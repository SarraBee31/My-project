# Base de données

## 1. Vue d'ensemble

Capsule Wardrobe (Dansee) est une application de vestiaire capsule : profil, pièces photo, outfits et likes.

La stack est **Nuxt 4** + **Supabase** (PostgreSQL, Auth, Storage). Le schéma TypeScript généré `app/types/database.types.ts` est la source de vérité des colonnes.

Cinq tables (`profiles`, `items`, `outfits`, `outfit_items`, `likes`) ; **RLS est activé partout**.

## 2. Schéma

Types ci-dessous : TypeScript tels que générés dans `database.types.ts`, avec l’équivalent Postgres entre parenthèses.

### `profiles`

| Colonne | Type (TS / Postgres) | Contraintes |
|---|---|---|
| `id` | `string` (`uuid`) | **PK**. FK `auth.users.id` **ON DELETE CASCADE**. Même valeur que l’utilisateur Auth. |
| `username` | `string` (`text`) | `NOT NULL`, `UNIQUE`. Rempli à l’inscription via le trigger. |
| `aesthetic_id` | `string \| null` (`text`) | Nullable. Slug d’aesthetic (même vocabulaire que l’enum, mais colonne `text`). |
| `created_at` | `string` (`timestamptz`) | Horodatage de création. |

Pas de FK sortante vers les autres tables publiques : le profil **est** l’utilisateur.

### `items`

| Colonne | Type (TS / Postgres) | Contraintes |
|---|---|---|
| `item_id` | `string` (`uuid`) | **PK** (ce n’est pas `id`). |
| `user_id` | `string` (`uuid`) | FK `profiles.id` **ON DELETE CASCADE**. |
| `photo_url` | `string` (`text`) | URL publique du fichier dans le bucket `photos`. `NOT NULL`. |
| `category` | `item_category` | Enum Postgres `'top' \| 'bottom' \| 'shoes'`. |
| `created_at` | `string` (`timestamptz`) | Horodatage de création. |

Pas de colonne `name`, `color` ni `storage_path`.

### `outfits`

| Colonne | Type (TS / Postgres) | Contraintes |
|---|---|---|
| `id` | `string` (`uuid`) | **PK**. |
| `user_id` | `string` (`uuid`) | FK `profiles.id` **ON DELETE CASCADE**. |
| `aesthetic` | `outfit_aesthetic` | Enum Postgres (voir ci-dessous). `NOT NULL`. |
| `generated_by_ai` | `boolean` | Défaut `false`. |
| `is_public` | `boolean` | Défaut `false`. Contrôle la visibilité RLS. |
| `created_at` | `string` (`timestamptz`) | Horodatage de création. |

Pas de colonne `name`.

### `outfit_items`

Table de jonction outfit ↔ pièce. **Clé primaire composite** `(outfit_id, item_id)` : une pièce ne peut pas figurer deux fois dans un même outfit.

| Colonne | Type (TS / Postgres) | Contraintes |
|---|---|---|
| `outfit_id` | `string` (`uuid`) | PK (composite). FK `outfits.id` **ON DELETE CASCADE**. |
| `item_id` | `string` (`uuid`) | PK (composite). FK `items.item_id` **ON DELETE RESTRICT**. |

### `likes`

**Clé primaire composite** `(outfit_id, user_id)` : un user ne like un outfit qu’une fois.

| Colonne | Type (TS / Postgres) | Contraintes |
|---|---|---|
| `outfit_id` | `string` (`uuid`) | PK (composite). FK `outfits.id` **ON DELETE CASCADE**. |
| `user_id` | `string` (`uuid`) | PK (composite). FK `profiles.id` **ON DELETE CASCADE**. |
| `created_at` | `string` (`timestamptz`) | Horodatage du like. |

## 3. Choix de conception

**Identité.** `profiles.id = auth.users.id` : un profil **est** l’utilisateur Auth, pas un enregistrement satellite. Partout ailleurs, une colonne `*_id` désigne un parent (`user_id`, `outfit_id`, `item_id`).

**Cascades.** `ON DELETE CASCADE` partout, **sauf** `outfit_items.item_id` en **RESTRICT**. Supprimer un compte Auth efface le profil puis tout ce que l’utilisateur possède (pièces, outfits, jonctions, likes) : droit à l’effacement. RESTRICT empêche de supprimer une pièce encore utilisée dans un outfit ; l’application attrape l’erreur Postgres `23503` et affiche un message dédié (« Cette pièce est utilisée dans un outfit »).

**Enums.** `item_category` (`'top' | 'bottom' | 'shoes'`) et `outfit_aesthetic` (`'quiet-luxury' | 'parisian' | 'minimal' | 'coastal' | 'old-money' | 'vintage'`) sont des vocabulaires **fermés imposés par la base**, pas seulement par l’UI. `outfits.aesthetic` est typé sur l’enum. `profiles.aesthetic_id` reste `text` mais partage les mêmes slugs.

## 4. Création des profils

