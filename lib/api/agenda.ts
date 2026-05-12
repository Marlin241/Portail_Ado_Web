import { apiRequest } from "./client"
import { normalizeBibleTranslations } from "../bible-translations"
import type {
  AdminMeditation,
  AdminMeditationPayload,
  CalendrierEntry,
  LivreBiblique,
  Meditation,
  PaginatedResponse,
  TraductionBiblique,
  VersetBiblique,
} from "./types"

export async function getTodayMeditation(): Promise<Meditation> {
  return apiRequest<Meditation>("/agenda/aujourd-hui")
}

export async function listMeditationCalendar(params: {
  avant: string
  limit?: number
}): Promise<CalendrierEntry[]> {
  return apiRequest<CalendrierEntry[]>("/agenda/calendrier", {
    query: { avant: params.avant, limit: params.limit },
  })
}

export async function getMeditation(id: string): Promise<Meditation> {
  return apiRequest<Meditation>(`/agenda/meditations/${id}`)
}

export async function likeMeditation(id: string): Promise<Meditation> {
  return apiRequest<Meditation>(`/agenda/meditations/${id}/like`, { method: "POST" })
}

export async function unlikeMeditation(id: string): Promise<void> {
  await apiRequest<void>(`/agenda/meditations/${id}/like`, { method: "DELETE" })
}

export async function adminListMeditations(
  params: {
    mois?: number
    annee?: number
    is_surcharge?: boolean
    limit?: number
    offset?: number
  } = {},
): Promise<PaginatedResponse<AdminMeditation>> {
  return apiRequest<PaginatedResponse<AdminMeditation>>("/admin/agenda/meditations", {
    query: params,
  })
}

export async function adminGetMeditation(id: string): Promise<AdminMeditation> {
  return apiRequest<AdminMeditation>(`/admin/agenda/meditations/${id}`)
}

export async function adminCreateMeditation(payload: AdminMeditationPayload): Promise<AdminMeditation> {
  return apiRequest<AdminMeditation>("/admin/agenda/meditations", {
    method: "POST",
    body: payload,
  })
}

export async function adminUpdateMeditation(
  id: string,
  payload: Partial<AdminMeditationPayload>,
): Promise<AdminMeditation> {
  return apiRequest<AdminMeditation>(`/admin/agenda/meditations/${id}`, {
    method: "PATCH",
    body: payload,
  })
}

export async function adminDeleteMeditation(id: string): Promise<void> {
  await apiRequest<void>(`/admin/agenda/meditations/${id}`, { method: "DELETE" })
}

export async function adminListBibleTranslations(): Promise<TraductionBiblique[]> {
  return apiRequest<unknown>("/admin/agenda/traductions").then(normalizeBibleTranslations)
}

export async function adminListBibleBooks(traduction?: string | null): Promise<LivreBiblique[]> {
  return apiRequest<LivreBiblique[]>("/admin/agenda/livres-bibliques", {
    query: { traduction },
  })
}

export async function adminListBibleChapters(
  bookId: string,
  traduction: string,
): Promise<number[]> {
  return apiRequest<number[]>(`/admin/agenda/livres-bibliques/${bookId}/chapitres`, {
    query: { traduction },
  })
}

export async function adminListVerses(
  bookId: string,
  chapitre: number,
  traduction: string,
): Promise<VersetBiblique[]> {
  return apiRequest<VersetBiblique[]>(`/admin/agenda/livres-bibliques/${bookId}/versets`, {
    query: { chapitre, traduction },
  })
}
