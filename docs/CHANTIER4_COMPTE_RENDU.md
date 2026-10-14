# Chantier 4 — compte rendu (admin Kairos)

Branche `feature/admin-kairos` (8 commits après la spec). Rien n'est poussé ni fusionné dans `main`.

## Fait
- **Coque** : rail sombre sur PC, barre basse flottante sur téléphone, pastille citron qui glisse, pastille de comptage sur Modération.
- **Aujourd'hui** : phrase du jour, grande action (« Scanner les présences » le samedi, « Voir les présences » sinon), trois lignes Ados / Contenus / Modération.
- **Contenus** : onglets Livres / Podcasts. **Modération** : file avec décision sur place (approuver, refuser avec confirmation, répondre). **Plus** : toutes les autres sections. **Présences** et **Ados** habillés (cartes sur téléphone, actions de la fiche regroupées et confirmées).
- **Thème Kairos** limité à l'admin (`.admin-kairos`), l'espace ados n'est pas touché.

## Vérifié
`pnpm build` réussi ; Playwright 198/198 à 1280 px et 390 px (API simulée) ; captures regardées.

## À savoir
- Le « mode mock » du web n'existe plus (CLAUDE.md est périmé) : les tests utilisent un faux serveur.
- Les pages de « Plus » gardent leur contenu d'origine (quelques textes sans accents, quelques couleurs en dur dans le scanner).
- Le samedi n'a pas pu être testé en conditions réelles.
- « Ajouter un épisode » de la maquette devient « Gérer les podcasts » (un épisode se rattache à une série).
