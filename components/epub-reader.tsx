"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface EpubReaderProps {
  url: string
  onProgressChange?: (percent: number) => void
}

export default function EpubReader({ url, onProgressChange }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renditionRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableOnProgress = useRef(onProgressChange)
  useEffect(() => { stableOnProgress.current = onProgressChange }, [onProgressChange])

  const goToPrev = useCallback(() => { renditionRef.current?.prev() }, [])
  const goToNext = useCallback(() => { renditionRef.current?.next() }, [])

  useEffect(() => {
    if (!viewerRef.current) return
    let active = true
    const controller = new AbortController()

    async function init() {
      try {
        // Fetch en ArrayBuffer pour contourner toute limitation de CORS dans epub.js
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error(`Erreur réseau (${response.status})`)
        const buffer = await response.arrayBuffer()
        if (!active) return

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ePub = (await import("epubjs")).default
        const book = ePub(buffer)
        bookRef.current = book

        // Attendre que la structure du livre soit parsée (avec timeout de sécurité)
        await Promise.race([
          book.ready,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Délai de chargement dépassé")), 20000)
          ),
        ])
        if (!active) return

        const el = viewerRef.current!
        // Dimensions explicites en pixels pour éviter que epub.js reçoive un viewport 0x0
        const width = el.clientWidth || window.innerWidth
        const height = el.clientHeight || Math.max(400, window.innerHeight - 200)

        const rendition = book.renderTo(el, {
          width,
          height,
          allowScriptedContent: false,
        })
        renditionRef.current = rendition

        await Promise.race([
          rendition.display(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Délai d'affichage dépassé")), 15000)
          ),
        ])
        if (!active) return

        setLoading(false)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rendition.on("relocated", (location: any) => {
          if (!active || !location?.start?.cfi) return
          const result = book.locations.percentageFromCfi(location.start.cfi)
          Promise.resolve(result).then((pct: unknown) => {
            const num = typeof pct === "number" ? pct : 0
            stableOnProgress.current?.(Math.round(num * 100))
          })
        })
      } catch (e) {
        if (!active) return
        console.error("[EpubReader]", e)
        setError("Impossible d'afficher ce livre EPUB.")
        setLoading(false)
      }
    }

    init()

    return () => {
      active = false
      controller.abort()
      try { renditionRef.current?.destroy() } catch { /* ignore */ }
      try { bookRef.current?.destroy() } catch { /* ignore */ }
    }
  }, [url])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-semibold text-destructive">Chargement impossible</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="relative flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-xs text-muted-foreground">Chargement du livre…</span>
          </div>
        )}
        <div ref={viewerRef} className="h-full w-full" />
      </div>

      {!loading && (
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-background px-6 py-3">
          <button
            type="button"
            onClick={goToPrev}
            className="rounded-xl bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
          >
            ← Précédent
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="rounded-xl bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
