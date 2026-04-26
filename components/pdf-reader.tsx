"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Loader2 } from "lucide-react"

interface PdfReaderProps {
  url: string
  initialPage?: number
  onPageChange?: (page: number, total: number) => void
}

export default function PdfReader({ url, initialPage = 1, onPageChange }: PdfReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTaskRef = useRef<any>(null)
  const startedRef = useRef(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPage = useCallback(async (pdf: any, pageNum: number) => {
    if (!pdf || !canvasRef.current) return

    try { renderTaskRef.current?.cancel() } catch {}
    setPageLoading(true)

    try {
      // ctx check à l'intérieur du try pour que finally réinitialise toujours pageLoading
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

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

  // Chargement du PDF
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setTotalPages(0)
    setCurrentPage(1)
    pdfRef.current = null
    startedRef.current = false

    async function loadPdf() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf")
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

        const pdf = await pdfjsLib.getDocument(url).promise
        if (cancelled) return

        pdfRef.current = pdf
        // setTotalPages déclenche l'effet ci-dessous après le re-render (canvas monté)
        setTotalPages(pdf.numPages)
        setLoading(false)
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
  }, [url])

  // Affiche la page initiale après que le PDF est chargé ET que le canvas est monté
  useEffect(() => {
    if (totalPages > 0 && pdfRef.current && !startedRef.current) {
      startedRef.current = true
      const page = Math.min(Math.max(1, initialPage), totalPages)
      renderPage(pdfRef.current, page)
    }
  }, [totalPages, renderPage, initialPage])

  function goTo(page: number) {
    if (!pdfRef.current || page < 1 || page > totalPages || pageLoading) return
    renderPage(pdfRef.current, page)
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center bg-background">
        <p className="text-sm font-semibold text-destructive">Erreur de chargement</p>
        <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Le canvas est TOUJOURS dans le DOM (pas d'early-return loading) pour que canvasRef soit valide */}
      <div ref={containerRef} className="relative flex-1 overflow-y-auto">
        {(loading || pageLoading) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-xs text-muted-foreground">Chargement du livre…</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ maxWidth: "100%", display: "block", margin: "0 auto" }}
        />
      </div>

      {!loading && (
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
      )}
    </div>
  )
}
