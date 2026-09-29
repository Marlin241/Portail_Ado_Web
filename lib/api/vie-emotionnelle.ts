import { apiRequest } from "./client"
import { mapContenuVie } from "./mappers"
import type {
  AdminContenuVieDetail,
  AdminContenuVieListItem,
  AdminContenuViePayload,
  CategorieVie,
  ContenuVieDetail,
  ContenuVieListItem,
  PaginatedResponse,
  TypeContenuVie,
} from "./types"

export async function listVieCategories(): Promise<CategorieVie[]> {
  return apiRequest<CategorieVie[]>("/vie-emotionnelle/categories")
}

export async function listVieContenus(
  params: {
    type?: TypeContenuVie
    categorie_id?: string
    q?: string
    limit?: number
    offset?: number
  } = {},
): Promise<PaginatedResponse<ContenuVieListItem>> {
  const res = await apiRequest<{ total: number; items: ContenuVieListItem[] }>("/vie-emotionnelle/contenus", {
    query: params,
  })
  return {
    total: res.total,
    items: res.items.map(mapContenuVie),
    limit: params.limit ?? res.items.length,
    offset: params.offset ?? 0,
  }
}

export async function listMyVieLikes(
  params: { limit?: number; offset?: number } = {},
): Promise<PaginatedResponse<ContenuVieListItem>> {
  const res = await apiRequest<{ total: number; items: ContenuVieListItem[] }>("/vie-emotionnelle/mes-likes", {
    query: params,
  })
  return {
    total: res.total,
    items: res.items.map(mapContenuVie),
    limit: params.limit ?? res.items.length,
    offset: params.offset ?? 0,
  }
}

export async function getVieContenu(id: string): Promise<ContenuVieDetail> {
  return apiRequest<ContenuVieDetail>(`/vie-emotionnelle/contenus/${id}`).then(mapContenuVie)
}

export async function likeVieContenu(id: string): Promise<{ likes_count: number }> {
  return apiRequest<{ likes_count: number }>(`/vie-emotionnelle/contenus/${id}/like`, { method: "POST" })
}

export async function unlikeVieContenu(id: string): Promise<void> {
  await apiRequest<void>(`/vie-emotionnelle/contenus/${id}/like`, { method: "DELETE" })
}

export async function adminListVieCategories(): Promise<CategorieVie[]> {
  return apiRequest<CategorieVie[]>("/admin/vie-emotionnelle/categories")
}

export async function adminCreateVieCategory(payload: { nom: string }): Promise<CategorieVie> {
  return apiRequest<CategorieVie>("/admin/vie-emotionnelle/categories", {
    method: "POST",
    body: payload,
  })
}

export async function adminUpdateVieCategory(id: string, payload: { nom: string }): Promise<CategorieVie> {
  return apiRequest<CategorieVie>(`/admin/vie-emotionnelle/categories/${id}`, {
    method: "PATCH",
    body: payload,
  })
}

export async function adminDeleteVieCategory(id: string): Promise<void> {
  await apiRequest<void>(`/admin/vie-emotionnelle/categories/${id}`, { method: "DELETE" })
}

export async function adminListVieContenus(
  params: {
    type?: TypeContenuVie
    categorie_id?: string
    publie?: boolean
    limit?: number
    offset?: number
  } = {},
): Promise<PaginatedResponse<AdminContenuVieListItem>> {
  const res = await apiRequest<{ total: number; items: AdminContenuVieListItem[] }>(
    "/admin/vie-emotionnelle/contenus",
    { query: params },
  )
  return {
    total: res.total,
    items: res.items.map(mapContenuVie),
    limit: params.limit ?? res.items.length,
    offset: params.offset ?? 0,
  }
}

export async function adminGetVieContenu(id: string): Promise<AdminContenuVieDetail> {
  return apiRequest<AdminContenuVieDetail>(`/admin/vie-emotionnelle/contenus/${id}`).then(mapContenuVie)
}

export async function adminCreateVieContenu(payload: AdminContenuViePayload): Promise<AdminContenuVieDetail> {
  return apiRequest<AdminContenuVieDetail>("/admin/vie-emotionnelle/contenus", {
    method: "POST",
    body: payload,
  }).then(mapContenuVie)
}

export async function adminUpdateVieContenu(
  id: string,
  payload: Partial<AdminContenuViePayload>,
): Promise<AdminContenuVieDetail> {
  return apiRequest<AdminContenuVieDetail>(`/admin/vie-emotionnelle/contenus/${id}`, {
    method: "PATCH",
    body: payload,
  }).then(mapContenuVie)
}

export async function adminDeleteVieContenu(id: string): Promise<void> {
  await apiRequest<void>(`/admin/vie-emotionnelle/contenus/${id}`, { method: "DELETE" })
}

export async function adminToggleViePublication(id: string): Promise<AdminContenuVieDetail> {
  return apiRequest<AdminContenuVieDetail>(`/admin/vie-emotionnelle/contenus/${id}/publier`, {
    method: "POST",
  }).then(mapContenuVie)
}

export async function adminUploadVieCover(id: string, file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  const res = await apiRequest<{ image_couverture_url: string }>(
    `/admin/vie-emotionnelle/contenus/${id}/couverture`,
    { method: "POST", body: form },
  )
  return res.image_couverture_url
}

export async function adminUploadVieVideo(id: string, file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  const res = await apiRequest<{ video_fichier_url: string }>(
    `/admin/vie-emotionnelle/contenus/${id}/video`,
    { method: "POST", body: form },
  )
  return res.video_fichier_url
}
