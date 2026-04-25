"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { PodcastCard } from "@/components/podcast-card"
import { listPodcasts } from "@/lib/api/podcasts"
import type { Podcast } from "@/lib/api/types"

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    listPodcasts()
      .then((p) => active && setPodcasts(p))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <header className="bg-background px-6 pb-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Écouter</p>
        <h1 className="mt-1 text-2xl font-bold">Podcasts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Des voix qui parlent à ta vie, chaque semaine, en français.
        </p>
      </header>

      <section className="px-6 pb-8 pt-2">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : podcasts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
            <p className="text-sm font-semibold">Aucun podcast disponible</p>
            <p className="mt-1 text-xs text-muted-foreground">Reviens très vite, de nouvelles séries arrivent.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {podcasts.map((p) => (
              <PodcastCard key={p.id} podcast={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
