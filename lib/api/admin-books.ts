import { apiRequest, isMockMode } from "./client"
import { mapBook, mapCategory } from "./mappers"
import { getBook } from "./books"
import { makeId, mockAppendAudit, mockBooks, mockCategories } from "./mocks-admin"
import type { AdminBookPayload, Book, CategorieLivre } from "./types"

export async function adminCreateBook(payload: AdminBookPayload): Promise<Book> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 120))
    const categorie =
      mockCategories.find((c) => c.id === payload.categorie_id) ?? null
    const now = new Date().toISOString()
    const book: Book = {
      id: makeId("b"),
      titre: payload.titre,
      auteur: payload.auteur,
      description: payload.description ?? null,
      couverture_url: null,
      categorie,
      annee_publication: payload.annee_publication ?? null,
      isbn: payload.isbn ?? null,
      lien_achat: payload.lien_achat ?? null,
      est_recommande: payload.est_recommande ?? false,
      formats_disponibles: [],
      created_at: now,
      updated_at: now,
    }
    mockBooks.unshift(book)
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "book.create",
      entity_type: "book",
      entity_id: book.id,
      ip_address: null,
      user_agent: null,
      metadata: { titre: book.titre },
    })
    return book
  }
  return apiRequest<Book>("/livres", { method: "POST", body: payload }).then(mapBook)
}

export async function adminUpdateBook(
  id: string,
  payload: Partial<AdminBookPayload>,
): Promise<Book> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 120))
    const idx = mockBooks.findIndex((b) => b.id === id)
    if (idx === -1) throw new Error("Livre introuvable")
    const prev = mockBooks[idx]
    const categorie =
      payload.categorie_id === undefined
        ? prev.categorie
        : (mockCategories.find((c) => c.id === payload.categorie_id) ?? null)
    const next: Book = {
      ...prev,
      titre: payload.titre ?? prev.titre,
      auteur: payload.auteur ?? prev.auteur,
      description: payload.description ?? prev.description,
      annee_publication: payload.annee_publication ?? prev.annee_publication,
      isbn: payload.isbn ?? prev.isbn,
      lien_achat: payload.lien_achat ?? prev.lien_achat,
      est_recommande: payload.est_recommande ?? prev.est_recommande,
      categorie,
      updated_at: new Date().toISOString(),
    }
    mockBooks[idx] = next
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "book.update",
      entity_type: "book",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: payload as Record<string, unknown>,
    })
    return next
  }
  return apiRequest<Book>(`/livres/${id}`, { method: "PUT", body: payload }).then(mapBook)
}

export async function adminDeleteBook(id: string): Promise<void> {
  if (isMockMode()) {
    const idx = mockBooks.findIndex((b) => b.id === id)
    if (idx !== -1) mockBooks.splice(idx, 1)
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "book.delete",
      entity_type: "book",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: {},
    })
    return
  }
  await apiRequest<void>(`/livres/${id}`, { method: "DELETE" })
}

export async function adminUploadBookFile(
  id: string,
  format: "pdf" | "epub",
  file: File,
): Promise<Book> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 200))
    const idx = mockBooks.findIndex((b) => b.id === id)
    if (idx === -1) throw new Error("Livre introuvable")
    const prev = mockBooks[idx]
    const formats = prev.formats_disponibles.includes(format)
      ? prev.formats_disponibles
      : [...prev.formats_disponibles, format]
    mockBooks[idx] = { ...prev, formats_disponibles: formats, updated_at: new Date().toISOString() }
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "book.upload",
      entity_type: "book",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: { format, filename: file.name, size: file.size },
    })
    return mockBooks[idx]
  }
  const form = new FormData()
  form.append("file", file)
  await apiRequest(`/livres/${id}/fichiers/${format}`, { method: "POST", body: form })
  const book = await getBook(id)
  if (!book) throw new Error("Livre introuvable")
  return book
}

export async function adminUploadBookCover(id: string, file: File): Promise<Book> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 150))
    const idx = mockBooks.findIndex((b) => b.id === id)
    if (idx === -1) throw new Error("Livre introuvable")
    mockBooks[idx] = { ...mockBooks[idx], couverture_url: URL.createObjectURL(file) }
    return mockBooks[idx]
  }
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
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 100))
    const cat: CategorieLivre = {
      id: makeId("c"),
      nom: payload.nom,
      description: payload.description ?? null,
    }
    mockCategories.push(cat)
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "category.create",
      entity_type: "category",
      entity_id: cat.id,
      ip_address: null,
      user_agent: null,
      metadata: { nom: cat.nom },
    })
    return cat
  }
  return apiRequest<CategorieLivre>("/livres/categories", { method: "POST", body: payload }).then(mapCategory)
}

export async function adminDeleteCategory(id: string): Promise<void> {
  if (isMockMode()) {
    const idx = mockCategories.findIndex((c) => c.id === id)
    if (idx !== -1) mockCategories.splice(idx, 1)
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "category.delete",
      entity_type: "category",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: {},
    })
    return
  }
  await apiRequest<void>(`/livres/categories/${id}`, { method: "DELETE" })
}
