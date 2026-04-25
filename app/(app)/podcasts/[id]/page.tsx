"use client"

import { use, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, Headphones, Loader2, Play } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { getPodcast, listEpisodes } from "@/lib/api/podcasts"
import type { Episode, Podcast } from "@/lib/api/types"

function formatDuration(sec: number | null) {
  if (!sec) return "—"
  const m = Math.floor(sec / 60)
  return `${m} min`
}

export default function PodcastDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getPodcast(id), listEpisodes(id, { limit: 50 })])
      .then(([p, e]) => {
        if (!active) return
        setPodcast(p)
        setEpisodes(e.items)
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

  if (!podcast) {
    return (
      <div>
        <ScreenHeader title="Podcast introuvable" />
        <div className="px-6 pt-6 text-sm text-muted-foreground">Cette série n&apos;est plus active.</div>
      </div>
    )
  }

  const cover =
    podcast.image_url ||
    `/placeholder.svg?height=400&width=400&query=${encodeURIComponent("christian youth podcast " + podcast.titre)}`

  return (
    <div>
      <div className="relative h-72 overflow-hidden bg-gradient-to-b from-primary/20 to-background">
        <ScreenHeader variant="transparent" />
        <div className="relative flex flex-col items-center gap-3 px-6 pb-4">
          <div className="relative h-36 w-36 overflow-hidden rounded-2xl bg-muted shadow-2xl shadow-primary/20 ring-1 ring-border">
            <Image src={cover || "/placeholder.svg"} alt={`Couverture de ${podcast.titre}`} fill sizes="144px" className="object-cover" priority />
          </div>
          <div className="text-center">
            <h1 className="text-pretty text-xl font-bold leading-tight">{podcast.titre}</h1>
            <p className="text-xs text-muted-foreground">{podcast.animateur || "Équipe Bethel Ados"}</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        {podcast.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{podcast.description}</p>
        )}

        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide">Épisodes</h2>
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <Headphones className="h-3.5 w-3.5" />
            {episodes.length} disponible{episodes.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {episodes.map((e) => (
            <Link
              key={e.id}
              href={`/podcasts/episodes/${e.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <Play className="ml-0.5 h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Épisode {e.numero}
                </p>
                <p className="line-clamp-2 text-sm font-semibold leading-tight">{e.titre}</p>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(e.date_publication).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(e.duree_secondes)}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {episodes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-8 text-center">
              <p className="text-sm font-semibold">Aucun épisode publié</p>
              <p className="mt-1 text-xs text-muted-foreground">Les prochains épisodes arrivent bientôt.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