Le client **n’insère jamais** dans `profiles`. Au `signUp`, Nuxt envoie seulement `options.data.username` (prénom + nom) dans les metadata Auth. Un trigger `on_auth_user_created` sur `auth.users` appelle `handle_new_user()` en `SECURITY DEFINER` : c’est la base qui crée la ligne, en réaction à l’événement Auth.

Il n’existe **pas** de policy `INSERT` sur `profiles` : c’est volontaire. Un `.from('profiles').insert()` côté client est rejeté par RLS.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      trim(concat_ws(
        ' ',
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name'
      ))
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 5. Row Level Security

RLS est activé sur les cinq tables. Les 13 policies :

### `profiles`

| Nom | Commande | Expression | Intention |
|---|---|---|---|
| `profiles readable` | `SELECT` | `USING (true)` | Tout profil est lisible par les utilisateurs connectés. |
| `update own profile` | `UPDATE` | `USING (auth.uid() = id)` / `WITH CHECK (auth.uid() = id)` | Chacun ne met à jour que sa propre ligne (ex. `aesthetic_id`). |

Pas de policy `INSERT` : seul le trigger crée des profils (choix délibéré).

### `items`

| Nom | Commande | Expression | Intention |
|---|---|---|---|
| `own items only` | `ALL` | `USING (auth.uid() = user_id)` / `WITH CHECK (auth.uid() = user_id)` | Vestiaire 100 % privé : lecture et écriture uniquement sur ses pièces. |

Un autre utilisateur qui interroge `items` reçoit `[]`, sans erreur.

### `outfits`

| Nom | Commande | Expression | Intention |
|---|---|---|---|
| `read public or own` | `SELECT` | `USING (is_public OR auth.uid() = user_id)` | On lit les outfits publics et les siens. |
| `insert own` | `INSERT` | `WITH CHECK (auth.uid() = user_id)` | On ne crée un outfit qu’à son nom (`user_id` doit être envoyé). |
| `update own` | `UPDATE` | `USING (auth.uid() = user_id)` / `WITH CHECK (auth.uid() = user_id)` | On ne modifie que ses outfits. |
| `delete own` | `DELETE` | `USING (auth.uid() = user_id)` | On ne supprime que ses outfits. |

### `outfit_items`

Une ligne de jonction n’a pas de propriétaire propre : sa visibilité et ses écritures sont héritées de l’outfit parent via `EXISTS`.

| Nom | Commande | Expression | Intention |
|---|---|---|---|
| `read if outfit visible` | `SELECT` | `USING (EXISTS (SELECT 1 FROM public.outfits o WHERE o.id = outfit_id AND (o.is_public OR o.user_id = auth.uid())))` | On lit la composition si l’outfit parent est public ou à soi. |
| `compose own outfit` | `INSERT` | `WITH CHECK (EXISTS (SELECT 1 FROM public.outfits o WHERE o.id = outfit_id AND o.user_id = auth.uid()))` | On n’ajoute une pièce que dans un outfit dont on est propriétaire. |
| `edit own composition` | `DELETE` | `USING (EXISTS (SELECT 1 FROM public.outfits o WHERE o.id = outfit_id AND o.user_id = auth.uid()))` | On ne retire une pièce que d’un outfit dont on est propriétaire. |

### `likes`

| Nom | Commande | Expression | Intention |
|---|---|---|---|
| `read likes of visible outfits` | `SELECT` | `USING (EXISTS (SELECT 1 FROM public.outfits o WHERE o.id = outfit_id AND (o.is_public OR o.user_id = auth.uid())))` | On lit les likes des outfits visibles (publics ou les siens). |
| `like public outfits` | `INSERT` | `WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.outfits o WHERE o.id = outfit_id AND o.is_public))` | On ne like que le publié, et uniquement en son nom. |
| `unlike own` | `DELETE` | `USING (auth.uid() = user_id)` | On ne retire que son propre like. |

## 6. Storage

Bucket public **`photos`**. Chemin d’upload : `{user_id}/fichier` (ex. `{auth.uid()}/{uuid}.jpg`). L’URL publique résultante est stockée dans `items.photo_url`.

Policies `INSERT` / `DELETE` sur `storage.objects` :

```sql
bucket_id = 'photos'
and (storage.foldername(name))[1] = auth.uid()::text
```

Chacun n’écrit et ne supprime que dans **son** dossier. La lecture est libre : le bucket est public (URL `getPublicUrl`), pas besoin d’une policy `SELECT` restrictive.

## 7. Circulation des données

Le navigateur appelle un composable Nuxt (`useSupabaseClient<Database>()`), typé sur le schéma généré. Le client envoie la requête à l’API **PostgREST** de Supabase avec le JWT de session. Postgres exécute la requête SQL et **RLS filtre sur `auth.uid()`** avant de renvoyer les lignes. La clé **publishable** (anon) peut figurer dans le client : elle identifie le projet, elle n’accorde aucun privilège d’admin. L’autorisation réelle est le JWT + RLS. La clé `service_role` ne doit jamais être exposée dans Nuxt.
