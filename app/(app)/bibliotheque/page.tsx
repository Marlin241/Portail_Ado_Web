"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Search, SlidersHorizontal, Sparkles, X } from "lucide-react"
import { BookCard } from "@/components/book-card"
import { listBooks, listCategories, listRecommendedBooks } from "@/lib/api/books"
import type { Book, CategorieLivre } from "@/lib/api/types"
import { cn } from "@/lib/utils"

export default function BibliothequePage() {
  const [search, setSearch] = useState("")
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategorieLivre[]>([])
  const [recommended, setRecommended] = useState<Book[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]))
    listRecommendedBooks().then(setRecommended).catch(() => setRecommended([]))
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    listBooks({ search: search || undefined, category_id: selectedCat || undefined, limit: 50 })
      .then((res) => {
        if (!active) return
        setBooks(res.items)
      })
      .catch(() => {
        if (!active) return
        setBooks([])
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [search, selectedCat])

  const showRecommended = !search && !selectedCat

  const filteredCount = useMemo(() => books.length, [books])

  return (
    <div>
      <header className="bg-background px-6 pb-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explorer</p>
        <h1 className="mt-1 text-2xl font-bold">Bibliothèque</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Des livres chrétiens choisis pour toi, adaptés à ta réalité.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Titre, auteur, thème…"
              className="w-full rounded-2xl border border-border bg-card py-2.5 pl-9 pr-9 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-4"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label="Filtres"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="phone-scroll mt-4 flex gap-2 overflow-x-auto pb-1">
          <CategoryChip
            label="Toutes"
            active={selectedCat === null}
            onClick={() => setSelectedCat(null)}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.nom}
              active={selectedCat === c.id}
              onClick={() => setSelectedCat(selectedCat === c.id ? null : c.id)}
            />
          ))}
        </div>
      </header>

      {showRecommended && recommended.length > 0 && (
        <section className="mt-2 pb-2">
          <div className="mb-3 flex items-center gap-2 px-6">
            <Sparkles className="h-4 w-4 text-accent-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wide">Coups de cœur</h2>
          </div>
          <div className="phone-scroll flex gap-3 overflow-x-auto px-6 pb-2">
            {recommended.map((b) => (
              <BookCard key={b.id} book={b} variant="featured" />
            ))}
          </div>
        </section>
      )}

      <section className="px-6 pb-8 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide">
            {selectedCat
              ? categories.find((c) => c.id === selectedCat)?.nom || "Catégorie"
              : search
                ? "Résultats"
                : "Toute la bibliothèque"}
          </h2>
          <span className="text-xs text-muted-foreground">{filteredCount} livre{filteredCount > 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : books.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  )
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <p className="text-sm font-semibold">Aucun livre trouvé</p>
      <p className="text-xs text-muted-foreground">
        {search
          ? `Rien ne correspond à « ${search} ». Essaie un autre mot-clé.`
          : "Cette catégorie est encore vide. Reviens bientôt !"}
      </p>
    </div>
  )
}
