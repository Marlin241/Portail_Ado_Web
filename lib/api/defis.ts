import { apiRequest } from "./client"
import type {
  AdminDefi,
  AdminDefiDetail,
  Defi,
  DefiPayload,
  PaginatedPageResponse,
  ParticipationDefi,
} from "./types"

export async function listCurrentDefis(): Promise<Defi[]> {
  return apiRequest<Defi[]>("/defis/semaine-courante")
}

export async function listDefis(
  params: { page?: number; per_page?: number } = {},
): Promise<PaginatedPageResponse<Defi>> {
  return apiRequest<PaginatedPageResponse<Defi>>("/defis", { query: params })
}

export async function listMyDefiParticipations(
  params: { page?: number; per_page?: number } = {},
): Promise<PaginatedPageResponse<ParticipationDefi>> {
  return apiRequest<PaginatedPageResponse<ParticipationDefi>>("/defis/mes-participations", {
    query: params,
  })
}

export async function participateDefi(id: string): Promise<ParticipationDefi> {
  return apiRequest<ParticipationDefi>(`/defis/${id}/participer`, { method: "POST" })
}

export async function completeDefi(id: string): Promise<ParticipationDefi> {
  return apiRequest<ParticipationDefi>(`/defis/${id}/terminer`, { method: "PATCH" })
}

export async function adminListDefis(
  params: { page?: number; per_page?: number } = {},
): Promise<PaginatedPageResponse<AdminDefi>> {
  return apiRequest<PaginatedPageResponse<AdminDefi>>("/admin/defis", { query: params })
}

export async function adminGetDefi(id: string): Promise<AdminDefiDetail> {
  return apiRequest<AdminDefiDetail>(`/admin/defis/${id}`)
}

export async function adminCreateDefi(payload: DefiPayload): Promise<AdminDefi> {
  return apiRequest<AdminDefi>("/admin/defis", { method: "POST", body: payload })
}

export async function adminUpdateDefi(id: string, payload: Partial<DefiPayload>): Promise<AdminDefi> {
  return apiRequest<AdminDefi>(`/admin/defis/${id}`, { method: "PUT", body: payload })
}

export async function adminDeleteDefi(id: string): Promise<void> {
  await apiRequest<void>(`/admin/defis/${id}`, { method: "DELETE" })
}
