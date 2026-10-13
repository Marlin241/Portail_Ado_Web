// Présences par QR code — client des routes /api/v1/admin/presences/*.
import { apiRequest, apiRequestBlob } from "./client"
import type { ApiError } from "./types"

export interface AdoPresence {
  id: string
  prenom: string
  nom: string
}

export interface ReunionResume {
  id: string
  jour: string
  titre: string
  nb_presents: number
}

export interface EnregistrementPresence {
  statut: "present" | "deja_present"
  ado: AdoPresence
  reunion: ReunionResume
}

export interface AdoRecherche extends AdoPresence {
  username: string
  deja_present: boolean
}

export interface PresenceDetail {
  user_id: string
  prenom: string
  nom: string
  methode: "scan" | "manuel"
  heure: string
  enregistre_par: string | null
}

export interface ReunionDetail extends ReunionResume {
  presences: PresenceDetail[]
}

export interface PaginatedReunions {
  items: ReunionResume[]
  total: number
  limit: number
  offset: number
}

const BASE = "/admin/presences"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Vrai si la valeur est un identifiant UUID (refuse « ../ » et autres chemins piégés). */
export function estUuid(valeur: unknown): valeur is string {
  return typeof valeur === "string" && UUID_RE.test(valeur)
}

/** Segment d'URL sûr : un UUID, sinon on refuse d'appeler l'API. */
function id(valeur: string): string {
  if (!estUuid(valeur)) throw { status: 400, message: "Identifiant invalide" } satisfies ApiError
  return encodeURIComponent(valeur)
}

export function scannerCode(code: string): Promise<EnregistrementPresence> {
  return apiRequest<EnregistrementPresence>(`${BASE}/scan`, { method: "POST", body: { code } })
}

export function cocherAdo(userId: string): Promise<EnregistrementPresence> {
  return apiRequest<EnregistrementPresence>(`${BASE}/manuel`, {
    method: "POST",
    body: { user_id: userId },
  })
}

export function chercherAdos(q: string): Promise<AdoRecherche[]> {
  return apiRequest<AdoRecherche[]>(`${BASE}/ados`, { query: { q } })
}

export function reunionAujourdhui(): Promise<ReunionResume | null> {
  return apiRequest<ReunionResume | null>(`${BASE}/reunions/aujourdhui`)
}

export function listerReunions(
  params: { limit?: number; offset?: number } = {},
): Promise<PaginatedReunions> {
  return apiRequest<PaginatedReunions>(`${BASE}/reunions`, { query: params })
}

export function getReunion(reunionId: string): Promise<ReunionDetail> {
  return apiRequest<ReunionDetail>(`${BASE}/reunions/${id(reunionId)}`)
}

export function renommerReunion(reunionId: string, titre: string): Promise<ReunionDetail> {
  return apiRequest<ReunionDetail>(`${BASE}/reunions/${id(reunionId)}`, { method: "PATCH", body: { titre } })
}

export async function retirerPresence(reunionId: string, userId: string): Promise<void> {
  await apiRequest<void>(`${BASE}/reunions/${id(reunionId)}/presences/${id(userId)}`, {
    method: "DELETE",
  })
}

export async function supprimerReunion(reunionId: string): Promise<void> {
  await apiRequest<void>(`${BASE}/reunions/${id(reunionId)}`, { method: "DELETE" })
}

export function regenererCodeAdo(userId: string): Promise<{ code: string }> {
  return apiRequest<{ code: string }>(`${BASE}/ados/${id(userId)}/code/regenerer`, { method: "POST" })
}

export function telechargerPdfReunion(reunionId: string): Promise<Blob> {
  return apiRequestBlob(`${BASE}/reunions/${id(reunionId)}/pdf`)
}

/** Message à afficher pour une erreur de scan / coche, en français simple. */
export function messageErreurPresence(err: unknown): string {
  const e = err as Partial<ApiError> | undefined
  if (!e || typeof e.status !== "number") return "Pas de connexion, réessayez"
  if (e.status === 404) return "QR non reconnu"
  const detail = (e.detail as { detail?: { message?: string } } | null)?.detail
  if (e.status === 409 && detail?.message) return detail.message
  return e.message || "Une erreur est survenue"
}

/** Vrai quand l'erreur vient du réseau (aucune réponse du serveur). */
export function estErreurReseau(err: unknown): boolean {
  return typeof (err as Partial<ApiError> | undefined)?.status !== "number"
}

/** « samedi 11 octobre 2026 » à partir de « 2026-10-11 ». */
export function formaterJour(jour: string): string {
  const [a, m, j] = jour.split("-").map(Number)
  return new Date(a, m - 1, j).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
