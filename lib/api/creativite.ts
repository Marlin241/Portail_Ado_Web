import { apiRequest } from "./client"
import { resolveApiUrl } from "./mappers"
import type {
  CategorieCreativite,
  CategorieCreativitePayload,
  Creation,
  CreationPayload,
  PaginatedPageResponse,
  StatutCreation,
  TalentDuMois,
} from "./types"

function mapCreation<T extends Creation>(item: T): T {
  return { ...item, media_url: resolveApiUrl(item.media_url) } as T
}

function mapTalent(item: TalentDuMois): TalentDuMois {
  return { ...item, creation: mapCreation(item.creation) }
}

export async function listCategoriesCreativite(): Promise<CategorieCreativite[]> {
  return apiRequest<CategorieCreativite[]>("/creativite/categories")
}

export async function listCreations(
  params: {
    categorie_id?: string
    mois?: number
    annee?: number
    tri?: "recent" | "likes"
    page?: number
    per_page?: number
  } = {},
): Promise<PaginatedPageResponse<Creation>> {
  return apiRequest<PaginatedPageResponse<Creation>>("/creativite", {
    query: params,
  }).then((res) => ({ ...res, items: res.items.map(mapCreation) }))
}

export async function listMesCreations(): Promise<Creation[]> {
  return apiRequest<Creation[]>("/creativite/mes-creations").then((items) =>
    items.map(mapCreation),
  )
}

export async function getCreation(id: string): Promise<Creation> {
  return apiRequest<Creation>(`/creativite/${id}`).then(mapCreation)
}

export async function submitCreation(payload: CreationPayload): Promise<Creation> {
  return apiRequest<Creation>("/creativite", { method: "POST", body: payload }).then(
    mapCreation,
  )
}

export async function uploadCreationMedia(id: string, file: File): Promise<Creation> {
  const form = new FormData()
  form.append("file", file)
  return apiRequest<Creation>(`/creativite/${id}/media`, {
    method: "POST",
    body: form,
  }).then(mapCreation)
}

export async function likeCreation(id: string): Promise<void> {
  await apiRequest(`/creativite/${id}/like`, { method: "POST" })
}

export async function unlikeCreation(id: string): Promise<void> {
  await apiRequest(`/creativite/${id}/like`, { method: "DELETE" })
}

export async function getTalentDuMois(): Promise<TalentDuMois> {
  return apiRequest<TalentDuMois>("/creativite/talent-du-mois").then(mapTalent)
}

export async function getTalentDuMoisPasse(
  annee: number,
  mois: number,
): Promise<TalentDuMois> {
  return apiRequest<TalentDuMois>(`/creativite/talent-du-mois/${annee}/${mois}`).then(
    mapTalent,
  )
}

export async function adminCreateCategorieCreativite(
  payload: CategorieCreativitePayload,
): Promise<CategorieCreativite> {
  return apiRequest<CategorieCreativite>("/admin/creativite/categories", {
    method: "POST",
    body: payload,
  })
}

export async function adminUpdateCategorieCreativite(
  id: string,
  payload: Partial<CategorieCreativitePayload>,
): Promise<CategorieCreativite> {
  return apiRequest<CategorieCreativite>(`/admin/creativite/categories/${id}`, {
    method: "PUT",
    body: payload,
  })
}

export async function adminDeleteCategorieCreativite(id: string): Promise<void> {
  await apiRequest<void>(`/admin/creativite/categories/${id}`, { method: "DELETE" })
}

export async function adminListCreations(
  params: { statut?: StatutCreation | "all"; page?: number; per_page?: number } = {},
): Promise<PaginatedPageResponse<Creation>> {
  return apiRequest<PaginatedPageResponse<Creation>>("/admin/creativite", {
    query: {
      statut: params.statut === "all" ? undefined : params.statut,
      page: params.page,
      per_page: params.per_page,
    },
  }).then((res) => ({ ...res, items: res.items.map(mapCreation) }))
}

export async function adminGetCreation(id: string): Promise<Creation> {
  return apiRequest<Creation>(`/admin/creativite/${id}`).then(mapCreation)
}

export async function adminChangeCreationStatus(
  id: string,
  statut: Extract<StatutCreation, "approved" | "rejected">,
): Promise<Creation> {
  return apiRequest<Creation>(`/admin/creativite/${id}/statut`, {
    method: "PATCH",
    body: { statut },
  }).then(mapCreation)
}

export async function adminDeleteCreation(id: string): Promise<void> {
  await apiRequest<void>(`/admin/creativite/${id}`, { method: "DELETE" })
}

export async function adminListTalentsDuMois(): Promise<TalentDuMois[]> {
  return apiRequest<TalentDuMois[]>("/admin/creativite/talent-du-mois").then((items) =>
    items.map(mapTalent),
  )
}

export async function adminFreezeTalentDuMois(): Promise<TalentDuMois> {
  return apiRequest<TalentDuMois>("/admin/creativite/talent-du-mois/figer", {
    method: "POST",
  }).then(mapTalent)
}
