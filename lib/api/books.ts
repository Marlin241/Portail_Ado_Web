import { apiRequest, USE_MOCKS } from "./client"
import { mapBook, mapBookAccess, mapCategory } from "./mappers"
import { mockBookAccess } from "./mocks"
import { mockBooks as MOCK_BOOKS, mockCategories as MOCK_CATEGORIES } from "./mocks-admin"
import type { Book, BookAccess, CategorieLivre, PaginatedResponse } from "./types"

export interface ListBooksParams {
  search?: string
  category_id?: string
  limit?: number
  offset?: number
}

export async function listBooks(params: ListBooksParams = {}): Promise<PaginatedResponse<Book>> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 180))
    let items = [...MOCK_BOOKS]
    if (params.search) {
      const s = params.search.toLowerCase()
      items = items.filter(
        (b) =>
          b.titre.toLowerCase().includes(s) ||
          b.auteur.toLowerCase().includes(s) ||
          (b.description?.toLowerCase().includes(s) ?? false),
      )
    }
    if (params.category_id) {
      items = items.filter((b) => b.categorie?.id === params.category_id)
    }
    const limit = params.limit ?? 20
    const offset = params.offset ?? 0
    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
      limit,
      offset,
    }
  }

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
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 150))
    return MOCK_BOOKS.filter((b) => b.est_recommande)
  }
  return apiRequest<Book[]>("/livres/recommandes").then((items) => items.map(mapBook))
}

export async function listCategories(): Promise<CategorieLivre[]> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 120))
    return MOCK_CATEGORIES
  }
  return apiRequest<CategorieLivre[]>("/livres/categories").then((items) => items.map(mapCategory))
}

export async function getBook(id: string): Promise<Book | null> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 120))
    return MOCK_BOOKS.find((b) => b.id === id) ?? null
  }
  return apiRequest<Book>(`/livres/${id}`).then(mapBook)
}

export async function getBookAccess(id: string): Promise<BookAccess> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 200))
    return mockBookAccess(id)
  }
  return apiRequest<BookAccess>(`/livres/${id}/acces`).then(mapBookAccess)
}
