import { API_BASE_URL } from "./client"
import type {
  AudioProgress,
  AuditLog,
  Book,
  BookAccess,
  BookProgress,
  CategorieLivre,
  Episode,
  EpisodeDetail,
  Podcast,
  User,
} from "./types"

interface BackendUser {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  birth_date: string | null
  role: User["role"]
  account_status: User["account_status"]
  is_active: boolean
  is_verified: boolean
  is_superadmin: boolean
  must_change_password: boolean
  avatar_url: string | null
  created_by_id: string | null
  activated_at: string | null
  created_at: string
  updated_at: string
}

interface BackendCategory {
  id: string
  nom: string
  description: string | null
  created_at?: string
}

interface BackendBook {
  id: string
  titre: string
  auteur: string
  description: string | null
  couverture_url: string | null
  categorie_id: string | null
  categorie: BackendCategory | null
  annee_publication: number | null
  isbn: string | null
  lien_achat: string | null
  est_recommande: boolean
  formats_disponibles: Array<"pdf" | "epub">
  created_by_id: string | null
  created_at: string
  updated_at: string
}

interface BackendBookAccessAsset {
  format: "pdf" | "epub"
  mime_type: string
  expires_at: string
  read_url: string
}

interface BackendBookAccess {
  book_id: string
  assets: BackendBookAccessAsset[]
}

interface BackendPodcast {
  id: string
  titre: string
  description: string | null
  image_url: string | null
  animateur: string | null
  est_actif: boolean
  episodes_count: number
  created_by_id: string | null
  created_at: string
  updated_at: string
}

interface BackendEpisode {
  id: string
  podcast_id: string
  titre: string
  description: string | null
  numero: number
  duree_secondes: number | null
  date_publication: string
  est_publie: boolean
  created_at: string
  updated_at: string
}

interface BackendEpisodeDetail extends BackendEpisode {
  audio: {
    read_url: string
    mime_type: string
    expires_at: string
  }
}

interface BackendBookProgress {
  book_id: string
  derniere_page_lue: number | null
  pourcentage_progression: number
  est_termine: boolean
  updated_at: string | null
}

interface BackendAudioProgress {
  episode_id: string
  position_secondes: number
  duree_secondes: number | null
  pourcentage_progression: number | null
  est_termine: boolean
  updated_at: string | null
}

interface BackendAuditLog {
  id: string
  admin_id: string | null
  admin_username: string
  action: string
  target_id: string | null
  target_label: string | null
  detail: string | null
  created_at: string
}

function looksAbsolute(url: string) {
  return /^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith("blob:") || url.startsWith("data:")
}

