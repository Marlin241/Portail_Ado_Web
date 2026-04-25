# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

**Portail Ados Bethel** — Plateforme web Next.js 16 pour une application chrétienne jeunesse. Elle réunit deux expériences dans un seul dépôt : une app mobile-first pour les jeunes (role `ado`/`user`) et un panel admin desktop. Le backend (FastAPI, Sprint 1) se trouve dans `C:\Users\DELL\Documents\AD_BETHEL_Project\Backend`.

## Commandes de développement

```bash
pnpm dev        # Serveur de développement Next.js
pnpm build      # Build de production
pnpm lint       # ESLint
```

> Le projet utilise **pnpm** comme gestionnaire de paquets.

## Variables d'environnement

- `.env` : copier/adapter selon l'environnement.
- `NEXT_PUBLIC_API_BASE_URL` : URL du backend FastAPI. Si absente ou vide, toute l'app bascule automatiquement en **mode mock** (`USE_MOCKS = true` dans `lib/api/client.ts`).

Comptes de démo (mode mock) :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `admin@bethel.test` | `Welcome123!` | Admin → `/admin` |
| `jeune@bethel.test` | `Welcome123!` | User → `/accueil` |
| `nouveau@bethel.test` | `TempPass1!` | Doit changer le mot de passe |
| `suspendu@bethel.test` | `Welcome123!` | Compte suspendu |

## Architecture

### Deux expériences dans un seul Next.js App Router

| Scope | Groupe de route | Design |
|-------|----------------|--------|
| App user (jeunes) | `app/(app)/` | Mobile-first, encadrée dans une phone-frame, 4 bottom tabs |
| Panel admin | `app/admin/` | Desktop plein écran, sidebar + layout tabulaire |

**Logique de routage post-login** (dans `app/page.tsx`) : unauthenticated → `/login`, suspendu → `/compte-suspendu`, `must_change_password` → `/activate-password`, admin → `/admin`, sinon → `/accueil`.

Le guard admin est dans `app/admin/layout.tsx` : il vérifie `user.role === "admin" || user.is_superadmin` côté client.

### Authentification (Session)

Gérée par `lib/auth/session-provider.tsx` (React Context, pas NextAuth). Les tokens JWT sont stockés dans `localStorage` sous la clé `bethel.auth.tokens`. Le client HTTP `lib/api/client.ts` gère le rafraîchissement automatique du token (retry 401 → refresh → retry).

### Couche API

`lib/api/client.ts` expose `apiRequest<T>()`. Chaque module métier (`auth.ts`, `books.ts`, `podcasts.ts`, etc.) importe `apiRequest` et — si `USE_MOCKS` est vrai — retourne directement les données depuis `mocks.ts` / `mocks-admin.ts` sans appel réseau.

Les mocks sont **mutables** : une création côté admin se reflète immédiatement côté user dans la même session.

### Modules admin (statut)

| Module | Route | Statut |
|--------|-------|--------|
| Dashboard KPIs | `/admin` | Livré |
| Utilisateurs | `/admin/utilisateurs` | Livré |
| Bibliothèque | `/admin/livres` | Livré |
| Podcasts | `/admin/podcasts` | Livré |
| Audit | `/admin/audit` | Livré |
| Témoignages, Questions, Exploits | `/admin/temoignages` etc. | Stubs "en attente backend" (Sprint 2-4) |

Les modules en attente utilisent `components/admin/coming-soon-module.tsx`.

### Composants clés

- `components/app-shell.tsx` — shell de l'app user (phone-frame + bottom tabs)
- `components/admin/admin-shell.tsx` + `admin-sidebar.tsx` — shell du panel admin
- `components/pdf-reader.tsx` — lecteur PDF (pdfjs-dist)
- `components/audio-player.tsx` — lecteur audio pour les épisodes de podcast

### UI / Style

- shadcn/ui (style `new-york`) avec Tailwind v4 et variables CSS
- Icônes : lucide-react
- Alias `@/` → racine du projet (configuré dans `tsconfig.json` et `components.json`)
- Ajouter des composants shadcn : `pnpm dlx shadcn@latest add <component>`

## Conventions importantes

- `next.config.mjs` désactive la validation TypeScript au build (`ignoreBuildErrors: true`) — les erreurs de type n'empêchent pas `pnpm build`.
- Tous les layouts et pages qui consomment `useSession()` sont `"use client"` ; les guards de route se font côté client par `useEffect`.
- Les types partagés backend/admin se trouvent dans `lib/api/types.ts` — c'est la source de vérité pour les shapes de données.
- Le projet mobile (`/mobile`, Expo 54) est **gelé temporairement** et ne fait pas partie du périmètre de développement actif.
