import { apiRequest } from "./client"
import { mapBook, mapBookAccess, mapCategory } from "./mappers"
import type { Book, BookAccess, CategorieLivre, PaginatedResponse } from "./types"

export interface ListBooksParams {
  search?: string
  category_id?: string
  limit?: number
  offset?: number
}

export async function listBooks(params: ListBooksParams = {}): Promise<PaginatedResponse<Book>> {
  return apiRequest<PaginatedResponse<Book>>("/livres", {
    query: {
      q: params.search,
      categorie_id: params.category_id,
      limit: params.limit,
      offset: params.offset,
    },
  }).then((res) => ({
    ...res,
    items: res.items.map(mapBook),
  }))
}

export async function listRecommendedBooks(): Promise<Book[]> {
  return apiRequest<Book[]>("/livres/recommandes").then((items) => items.map(mapBook))
}

export async function listCategories(): Promise<CategorieLivre[]> {
  return apiRequest<CategorieLivre[]>("/livres/categories").then((items) => items.map(mapCategory))
}

export async function getBook(id: string): Promise<Book | null> {
  return apiRequest<Book>(`/livres/${id}`).then(mapBook)
}

export async function getBookAccess(id: string): Promise<BookAccess> {
  return apiRequest<BookAccess>(`/livres/${id}/acces`).then(mapBookAccess)
}
