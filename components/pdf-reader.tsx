"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Loader2 } from "lucide-react"

interface PdfReaderProps {
  url: string
  onPageChange?: (page: number, total: number) => void
}

export default function PdfReader({ url, onPageChange }: PdfReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTaskRef = useRef<any>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      setLoading(true)
      setError(null)
      try {
        // pdfjs-dist v3.11.174 — worker CDN correspondant exactement à cette version
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf")
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

        const pdf = await pdfjsLib.getDocument(url).promise
        if (cancelled) return

        pdfRef.current = pdf
        setTotalPages(pdf.numPages)
        setLoading(false)
        renderPage(pdf, 1)
      } catch (e) {
        if (cancelled) return
        console.error("PdfReader load error:", e)
        setError("Impossible de charger le PDF.")
        setLoading(false)
      }
    }

    loadPdf()
    return () => {
      cancelled = true
      try { renderTaskRef.current?.cancel() } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPage = useCallback(async (pdf: any, pageNum: number) => {
    if (!pdf || !canvasRef.current) return

    try { renderTaskRef.current?.cancel() } catch {}

    setPageLoading(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    try {
      const page = await pdf.getPage(pageNum)
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth
      const baseViewport = page.getViewport({ scale: 1 })
      const scale = Math.max(1, containerWidth / baseViewport.width)
      const viewport = page.getViewport({ scale })

      canvas.width = viewport.width
      canvas.height = viewport.height

      const task = page.render({ canvasContext: ctx, viewport })
      renderTaskRef.current = task
      await task.promise

      setCurrentPage(pageNum)
      onPageChange?.(pageNum, pdf.numPages)
    } catch (e: unknown) {
      if ((e as { name?: string })?.name !== "RenderingCancelledException") {
        console.error("PdfReader render error:", e)
      }
    } finally {
      setPageLoading(false)
    }
  }, [onPageChange])

  function goTo(page: number) {
    if (!pdfRef.current || page < 1 || page > totalPages || pageLoading) return
    renderPage(pdfRef.current, page)
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Chargement du livre…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-semibold text-destructive">Erreur de chargement</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Canvas scrollable */}
      <div ref={containerRef} className="relative flex-1 overflow-y-auto">
        {pageLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ maxWidth: "100%", display: "block", margin: "0 auto" }}
        />
      </div>

      {/* Barre de navigation */}
      <div className="flex shrink-0 items-center justify-between border-t border-border bg-background px-6 py-3">
        <button
          type="button"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1 || pageLoading}
          className="rounded-xl bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80 disabled:opacity-40"
        >
          ← Précédent
        </button>
        <span className="text-xs text-muted-foreground">
          Page{" "}
          <span className="font-semibold text-foreground">{currentPage}</span>
          {" "}sur{" "}
          <span className="font-semibold text-foreground">{totalPages}</span>
        </span>
        <button
          type="button"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages || pageLoading}
          className="rounded-xl bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80 disabled:opacity-40"
        >
          Suivant →
        </button>
      </div>
    </div>
  )
}
