# Présences par QR code — Étape 3 : admin web — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal :** depuis l'admin web (d'abord sur téléphone), les moniteurs scannent les QR des ados, cochent à la main ceux qui n'ont pas de téléphone, consultent les réunions et partagent le PDF des présents. L'écran des utilisateurs permet en plus de changer le QR d'un ado.

**Architecture :**
- `lib/api/presences.ts` : client typé des routes `/api/v1/admin/presences/*` ;
- un helper `apiRequestBlob` dans `lib/api/client.ts` pour télécharger le PDF avec l'authentification et le renouvellement de session ;
- trois pages sous `app/admin/presences/` : l'accueil, le scanner, le détail d'une réunion ;
- l'entrée « Présences » dans `components/admin/admin-sidebar.tsx` ;
- l'action « Changer son QR » dans `app/admin/utilisateurs/page.tsx`.

**Tech Stack :** Next.js 16 (App Router, client components), SWR, shadcn/ui, sonner, `@zxing/browser` 0.2.1 et `@zxing/library` 0.23.0 (lecture du QR avec ZXing, choisi parce que c'est lui qui a lu sans difficulté les QR du téléphone à l'étape 2).

**Spec :** `Backend/docs/superpowers/specs/2026-10-11-presences-qr-design.md`, sections « Admin web ». Backend livré : voir le tableau API de la spec (`jour`, 409 avec `detail.{code,message,statut,prenom,nom}`).

## Global Constraints

- Textes en français simple :
  - succès : « ✓ Prénom Nom, présent(e) » ;
  - déjà marqué : « Prénom Nom est déjà marqué(e) présent(e) » ;
  - code inconnu : « QR non reconnu » ;
  - compte refusé : le `message` du 409 (« Compte suspendu : … ») ;
  - réseau : « Pas de connexion, réessayez ».
- Scan continu, sans aucune action entre deux ados. Le même code est ignoré pendant 3 s. Un bandeau reste affiché environ 2 s. Le téléphone vibre si le navigateur le permet (`navigator.vibrate`).
- Caméra arrière (`facingMode: "environment"`). Si la caméra est refusée ou absente : explication, et la recherche par nom reste disponible.
- PDF : partage de fichier par Web Share API (`navigator.canShare({ files })`) quand le navigateur le permet, sinon téléchargement.
- Retirer une présence ou changer un QR passe toujours par une confirmation (`AlertDialog`).
- Pas de test unitaire dans ce dépôt : la vérification se fait par Playwright, avec une fausse caméra qui filme de vrais QR, plus un essai réel sur le TECNO via `adb reverse` (`localhost` est une origine sécurisée, donc la caméra est autorisée).
- Ne jamais modifier `.env`. Le web tourne avec `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 pnpm dev`.
- Commits sans ligne de co-auteur Claude. Pas de push.

## Review Focus

1. Un même QR reste devant la caméra : un seul enregistrement, un seul bandeau. Debounce, tâche 2.
2. Deux moniteurs scannent en même temps : le compteur affiché est le total renvoyé par le serveur. Tâche 2.
3. Erreur réseau pendant un scan : le bandeau réseau s'affiche, et le même code peut être rescanné tout de suite. Debounce levé sur erreur réseau, tâche 2.
4. Le navigateur ne sait pas partager de fichier (ordinateur) : le PDF se télécharge. Tâche 3.
5. La caméra est refusée : la page reste utilisable avec la recherche par nom. Tâche 2.

---

### Task 1 : Client API

**Files :**
- Create : `lib/api/presences.ts`
- Modify : `lib/api/client.ts` (ajout de `apiRequestBlob`)

**Produces :**
- types `ReunionResume`, `EnregistrementPresence`, `AdoRecherche`, `PresenceDetail`, `ReunionDetail`, `PaginatedReunions` ;
- fonctions `scannerCode`, `cocherAdo`, `chercherAdos`, `reunionAujourdhui`, `listerReunions`, `getReunion`, `renommerReunion`, `retirerPresence`, `regenererCodeAdo`, `telechargerPdfReunion` ;
- `messageErreurPresence(err)`.

- [ ] Écrire le code.
- [ ] `pnpm exec tsc --noEmit` et `pnpm lint` sans nouvelle erreur.

### Task 2 : Accueil Présences et scanner

**Files :**
- Create : `app/admin/presences/page.tsx`
- Create : `app/admin/presences/scanner/page.tsx`
- Modify : `components/admin/admin-sidebar.tsx`
- Verify : `scratchpad/web_presences.py` (Playwright, hors dépôt)

- [ ] Écrire les pages.
- [ ] Playwright (fausse caméra : vidéo `.y4m` générée avec ffmpeg à partir de QR de vrais codes, dont un code inconnu). Vérifier :
  - le bandeau vert, puis jaune pour le même ado ;
  - le bandeau rouge pour le code inconnu ;
  - le compteur ;
  - la recherche par nom, puis la coche d'un ado non activé ;
  - avec la caméra refusée (contexte sans la permission caméra), le message d'explication et la recherche toujours utilisable ;
  - des captures à 390 px (téléphone) et à 1440 px.

### Task 3 : Détail d'une réunion, PDF, changer le QR

**Files :**
- Create : `app/admin/presences/[id]/page.tsx`
- Modify : `app/admin/utilisateurs/page.tsx`

- [ ] Écrire le code.
- [ ] Playwright :
  - renommer la réunion ;
  - retirer une présence, avec la confirmation ;
  - « Partager le PDF » sur ordinateur produit le téléchargement de `presences-AAAA-MM-JJ.pdf`, dont le texte est vérifié avec pypdf ;
  - « Changer son QR » : le nouveau code est différent, et l'ancien est refusé au scan.

### Task 4 : Essai réel sur le TECNO et suivi

- [ ] `adb reverse tcp:3000 tcp:3000` et `adb reverse tcp:8000 tcp:8000` ; ouvrir `http://localhost:3000/admin/presences/scanner` sur le téléphone.
- [ ] Scanner le QR d'`ado_test` affiché sur un autre écran : la présence est enregistrée.
- [ ] Partager le PDF : le menu de partage Android s'ouvre. Ne pas envoyer au groupe des parents.
- [ ] Commits ; mettre à jour le suivi.
