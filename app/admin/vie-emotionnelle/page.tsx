"use client"

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { HeartPulse, ImagePlus, MoreVertical, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  adminCreateVieCategory,
  adminCreateVieContenu,
  adminDeleteVieCategory,
  adminDeleteVieContenu,
  adminGetVieContenu,
  adminListVieCategories,
  adminListVieContenus,
  adminToggleViePublication,
  adminUpdateVieCategory,
  adminUpdateVieContenu,
  adminUploadVieCover,
  adminUploadVieVideo,
} from "@/lib/api/vie-emotionnelle"
import type {
  AdminContenuVieDetail,
  AdminContenuVieListItem,
  AdminContenuViePayload,
  ApiError,
  CategorieVie,
  TypeContenuVie,
} from "@/lib/api/types"

const TYPE_LABEL: Record<TypeContenuVie, string> = {
  article: "Article",
  video: "Video",
  temoignage: "Temoignage",
}

function emptyContentForm(categoryId = ""): AdminContenuViePayload {
  return {
    type: "article",
    titre: "",
    description: "",
    contenu_texte: "",
    video_url: "",
    categorie_id: categoryId,
  }
}

export default function AdminVieEmotionnellePage() {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminContenuVieDetail | null>(null)
  const [deleting, setDeleting] = useState<AdminContenuVieListItem | null>(null)
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null)

  const { data: categories = [], mutate: mutateCategories } = useSWR(
    "admin-vie-categories",
    adminListVieCategories,
  )
  const { data, mutate } = useSWR("admin-vie-contenus", () =>
    adminListVieContenus({ limit: 80, offset: 0 }),
  )
  const items = data?.items ?? []

  async function refresh() {
    await Promise.all([mutate(), mutateCategories()])
    globalMutate("admin-audit-recent")
  }

  async function startEdit(item: AdminContenuVieListItem) {
    setLoadingEditId(item.id)
    try {
      setEditing(await adminGetVieContenu(item.id))
    } catch (error) {
      toast.error((error as ApiError).message ?? "Chargement impossible")
    } finally {
      setLoadingEditId(null)
    }
  }

  async function togglePublication(item: AdminContenuVieListItem) {
    try {
      await adminToggleViePublication(item.id)
      toast.success(item.publie ? "Contenu masque" : "Contenu publie")
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  async function onDelete(item: AdminContenuVieListItem) {
    try {
      await adminDeleteVieContenu(item.id)
      toast.success("Contenu supprime")
      setDeleting(null)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Sprint 2"
        title="Vie emotionnelle"
        description="Gerez les categories, articles, videos et temoignages relationnels."
        actions={
          <Button onClick={() => setCreating(true)} disabled={categories.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau contenu
          </Button>
        }
      />

      <div className="grid gap-6 px-6 py-6 md:px-10 md:py-8 xl:grid-cols-[320px_1fr]">
        <CategoriesPanel categories={categories} onChanged={refresh} />

        <section>
          {!data ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <HeartPulse className="h-10 w-10 text-muted-foreground" />
                <h2 className="font-serif text-lg font-semibold">Aucun contenu</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Creez une categorie, puis ajoutez un premier contenu.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/70">
                  <div className="flex aspect-[16/8] items-center justify-center bg-muted">
                    {item.image_couverture_url ? (
                      <img src={item.image_couverture_url} alt={item.titre} className="h-full w-full object-cover" />
                    ) : (
                      <HeartPulse className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={item.publie ? "default" : "outline"}>
                            {item.publie ? "Publie" : "Brouillon"}
                          </Badge>
                          <Badge variant="secondary">{TYPE_LABEL[item.type]}</Badge>
                          <Badge variant="outline">{item.categorie.nom}</Badge>
                        </div>
                        <h2 className="mt-2 truncate font-serif text-lg font-semibold">{item.titre}</h2>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions contenu">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(item)} disabled={loadingEditId === item.id}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePublication(item)}>
                            {item.publie ? "Masquer" : "Publier"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(item)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <ContentDialog
        open={creating}
        categories={categories}
        onOpenChange={setCreating}
        onSaved={() => {
          setCreating(false)
          refresh()
        }}
      />
      <ContentDialog
        open={!!editing}
        content={editing}
        categories={categories}
        onOpenChange={(value) => !value && setEditing(null)}
        onSaved={() => {
          setEditing(null)
          refresh()
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contenu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le contenu ne sera plus disponible dans l'application utilisateur.
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

function CategoriesPanel({
  categories,
  onChanged,
}: {
  categories: CategorieVie[]
  onChanged: () => void
}) {
  const [name, setName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      if (editingId) await adminUpdateVieCategory(editingId, { nom: name.trim() })
      else await adminCreateVieCategory({ nom: name.trim() })
      toast.success(editingId ? "Categorie mise a jour" : "Categorie creee")
      setName("")
      setEditingId(null)
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Operation impossible")
    } finally {
      setSubmitting(false)
    }
  }

  async function removeCategory(category: CategorieVie) {
    try {
      await adminDeleteVieCategory(category.id)
      toast.success("Categorie supprimee")
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <Card className="h-fit border-border/70">
      <CardContent className="space-y-4 p-5">
        <div>
          <h2 className="font-serif text-lg font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">Elles structurent les contenus cote ado.</p>
        </div>
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nom"
            className="flex-1"
          />
          <Button type="submit" disabled={submitting || !name.trim()}>
            {editingId ? "OK" : "Ajouter"}
          </Button>
        </form>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
              <span className="truncate text-sm font-medium">{category.nom}</span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingId(category.id)
                    setName(category.nom)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCategory(category)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ContentDialog({
  open,
  content,
  categories,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  content?: AdminContenuVieDetail | null
  categories: CategorieVie[]
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const isEdit = !!content
  const [form, setForm] = useState<AdminContenuViePayload>(emptyContentForm())
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [coverName, setCoverName] = useState("")
  const [videoName, setVideoName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setCoverFile(null)
    setVideoFile(null)
    setCoverName("")
    setVideoName("")
    setForm(
      content
        ? {
            type: content.type,
            titre: content.titre,
            description: content.description,
            contenu_texte: content.contenu_texte ?? "",
            video_url: content.video_url ?? "",
            categorie_id: content.categorie.id,
          }
        : emptyContentForm(categories[0]?.id ?? ""),
    )
  }, [categories, content, open])

  function rememberFile(event: ChangeEvent<HTMLInputElement>, kind: "cover" | "video") {
    const next = event.target.files?.[0]
    if (!next) return
    if (kind === "cover") {
      setCoverFile(next)
      setCoverName(next.name)
    } else {
      setVideoFile(next)
      setVideoName(next.name)
    }
    event.target.value = ""
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload: AdminContenuViePayload = {
        ...form,
        titre: form.titre.trim(),
        description: form.description.trim(),
        contenu_texte: form.contenu_texte?.trim() || null,
        video_url: form.video_url?.trim() || null,
      }
      const saved = isEdit && content
        ? await adminUpdateVieContenu(content.id, payload)
        : await adminCreateVieContenu(payload)
      if (coverFile) await adminUploadVieCover(saved.id, coverFile)
      if (videoFile) await adminUploadVieVideo(saved.id, videoFile)
      toast.success(isEdit ? "Contenu mis a jour" : "Contenu cree")
      onSaved()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Operation impossible")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le contenu" : "Nouveau contenu"}</DialogTitle>
          <DialogDescription>
            Les contenus brouillons restent invisibles cote ado jusqu'a publication.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value as TypeContenuVie }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="temoignage">Temoignage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categorie</Label>
              <Select
                value={form.categorie_id}
                onValueChange={(value) => setForm((current) => ({ ...current, categorie_id: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="ct">Titre</Label>
            <Input
              id="ct"
              required
              value={form.titre}
              onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cd">Description</Label>
            <Textarea
              id="cd"
              required
              rows={3}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cb">Texte</Label>
            <Textarea
              id="cb"
              rows={6}
              value={form.contenu_texte ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, contenu_texte: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cv">URL video externe</Label>
            <Input
              id="cv"
              type="url"
              value={form.video_url ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, video_url: event.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-3 text-sm">
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{coverName || "Image de couverture"}</span>
              <Upload className="h-4 w-4 text-muted-foreground" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => rememberFile(event, "cover")}
              />
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-3 text-sm">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{videoName || "Fichier video"}</span>
              <Upload className="h-4 w-4 text-muted-foreground" />
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(event) => rememberFile(event, "video")}
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting || !form.categorie_id}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
