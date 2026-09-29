"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, Heart, History, ListMusic, Loader2, Music2, Send } from "lucide-react"
import { toast } from "sonner"
import { BackendMedia } from "@/components/backend-media"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  listGenresMusicaux,
  listMesEcoutesMusique,
  listMesLikesMusique,
  listMesPropositionsMusique,
  listMorceauxParGenre,
  listPlaylistsMusique,
  proposerMorceau,
} from "@/lib/api/musique"
import type {
  ApiError,
  GenreMusical,
  Morceau,
  PlaylistMusicale,
  PropositionMusique,
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<PropositionMusique["statut"], string> = {
  pending: "En moderation",
  approved: "Validee",
  rejected: "Refusee",
}

function formatDuration(value: number | null) {
  if (!value) return "--"
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function TrackRow({ track }: { track: Morceau }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{track.titre}</p>
        <p className="truncate text-xs text-muted-foreground">
          {track.artiste?.nom ?? "Artiste non renseigne"}
          {track.genre ? ` - ${track.genre.nom}` : ""}
        </p>
      </div>
      <span className="font-mono text-xs text-muted-foreground">{formatDuration(track.duree_secondes)}</span>
    </div>
  )
}

export default function MusiquePage() {
  const [playlists, setPlaylists] = useState<PlaylistMusicale[]>([])
  const [genres, setGenres] = useState<GenreMusical[]>([])
  const [genreId, setGenreId] = useState("all")
  const [genreTracks, setGenreTracks] = useState<Morceau[]>([])
  const [likes, setLikes] = useState<Morceau[]>([])
  const [history, setHistory] = useState<Morceau[]>([])
  const [propositions, setPropositions] = useState<PropositionMusique[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ titre: "", artiste_nom: "", url_externe: "", note: "" })

  async function load() {
    setLoading(true)
    const [playlistRes, genreRes, likeRes, historyRes, propositionRes] = await Promise.all([
      listPlaylistsMusique().catch(() => [] as PlaylistMusicale[]),
      listGenresMusicaux().catch(() => [] as GenreMusical[]),
      listMesLikesMusique().catch(() => [] as Morceau[]),
      listMesEcoutesMusique().catch(() => [] as Morceau[]),
      listMesPropositionsMusique().catch(() => [] as PropositionMusique[]),
    ])
    setPlaylists(playlistRes)
    setGenres(genreRes)
    setLikes(likeRes)
    setHistory(historyRes)
    setPropositions(propositionRes)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadGenre() {
      if (genreId === "all") {
        setGenreTracks([])
        return
      }
      const items = await listMorceauxParGenre(genreId).catch(() => [] as Morceau[])
      if (mounted) setGenreTracks(items)
    }
    loadGenre()
    return () => {
      mounted = false
    }
  }, [genreId])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await proposerMorceau({
        titre: form.titre.trim(),
        artiste_nom: form.artiste_nom.trim(),
        url_externe: form.url_externe.trim(),
        note: form.note.trim() || null,
      })
      toast.success("Proposition envoyee")
      setForm({ titre: "", artiste_nom: "", url_externe: "", note: "" })
      await load()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Envoi impossible")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-6 pb-8 pt-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sprint 4</p>
        <h1 className="mt-1 text-2xl font-bold">Musique gospel</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Playlists, favoris et propositions de morceaux pour accompagner tes temps de louange.
        </p>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                  <ListMusic className="h-4 w-4 text-primary" />
                  Playlists actives
                </h2>
              </div>
              {playlists.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Aucune playlist active pour le moment.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {playlists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      href={`/musique/${playlist.id}`}
                      className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-muted/40"
                    >
                      <div className="aspect-video bg-muted">
                        {playlist.image_url ? (
                          <BackendMedia src={playlist.image_url} alt={playlist.titre} />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Music2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-1 font-semibold">{playlist.titre}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {playlist.description ?? "Selection gospel Bethel Ados."}
                        </p>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          Ecouter <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Card className="border-border/70">
              <CardContent className="p-5">
                <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px] sm:items-end">
                  <div>
                    <h2 className="font-semibold">Explorer par ambiance</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Les genres sont geres par l'equipe admin.
                    </p>
                  </div>
                  <Select value={genreId} onValueChange={setGenreId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Choisir un genre</SelectItem>
                      {genres.map((genre) => (
                        <SelectItem key={genre.id} value={genre.id}>
                          {genre.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  {genreId === "all" ? (
                    <p className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                      Selectionne une ambiance pour voir les morceaux publies.
                    </p>
                  ) : genreTracks.length === 0 ? (
                    <p className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                      Aucun morceau publie dans ce genre.
                    </p>
                  ) : (
                    genreTracks.map((track) => <TrackRow key={track.id} track={track} />)
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card className="border-border/70">
              <CardContent className="p-5">
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold">
                      <Send className="h-4 w-4 text-primary" />
                      Proposer un morceau
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      La proposition passe en validation admin avant toute decision.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="song-title">Titre</Label>
                    <Input
                      id="song-title"
                      required
                      value={form.titre}
                      onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="song-artist">Artiste</Label>
                    <Input
                      id="song-artist"
                      required
                      value={form.artiste_nom}
                      onChange={(event) => setForm((current) => ({ ...current, artiste_nom: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="song-url">Lien externe</Label>
                    <Input
                      id="song-url"
                      required
                      type="url"
                      value={form.url_externe}
                      onChange={(event) => setForm((current) => ({ ...current, url_externe: event.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="song-note">Note</Label>
                    <Textarea
                      id="song-note"
                      rows={3}
                      value={form.note}
                      onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Envoi..." : "Envoyer"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="space-y-4 p-5">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Heart className="h-4 w-4 text-primary" />
                  Mes favoris
                </h2>
                <div className="space-y-2">
                  {likes.slice(0, 4).map((track) => (
                    <TrackRow key={track.id} track={track} />
                  ))}
                  {likes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun favori pour le moment.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="space-y-4 p-5">
                <h2 className="flex items-center gap-2 font-semibold">
                  <History className="h-4 w-4 text-primary" />
                  Ecoutes recentes
                </h2>
                <div className="space-y-2">
                  {history.slice(0, 4).map((track) => (
                    <TrackRow key={track.id} track={track} />
                  ))}
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ton historique apparaitra ici.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {propositions.length > 0 ? (
              <Card className="border-border/70">
                <CardContent className="space-y-3 p-5">
                  <h2 className="font-semibold">Mes propositions</h2>
                  {propositions.slice(0, 5).map((item) => (
                    <div key={item.id} className="rounded-lg border border-border/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="line-clamp-1 text-sm font-medium">{item.titre}</p>
                        <Badge
                          variant={item.statut === "pending" ? "default" : "outline"}
                          className={cn(item.statut === "rejected" && "border-destructive/30 text-destructive")}
                        >
                          {STATUS_LABEL[item.statut]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.artiste_nom}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  )
}
