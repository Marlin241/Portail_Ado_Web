"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ChevronDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AudioPlayer } from "@/components/audio-player"
import { getEpisode } from "@/lib/api/podcasts"
import { getAudioProgress } from "@/lib/api/progression"
import type { AudioProgress, EpisodeDetail } from "@/lib/api/types"

export default function EpisodePlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [episode, setEpisode] = useState<EpisodeDetail | null>(null)
  const [progress, setProgress] = useState<AudioProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getEpisode(id), getAudioProgress(id)])
      .then(([e, p]) => {
        if (!active) return
        setEpisode(e)
        setProgress(p)
      })
      .catch((e) => toast.error(e?.message || "Impossible de charger l'épisode."))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Chargement" />
      </div>
    )
  }

  if (!episode) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-semibold">Épisode introuvable</p>
      </div>
    )
  }

  const cover =
    episode.podcast?.image_url ||
    `/placeholder.svg?height=500&width=500&query=${encodeURIComponent("christian podcast art " + episode.titre)}`

  async function refreshSignedUrl() {
    try {
      const fresh = await getEpisode(id)
      setEpisode(fresh)
      return fresh?.audio?.read_url ?? null
    } catch {
      return null
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-gradient-to-b from-primary/10 via-background to-background">
      {/* Mini header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Réduire"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Lecture en cours</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="phone-scroll flex-1 overflow-y-auto px-6 pb-8 pt-4">
        {/* Artwork */}
        <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-3xl bg-muted shadow-2xl shadow-primary/25 ring-1 ring-border">
          <Image src={cover || "/placeholder.svg"} alt={`Pochette — ${episode.titre}`} fill sizes="280px" className="object-cover" priority />
        </div>

        {/* Meta */}
        <div className="mt-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            {episode.podcast?.titre || "Podcast"} · Épisode {episode.numero}
          </p>
          <h1 className="mt-1.5 text-pretty text-lg font-bold leading-tight">{episode.titre}</h1>
          {episode.description && (
            <p className="mx-auto mt-2 max-w-sm text-pretty text-xs leading-relaxed text-muted-foreground">
              {episode.description}
            </p>
          )}
        </div>

        {/* Player */}
        <div className="mt-6">
          <AudioPlayer
            episodeId={episode.id}
            src={episode.audio.read_url}
            mimeType={episode.audio.mime_type}
            initialPosition={progress?.position_seconds ?? 0}
            initialDuration={episode.duree_secondes}
            onUnauthorized={refreshSignedUrl}
          />
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          La progression est sauvegardée automatiquement toutes les 15 secondes.
        </p>
      </div>
    </div>
  )
}
