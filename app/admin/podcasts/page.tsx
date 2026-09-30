"use client"

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import useSWR, { mutate as globalMutate } from "swr"
import {
  ChevronRight,
  ImagePlus,
  MoreVertical,
  Pencil,
  Plus,
  Podcast as PodcastIcon,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  adminCreatePodcast,
  adminDeletePodcast,
  adminListPodcasts,
  adminUpdatePodcast,
  adminUploadPodcastImage,
} from "@/lib/api/admin-podcasts"
import type { AdminPodcastPayload, ApiError, Podcast } from "@/lib/api/types"

function emptyPodcastForm(): AdminPodcastPayload {
  return {
    titre: "",
    description: "",
    image_url: null,
    animateur: "",
    est_actif: true,
  }
}

export default function AdminPodcastsPage() {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Podcast | null>(null)
  const [deleting, setDeleting] = useState<Podcast | null>(null)

  const { data: podcasts, mutate } = useSWR("admin-podcasts", adminListPodcasts)

  async function refresh() {
    await mutate()
    globalMutate("admin-stats")
    globalMutate("admin-audit-recent")
  }

  async function onDelete(podcast: Podcast) {
    try {
      await adminDeletePodcast(podcast.id)
      toast.success(`"${podcast.titre}" supprime`)
      setDeleting(null)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Podcasts"
        title="Series et episodes"
        description="Creez des series audio, publiez des episodes et controlez leur visibilite."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle serie
          </Button>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        {!podcasts ? (
          <p className="text-muted-foreground text-sm">Chargement...</p>
        ) : podcasts.length === 0 ? (
          <Card className="border-border/70 border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
                <PodcastIcon className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold">Aucune serie pour le moment</h3>
              <p className="text-muted-foreground max-w-md text-sm">
                Creez votre premiere serie pour commencer a publier des episodes audio.
              </p>
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Creer une serie
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {podcasts.map((podcast) => (
              <Card key={podcast.id} className="border-border/70 overflow-hidden">
                <div className="bg-muted relative aspect-[4/2]">
                  {podcast.image_url ? (
                    <Image
                      src={podcast.image_url}
                      alt={podcast.titre}
                      fill
                      sizes="(min-width: 1280px) 33vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <PodcastIcon className="text-muted-foreground h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute right-3 top-3">
                    {podcast.est_actif ? (
                      <Badge className="bg-secondary text-secondary-foreground border-0">Actif</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-card">
                        Masque
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="flex flex-col gap-2 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-serif text-lg font-semibold">{podcast.titre}</h3>
                      <p className="text-muted-foreground truncate text-xs">
                        {podcast.animateur ?? "Animateur non precise"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions ${podcast.titre}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(podcast)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(podcast)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer la serie
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {podcast.description ? (
                    <p className="text-muted-foreground line-clamp-2 text-sm">{podcast.description}</p>
                  ) : null}
                  <div className="border-border mt-2 flex items-center justify-between border-t pt-3">
                    <span className="text-muted-foreground text-xs">
                      {podcast.episodes_count} episode{podcast.episodes_count > 1 ? "s" : ""}
                    </span>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/podcasts/${podcast.id}`}>
                        Gerer les episodes
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PodcastDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => {
          setCreating(false)
          refresh()
        }}
      />

      <PodcastDialog
        open={!!editing}
        podcast={editing}
        onOpenChange={(value) => !value && setEditing(null)}
        onSaved={() => {
          setEditing(null)
          refresh()
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette serie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tous les episodes lies a &laquo;&nbsp;{deleting?.titre}&nbsp;&raquo; seront egalement
              supprimes. Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && onDelete(deleting)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function PodcastDialog({
  open,
  podcast,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  podcast?: Podcast | null
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const isEdit = !!podcast
  const [form, setForm] = useState<AdminPodcastPayload>(emptyPodcastForm())
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [imageFileName, setImageFileName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    setPendingImageFile(null)
    setImageFileName("")

    if (podcast) {
      setForm({
        titre: podcast.titre,
        description: podcast.description ?? "",
        image_url: podcast.image_url ?? null,
        animateur: podcast.animateur ?? "",
        est_actif: podcast.est_actif,
      })
      return
    }

    setForm(emptyPodcastForm())
  }, [open, podcast])

  function resetForm() {
    setForm(emptyPodcastForm())
    setPendingImageFile(null)
    setImageFileName("")
  }

  function rememberImageFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setPendingImageFile(file)
    setImageFileName(file.name)
    event.target.value = ""
    toast.info("La pochette sera envoyee apres l'enregistrement de la serie.")
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    let savedPodcast: Podcast | null = null

    try {
      savedPodcast =
        isEdit && podcast ? await adminUpdatePodcast(podcast.id, form) : await adminCreatePodcast(form)

      if (pendingImageFile) {
        await adminUploadPodcastImage(savedPodcast.id, pendingImageFile)
      }

      toast.success(isEdit ? "Serie mise a jour" : "Serie creee")
      resetForm()
      onSaved()
    } catch (error) {
      if (savedPodcast) {
        toast.error(
          (error as ApiError).message ??
            "La serie a ete enregistree, mais l'envoi de la pochette a echoue.",
        )
        resetForm()
        onSaved()
      } else {
        toast.error((error as ApiError).message ?? "Operation impossible")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetForm()
        onOpenChange(value)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isEdit ? "Modifier la serie" : "Nouvelle serie"}
          </DialogTitle>
          <DialogDescription>
            Vous pouvez renseigner une URL d&apos;image ou televerser directement une pochette.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pt">Titre</Label>
            <Input
              id="pt"
              required
              value={form.titre}
              onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="pd">Description</Label>
            <Textarea
              id="pd"
              rows={3}
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="pi">URL de la pochette (optionnel)</Label>
            <Input
              id="pi"
              type="url"
              placeholder="https://..."
              value={form.image_url ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, image_url: event.target.value || null }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Pochette a televerser</Label>
            <label className="border-border/70 bg-muted/30 flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-sm">
              <ImagePlus className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {imageFileName
                  ? imageFileName
                  : podcast?.image_url
                    ? "Pochette actuelle presente"
                    : "Choisir une image"}
              </span>
              <Upload className="text-muted-foreground h-4 w-4 shrink-0" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={rememberImageFile}
              />
            </label>
          </div>

          <div>
            <Label htmlFor="pa">Animateur / animatrice</Label>
            <Input
              id="pa"
              value={form.animateur ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, animateur: event.target.value || null }))
              }
            />
          </div>

          <label className="border-border/70 bg-muted/30 flex items-center gap-3 rounded-lg border p-4">
            <Checkbox
              checked={!!form.est_actif}
              onCheckedChange={(value) =>
                setForm((current) => ({ ...current, est_actif: value === true }))
              }
            />
            <div>
              <span className="text-sm font-medium">Serie active</span>
              <p className="text-muted-foreground text-xs">
                Si decoche, la serie n&apos;apparaitra pas aux utilisateurs.
              </p>
            </div>
          </label>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement..." : isEdit ? "Enregistrer" : "Creer la serie"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
