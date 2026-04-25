"use client"

import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Book } from "@/lib/api/types"

interface BookCardProps {
  book: Book
  variant?: "featured" | "list" | "compact"
  progress?: number
  className?: string
}

function coverSrc(book: Book) {
  return book.couverture_url || `/placeholder.svg?height=300&width=200&query=${encodeURIComponent("christian teen book cover " + book.titre)}`
}

export function BookCard({ book, variant = "list", progress, className }: BookCardProps) {
  const src = coverSrc(book)

  if (variant === "featured") {
    return (
      <Link
        href={`/bibliotheque/${book.id}`}
        className={cn(
          "group relative block w-44 shrink-0 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md",
          className,
        )}
      >
        <div className="relative aspect-[2/3] w-full bg-muted">
          <Image src={src || "/placeholder.svg"} alt={`Couverture de ${book.titre}`} fill sizes="176px" className="object-cover" />
          {book.est_recommande && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground shadow-sm">
              <Sparkles className="h-3 w-3" aria-hidden /> Coup de cœur
            </span>
          )}
        </div>
        <div className="space-y-0.5 px-3 py-2.5">
          <p className="line-clamp-1 text-sm font-semibold text-foreground">{book.titre}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{book.auteur}</p>
        </div>
      </Link>
    )
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/bibliotheque/${book.id}`}
        className={cn("group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted", className)}
      >
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image src={src || "/placeholder.svg"} alt="" fill sizes="48px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-semibold">{book.titre}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{book.auteur}</p>
          {typeof progress === "number" && (
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/bibliotheque/${book.id}`}
      className={cn(
        "group flex gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image src={src || "/placeholder.svg"} alt="" fill sizes="80px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">{book.titre}</p>
          {book.est_recommande && (
            <Sparkles className="h-4 w-4 shrink-0 text-accent-foreground/80" aria-label="Recommandé" />
          )}
        </div>
        <p className="line-clamp-1 text-xs text-muted-foreground">{book.auteur}</p>
        {book.categorie && (
          <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
            {book.categorie.nom}
          </span>
        )}
        {book.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{book.description}</p>
        )}
      </div>
    </Link>
  )
}
