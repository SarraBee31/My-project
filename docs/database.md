# Base de données — Dansee (Capsule Wardrobe)

Le projet utilise **Supabase** (PostgreSQL + Auth + Storage). L’identifiant utilisateur vient de `auth.users`. Les politiques **RLS** limitent chaque personne à **ses** lignes.

## Tables

### `public.profile`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `uuid` PK, FK `auth.users.id` | Même id que le compte Auth |
| `created_at` | `timestamptz` | Création |
| `username` | `text` | Prénom + nom (affichage) |
| `aesthetic_id` | `text` | Style de capsule choisi |

**CRUD profil**

| Opération | Où |
|---|---|
| Create | Inscription (`upsert`) + trigger `handle_new_user` |
| Read | Plugin auth + `syncFromSupabase` |
| Update | Page aesthetic (`aesthetic_id`) |
| Delete | Cascade si le user Auth est supprimé |

**RLS** : `auth.uid() = id` pour SELECT / INSERT / UPDATE.

### `public.piece`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `uuid` PK | Identifiant de la pièce |
| `user_id` | `uuid` FK `auth.users` | Propriétaire |
| `name` | `text` | Nom affichable (renommage = Update) |
| `storage_path` | `text` | Chemin dans le bucket `pieces` |
| `created_at` | `timestamptz` | Création |
| `updated_at` | `timestamptz` | Dernière modification |

**CRUD pièces**

| Opération | Où |
|---|---|
| Create | Upload image Storage + `insert` dans `piece` |
| Read | Liste sur `/pieces` (`select` filtré par `user_id`) |
| Update | Champ nom (`update name`) |
| Delete | Suppression fichier Storage + `delete` ligne |

**RLS** : `auth.uid() = user_id` pour SELECT / INSERT / UPDATE / DELETE.

## Storage

- Bucket : `pieces` (public lecture via URL, écriture authentifiée)
- Chemin : `{auth.uid()}/{uuid}.jpg|png|webp`
- RLS Storage : le premier dossier du path doit égaler `auth.uid()`

## Auth

- Email + mot de passe (`signUp` / `signInWithPassword` / `signOut`)
- Confirmation email : redirect `https://nuxt-shadcn-starter-template.vercel.app/confirm`
- `useSupabaseUser()` expose les **claims JWT** (`sub` = uuid), pas toujours `id`

## Installer le schéma

1. Dashboard Supabase → **SQL Editor**
2. Coller et exécuter `supabase/schema.sql`
3. Storage → vérifier le bucket **pieces**
4. Authentication → URL Configuration → Redirect URL :  
   `https://nuxt-shadcn-starter-template.vercel.app/confirm`

Les types TypeScript correspondent à ce schéma : `app/types/database.types.ts`.
