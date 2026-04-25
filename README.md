# Portail Ados Bethel - Plateforme web + App mobile

Sur le pc, le backend se trouve ici "C:\Users\DELL\Documents\AD_BETHEL_Project\Backend" sur le pc

Ce repo contient **deux livrables paralleles** pour l'application "Portail Ados Bethel" :

| Dossier | Stack | Statut | Objectif |
|---------|-------|--------|----------|
| `/` (racine) | Next.js 16 + Tailwind v4 | **En cours de developpement actif** | Plateforme web complete : app mobile-first pour les jeunes + panel admin desktop. Deployable sur Vercel. |
| `/mobile` | Expo 54 + React Native + NativeWind + Expo Router | **Gele temporairement** | App mobile native (iOS + Android). Sera reprise une fois la version web finalisee et validee. |

> **Note sur le gel mobile** : pour concentrer les efforts et livrer d'abord une version web complete (incluant le back-office admin), le projet `/mobile` est gele a son etat Sprint 1. Le code reste fonctionnel (SDK 54, services branches sur le backend) et pourra etre repris a l'identique une fois la version web finalisee. Voir `mobile/README.md` pour les instructions de redemarrage.

Les deux projets partagent la meme logique metier (meme structure de types, memes services REST, memes ecrans cote user), branches sur le **backend FastAPI Sprint 1** (auth admin-managed, livres, podcasts, progression, audit).

---

## Plateforme web (racine)

### Deux experiences en une

| Scope | Route | Utilisateur | Design |
|-------|-------|-------------|--------|
| App utilisateur | `/accueil`, `/bibliotheque`, `/podcasts`, `/profil` | Jeune (role `ado`) | Mobile-first affiche dans une frame iPhone, 4 bottom tabs |
| Panel admin | `/admin/*` | `admin` ou `superadmin` | Desktop plein ecran, sidebar + vues tabulaires |

Le routage post-login envoie automatiquement :
- Un user standard vers `/accueil`
- Un admin vers `/admin` (dashboard)
- Les users avec `must_change_password: true` vers `/activate-password` en premier

### Variables d'environnement

- `NEXT_PUBLIC_API_BASE_URL` : URL de ton backend FastAPI deploye (ex. `https://api.bethel-ados.exemple.com`).
  Si absente, l'app utilise des **mocks realistes** (definis dans `lib/api/mocks.ts` + `lib/api/mocks-admin.ts`) pour tester end-to-end sans backend. Les mocks sont mutables : creer un livre cote admin le fait apparaitre cote user immediatement.

Ajoute la via le bouton "Vars" dans la barre v0.

### Identifiants de demo (mode mock)

| Email | Password | Comportement |
|-------|----------|--------------|
| `admin@bethel.test` | `Welcome123!` | Redirige vers `/admin`, acces a tout le panel |
| `jeune@bethel.test` | `Welcome123!` | Compte actif, va direct sur `/accueil` |
| `nouveau@bethel.test` | `TempPass1!` | Force le passage sur l'ecran de changement de mot de passe |
| `suspendu@bethel.test` | `Welcome123!` | Ecran "compte suspendu" |

### Modules du panel admin

| Module | Route | Statut | Contenu |
|--------|-------|--------|---------|
| Tableau de bord | `/admin` | Livre | KPIs utilisateurs / contenus / engagement + activite recente |
| Utilisateurs | `/admin/utilisateurs` | Livre | CRUD, suspension, reset password, filtrage par role/statut |
| Bibliotheque | `/admin/livres` | Livre | CRUD livres + categories, upload PDF + couverture, toggle recommande |
| Podcasts | `/admin/podcasts`, `/admin/podcasts/[id]` | Livre | CRUD series + episodes, upload audio, publier/depublier |
| Journal d'audit | `/admin/audit` | Livre | Historique des actions admin avec filtres |
| Temoignages | `/admin/temoignages` | En attente backend | Moderation des temoignages (Sprint 2) |
| Questions | `/admin/questions` | En attente backend | Q&R anonymes (Sprint 3) |
| Exploits | `/admin/exploits` | En attente backend | Defis hebdomadaires (Sprint 4) |

### Architecture Next.js

```
app/
  layout.tsx                     # Polices + SessionProvider
  page.tsx                       # Redirection selon etat auth
  login/                         # Connexion (+ ?redirect=)
  forgot-password/               # Demande de reset
  reset-password/                # Confirmation avec token
  activate-password/             # Changement force
  compte-suspendu/

  (app)/                         # App USER : mobile-first, phone frame + bottom tabs
    accueil/
    bibliotheque/[id]/lire/
    podcasts/[id]/ + episodes/[id]/
    profil/

  admin/                         # PANEL ADMIN : desktop, sidebar + shell
    layout.tsx                   # Guard de role admin/superadmin
    page.tsx                     # Dashboard KPIs
    utilisateurs/
    livres/                      # + gestion categories
    podcasts/[id]/               # Serie + liste episodes
    audit/
    temoignages/ questions/ exploits/   # Stubs "en attente backend"

components/
  phone-frame.tsx, bottom-tabs.tsx      # App user
  admin/
    admin-sidebar.tsx, admin-shell.tsx  # Panel admin
    admin-page-header.tsx, stat-card.tsx
    coming-soon-module.tsx              # Template modules en attente

lib/
  api/
    client.ts                    # fetch + localStorage tokens (fallback mocks)
    types.ts                     # Types partages backend + admin
    mocks.ts, mocks-admin.ts     # Donnees de demo mutables
    auth.ts, books.ts, podcasts.ts, progression.ts
    admin-users.ts, admin-books.ts, admin-podcasts.ts, admin-misc.ts
  auth/session-provider.tsx      # React Context + hydration
```

## Backend FastAPI attendu

L'app consomme l'API decrite dans le suivi backend Sprint 1. Resume des endpoints cables :

**Auth & user**
- `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`
- `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/change-password`
- `GET /auth/me`

**Contenus user-facing**
- `GET /livres`, `GET /livres/:id`, `GET /categories`
- `GET /progression/livres/:id`, `PUT /progression/livres/:id`, `GET /progression/livres/en-cours`
- `GET /podcasts`, `GET /podcasts/:id`, `GET /podcasts/:id/episodes`, `GET /podcasts/episodes/:id`
- `GET /progression/episodes/:id`, `PUT /progression/episodes/:id`

**Administration**
- `GET/POST/PATCH/DELETE /admin/users`, `POST /admin/users/:id/suspend|reactivate|reset-password`
- `POST/PATCH/DELETE /livres`, `POST /livres/:id/pdf|cover`, `POST/PATCH/DELETE /categories`
- `POST/PATCH/DELETE /podcasts`, `POST/PATCH/DELETE /podcasts/:id/episodes`, `POST /podcasts/episodes/:id/audio`
- `POST /podcasts/episodes/:id/publish|unpublish`
- `GET /admin/stats`, `GET /admin/audit`

Voir `lib/api/types.ts` pour les payloads exacts.

## Prochaines etapes

1. Brancher `NEXT_PUBLIC_API_BASE_URL` sur l'API reelle (bouton Vars dans v0)
2. Valider avec le client les flux admin (utilisateurs, livres, podcasts, audit)
3. Livrer les modules "en attente" au fil des sprints backend (temoignages, questions, exploits)
4. **Degeler le projet `/mobile`** et le resynchroniser sur les nouveautes metier
5. Brancher un vrai renderer PDF (react-pdf) dans `/bibliotheque/[id]/lire/`
