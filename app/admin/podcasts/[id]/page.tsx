"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit3,
  Headphones,
  Link as LinkIcon,
  Loader2,
  MoreVertical,
  Plus,
  Radio,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  adminGetPodcast,
  adminListEpisodes,
  adminCreateEpisode,
  adminUpdateEpisode,
  adminDeleteEpisode,
  adminPublishEpisode,
  adminUnpublishEpisode,
  adminUploadEpisodeAudio,
} from "@/lib/api/admin-podcasts"
import type { AdminEpisodePayload, ApiError, Episode } from "@/lib/api/types"

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "-"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

type EpisodeFormState = {
  titre: string
  description: string
  numero: string
  duree_secondes: string
  date_publication: string
  est_publie: boolean
}

function emptyEpisodeForm(nextNumber: number): EpisodeFormState {
  return {
    titre: "",
    description: "",
    numero: String(nextNumber),
    duree_secondes: "",
    date_publication: todayIso(),
    est_publie: false,
  }
}

export default function AdminPodcastDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const { data: podcast, isLoading: loadingPodcast } = useSWR(
    id ? ["admin", "podcast", id] : null,
    () => adminGetPodcast(id),
  )

  const { data: episodesData, isLoading: loadingEpisodes, mutate } = useSWR(
    id ? ["admin", "episodes", id] : null,
    () => adminListEpisodes(id),
  )

  const episodes = episodesData?.items ?? []
  const nextNumber = useMemo(() => {
    if (!episodes.length) return 1
    return Math.max(...episodes.map((e) => e.numero)) + 1
  }, [episodes])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Episode | null>(null)
  const [form, setForm] = useState<EpisodeFormState>(emptyEpisodeForm(1))
  const [saving, setSaving] = useState(false)
  const [audioFileName, setAudioFileName] = useState<string>("")
  const [pendingAudioFile, setPendingAudioFile] = useState<File | null>(null)

  const [deleting, setDeleting] = useState<Episode | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function openCreate() {
    setEditing(null)
    setAudioFileName("")
    setPendingAudioFile(null)
    setForm(emptyEpisodeForm(nextNumber))
    setDialogOpen(true)
  }

  function openEdit(ep: Episode) {
    setEditing(ep)
    setAudioFileName("")
    setPendingAudioFile(null)
    setForm({
      titre: ep.titre,
      description: ep.description ?? "",
      numero: String(ep.numero),
      duree_secondes: ep.duree_secondes ? String(ep.duree_secondes) : "",
      date_publication: ep.date_publication.slice(0, 10),
      est_publie: ep.est_publie,
    })
    setDialogOpen(true)
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioFileName(file.name)
    if (!editing) {
      setPendingAudioFile(file)
      e.target.value = ""
      toast.info("Audio enregistré. Il sera envoyé juste après la création de l'épisode.")
      return
    }
    try {
      setSaving(true)
      const res = await adminUploadEpisodeAudio(editing.id, file)
      toast.success("Audio uploadé")
      setForm((prev) => ({
        ...prev,
        duree_secondes: res.duree_secondes ? String(res.duree_secondes) : prev.duree_secondes,
      }))
      mutate()
    } catch (err) {
      toast.error((err as ApiError).message ?? "Échec de l'upload")
    } finally {
      e.target.value = ""
      setSaving(false)
    }
  }

  async function handleSave() {
    if (!form.titre.trim() || !form.numero || !form.date_publication) {
      toast.error("Titre, numéro et date sont requis")
      return
    }
    if (!editing && form.est_publie && !pendingAudioFile) {
      toast.error("Ajoute un fichier audio avant de publier un nouvel épisode.")
      return
    }
    setSaving(true)
    const payload: AdminEpisodePayload = {
      podcast_id: id,
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      numero: Number(form.numero),
      duree_secondes: form.duree_secondes ? Number(form.duree_secondes) : null,
      date_publication: form.date_publication,
      est_publie: form.est_publie,
    }
    let createdEpisode: Episode | null = null
    try {
      if (editing) {
        await adminUpdateEpisode(editing.id, payload)
        toast.success("Épisode mis à jour")
      } else {
        const shouldPublish = payload.est_publie
        const { podcast_id: _pid, ...rest } = payload
        createdEpisode = await adminCreateEpisode(id, {
          ...rest,
          est_publie: pendingAudioFile ? false : shouldPublish,
        })

        if (pendingAudioFile) {
          const uploaded = await adminUploadEpisodeAudio(createdEpisode.id, pendingAudioFile)
          setForm((prev) => ({
            ...prev,
            duree_secondes: uploaded.duree_secondes ? String(uploaded.duree_secondes) : prev.duree_secondes,
          }))
        }

        if (shouldPublish && pendingAudioFile) {
          await adminPublishEpisode(createdEpisode.id)
        }

        setPendingAudioFile(null)
        setAudioFileName("")
        toast.success(shouldPublish ? "Épisode créé et publié" : "Épisode créé")
      }
      setDialogOpen(false)
      mutate()
    } catch (err) {
      if (createdEpisode) {
        setEditing(createdEpisode)
        mutate()
        toast.error(
          (err as ApiError).message ??
            "L'épisode a été créé, mais l'upload audio ou la publication a échoué.",
        )
        return
      }
      toast.error((err as ApiError).message ?? "Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(ep: Episode) {
    try {
      if (ep.est_publie) await adminUnpublishEpisode(ep.id)
      else await adminPublishEpisode(ep.id)
      toast.success(ep.est_publie ? "Épisode dépublié" : "Épisode publié")
      mutate()
    } catch (err) {
      toast.error((err as ApiError).message ?? "Action impossible")
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await adminDeleteEpisode(deleting.id)
      toast.success("Épisode supprimé")
      setDeleting(null)
      mutate()
    } catch (err) {
      toast.error((err as ApiError).message ?? "Suppression impossible")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loadingPodcast) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="text-primary" />
      </div>
    )
  }

  if (!podcast) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Podcast introuvable" />
        <Button variant="outline" onClick={() => router.push("/admin/podcasts")}>
          <ArrowLeft className="size-4" /> Retour
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={() => router.push("/admin/podcasts")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Tous les podcasts
        </button>

        <AdminPageHeader
          title={podcast.titre}
          description={podcast.description ?? "Gérez les épisodes de cette série."}
          actions={
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Nouvel épisode
            </Button>
          }
        />

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {podcast.animateur ? (
            <span className="inline-flex items-center gap-1">
              <Radio className="size-3.5" /> {podcast.animateur}
            </span>
          ) : null}
          <Badge variant={podcast.est_actif ? "default" : "secondary"}>
            {podcast.est_actif ? "Actif" : "Archivé"}
          </Badge>
          <span>{episodes.length} épisode{episodes.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      {loadingEpisodes ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="text-primary" />
        </div>
      ) : episodes.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Headphones className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Aucun épisode pour l&apos;instant</EmptyTitle>
          <EmptyDescription>
            Créez votre premier épisode pour commencer à publier cette série.
          </EmptyDescription>
          <EmptyContent>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Nouvel épisode
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {episodes.map((ep) => (
            <article
              key={ep.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-lg font-semibold text-foreground">
                  {ep.numero}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{ep.titre}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" /> {formatDuration(ep.duree_secondes)}
                    </span>
                    <span>·</span>
                    <span>{formatDate(ep.date_publication)}</span>
                    {ep.audio_url ? (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <LinkIcon className="size-3" /> audio disponible
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={ep.est_publie ? "default" : "secondary"}>
                  {ep.est_publie ? "Publié" : "Brouillon"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(ep)}>
                      <Edit3 className="size-4" /> Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => togglePublish(ep)}>
                      {ep.est_publie ? (
                        <>
                          <XCircle className="size-4" /> Dépublier
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4" /> Publier
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleting(ep)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* min-w-0 sur les enfants : un nom de fichier très long ne doit pas élargir la grille */}
        <DialogContent className="max-w-lg [&>*]:min-w-0">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'épisode" : "Nouvel épisode"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Ajustez les métadonnées et le statut de publication."
                : "Créez un épisode, puis le fichier audio sélectionné sera envoyé automatiquement."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 [&>*]:min-w-0">
            <div className="grid gap-2">
              <Label htmlFor="ep-titre">Titre</Label>
              <Input
                id="ep-titre"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="ep-num">Numéro</Label>
                <Input
                  id="ep-num"
                  type="number"
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ep-date">Date de publication</Label>
                <Input
                  id="ep-date"
                  type="date"
                  value={form.date_publication}
                  onChange={(e) => setForm({ ...form, date_publication: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ep-duree">Durée (secondes)</Label>
              <Input
                id="ep-duree"
                type="number"
                value={form.duree_secondes}
                onChange={(e) => setForm({ ...form, duree_secondes: e.target.value })}
                placeholder="Laisser vide — calculé après upload"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ep-desc">Description</Label>
              <Textarea
                id="ep-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Publié</p>
                <p className="text-xs text-muted-foreground">
                  Visible par les jeunes dans l&apos;app dès maintenant.
                </p>
              </div>
              <Switch
                checked={form.est_publie}
                onCheckedChange={(v) => setForm({ ...form, est_publie: v })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Fichier audio</Label>
              <label className="flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground transition hover:border-primary hover:text-foreground">
                <Upload className="size-4" />
                <span className="flex-1 truncate">
                  {audioFileName
                    ? audioFileName
                    : editing?.audio_url
                      ? "Audio déjà présent - remplacer"
                      : "Choisir un fichier MP3 / M4A"}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioUpload}
                />
              </label>
              {!editing ? (
                <p className="text-xs text-muted-foreground">
                  Le fichier sera envoyé automatiquement après la création de l&apos;épisode.
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {editing ? "Mettre à jour" : "Créer l'épisode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cet épisode ?</DialogTitle>
            <DialogDescription>
              L&apos;épisode <strong>{deleting?.titre}</strong> sera retiré de l&apos;app et l&apos;audio
              archivé. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteLoading}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
