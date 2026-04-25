"use client"

import { use, useEffect, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, CheckCircle2, Loader2, X } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { getBook, getBookAccess } from "@/lib/api/books"
import { getBookProgress, putBookProgress } from "@/lib/api/progression"
import type { Book, BookAccess, BookProgress } from "@/lib/api/types"
import dynamic from "next/dynamic"

// Import dynamique pour éviter le SSR (pdf.js a besoin du DOM)
const PdfReader = dynamic(() => import("@/components/pdf-reader"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Chargement du livre…</span>
    </div>
  ),
})

export default function BookReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [book, setBook] = useState<Book | null>(null)
  const [access, setAccess] = useState<BookAccess | null>(null)
  const [progress, setProgress] = useState<BookProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoadError(null)
    Promise.all([getBook(id), getBookAccess(id), getBookProgress(id)])
      .then(([b, a, p]) => {
        if (!active) return
        setBook(b)
        setAccess(a)
        setProgress(p)
      })
      .catch((e) => {
        if (!active) return
        const msg = e?.message || "Impossible de charger le livre."
        setLoadError(msg)
        toast.error(msg)
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])

  const pdfAsset = access?.assets.find((a) => a.format === "pdf") ?? access?.assets[0]
  const percent = progress?.progress_percent ?? 0
  const isPdf = pdfAsset?.format === "pdf" || pdfAsset?.mime_type === "application/pdf"
  const isMock = pdfAsset?.read_url?.startsWith("#mock") ?? false

  // Sauvegarde automatique à chaque changement de page (PDF uniquement)
  const handlePageChange = useCallback(async (page: number, total: number) => {
    if (!book) return
    const pct = total > 0 ? Math.round((page / total) * 100) : 0
    try {
      const updated = await putBookProgress(book.id, {
        progress_percent: pct,
        current_page: page,
        total_pages: total,
      })
      setProgress(updated)
    } catch {
      // non-bloquant
    }
  }, [book])

  async function markComplete() {
    if (!book) return
    setSaving(true)
    try {
      const updated = await putBookProgress(book.id, {
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      })
      setProgress(updated)
      toast.success("Bravo ! Livre marqué comme terminé.")
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Action impossible.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!book || !pdfAsset) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background px-6 text-center">
        <p className="text-sm font-semibold">Lecture indisponible</p>
        <p className="text-xs text-muted-foreground">
          {loadError
            ? loadError
            : !access || !access.assets.length
              ? "Aucun fichier de lecture n'est disponible pour ce livre. Contacte un administrateur."
              : "Le fichier n'a pas pu être chargé. Réessaie plus tard."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-foreground/95 text-background">

      {/* Barre du haut */}
      <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Fermer"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background/15 backdrop-blur"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 px-3 text-center">
          <p className="truncate text-xs text-background/70">{book.auteur}</p>
          <p className="truncate text-sm font-semibold">{book.titre}</p>
        </div>
        <button
          type="button"
          onClick={markComplete}
          disabled={saving || percent >= 100}
          aria-label="Marquer comme terminé"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background/15 backdrop-blur disabled:opacity-40"
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>
      </div>

      {/* Zone de lecture */}
      <div className="flex-1 overflow-hidden">
        {isMock ? (
          // Mode aperçu (mock)
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center bg-background text-foreground">
            <div className="relative h-40 w-28 overflow-hidden rounded-xl shadow-md">
              {book.couverture_url && (
                <Image src={book.couverture_url} alt="" fill sizes="112px" className="object-cover" />
              )}
            </div>
            <BookOpen className="h-6 w-6 text-primary" />
            <p className="text-sm font-semibold">Aperçu</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              La lecture sécurisée s&apos;ouvre ici quand le backend fournit l&apos;URL temporaire.
            </p>
          </div>
        ) : isPdf ? (
          // Lecteur PDF canvas — pas de toolbar navigateur
          <PdfReader
            url={pdfAsset.read_url}
            onPageChange={handlePageChange}
          />
        ) : (
          // EPUB ou autre format — iframe sans toolbar
          // #toolbar=0&navpanes=0 masque la toolbar sur Chrome/Edge pour les PDFs aussi
          <iframe
            src={`${pdfAsset.read_url}#toolbar=0&navpanes=0&scrollbar=0`}
            title={book.titre}
            className="h-full w-full border-0 bg-background"
            sandbox="allow-same-origin allow-scripts"
          />
        )}
      </div>

      {/* Barre de progression globale */}
      <div className="shrink-0 border-t border-background/10 bg-foreground px-4 pt-2 pb-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-background/70">Progression</span>
          <span className="font-mono font-semibold text-background">{percent}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-background/15">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      </div>

    </div>
  )
}
