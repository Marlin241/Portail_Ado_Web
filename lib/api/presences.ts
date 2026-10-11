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

export function getReunion(id: string): Promise<ReunionDetail> {
  return apiRequest<ReunionDetail>(`${BASE}/reunions/${id}`)
}

export function renommerReunion(id: string, titre: string): Promise<ReunionDetail> {
  return apiRequest<ReunionDetail>(`${BASE}/reunions/${id}`, { method: "PATCH", body: { titre } })
}

export async function retirerPresence(reunionId: string, userId: string): Promise<void> {
  await apiRequest<void>(`${BASE}/reunions/${reunionId}/presences/${userId}`, {
    method: "DELETE",
  })
}

export function regenererCodeAdo(userId: string): Promise<{ code: string }> {
  return apiRequest<{ code: string }>(`${BASE}/ados/${userId}/code/regenerer`, { method: "POST" })
}

export function telechargerPdfReunion(id: string): Promise<Blob> {
  return apiRequestBlob(`${BASE}/reunions/${id}/pdf`)
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
