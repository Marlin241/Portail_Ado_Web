import { apiRequest } from "./client"
import { mapBook, mapCategory } from "./mappers"
import { getBook } from "./books"
import type { AdminBookPayload, Book, CategorieLivre } from "./types"

export async function adminCreateBook(payload: AdminBookPayload): Promise<Book> {
  return apiRequest<Book>("/livres", { method: "POST", body: payload }).then(mapBook)
}

export async function adminUpdateBook(
  id: string,
  payload: Partial<AdminBookPayload>,
): Promise<Book> {
  return apiRequest<Book>(`/livres/${id}`, { method: "PUT", body: payload }).then(mapBook)
}

export async function adminDeleteBook(id: string): Promise<void> {
  await apiRequest<void>(`/livres/${id}`, { method: "DELETE" })
}

export async function adminUploadBookFile(
  id: string,
  format: "pdf" | "epub",
  file: File,
): Promise<Book> {
  const form = new FormData()
  form.append("file", file)
  await apiRequest(`/livres/${id}/fichiers/${format}`, { method: "POST", body: form })
  const book = await getBook(id)
  if (!book) throw new Error("Livre introuvable")
  return book
}

export async function adminUploadBookCover(id: string, file: File): Promise<Book> {
  const form = new FormData()
  form.append("file", file)
  await apiRequest(`/livres/${id}/couverture`, { method: "POST", body: form })
  const book = await getBook(id)
  if (!book) throw new Error("Livre introuvable")
  return book
}

export async function adminCreateCategory(payload: {
  nom: string
  description?: string | null
}): Promise<CategorieLivre> {
  return apiRequest<CategorieLivre>("/livres/categories", { method: "POST", body: payload }).then(mapCategory)
}

export async function adminUpdateCategory(
  id: string,
  payload: { nom?: string; description?: string | null },
): Promise<CategorieLivre> {
  return apiRequest<CategorieLivre>(`/livres/categories/${id}`, {
    method: "PUT",
    body: payload,
  }).then(mapCategory)
}

export async function adminDeleteCategory(id: string): Promise<void> {
  await apiRequest<void>(`/livres/categories/${id}`, { method: "DELETE" })
}
