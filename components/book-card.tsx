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
          "group relative block w-44 shrink-0 overflow-hidden rounded-2xl bg-card shadow-md shadow-foreground/8 ring-1 ring-border/50 transition-all duration-250 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/15 hover:ring-primary/30",
          className,
        )}
      >
        <div className="relative aspect-2/3 w-full bg-muted">
          <Image
            src={src || "/placeholder.svg"}
            alt={`Couverture de ${book.titre}`}
            fill
            sizes="176px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {/* Dégradé bas pour lisibilité */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/40 to-transparent" />
          {book.est_recommande && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground shadow-sm">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              Coup de cœur
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
        className={cn(
          "group flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-2.5 shadow-sm transition-all duration-200 hover:border-primary/20 hover:bg-muted/40",
          className,
        )}
      >
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm">
          <Image src={src || "/placeholder.svg"} alt="" fill sizes="48px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-semibold">{book.titre}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{book.auteur}</p>
          {typeof progress === "number" && (
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>
        <ArrowChevron />
      </Link>
    )
  }

  return (
    <Link
      href={`/bibliotheque/${book.id}`}
      className={cn(
        "group flex gap-3 rounded-2xl border border-border/50 bg-card p-3 shadow-sm transition-all duration-250 hover:border-primary/20 hover:shadow-md hover:shadow-primary/8",
        className,
      )}
    >
      <div className="relative aspect-2/3 w-20 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm">
        <Image src={src || "/placeholder.svg"} alt="" fill sizes="80px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">{book.titre}</p>
          {book.est_recommande && (
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" aria-label="Recommandé" />
          )}
        </div>
        <p className="line-clamp-1 text-xs text-muted-foreground">{book.auteur}</p>
        {book.categorie && (
          <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
            {book.categorie.nom}
          </span>
        )}
        {book.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{book.description}</p>
        )}
      </div>
    </Link>
  )
}

function ArrowChevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
