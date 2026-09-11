# Dansee — Capsule Wardrobe

**Projet :** Dansee (assistant capsule wardrobe)
**Groupe :** Dansee
**Site :** https://nuxt-shadcn-starter-template.vercel.app
**Dépôt :** https://github.com/SarraBee31/My-project

Application **Nuxt 4** (Vue) branchée sur **Supabase** (Postgres, Auth, Storage). Inscription / connexion, choix d’un aesthetic, puis CRUD privé des photos de vêtements. Le schéma, les FK, le trigger de profil et les 13 policies RLS sont décrits dans [`docs/database.md`](docs/database.md). Les colonnes font foi dans [`app/types/database.types.ts`](app/types/database.types.ts).

## Parcours

1. Accueil `/`
2. Inscription `/signup` (email + mot de passe ; `username` passé dans les metadata Auth)
3. Confirmation email `/confirm` (lien envoyé vers le site Vercel)
4. Connexion `/login` et déconnexion
5. Aesthetic `/aesthetic` (écrit `profiles.aesthetic_id` ; slugs identiques à l’enum `outfit_aesthetic`)
6. Pièces `/pieces` : ajouter / lister / supprimer (table `items` + bucket Storage `photos`)

Les pages `/aesthetic` et `/pieces` passent par le middleware `auth`.

## Stack

- Nuxt 4, Vue, Pinia (`app/stores/`)
- `@nuxtjs/supabase` — client typé `useSupabaseClient<Database>()`
- Tailwind CSS + shadcn-vue
- Supabase : Auth email/password, Postgres + RLS, Storage

## Fonctionnalités

| Zone | Comportement |
|---|---|
| Auth | `signUp` / `signInWithPassword` / `signOut`. Pas d’insert client dans `profiles` : un trigger Postgres crée la ligne. |
| Profil | Lecture seule au login ; mise à jour de `aesthetic_id` sur `/aesthetic`. |
| Vestiaire | `items` 100 % privé (RLS `auth.uid() = user_id`). Upload `{user_id}/fichier` dans le bucket public `photos`, URL dans `photo_url`. Catégorie obligatoire `top` \| `bottom` \| `shoes`. |
| Suppression | Ligne DB d’abord, fichier Storage ensuite. Si la pièce est encore dans un outfit (`23503` / RESTRICT), message dédié. |
| Outfits / likes | Présents en base (voir `docs/database.md`). Pas d’UI pour l’instant. |

## Prérequis

- Node.js 20+
- Projet Supabase (URL + clé **publishable**)

## Installation

```bash
npm install
cp .env.example .env
```

Renseigner `.env` :

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=sb_publishable_...
NUXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=sb_publishable_...
```

La clé publishable est volontairement côté client : RLS filtre chaque requête (détail dans `docs/database.md`, section Circulation des données). Ne pas y mettre la clé `service_role`.

```bash
npm run dev
```

Ouvre http://localhost:3000.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run preview` | Prévisualiser le build |

## Structure

```
app/
  pages/          /, /signup, /login, /confirm, /aesthetic, /pieces
  stores/         Pinia (user, piece)
  middleware/     auth
  plugins/        sync session → profil
  types/          database.types.ts (source de vérité du schéma)
  utils/          validation, erreurs, id Supabase
docs/database.md  Schéma, trigger, 13 policies RLS, Storage
```

## Livrables

- URL du site : https://nuxt-shadcn-starter-template.vercel.app
- URL GitHub : https://github.com/SarraBee31/My-project
- Nom du projet et groupe : **Dansee**
- README : ce fichier
- `app/types/database.types.ts`
- `docs/database.md`
