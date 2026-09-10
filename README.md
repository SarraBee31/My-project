# Dansee — Capsule Wardrobe

**Projet :** Dansee (assistant capsule wardrobe)  
**Groupe :** Dansee  
**Site :** https://nuxt-shadcn-starter-template.vercel.app  
**Dépôt :** https://github.com/SarraBee31/My-project

Application Nuxt (Vue) : inscription / connexion Supabase, choix d’un aesthetic, puis CRUD des photos de vêtements.

## Parcours

1. Accueil `/`
2. Inscription `/signup` (email + mot de passe, confirmation mail)
3. Connexion `/login` et déconnexion
4. Aesthetic `/aesthetic` (enregistré sur `profile.aesthetic_id`)
5. Pièces `/pieces` : ajouter, lister, renommer, supprimer (table `piece` + Storage)

## Prérequis

- Node.js 20+
- Projet Supabase (URL + clé publishable)

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

Dans le SQL Editor Supabase, exécuter `supabase/schema.sql` (tables, RLS, trigger, bucket).

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
  pages/          Accueil, signup, login, confirm, aesthetic, pieces
  stores/         Pinia (user, piece)
  middleware/     auth
  types/          database.types.ts
  utils/          validation, erreurs, id Supabase
docs/database.md  Schéma, CRUD, RLS
supabase/schema.sql
```

## Livrables demandés

- URL du site : https://nuxt-shadcn-starter-template.vercel.app
- URL GitHub : https://github.com/SarraBee31/My-project
- Nom du projet et groupe : **Dansee**
- README : ce fichier
- `app/types/database.types.ts`
- `docs/database.md`
