"use client"

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { CheckCircle2, Disc3, ImagePlus, Music2, Plus, Trash2, Upload, XCircle } from "lucide-react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ProtectedAudio } from "@/components/protected-audio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  adminAddMorceau,
  adminChangePropositionMusiqueStatus,
  adminCreateArtisteGospel,
  adminCreateGenreMusical,
  adminCreatePlaylistMusique,
  adminDeleteArtisteGospel,
  adminDeleteGenreMusical,
  adminDeleteMorceau,
  adminDeletePlaylistMusique,
  adminGetPlaylistMusique,
  adminListArtistesGospel,
  adminListGenresMusicaux,
  adminListPlaylistsMusique,
  adminListPropositionsMusique,
  adminTogglePublierMorceau,
  adminUpdatePlaylistMusique,
  adminUploadAudioMorceau,
  adminUploadImagePlaylist,
  adminUploadPhotoArtiste,
} from "@/lib/api/musique"
import type {
  ApiError,
  ArtisteGospel,
  GenreMusical,
  MorceauAdmin,
  PlaylistMusicale,
  PlaylistMusicaleAdminDetail,
  PropositionMusiqueAdmin,
  StatutPropositionMusique,
} from "@/lib/api/types"

const STATUS_LABEL: Record<StatutPropositionMusique, string> = {
  pending: "En attente",
  approved: "Validee",
  rejected: "Rejetee",
}

