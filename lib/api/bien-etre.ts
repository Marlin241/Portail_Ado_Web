import { apiRequest } from "./client"
import type {
  AdminBienEtreArticle,
  BienEtreArticle,
  BienEtreArticlePayload,
  BienEtreCategorie,
  BienEtreCategoriePayload,
  PaginatedPageResponse,
} from "./types"

export async function listBienEtreCategories(): Promise<BienEtreCategorie[]> {
  return apiRequest<BienEtreCategorie[]>("/bien-etre/categories")
}

export async function listBienEtreArticles(
  params: { page?: number; per_page?: number; categorie_id?: string } = {},
): Promise<PaginatedPageResponse<BienEtreArticle>> {
  return apiRequest<PaginatedPageResponse<BienEtreArticle>>("/bien-etre/articles", {
    query: params,
  })
}

export async function getBienEtreArticle(id: string): Promise<BienEtreArticle> {
  return apiRequest<BienEtreArticle>(`/bien-etre/articles/${id}`)
}

export async function adminListBienEtreCategories(): Promise<BienEtreCategorie[]> {
  return apiRequest<BienEtreCategorie[]>("/admin/bien-etre/categories")
}

export async function adminCreateBienEtreCategory(
  payload: BienEtreCategoriePayload,
): Promise<BienEtreCategorie> {
  return apiRequest<BienEtreCategorie>("/admin/bien-etre/categories", {
    method: "POST",
    body: payload,
  })
}

export async function adminUpdateBienEtreCategory(
  id: string,
  payload: BienEtreCategoriePayload,
): Promise<BienEtreCategorie> {
  return apiRequest<BienEtreCategorie>(`/admin/bien-etre/categories/${id}`, {
    method: "PATCH",
    body: payload,
  })
}

export async function adminDeleteBienEtreCategory(id: string): Promise<void> {
  await apiRequest<void>(`/admin/bien-etre/categories/${id}`, { method: "DELETE" })
}

export async function adminListBienEtreArticles(
  params: { page?: number; per_page?: number; publie?: boolean } = {},
): Promise<PaginatedPageResponse<AdminBienEtreArticle>> {
  return apiRequest<PaginatedPageResponse<AdminBienEtreArticle>>("/admin/bien-etre/articles", {
    query: params,
  })
}

export async function adminGetBienEtreArticle(id: string): Promise<AdminBienEtreArticle> {
  return apiRequest<AdminBienEtreArticle>(`/admin/bien-etre/articles/${id}`)
}

export async function adminCreateBienEtreArticle(
  payload: BienEtreArticlePayload,
): Promise<AdminBienEtreArticle> {
  return apiRequest<AdminBienEtreArticle>("/admin/bien-etre/articles", {
    method: "POST",
    body: payload,
  })
}

export async function adminUpdateBienEtreArticle(
  id: string,
  payload: Partial<BienEtreArticlePayload>,
): Promise<AdminBienEtreArticle> {
  return apiRequest<AdminBienEtreArticle>(`/admin/bien-etre/articles/${id}`, {
    method: "PATCH",
    body: payload,
  })
}

export async function adminDeleteBienEtreArticle(id: string): Promise<void> {
  await apiRequest<void>(`/admin/bien-etre/articles/${id}`, { method: "DELETE" })
}

export async function adminUploadBienEtreImage(id: string, file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  const res = await apiRequest<{ article_id: string; image_url: string }>(
    `/admin/bien-etre/articles/${id}/image`,
    { method: "POST", body: form },
  )
  return res.image_url
}
