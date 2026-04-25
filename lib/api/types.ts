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
}
