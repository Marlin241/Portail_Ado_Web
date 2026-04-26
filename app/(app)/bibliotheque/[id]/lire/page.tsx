"use client"

import { use, useEffect, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, CheckCircle2, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { getBook, getBookAccess } from "@/lib/api/books"
import { getBookProgress, putBookProgress } from "@/lib/api/progression"
import type { Book, BookAccess, BookProgress } from "@/lib/api/types"
import dynamic from "next/dynamic"

const PdfReader = dynamic(() => import("@/components/pdf-reader"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Chargement du livre…</span>
    </div>
  ),
})

const EpubReader = dynamic(() => import("@/components/epub-reader"), {
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

  // Priorité PDF > EPUB > autre
  const pdfAsset = access?.assets.find((a) => a.format === "pdf")
  const epubAsset = access?.assets.find((a) => a.format === "epub")
  const activeAsset = pdfAsset ?? epubAsset ?? access?.assets[0]

  // Proxy côté serveur pour contourner les restrictions CORS du stockage (MinIO)
  function proxyUrl(url: string): string {
    if (url.startsWith("#")) return url
    return `/api/proxy/book?url=${encodeURIComponent(url)}`
  }

  const percent = progress?.progress_percent ?? 0
  const isPdf = activeAsset?.format === "pdf" || activeAsset?.mime_type === "application/pdf"
  const isEpub = activeAsset?.format === "epub"

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
    } catch { /* non-bloquant */ }
  }, [book])

  const handleEpubProgress = useCallback(async (pct: number) => {
    if (!book) return
    try {
      const updated = await putBookProgress(book.id, { progress_percent: pct })
      setProgress(updated)
    } catch { /* non-bloquant */ }
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

  if (!book || !activeAsset) {
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
        {isPdf ? (
          <PdfReader
            url={proxyUrl(activeAsset.read_url)}
            initialPage={progress?.current_page ?? 1}
            onPageChange={handlePageChange}
          />
        ) : isEpub ? (
          <EpubReader
            url={proxyUrl(activeAsset.read_url)}
            initialPercent={progress?.progress_percent ?? 0}
            onProgressChange={handleEpubProgress}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-semibold">Format non supporté</p>
            <p className="text-xs text-muted-foreground">
              Ce format ne peut pas être affiché directement dans l&apos;application.
            </p>
          </div>
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
