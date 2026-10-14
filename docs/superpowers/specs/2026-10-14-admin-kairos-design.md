# Design — Admin Kairos : refonte de l'admin web

**Date :** 2026-10-14
**Chantier :** 4 (après « Hors ligne complet »)
**Dépôt :** `Ado_Bethel_Web` (Next.js, `app/admin`). Backend inchangé.
**Maquettes :** https://claude.ai/artifact/7gUgJC8toN72Kypp8MfXdp (PC « Aujourd'hui », téléphone « Aujourd'hui », téléphone « Modération »)
**Statut :** décisions prises avec carte blanche du responsable (il dormait) ; à relire au réveil.

---

## Contexte et intention

L'admin actuel (plus de 20 écrans, 18 entrées de menu) fait se perdre les moniteurs et cache les actions simples. « Admin » et « moniteur » désignent les mêmes personnes. Elles travaillent sur PC **et** sur téléphone.

Objectif : un admin **évident sans mode d'emploi**, organisé autour des quatre tâches du quotidien, aussi à l'aise sur téléphone que sur PC, avec l'identité Kairos.

**Tâches du quotidien (confirmées par le responsable) :** présences du samedi ; gérer les ados ; publier des livres et podcasts ; modérer témoignages et questions.

**Hors périmètre :** l'espace ados du web (`app/(app)`), le backend, les sections « Plus » en profondeur (elles gardent leur contenu, habillé par la nouvelle coque), l'ajout de nouvelles fonctions.

## Décisions

1. **Navigation « 4 entrées + Plus »** : Aujourd'hui (accueil), Présences, Ados, Contenus, Modération, et « Plus ». Barre latérale étroite sur PC (≥ 1024 px), barre basse flottante sur téléphone avec une pastille citron qui glisse vers l'entrée active (même langage que l'app Kairos). Une pastille de comptage sur Modération.
2. **« Plus »** : une page qui liste les autres sections (Agenda, Quiz, Biblique étendu, Musique gospel, Créativité, Vie émotionnelle, Bien-être, Défis, Exploits, Journal d'audit, autres types de modération…). Rien n'est supprimé ; les URLs existantes restent valables.
3. **Aujourd'hui** remplace le tableau de bord : une phrase du jour, une grande action principale (« Scanner les présences » le samedi, sinon « Voir les présences »), puis trois lignes (Ados, Contenus, Modération avec « n à traiter »). Pas de statistiques, pas de grilles de cartes à icônes.
4. **Contenus** : un seul espace, deux onglets, Livres et Podcasts (les pages actuelles, dans une entête commune).
5. **Modération** : une file avec onglets Témoignages et Questions ; on décide sur place (approuver, refuser, répondre) avec les appels API existants. Les autres types (exploits, créations, propositions de musique) restent accessibles par un lien « Autres demandes » vers leurs modules.
6. **Rôle modérateur** : inchangé (accès limité aux témoignages) ; sa navigation ne montre que Modération.
7. **Identité** : palette Kairos (neutres + citron `#C8FF3E` + violet `#8E6CFF`, fichier `design/kairos-couleurs.json` du dépôt mobile), Unbounded pour les titres, Onest pour le texte. Les variables de thème de l'admin sont surchargées dans un seul scope (`.admin-kairos`) pour que tous les composants (y compris les pages de « Plus ») prennent la nouvelle apparence. Clair par défaut sur PC, sombre si le système le demande.
8. **Pas de look « IA »** : pas de carrés d'icônes colorés, pas de grilles icône + titre + description, peu d'icônes, beaucoup de texte clair.

## Écrans

| Espace | Contenu |
|---|---|
| Aujourd'hui `/admin` | date, titre, action principale, trois lignes (Ados, Contenus, Modération) |
| Présences `/admin/presences` | liste des réunions, bouton « Scanner » en premier ; scanner et détail existants conservés |
| Ados `/admin/utilisateurs` | recherche, liste en cartes sur téléphone, actions de la fiche regroupées et confirmées (mot de passe, QR, suspendre), « Ajouter un ado » bien visible |
| Contenus `/admin/contenus` | onglets Livres / Podcasts, mêmes fonctions que `/admin/livres` et `/admin/podcasts` |
| Modération `/admin/moderation` | onglets Témoignages / Questions, décision sur place, lien « Autres demandes » |
| Plus `/admin/plus` | liste simple des sections restantes |

## Téléphone

Aucune table qui déborde (cartes), boutons ≥ 48 px de haut, formulaires sur une colonne, barre basse flottante, aucun défilement horizontal de la page.

## Vérifications

- `pnpm build` sans erreur ; `tsc` propre.
- Playwright (mode mock, `NEXT_PUBLIC_API_BASE_URL` vide) à 1280 px et 390 px : les 4 entrées + Plus sont visibles et mènent au bon espace ; l'entrée active suit la page ; la pastille de Modération se met à jour ; décider sur place dans Modération fonctionne ; aucun débordement horizontal ; le rôle modérateur ne voit que Modération.
- Captures PC et téléphone de chaque espace.
