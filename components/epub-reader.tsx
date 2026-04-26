"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface EpubReaderProps {
  url: string
  initialPercent?: number
  onProgressChange?: (percent: number) => void
}

export default function EpubReader({ url, initialPercent = 0, onProgressChange }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renditionRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState("Chargement du livre…")
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
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error(`Erreur réseau (${response.status})`)
        const buffer = await response.arrayBuffer()
        if (!active) return

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ePub = (await import("epubjs")).default
        const book = ePub(buffer)
        bookRef.current = book

        await Promise.race([
          book.ready,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Délai de chargement dépassé")), 20000)
          ),
        ])
        if (!active) return

        // Si une progression existe, générer les locations CFI avant l'affichage
        // pour pouvoir naviguer vers la position sauvegardée
        const hasProgress = initialPercent > 0 && initialPercent < 100
        if (hasProgress) {
          setLoadingMsg("Reprise de la lecture…")
          await Promise.race([
            book.locations.generate(1024),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Délai de génération des positions")), 30000)
            ),
          ])
          if (!active) return
        }

        const el = viewerRef.current!
        const width = el.clientWidth || window.innerWidth
        const height = el.clientHeight || Math.max(400, window.innerHeight - 200)

        const rendition = book.renderTo(el, {
          width,
          height,
          allowScriptedContent: false,
        })
        renditionRef.current = rendition

        // Calculer le CFI de reprise si on a une progression sauvegardée
        let startCfi: string | undefined
        if (hasProgress) {
          try {
            const cfi = book.locations.cfiFromPercentage(initialPercent / 100)
            if (cfi) startCfi = cfi
          } catch { /* démarre depuis le début en cas d'erreur */ }
        }

        await Promise.race([
          rendition.display(startCfi),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Délai d'affichage dépassé")), 15000)
          ),
        ])
        if (!active) return

        setLoading(false)

        // Générer les locations en arrière-plan si pas encore fait (premier accès)
        if (!hasProgress) {
          book.locations.generate(1024).catch(() => {})
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rendition.on("relocated", (location: any) => {
          if (!active || !location?.start?.cfi) return
          const pct = book.locations.percentageFromCfi(location.start.cfi)
          if (typeof pct === "number" && pct > 0) {
            stableOnProgress.current?.(Math.round(pct * 100))
          }
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
  }, [url, initialPercent])

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
            <span className="ml-2 text-xs text-muted-foreground">{loadingMsg}</span>
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
