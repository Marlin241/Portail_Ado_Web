"use client"

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { HeartPulse, ImagePlus, MoreVertical, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { BackendMedia } from "@/components/backend-media"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  adminCreateBienEtreArticle,
  adminCreateBienEtreCategory,
  adminDeleteBienEtreArticle,
  adminDeleteBienEtreCategory,
  adminGetBienEtreArticle,
  adminListBienEtreArticles,
  adminListBienEtreCategories,
  adminUpdateBienEtreArticle,
  adminUpdateBienEtreCategory,
  adminUploadBienEtreImage,
} from "@/lib/api/bien-etre"
import type {
  AdminBienEtreArticle,
  ApiError,
  BienEtreArticlePayload,
  BienEtreCategorie,
} from "@/lib/api/types"

function emptyArticle(categoryId = ""): BienEtreArticlePayload {
  return {
    titre: "",
    contenu: "",
    categorie_ids: categoryId ? [categoryId] : [],
    publie: false,
  }
}

export default function AdminBienEtrePage() {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminBienEtreArticle | null>(null)
  const [deleting, setDeleting] = useState<AdminBienEtreArticle | null>(null)
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null)

  const { data: categories = [], mutate: mutateCategories } = useSWR(
    "admin-bien-etre-categories",
    adminListBienEtreCategories,
  )
  const { data, mutate } = useSWR("admin-bien-etre-articles", () =>
    adminListBienEtreArticles({ page: 1, per_page: 80 }),
  )
  const items = data?.items ?? []

  async function refresh() {
    await Promise.all([mutate(), mutateCategories()])
    globalMutate("admin-audit-recent")
  }

  async function startEdit(item: AdminBienEtreArticle) {
    setLoadingEditId(item.id)
    try {
      setEditing(await adminGetBienEtreArticle(item.id))
    } catch (error) {
      toast.error((error as ApiError).message ?? "Chargement impossible")
    } finally {
      setLoadingEditId(null)
    }
  }

  async function togglePublication(item: AdminBienEtreArticle) {
    try {
      await adminUpdateBienEtreArticle(item.id, { publie: !item.publie })
      toast.success(item.publie ? "Article masque" : "Article publie")
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  async function remove(item: AdminBienEtreArticle) {
    try {
      await adminDeleteBienEtreArticle(item.id)
      toast.success("Article supprime")
      setDeleting(null)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Sprint 3"
        title="Bien-etre"
        description="Gerez les articles Mode, Sante et Bien-etre visibles par les ados."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel article
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
                <h2 className="font-serif text-lg font-semibold">Aucun article</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Creez une categorie, puis ajoutez un premier article.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/70">
                  <div className="flex aspect-[16/8] items-center justify-center bg-muted">
                    {item.image_url ? (
                      <BackendMedia src={item.image_url} alt={item.titre} />
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
                          {item.categories.slice(0, 2).map((category) => (
                            <Badge key={category.id} variant="secondary">
                              {category.nom}
                            </Badge>
                          ))}
                        </div>
                        <h2 className="mt-2 truncate font-serif text-lg font-semibold">{item.titre}</h2>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.contenu}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions article">
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

      <ArticleDialog
        open={creating}
        categories={categories}
        onOpenChange={setCreating}
        onSaved={() => {
          setCreating(false)
          refresh()
        }}
      />
      <ArticleDialog
        open={!!editing}
        article={editing}
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
            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
            <AlertDialogDescription>
              Il ne sera plus disponible cote ado et son image associee sera nettoyee par le backend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && remove(deleting)}
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
  categories: BienEtreCategorie[]
  onChanged: () => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const payload = { nom: name.trim(), description: description.trim() || null }
      if (editingId) await adminUpdateBienEtreCategory(editingId, payload)
      else await adminCreateBienEtreCategory(payload)
      toast.success(editingId ? "Categorie mise a jour" : "Categorie creee")
      setName("")
      setDescription("")
      setEditingId(null)
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Operation impossible")
    } finally {
      setSubmitting(false)
    }
  }

  async function removeCategory(category: BienEtreCategorie) {
    try {
      await adminDeleteBienEtreCategory(category.id)
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
          <p className="text-sm text-muted-foreground">Mode, Sante, Bien-etre et autres rubriques.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom" />
          <Textarea
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description optionnelle"
          />
          <Button type="submit" disabled={submitting || !name.trim()} className="w-full">
            {editingId ? "Mettre a jour" : "Ajouter"}
          </Button>
        </form>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="rounded-lg border p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{category.nom}</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingId(category.id)
                      setName(category.nom)
                      setDescription(category.description ?? "")
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeCategory(category)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {category.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{category.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ArticleDialog({
  open,
  article,
  categories,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  article?: AdminBienEtreArticle | null
  categories: BienEtreCategorie[]
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const isEdit = !!article
  const [form, setForm] = useState<BienEtreArticlePayload>(emptyArticle())
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageName, setImageName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setImageFile(null)
    setImageName("")
    setForm(
      article
        ? {
            titre: article.titre,
            contenu: article.contenu,
            categorie_ids: article.categories.map((category) => category.id),
            publie: article.publie,
          }
        : emptyArticle(categories[0]?.id ?? ""),
    )
  }, [article, categories, open])

  function rememberImage(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0]
    if (!next) return
    setImageFile(next)
    setImageName(next.name)
    event.target.value = ""
  }

  function toggleCategory(categoryId: string, checked: boolean) {
    setForm((current) => {
      const ids = current.categorie_ids ?? []
      return {
        ...current,
        categorie_ids: checked ? Array.from(new Set([...ids, categoryId])) : ids.filter((id) => id !== categoryId),
      }
    })
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload: BienEtreArticlePayload = {
        titre: form.titre.trim(),
        contenu: form.contenu.trim(),
        categorie_ids: form.categorie_ids ?? [],
        publie: form.publie ?? false,
      }
      const saved = isEdit && article
        ? await adminUpdateBienEtreArticle(article.id, payload)
        : await adminCreateBienEtreArticle(payload)
      if (imageFile) await adminUploadBienEtreImage(saved.id, imageFile)
      toast.success(isEdit ? "Article mis a jour" : "Article cree")
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
          <DialogTitle>{isEdit ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
          <DialogDescription>Les brouillons restent invisibles dans l'espace ado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="article-title">Titre</Label>
            <Input
              id="article-title"
              required
              maxLength={200}
              value={form.titre}
              onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="article-content">Contenu</Label>
            <Textarea
              id="article-content"
              required
              minLength={100}
              maxLength={20000}
              rows={10}
              value={form.contenu}
              onChange={(event) => setForm((current) => ({ ...current, contenu: event.target.value }))}
            />
            <p className="mt-1 text-xs text-muted-foreground">{form.contenu.trim().length}/20000 caracteres</p>
          </div>
          <div>
            <Label>Categories</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                  <Checkbox
                    checked={(form.categorie_ids ?? []).includes(category.id)}
                    onCheckedChange={(checked) => toggleCategory(category.id, checked === true)}
                  />
                  <span className="truncate">{category.nom}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-3">
            <span>
              <span className="block text-sm font-medium">Publier</span>
              <span className="block text-xs text-muted-foreground">Rendre l'article visible cote ado.</span>
            </span>
            <Switch
              checked={form.publie ?? false}
              onCheckedChange={(checked) => setForm((current) => ({ ...current, publie: checked }))}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-3 text-sm">
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{imageName || "Image de couverture"}</span>
            <Upload className="h-4 w-4 text-muted-foreground" />
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={rememberImage}
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