export function resolveApiUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (looksAbsolute(url) || url.startsWith("#")) return url
  if (!API_BASE_URL) return url
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`
}

export function mapUser(raw: BackendUser | User): User {
  const source = raw as BackendUser & User
  return {
    id: source.id,
    email: source.email,
    username: source.username,
    first_name: source.first_name,
    last_name: source.last_name,
    birth_date: source.birth_date,
    role: source.role,
    account_status: source.account_status,
    is_superadmin: source.is_superadmin,
    must_change_password: source.must_change_password,
    avatar_url: resolveApiUrl(source.avatar_url),
    is_active: source.is_active,
    is_verified: source.is_verified,
    created_by_id: source.created_by_id,
    activated_at: source.activated_at,
    created_at: source.created_at,
    updated_at: source.updated_at,
  }
}

export function mapCategory(raw: BackendCategory | CategorieLivre): CategorieLivre {
  const source = raw as BackendCategory & CategorieLivre
  return {
    id: source.id,
    nom: source.nom,
    description: source.description,
    created_at: source.created_at,
  }
}

export function mapBook(raw: BackendBook | Book): Book {
  const source = raw as BackendBook & Book
  return {
    id: source.id,
    titre: source.titre,
    auteur: source.auteur,
    description: source.description,
    couverture_url: resolveApiUrl(source.couverture_url),
    categorie_id: source.categorie_id ?? null,
    categorie: source.categorie ? mapCategory(source.categorie) : null,
    annee_publication: source.annee_publication,
    isbn: source.isbn,
    lien_achat: source.lien_achat,
    est_recommande: source.est_recommande,
    formats_disponibles: source.formats_disponibles,
    created_by_id: source.created_by_id ?? null,
    created_at: source.created_at,
    updated_at: source.updated_at,
  }
}

export function mapBookAccess(raw: BackendBookAccess | BookAccess): BookAccess {
  const source = raw as BackendBookAccess & BookAccess
  return {
    book_id: source.book_id,
    assets: source.assets.map((asset) => ({
      format: asset.format,
      mime_type: asset.mime_type,
      expires_at: asset.expires_at,
      read_url: resolveApiUrl(asset.read_url) ?? asset.read_url,
    })),
  }
}

export function mapPodcast(raw: BackendPodcast | Podcast): Podcast {
  const source = raw as BackendPodcast & Podcast
  return {
    id: source.id,
    titre: source.titre,
    description: source.description,
    image_url: resolveApiUrl(source.image_url),
    animateur: source.animateur,
    est_actif: source.est_actif,
    episodes_count: source.episodes_count,
    created_by_id: source.created_by_id ?? null,
    created_at: source.created_at,
    updated_at: source.updated_at,
  }
}

export function mapEpisode(
  raw: BackendEpisode | Episode,
  extras: Partial<Pick<Episode, "audio_url" | "podcast">> = {},
): Episode {
  const source = raw as BackendEpisode & Episode
  return {
    id: source.id,
    podcast_id: source.podcast_id,
    titre: source.titre,
    description: source.description,
    numero: source.numero,
    duree_secondes: source.duree_secondes,
    date_publication: source.date_publication,
    est_publie: source.est_publie,
    created_at: source.created_at,
    updated_at: source.updated_at,
    audio_url: extras.audio_url ?? source.audio_url,
    podcast: extras.podcast ?? source.podcast,
  }
}

export function mapEpisodeDetail(
  raw: BackendEpisodeDetail | EpisodeDetail,
  podcast?: Podcast | null,
): EpisodeDetail {
  const source = raw as BackendEpisodeDetail & EpisodeDetail
  return {
    ...mapEpisode(source, {
      podcast: podcast
        ? { id: podcast.id, titre: podcast.titre, image_url: podcast.image_url }
        : undefined,
    }),
    audio: {
      read_url: resolveApiUrl(source.audio.read_url) ?? source.audio.read_url,
      mime_type: source.audio.mime_type,
      expires_at: source.audio.expires_at,
    },
  }
}

export function mapBookProgress(raw: BackendBookProgress | BookProgress): BookProgress {
  const source = raw as Partial<BackendBookProgress & BookProgress>
  return {
    book_id: source.book_id ?? "",
    user_id: source.user_id ?? "",
    progress_percent: source.pourcentage_progression ?? source.progress_percent ?? 0,
    current_page: source.derniere_page_lue ?? source.current_page ?? null,
    total_pages: source.total_pages ?? null,
    last_opened_at: source.updated_at ?? source.last_opened_at ?? null,
    completed_at:
      source.est_termine ?? Boolean(source.completed_at)
        ? source.updated_at ?? source.completed_at ?? null
        : null,
  }
}

export function mapAudioProgress(raw: BackendAudioProgress | AudioProgress): AudioProgress {
  const source = raw as Partial<BackendAudioProgress & AudioProgress>
  return {
    episode_id: source.episode_id ?? "",
    user_id: source.user_id ?? "",
    position_seconds: source.position_secondes ?? source.position_seconds ?? 0,
    duration_seconds: source.duree_secondes ?? source.duration_seconds ?? null,
    completed: source.est_termine ?? source.completed ?? false,
    last_listened_at: source.updated_at ?? source.last_listened_at ?? null,
  }
}

function mapAuditAction(action: string): string {
  const explicit: Record<string, string> = {
    user_created: "user.create",
    user_updated: "user.update",
    user_suspended: "user.suspend",
    user_reactivated: "user.reactivate",
    user_deleted: "user.delete",
    user_password_reset: "user.reset_password",
  }
  return explicit[action] ?? action
}

function inferEntityType(action: string): string {
  if (action.startsWith("user_")) return "user"
  return "admin"
}

export function mapAuditLog(raw: BackendAuditLog | AuditLog): AuditLog {
  const source = raw as Partial<BackendAuditLog & AuditLog>
  return {
    id: source.id ?? "",
    actor_id: source.admin_id ?? source.actor_id ?? "",
    actor_email: source.admin_username ?? source.actor_email ?? "",
    action: mapAuditAction(source.action ?? ""),
    entity_type: source.entity_type ?? inferEntityType(source.action ?? ""),
    entity_id: source.target_id ?? source.entity_id ?? null,
    ip_address: source.ip_address ?? null,
    user_agent: source.user_agent ?? null,
    metadata:
      source.detail || source.target_label
        ? { detail: source.detail ?? null, target_label: source.target_label ?? null }
        : source.metadata ?? null,
    created_at: source.created_at ?? "",
  }
}
