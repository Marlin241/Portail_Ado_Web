"use client"

import { use, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { BookOpen, CheckCircle2, ExternalLink, FileText, Loader2, Sparkles } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { getBook } from "@/lib/api/books"
import { getBookProgress } from "@/lib/api/progression"
import type { Book, BookProgress } from "@/lib/api/types"

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [book, setBook] = useState<Book | null>(null)
  const [progress, setProgress] = useState<BookProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getBook(id), getBookProgress(id)])
      .then(([b, p]) => {
        if (!active) return
        setBook(b)
        setProgress(p)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div>
        <ScreenHeader />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div>
        <ScreenHeader title="Livre introuvable" />
        <div className="px-6 pt-6 text-sm text-muted-foreground">Ce livre n&apos;est plus disponible.</div>
      </div>
    )
  }

  const cover =
    book.couverture_url ||
    `/placeholder.svg?height=600&width=400&query=${encodeURIComponent("christian teen book " + book.titre)}`

  return (
    <div>
      {/* Hero cover */}
      <div className="relative h-72 bg-gradient-to-b from-primary/15 to-background">
        <ScreenHeader variant="transparent" showBack />
        <div className="relative -mt-4 flex justify-center">
          <div className="relative h-60 w-40 overflow-hidden rounded-2xl bg-muted shadow-2xl shadow-primary/20 ring-1 ring-border">
            <Image src={cover || "/placeholder.svg"} alt={`Couverture de ${book.titre}`} fill sizes="160px" className="object-cover" priority />
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-6">
        <div className="space-y-1.5 text-center">
          {book.categorie && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
              {book.categorie.nom}
            </span>
          )}
          <h1 className="text-pretty text-xl font-bold leading-tight">{book.titre}</h1>
          <p className="text-sm text-muted-foreground">{book.auteur}</p>
          {book.est_recommande && (
            <div className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
              <Sparkles className="h-3 w-3" /> Coup de cœur
            </div>
          )}
        </div>

        {progress && progress.progress_percent > 0 && (
          <div className="mt-5 rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/10">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-primary">Ta progression</span>
              <span className="font-mono text-foreground">{progress.progress_percent}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, progress.progress_percent)}%` }}
              />
            </div>
            {progress.current_page && progress.total_pages && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Page {progress.current_page} sur {progress.total_pages}
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-5 space-y-2">
          <Link
            href={`/bibliotheque/${book.id}/lire`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
          >
            <BookOpen className="h-4 w-4" />
            {progress && progress.progress_percent > 0 ? "Reprendre la lecture" : "Commencer la lecture"}
          </Link>
          {book.lien_achat && (
            <a
              href={book.lien_achat}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold"
            >
              <ExternalLink className="h-4 w-4" /> Acheter l&apos;original
            </a>
          )}
        </div>

        {/* Description */}
        {book.description && (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide">À propos</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{book.description}</p>
          </section>
        )}

        {/* Meta */}
        <section className="mt-6 grid grid-cols-2 gap-3">
          {book.annee_publication && (
            <MetaTile label="Publication" value={String(book.annee_publication)} />
          )}
          {book.isbn && <MetaTile label="ISBN" value={book.isbn} />}
          <MetaTile
            label="Formats"
            value={book.formats_disponibles.map((f) => f.toUpperCase()).join(" · ") || "PDF"}
            icon={FileText}
          />
          {progress?.completed_at && (
            <MetaTile label="Terminé le" value={new Date(progress.completed_at).toLocaleDateString("fr-FR")} icon={CheckCircle2} />
          )}
        </section>
      </div>
    </div>
  )
}

function MetaTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}
