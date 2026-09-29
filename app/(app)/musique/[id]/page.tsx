"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Heart, Loader2, Music2 } from "lucide-react"
import { toast } from "sonner"
import { BackendMedia } from "@/components/backend-media"
import { ProtectedAudio } from "@/components/protected-audio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  getPlaylistMusique,
  likeMorceau,
  marquerMorceauEcoute,
  unlikeMorceau,
} from "@/lib/api/musique"
import type { ApiError, Morceau, PlaylistMusicaleDetail } from "@/lib/api/types"

function formatDuration(value: number | null) {
  if (!value) return "--"
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function TrackCard({
  track,
  liked,
  onToggleLike,
  onPlay,
}: {
  track: Morceau
  liked: boolean
  onToggleLike: (track: Morceau) => void
  onPlay: (track: Morceau) => void
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              {track.genre ? <Badge variant="secondary">{track.genre.nom}</Badge> : null}
              <Badge variant="outline">{formatDuration(track.duree_secondes)}</Badge>
            </div>
            <h2 className="line-clamp-1 font-semibold">{track.titre}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {track.artiste?.nom ?? "Artiste non renseigne"}
            </p>
          </div>
          <Button
            type="button"
            variant={liked ? "default" : "outline"}
            size="icon"
            aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
            onClick={() => onToggleLike(track)}
          >
            <Heart className={liked ? "h-4 w-4 fill-current" : "h-4 w-4"} />
          </Button>
        </div>
        {track.audio_url ? (
          <ProtectedAudio
            src={track.audio_url}
            title={track.audio_url.startsWith("http") ? undefined : "Lecture protegee"}
            onPlayIntent={() => onPlay(track)}
          />
        ) : (
          <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            Aucun audio disponible pour ce morceau.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function PlaylistMusiquePage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [playlist, setPlaylist] = useState<PlaylistMusicaleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  async function load() {
    if (!id) return
    setLoading(true)
    try {
      const item = await getPlaylistMusique(id)
      setPlaylist(item)
    } catch (error) {
      toast.error((error as ApiError).message ?? "Playlist introuvable")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function toggleLike(track: Morceau) {
    const liked = likedIds.has(track.id)
    setLikedIds((current) => {
      const next = new Set(current)
      if (liked) next.delete(track.id)
      else next.add(track.id)
      return next
    })
    try {
      if (liked) await unlikeMorceau(track.id)
      else await likeMorceau(track.id)
    } catch (error) {
      setLikedIds((current) => {
        const next = new Set(current)
        if (liked) next.add(track.id)
        else next.delete(track.id)
        return next
      })
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  async function markPlayed(track: Morceau) {
    await marquerMorceauEcoute(track.id).catch(() => undefined)
  }

  return (
    <div className="px-6 pb-8 pt-6">
      <Link href="/musique" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
        <ArrowLeft className="h-4 w-4" />
        Retour musique
      </Link>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !playlist ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Playlist introuvable.
          </CardContent>
        </Card>
      ) : (
        <>
          <header className="mb-6 overflow-hidden rounded-lg border border-border bg-card">
            <div className="grid md:grid-cols-[360px_1fr]">
              <div className="aspect-video bg-muted md:aspect-auto">
                {playlist.image_url ? (
                  <BackendMedia src={playlist.image_url} alt={playlist.titre} />
                ) : (
                  <div className="flex h-full min-h-52 items-center justify-center">
                    <Music2 className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Playlist gospel
                </p>
                <h1 className="mt-2 text-2xl font-bold">{playlist.titre}</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {playlist.description ?? "Selection musicale publiee par l'equipe Bethel Ados."}
                </p>
                <Badge className="mt-4" variant="secondary">
                  {playlist.morceaux.length} morceau{playlist.morceaux.length > 1 ? "x" : ""}
                </Badge>
              </div>
            </div>
          </header>

          <section className="grid gap-4 lg:grid-cols-2">
            {playlist.morceaux.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                liked={likedIds.has(track.id)}
                onToggleLike={toggleLike}
                onPlay={markPlayed}
              />
            ))}
            {playlist.morceaux.length === 0 ? (
              <Card className="border-dashed lg:col-span-2">
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  Aucun morceau publie dans cette playlist.
                </CardContent>
              </Card>
            ) : null}
          </section>
        </>
      )}
    </div>
  )
}
