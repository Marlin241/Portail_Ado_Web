import { apiRequest } from "./client"
import type {
  AdminTemoignage,
  PaginatedPageResponse,
  StatutTemoignage,
  Temoignage,
  TemoignagePayload,
} from "./types"

export async function listTemoignages(
  params: { page?: number; per_page?: number } = {},
): Promise<PaginatedPageResponse<Temoignage>> {
  return apiRequest<PaginatedPageResponse<Temoignage>>("/temoignages", {
    auth: false,
    query: params,
  })
}

export async function getTemoignage(id: string): Promise<Temoignage> {
  return apiRequest<Temoignage>(`/temoignages/${id}`, { auth: false })
}

export async function submitTemoignage(payload: TemoignagePayload): Promise<Temoignage> {
  return apiRequest<Temoignage>("/temoignages", {
    method: "POST",
    body: payload,
  })
}

export async function listMyTemoignages(
  params: { page?: number; per_page?: number } = {},
): Promise<PaginatedPageResponse<Temoignage>> {
  return apiRequest<PaginatedPageResponse<Temoignage>>("/temoignages/mes-temoignages", {
    query: params,
  })
}

export async function updateTemoignage(id: string, payload: TemoignagePayload): Promise<Temoignage> {
  return apiRequest<Temoignage>(`/temoignages/${id}`, {
    method: "PATCH",
    body: payload,
  })
}

export async function deleteTemoignage(id: string): Promise<void> {
  await apiRequest<void>(`/temoignages/${id}`, { method: "DELETE" })
}

export async function adminListTemoignages(
  params: { statut?: StatutTemoignage; page?: number; per_page?: number } = {},
): Promise<PaginatedPageResponse<AdminTemoignage>> {
  return apiRequest<PaginatedPageResponse<AdminTemoignage>>("/admin/temoignages", {
    query: params,
  })
}

export async function adminApproveTemoignage(id: string): Promise<AdminTemoignage> {
  return apiRequest<AdminTemoignage>(`/admin/temoignages/${id}/approuver`, {
    method: "PATCH",
  })
}

export async function adminRejectTemoignage(id: string): Promise<AdminTemoignage> {
  return apiRequest<AdminTemoignage>(`/admin/temoignages/${id}/rejeter`, {
    method: "PATCH",
  })
}

export async function adminDeleteTemoignage(id: string): Promise<void> {
  await apiRequest<void>(`/admin/temoignages/${id}`, { method: "DELETE" })
}
