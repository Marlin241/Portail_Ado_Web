// Typed data contracts that mirror the FastAPI backend responses.

export type UserRole = "user" | "moderator" | "admin"
export type AccountStatus = "active" | "suspended" | "pending_activation"

export interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  birth_date: string | null
  role: UserRole
  account_status: AccountStatus
  is_superadmin: boolean
  must_change_password: boolean
  avatar_url: string | null
  is_active?: boolean
  is_verified?: boolean
  created_by_id?: string | null
  activated_at?: string | null
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: "bearer"
  expires_in?: number
  expires_at?: string
  refresh_expires_at?: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}

export interface CategorieLivre {
  id: string
  nom: string
  description: string | null
  created_at?: string
}

export interface BookFormat {
  format: "pdf" | "epub"
  mime_type: string
  size_bytes?: number
}

export interface Book {
  id: string
  titre: string
  auteur: string
  description: string | null
  couverture_url: string | null
  categorie_id?: string | null
  categorie: CategorieLivre | null
  annee_publication: number | null
  isbn: string | null
  lien_achat: string | null
  est_recommande: boolean
  formats_disponibles: BookFormat["format"][]
  created_by_id?: string | null
  created_at: string
  updated_at: string
}

export interface BookAccessAsset {
  format: BookFormat["format"]
  mime_type: string
  expires_at: string
  read_url: string
}

export interface BookAccess {
  book_id: string
  assets: BookAccessAsset[]
}

export interface Podcast {
  id: string
  titre: string
  description: string | null
  image_url: string | null
  animateur: string | null
  est_actif: boolean
  episodes_count: number
  created_by_id?: string | null
  created_at: string
  updated_at?: string
}

export interface Episode {
  id: string
  podcast_id: string
  titre: string
  description: string | null
  numero: number
  duree_secondes: number | null
  date_publication: string
  est_publie: boolean
  audio_url?: string | null
  podcast?: { id: string; titre: string; image_url: string | null }
  created_at?: string
  updated_at?: string
}

export interface EpisodeAudio {
  read_url: string
  mime_type: string
  expires_at: string
}

export interface EpisodeDetail extends Episode {
  audio: EpisodeAudio
}

export interface BookProgress {
  book_id: string
  user_id: string
  progress_percent: number
  current_page?: number | null
  total_pages?: number | null
  last_opened_at: string | null
  completed_at: string | null
}