function formatDuration(value: number | null) {
  if (!value) return "--"
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function AdminMusiquePage() {
  const [playlistId, setPlaylistId] = useState<string>("")
  const [proposalStatus, setProposalStatus] = useState<StatutPropositionMusique | "all">("pending")
  const { data: playlists = [], mutate: mutatePlaylists } = useSWR(
    "admin-musique-playlists",
    adminListPlaylistsMusique,
  )
  const { data: artists = [], mutate: mutateArtists } = useSWR(
    "admin-musique-artistes",
    adminListArtistesGospel,
  )
  const { data: genres = [], mutate: mutateGenres } = useSWR(
    "admin-musique-genres",
    adminListGenresMusicaux,
  )
  const { data: propositions = [], mutate: mutatePropositions } = useSWR(
    ["admin-musique-propositions", proposalStatus],
    () => adminListPropositionsMusique(proposalStatus),
  )
  const { data: playlist, mutate: mutatePlaylist } = useSWR(
    playlistId ? ["admin-musique-playlist", playlistId] : null,
    () => adminGetPlaylistMusique(playlistId),
  )

  useEffect(() => {
    if (!playlistId && playlists[0]) setPlaylistId(playlists[0].id)
  }, [playlistId, playlists])

  async function refresh() {
    await Promise.all([
      mutatePlaylists(),
      mutatePlaylist(),
      mutateArtists(),
      mutateGenres(),
      mutatePropositions(),
    ])
    globalMutate("admin-stats")
    globalMutate(["admin-moderation-pending", "all"])
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Sprint 4"
        title="Musique gospel"
        description="Gerez les playlists, artistes, genres, morceaux et propositions ados."
        actions={
          <Select value={proposalStatus} onValueChange={(value) => setProposalStatus(value as StatutPropositionMusique | "all")}>
            <SelectTrigger className="w-48 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Propositions en attente</SelectItem>
              <SelectItem value="approved">Validees</SelectItem>
              <SelectItem value="rejected">Rejetees</SelectItem>
              <SelectItem value="all">Toutes</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-6 px-6 py-6 md:px-10 md:py-8 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <PlaylistPanel
            playlists={playlists}
            selectedId={playlistId}
            onSelect={setPlaylistId}
            onChanged={refresh}
          />
          <TaxonomyPanel artists={artists} genres={genres} onChanged={refresh} />
        </aside>

        <section className="space-y-6">
          <MorceauxPanel playlist={playlist ?? null} artists={artists} genres={genres} onChanged={refresh} />
          <PropositionsPanel items={propositions} onChanged={refresh} />
        </section>
      </div>
    </>
  )
}

function PlaylistPanel({
  playlists,
  selectedId,
  onSelect,
  onChanged,
}: {
  playlists: PlaylistMusicale[]
  selectedId: string
  onSelect: (id: string) => void
  onChanged: () => void
}) {
  const selected = useMemo(() => playlists.find((item) => item.id === selectedId) ?? null, [playlists, selectedId])
  const [form, setForm] = useState({ titre: "", description: "", est_active: false })

  useEffect(() => {
    if (!selected) return
    setForm({
      titre: selected.titre,
      description: selected.description ?? "",
      est_active: selected.est_active,
    })
  }, [selected])

  async function createPlaylist(event: FormEvent) {
    event.preventDefault()
    try {
      const created = await adminCreatePlaylistMusique({
        titre: form.titre.trim(),
        description: form.description.trim() || null,
        est_active: form.est_active,
      })
      toast.success("Playlist creee")
      onSelect(created.id)
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Creation impossible")
    }
  }

  async function savePlaylist() {
    if (!selected) return
    try {
      await adminUpdatePlaylistMusique(selected.id, {
        titre: form.titre.trim(),
        description: form.description.trim() || null,
        est_active: form.est_active,
      })
      toast.success("Playlist mise a jour")
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Mise a jour impossible")
    }
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !selected) return
    try {
      await adminUploadImagePlaylist(selected.id, file)
      toast.success("Image mise a jour")
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Upload impossible")
    }
  }

  async function removePlaylist() {
    if (!selected) return
    try {
      await adminDeletePlaylistMusique(selected.id)
      toast.success("Playlist supprimee")
      onSelect("")
      setForm({ titre: "", description: "", est_active: false })
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-4 p-5">
        <h2 className="font-semibold">Playlists</h2>
        <Select value={selectedId || "new"} onValueChange={(value) => onSelect(value === "new" ? "" : value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Nouvelle playlist</SelectItem>
            {playlists.map((playlist) => (
              <SelectItem key={playlist.id} value={playlist.id}>
                {playlist.titre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <form onSubmit={createPlaylist} className="space-y-3">
          <div>
            <Label>Titre</Label>
            <Input
              required
              value={form.titre}
              onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border/70 p-3 text-sm">
            <Checkbox
              checked={form.est_active}
              onCheckedChange={(checked) => setForm((current) => ({ ...current, est_active: checked === true }))}
            />
            Active cote ado
          </label>
          <div className="flex flex-wrap gap-2">
            {selected ? (
              <>
                <Button type="button" onClick={savePlaylist}>Enregistrer</Button>
                <Button type="button" variant="outline" asChild>
                  <label>
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Image
                    <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={uploadImage} />
                  </label>
                </Button>
                <Button type="button" variant="destructive" onClick={removePlaylist}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </>
            ) : (
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Creer
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Images: JPEG/PNG, 2 Mo max.</p>
        </form>
      </CardContent>
    </Card>
  )
}

function TaxonomyPanel({
  artists,
  genres,
  onChanged,
}: {
  artists: ArtisteGospel[]
  genres: GenreMusical[]
  onChanged: () => void
}) {
  const [artistName, setArtistName] = useState("")
  const [artistBio, setArtistBio] = useState("")
  const [genreName, setGenreName] = useState("")

  async function createArtist(event: FormEvent) {
    event.preventDefault()
    try {
      await adminCreateArtisteGospel({ nom: artistName.trim(), bio: artistBio.trim() || null })
      toast.success("Artiste cree")
      setArtistName("")
      setArtistBio("")
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Creation impossible")
    }
  }

  async function createGenre(event: FormEvent) {
    event.preventDefault()
    try {
      await adminCreateGenreMusical({ nom: genreName.trim() })
      toast.success("Genre cree")
      setGenreName("")
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Creation impossible")
    }
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>, artist: ArtisteGospel) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      await adminUploadPhotoArtiste(artist.id, file)
      toast.success("Photo mise a jour")
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Upload impossible")
    }
  }

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-5 p-5">
        <form onSubmit={createArtist} className="space-y-3">
          <h2 className="font-semibold">Artistes</h2>
          <Input required placeholder="Nom artiste" value={artistName} onChange={(event) => setArtistName(event.target.value)} />
          <Textarea placeholder="Bio" value={artistBio} onChange={(event) => setArtistBio(event.target.value)} />
          <Button type="submit" className="w-full">Ajouter artiste</Button>
        </form>
        <div className="max-h-52 space-y-2 overflow-y-auto">
          {artists.map((artist) => (
            <div key={artist.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 p-2">
              <span className="truncate text-sm">{artist.nom}</span>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" asChild aria-label="Photo artiste">
                  <label>
                    <Upload className="h-4 w-4" />
                    <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(event) => uploadPhoto(event, artist)} />
                  </label>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => adminDeleteArtisteGospel(artist.id).then(onChanged).catch((error) => toast.error((error as ApiError).message ?? "Suppression impossible"))} aria-label="Supprimer artiste">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={createGenre} className="space-y-3 border-t pt-4">
          <h2 className="font-semibold">Genres</h2>
          <Input required placeholder="Louange, Adoration..." value={genreName} onChange={(event) => setGenreName(event.target.value)} />
          <Button type="submit" className="w-full">Ajouter genre</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <Badge key={genre.id} variant="secondary" className="gap-1">
              {genre.nom}
              <button
                type="button"
                className="ml-1"
                onClick={() => adminDeleteGenreMusical(genre.id).then(onChanged).catch((error) => toast.error((error as ApiError).message ?? "Suppression impossible"))}
              >
                x
              </button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MorceauxPanel({
  playlist,
  artists,
  genres,
  onChanged,
}: {
  playlist: PlaylistMusicaleAdminDetail | null
  artists: ArtisteGospel[]
  genres: GenreMusical[]
  onChanged: () => void
}) {
  const [form, setForm] = useState({
    titre: "",
    artiste_id: "none",
    genre_id: "none",
    duree_secondes: "",
    audio_url_externe: "",
    ordre: "0",
  })

  async function addTrack(event: FormEvent) {
    event.preventDefault()
    if (!playlist) return
    try {
      await adminAddMorceau(playlist.id, {
        titre: form.titre.trim(),
        artiste_id: form.artiste_id === "none" ? null : form.artiste_id,
        genre_id: form.genre_id === "none" ? null : form.genre_id,
        duree_secondes: form.duree_secondes ? Number(form.duree_secondes) : null,
        audio_url_externe: form.audio_url_externe.trim() || null,
        ordre: Number(form.ordre) || 0,
      })
      toast.success("Morceau ajoute")
      setForm({ titre: "", artiste_id: "none", genre_id: "none", duree_secondes: "", audio_url_externe: "", ordre: "0" })
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Ajout impossible")
    }
  }

  async function uploadAudio(event: ChangeEvent<HTMLInputElement>, track: MorceauAdmin) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      await adminUploadAudioMorceau(track.id, file)
      toast.success("Audio uploade")
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Upload impossible")
    }
  }

  async function toggle(track: MorceauAdmin) {
    try {
      await adminTogglePublierMorceau(track.id)
      toast.success(track.est_publie ? "Morceau depublie" : "Morceau publie")
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Publication impossible")
    }
  }

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <Disc3 className="h-4 w-4 text-primary" />
              Morceaux
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {playlist ? playlist.titre : "Selectionnez ou creez une playlist."}
            </p>
          </div>
          {playlist ? <Badge variant={playlist.est_active ? "default" : "outline"}>{playlist.est_active ? "Active" : "Brouillon"}</Badge> : null}
        </div>

        {playlist ? (
          <>
            <form onSubmit={addTrack} className="grid gap-3 rounded-lg border border-border/70 p-4 md:grid-cols-2">
              <Input required placeholder="Titre" value={form.titre} onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))} />
              <Input type="url" required placeholder="URL audio externe initiale" value={form.audio_url_externe} onChange={(event) => setForm((current) => ({ ...current, audio_url_externe: event.target.value }))} />
              <Select value={form.artiste_id} onValueChange={(value) => setForm((current) => ({ ...current, artiste_id: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun artiste</SelectItem>
                  {artists.map((artist) => <SelectItem key={artist.id} value={artist.id}>{artist.nom}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.genre_id} onValueChange={(value) => setForm((current) => ({ ...current, genre_id: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun genre</SelectItem>
                  {genres.map((genre) => <SelectItem key={genre.id} value={genre.id}>{genre.nom}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Duree secondes" value={form.duree_secondes} onChange={(event) => setForm((current) => ({ ...current, duree_secondes: event.target.value }))} />
              <Input type="number" placeholder="Ordre" value={form.ordre} onChange={(event) => setForm((current) => ({ ...current, ordre: event.target.value }))} />
              <Button type="submit" className="md:col-span-2">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </form>

            <div className="grid gap-3">
              {playlist.morceaux.map((track) => (
                <div key={track.id} className="rounded-lg border border-border/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge variant={track.est_publie ? "default" : "outline"}>{track.est_publie ? "Publie" : "Brouillon"}</Badge>
                        <Badge variant="secondary">{formatDuration(track.duree_secondes)}</Badge>
                      </div>
                      <p className="font-semibold">{track.titre}</p>
                      <p className="text-sm text-muted-foreground">{track.artiste?.nom ?? "Sans artiste"} - {track.genre?.nom ?? "Sans genre"}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggle(track)}>{track.est_publie ? "Depublier" : "Publier"}</Button>
                      <Button size="sm" variant="outline" asChild>
                        <label>
                          <Music2 className="mr-2 h-4 w-4" />
                          Audio
                          <input type="file" accept="audio/mpeg,audio/mp4,audio/ogg,.mp3,.m4a,.ogg" className="hidden" onChange={(event) => uploadAudio(event, track)} />
                        </label>
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => adminDeleteMorceau(track.id).then(onChanged).catch((error) => toast.error((error as ApiError).message ?? "Suppression impossible"))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {track.audio_url ? <ProtectedAudio src={track.audio_url} className="mt-3" /> : null}
                </div>
              ))}
              {playlist.morceaux.length === 0 ? (
                <p className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">Aucun morceau dans cette playlist.</p>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">Audio upload accepte: MP3, M4A/AAC ou OGG, 50 Mo max.</p>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function PropositionsPanel({
  items,
  onChanged,
}: {
  items: PropositionMusiqueAdmin[]
  onChanged: () => void
}) {
  async function change(item: PropositionMusiqueAdmin, statut: "approved" | "rejected") {
    try {
      await adminChangePropositionMusiqueStatus(item.id, statut)
      toast.success(statut === "approved" ? "Proposition validee" : "Proposition rejetee")
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-4 p-5">
        <h2 className="font-semibold">Propositions ados</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border/70 p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant={item.statut === "pending" ? "default" : "outline"}>{STATUS_LABEL[item.statut]}</Badge>
                <Badge variant="secondary">@{item.user_id.slice(0, 8)}</Badge>
              </div>
              <p className="font-semibold">{item.titre}</p>
              <p className="text-sm text-muted-foreground">{item.artiste_nom}</p>
              {item.note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.note}</p> : null}
              <a href={item.url_externe} target="_blank" rel="noreferrer" className="mt-2 block truncate text-sm font-medium text-primary underline underline-offset-2">
                {item.url_externe}
              </a>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" disabled={item.statut !== "pending"} onClick={() => change(item, "approved")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Valider
                </Button>
                <Button size="sm" variant="outline" disabled={item.statut !== "pending"} onClick={() => change(item, "rejected")}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeter
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune proposition pour ce filtre.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