export interface AudioProgress {
  episode_id: string
  user_id: string
  position_seconds: number
  duration_seconds: number | null
  completed: boolean
  last_listened_at: string | null
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface ApiError {
  status: number
  message: string
  detail?: unknown
}

// Admin-specific shapes
export interface AdminUserCreate {
  email: string
  username: string
  first_name: string
  last_name: string
  birth_date?: string | null
  role: UserRole
}

export interface AdminUserUpdate {
  email?: string
  username?: string
  first_name?: string
  last_name?: string
  role?: UserRole
  birth_date?: string | null
  is_verified?: boolean
}

export interface AdminUserCreateResult {
  user: User
  temporary_password: string
}

export interface AdminBookPayload {
  titre: string
  auteur: string
  description?: string | null
  categorie_id?: string | null
  annee_publication?: number | null
  isbn?: string | null
  lien_achat?: string | null
  est_recommande?: boolean
}

export interface AdminPodcastPayload {
  titre: string
  description?: string | null
  image_url?: string | null
  animateur?: string | null
  est_actif?: boolean
}

export interface AdminEpisodePayload {
  podcast_id: string
  titre: string
  description?: string | null
  numero: number
  duree_secondes?: number | null
  date_publication: string
  est_publie?: boolean
}

export interface AuditLog {
  id: string
  actor_id: string
  actor_email: string
  action: string
  entity_type: string
  entity_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AdminStats {
  users_total: number
  users_active: number
  users_suspended: number
  users_pending: number
  books_total: number
  books_recommended: number
  categories_total: number
  podcasts_total: number
  podcasts_active: number
  episodes_total: number
  episodes_published: number
  reading_sessions_last_7d: number
  audio_sessions_last_7d: number
  questions_pending: number
  temoignages_pending: number
  exploits_pending: number
  creations_pending: number
  propositions_musique_pending: number
  participations_defis_7j: number
  quiz_resultats_7j: number
  meditation_likes_7j: number
  creation_likes_7j: number
  morceau_ecoutes_7j: number
  temoignages_approuves_total: number
  exploits_approuves_total: number
  creations_approuvees_total: number
  morceaux_total: number
  playlists_total: number
  defis_total: number
  meditations_total: number
}

export type ModerationPendingType =
  | "question"
  | "temoignage"
  | "exploit"
  | "creation"
  | "proposition_musique"

export interface ModerationPendingItem {
  id: string
  type: ModerationPendingType
  titre_court: string
  username_auteur: string | null
  created_at: string
}

export interface ModerationPendingResponse {
  total: number
  limit: number
  offset: number
  items: ModerationPendingItem[]
}

export interface UserActivity {
  user_id: string
  temoignages_soumis: number
  temoignages_approuves: number
  exploits_soumis: number
  exploits_approuves: number
  creations_soumises: number
  creations_approuvees: number
  participations_defis: number
  defis_termines: number
  quiz_completes: number
  propositions_musique_soumises: number
}

export type Testament = "AT" | "NT"

export interface TraductionBiblique {
  code: string
  nom: string
  description: string | null
  langue: string
  active: boolean
}

export interface LivreBiblique {
  id: string
  osis_code: string
  nom: string
  abreviation: string
  testament: Testament
  ordre_canonique: number
  nombre_chapitres: number
}

export interface VersetBiblique {
  id: string
  livre_id: string
  chapitre: number
  numero: number
  texte: string
  traduction: string
}

export interface VersetResolu {
  reference: string
  texte: string
  traduction: string
  traduction_nom: string
  livre: string
  chapitre: number
  verset_debut: number
  verset_fin: number
}

export interface Meditation {
  id: string
  date_resolue: string
  is_surcharge: boolean
  titre: string | null
  meditation_texte: string
  verset: VersetResolu
  likes_count: number
  liked_by_me: boolean
}

export interface CalendrierEntry {
  date: string
  meditation: Meditation
}

export interface AdminMeditation {
  id: string
  titre: string | null
  meditation_texte: string
  verset_debut_id: string
  verset_fin_id: string
  mois_jour: string
  annee: number | null
  created_by_id: string | null
  created_at: string
  updated_at: string
}

export interface AdminMeditationPayload {
  titre?: string | null
  meditation_texte: string
  verset_debut_id: string
  verset_fin_id: string
  mois_jour: string
  annee?: number | null
}

export interface QuizListItem {
  id: string
  titre: string
  description: string
  deja_fait: boolean
}

export interface QuizOptionAdo {
  id: string
  texte: string
  ordre: number
}

export interface QuizQuestionAdo {
  id: string
  texte: string
  ordre: number
  options: QuizOptionAdo[]
}

export interface QuizDetail {
  id: string
  titre: string
  description: string
  questions: QuizQuestionAdo[]
}

export interface QuizProfil {
  id: string
  quiz_id: string
  nom: string
  description: string
  personnage_biblique_nom: string
  personnage_biblique_description: string
  personnage_biblique_image_url: string | null
  conseils: string
  ordre: number
}

export interface QuizResultat {
  id: string
  quiz_id: string
  profil: QuizProfil
  soumis_le: string
}

export interface AdminQuizListItem {
  id: string
  titre: string
  description: string
  publie: boolean
  created_at: string
  updated_at: string
}

export interface QuizOptionAdmin {
  id: string
  texte: string
  profil_id: string
  ordre: number
}

export interface QuizQuestionAdmin {
  id: string
  texte: string
  ordre: number
  options: QuizOptionAdmin[]
}

export interface AdminQuizDetail extends AdminQuizListItem {
  profils: QuizProfil[]
  questions: QuizQuestionAdmin[]
}

export interface AdminQuizPayload {
  titre: string
  description: string
}

export interface AdminQuizProfilPayload {
  nom: string
  description: string
  personnage_biblique_nom: string
  personnage_biblique_description: string
  conseils: string
  ordre: number
}

export interface AdminQuizOptionPayload {
  texte: string
  profil_id: string
  ordre: number
}

export interface AdminQuizQuestionPayload {
  texte: string
  ordre: number
  options: AdminQuizOptionPayload[]
}

export type TypeContenuVie = "article" | "video" | "temoignage"

export interface CategorieVie {
  id: string
  nom: string
}

export interface ContenuVieListItem {
  id: string
  type: TypeContenuVie
  titre: string
  description: string
  image_couverture_url: string | null
  categorie: CategorieVie
  likes_count: number
  liked_by_me: boolean
  created_at: string
}

export interface ContenuVieDetail extends ContenuVieListItem {
  contenu_texte: string | null
  video_url: string | null
  video_fichier_url: string | null
}

export interface AdminContenuVieListItem {
  id: string
  type: TypeContenuVie
  titre: string
  description: string
  image_couverture_url: string | null
  categorie: CategorieVie
  publie: boolean
  created_at: string
  updated_at: string
}

export interface AdminContenuVieDetail extends AdminContenuVieListItem {
  contenu_texte: string | null
  video_url: string | null
  video_fichier_url: string | null
}

export interface AdminContenuViePayload {
  type: TypeContenuVie
  titre: string
  description: string
  contenu_texte?: string | null
  video_url?: string | null
  categorie_id: string
}

export type StatutQuestion = "pending" | "answered" | "rejected"

export interface QuestionAnonyme {
  id: string
  auteur_alias: string | null
  contenu: string
  reponse: string | null
  statut: StatutQuestion
  created_at: string
  answered_at: string | null
}

export interface AdminQuestionAnonyme extends QuestionAnonyme {
  user_id: string
  moderateur_id: string | null
}

export interface PaginatedPageResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

export type StatutTemoignage = "pending" | "approved" | "rejected"

export interface Temoignage {
  id: string
  auteur: string
  contenu: string
  statut: StatutTemoignage
  modere_le: string | null
  created_at: string
  updated_at: string | null
}

export interface AdminTemoignage extends Temoignage {
  user_id: string
  anonyme: boolean
  moderateur_id: string | null
}

export interface TemoignagePayload {
  contenu: string
  anonyme?: boolean
}

export interface BienEtreCategorie {
  id: string
  nom: string
  description: string | null
  created_at: string
}

export interface BienEtreArticle {
  id: string
  titre: string
  contenu: string
  image_url: string | null
  publie: boolean
  publie_le: string | null
  categories: BienEtreCategorie[]
  created_at: string
  updated_at: string | null
}

export interface AdminBienEtreArticle extends BienEtreArticle {
  created_by_id: string | null
}

export interface BienEtreCategoriePayload {
  nom: string
  description?: string | null
}

export interface BienEtreArticlePayload {
  titre: string
  contenu: string
  categorie_ids?: string[]
  publie?: boolean
}

export type StatutParticipation = "en_cours" | "termine"

export interface ParticipationDefi {
  id: string
  statut: StatutParticipation
  created_at: string
  termine_le: string | null
}

export interface Defi {
  id: string
  titre: string
  description: string
  semaine_debut: string
  created_at: string
  updated_at: string | null
  ma_participation: ParticipationDefi | null
}

export interface AdminDefi {
  id: string
  titre: string
  description: string
  semaine_debut: string
  created_at: string
  updated_at: string | null
}

export interface AdminDefiDetail extends AdminDefi {
  nb_participants: number
  nb_termines: number
}

export interface DefiPayload {
  titre: string
  description: string
  date_reference: string
}

export type StatutExploit = "pending" | "approved" | "rejected"

export interface CategorieExploit {
  id: string
  nom: string
  created_at: string
}

export interface Exploit {
  id: string
  titre: string
  description: string
  categorie: CategorieExploit
  media_url: string | null
  statut: StatutExploit
  created_at: string
  updated_at: string | null
}

export interface AdminExploit extends Exploit {
  user_id: string
}

export interface ExploitPayload {
  titre: string
  description: string
  categorie_id: string
  media_url_externe?: string | null
}

export interface ArtisteGospel {
  id: string
  nom: string
  bio: string | null
  photo_url: string | null
  created_at: string
}

export interface GenreMusical {
  id: string
  nom: string
  created_at: string
}

export interface Morceau {
  id: string
  titre: string
  artiste: ArtisteGospel | null
  genre: GenreMusical | null
  duree_secondes: number | null
  audio_url: string | null
  ordre: number
  est_publie: boolean
  created_at: string
  updated_at: string | null
}

export interface MorceauAdmin extends Morceau {
  playlist_id: string
  audio_url_externe: string | null
  audio_path: string | null
}

export interface PlaylistMusicale {
  id: string
  titre: string
  description: string | null
  image_url: string | null
  est_active: boolean
  created_at: string
  updated_at: string | null
}

export interface PlaylistMusicaleDetail extends PlaylistMusicale {
  morceaux: Morceau[]
}

export interface PlaylistMusicaleAdminDetail extends PlaylistMusicale {
  morceaux: MorceauAdmin[]
}

export type StatutPropositionMusique = "pending" | "approved" | "rejected"

export interface PropositionMusique {
  id: string
  titre: string
  artiste_nom: string
  url_externe: string
  note: string | null
  statut: StatutPropositionMusique
  created_at: string
}

export interface PropositionMusiqueAdmin extends PropositionMusique {
  user_id: string
}

export interface ArtisteGospelPayload {
  nom: string
  bio?: string | null
}

export interface GenreMusicalPayload {
  nom: string
}

export interface PlaylistMusicalePayload {
  titre: string
  description?: string | null
  est_active?: boolean
}

export interface MorceauPayload {
  titre: string
  artiste_id?: string | null
  genre_id?: string | null
  duree_secondes?: number | null
  audio_url_externe?: string | null
  ordre?: number
}

export interface PropositionMusiquePayload {
  titre: string
  artiste_nom: string
  url_externe: string
  note?: string | null
}

export type TypeMediaCreativite = "image" | "audio" | "texte" | "audio_ou_texte"
export type StatutCreation = "pending" | "approved" | "rejected"

export interface CategorieCreativite {
  id: string
  nom: string
  description: string | null
  type_media: TypeMediaCreativite
  ordre: number
  created_at: string
}

export interface Creation {
  id: string
  user_id: string
  categorie_id: string
  titre: string
  description: string | null
  contenu_texte: string | null
  media_url: string | null
  statut: StatutCreation
  nb_likes: number
  created_at: string
  updated_at: string | null
}

export interface TalentDuMois {
  annee: number
  mois: number
  nb_likes_snapshot: number
  fige_le: string | null
  creation: Creation
}

export interface CategorieCreativitePayload {
  nom: string
  description?: string | null
  type_media: TypeMediaCreativite
  ordre?: number
}

export interface CreationPayload {
  categorie_id: string
  titre: string
  description?: string | null
  contenu_texte?: string | null
  media_url_externe?: string | null
}

export interface ThemeBiblique {
  id: string
  titre: string
  description: string | null
  mois: number
  annee: number
  created_at: string
  updated_at: string | null
}

export interface QuizBiblique {
  id: string
  titre: string
  description: string | null
  theme_id: string | null
  est_publie: boolean
  created_at: string
  updated_at?: string | null
}

export interface OptionBibliqueAdo {
  id: string
  texte: string
  ordre: number
}

export type TypeQuestionBiblique = "libre" | "verset"
export type DifficulteBiblique = "facile" | "moyen" | "difficile"

export interface QuestionBibliqueAdo {
  id: string
  enonce: string
  type_question: TypeQuestionBiblique
  difficulte: DifficulteBiblique
  points: number
  ordre: number
  options: OptionBibliqueAdo[]
}

export interface QuizBibliqueDetail {
  id: string
  titre: string
  description: string | null
  theme_id: string | null
  questions: QuestionBibliqueAdo[]
}

export interface OptionBibliqueAdmin extends OptionBibliqueAdo {
  est_correcte: boolean
}

export interface QuestionBibliqueAdmin {
  id: string
  enonce: string
  type_question: TypeQuestionBiblique
  difficulte: DifficulteBiblique
  points: number
  ordre: number
  verset_id: string | null
  options: OptionBibliqueAdmin[]
}

export interface QuizBibliqueAdminDetail extends QuizBiblique {
  questions: QuestionBibliqueAdmin[]
}

export interface CorrectionQuestionBiblique {
  question_id: string
  option_choisie_id: string
  option_correcte_id: string
  est_correct: boolean
  points_obtenus: number
  points_max: number
}

export interface ResultatSoumissionBiblique {
  score_obtenu: number
  score_max: number
  pourcentage: number
  est_nouveau_record: boolean
  corrections: CorrectionQuestionBiblique[]
}

export interface TentativeBiblique {
  id: string
  score_obtenu: number
  score_max: number
  est_meilleure: boolean
  created_at: string
}

export interface EntreeClassementBiblique {
  rang: number
  user_id: string
  username: string
  avatar_url: string | null
  score_total: number
  nb_quiz_completes: number
}

export interface ClassementBiblique {
  mois: number
  annee: number
  theme_titre: string | null
  entrees: EntreeClassementBiblique[]
  mon_rang: number | null
}

export interface AdoMisEnAvant {
  id: string
  user_id: string
  username: string
  avatar_url: string | null
  mois: number
  annee: number
  description: string
  created_at: string
}

export interface ThemeBibliquePayload {
  titre: string
  description?: string | null
  mois?: number
  annee?: number
}

export interface QuizBibliquePayload {
  titre: string
  description?: string | null
  theme_id?: string | null
}

export interface QuestionBibliquePayload {
  enonce: string
  type_question?: TypeQuestionBiblique
  difficulte?: DifficulteBiblique
  verset_id?: string | null
  ordre?: number
}

export interface OptionBibliquePayload {
  texte: string
  est_correcte?: boolean
  ordre?: number
}

export interface AdoMisEnAvantPayload {
  user_id: string
  mois: number
  annee: number
  description: string
}
