"use client"

import { useState, type FormEvent } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { CheckCircle2, MoreVertical, Palette, Pencil, Trash2, Trophy, XCircle } from "lucide-react"
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
  adminChangeCreationStatus,
  adminCreateCategorieCreativite,
  adminDeleteCategorieCreativite,
  adminDeleteCreation,
  adminFreezeTalentDuMois,
  adminListCreations,
  adminListTalentsDuMois,
  adminUpdateCategorieCreativite,
  listCategoriesCreativite,
} from "@/lib/api/creativite"
import type {
  ApiError,
  CategorieCreativite,
  Creation,
  StatutCreation,
  TypeMediaCreativite,
} from "@/lib/api/types"

const STATUS_LABEL: Record<StatutCreation, string> = {
  pending: "En attente",
  approved: "Approuvee",
  rejected: "Rejetee",
}

export default function AdminCreativitePage() {
  const [status, setStatus] = useState<StatutCreation | "all">("pending")
  const [deleting, setDeleting] = useState<Creation | null>(null)
  const { data: categories = [], mutate: mutateCategories } = useSWR(
    "admin-creativite-categories",
    listCategoriesCreativite,
  )
  const { data, mutate } = useSWR(["admin-creativite", status], () =>
    adminListCreations({ statut: status, page: 1, per_page: 80 }),
  )
  const { data: talents = [], mutate: mutateTalents } = useSWR(
    "admin-creativite-talents",
    adminListTalentsDuMois,
  )
  const items = data?.items ?? []

  async function refresh() {
    await Promise.all([mutate(), mutateCategories(), mutateTalents()])
    globalMutate("admin-stats")
    globalMutate(["admin-moderation-pending", "all"])
  }

  async function changeStatus(item: Creation, next: "approved" | "rejected") {
    try {
      await adminChangeCreationStatus(item.id, next)
      toast.success(next === "approved" ? "Creation approuvee" : "Creation rejetee")
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  async function remove(item: Creation) {
    try {
      await adminDeleteCreation(item.id)
      toast.success("Creation supprimee")
      setDeleting(null)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  async function freezeTalent() {
    try {
      await adminFreezeTalentDuMois()
      toast.success("Talent du mois fige")
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Sprint 4"
        title="Creativite"
        description="Moderez les creations ados, gerez les categories et figez le talent du mois."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={freezeTalent}>
              <Trophy className="mr-2 h-4 w-4" />
              Figer talent
            </Button>
            <Select value={status} onValueChange={(value) => setStatus(value as StatutCreation | "all")}>
              <SelectTrigger className="w-40 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvees</SelectItem>
                <SelectItem value="rejected">Rejetees</SelectItem>
                <SelectItem value="all">Toutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-6 px-6 py-6 md:px-10 md:py-8 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <CategoriesPanel categories={categories} onChanged={refresh} />
          <Card className="border-border/70">
            <CardContent className="p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Trophy className="h-4 w-4 text-primary" />
                Talents figes
              </h2>
              <div className="space-y-2">
                {talents.slice(0, 6).map((talent) => (
                  <div key={`${talent.annee}-${talent.mois}`} className="rounded-lg border border-border/70 p-3">
                    <p className="line-clamp-1 text-sm font-medium">{talent.creation.titre}</p>
                    <p className="text-xs text-muted-foreground">
                      {talent.mois}/{talent.annee} - {talent.nb_likes_snapshot} likes
                    </p>
                  </div>
                ))}
                {talents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun talent fige.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </aside>

        <section>
          {!data ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Palette className="h-10 w-10 text-muted-foreground" />
                <h2 className="font-serif text-lg font-semibold">Aucune creation</h2>
                <p className="max-w-md text-sm text-muted-foreground">Les soumissions apparaitront ici.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/70">
                  {item.media_url ? (
                    <div className="flex max-h-72 items-center justify-center bg-muted">
                      <BackendMedia src={item.media_url} alt={item.titre} className="max-h-72" mediaClassName="max-h-72 w-full" />
                    </div>
                  ) : null}
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <Badge variant={item.statut === "pending" ? "default" : "outline"}>
                            {STATUS_LABEL[item.statut]}
                          </Badge>
                          <Badge variant="secondary">{item.nb_likes} likes</Badge>
                        </div>
                        <h2 className="line-clamp-1 text-lg font-semibold">{item.titre}</h2>
                        {item.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                        ) : null}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions creation">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => changeStatus(item, "approved")} disabled={item.statut !== "pending"}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approuver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => changeStatus(item, "rejected")} disabled={item.statut !== "pending"}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Rejeter
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(item)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {item.contenu_texte ? (
                      <p className="whitespace-pre-line rounded-lg bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
                        {item.contenu_texte}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette creation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette suppression est definitive et retire aussi le media stocke si necessaire.
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
  categories: CategorieCreativite[]
  onChanged: () => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    nom: "",
    description: "",
    type_media: "image" as TypeMediaCreativite,
    ordre: 0,
  })
  const [submitting, setSubmitting] = useState(false)

  function edit(category: CategorieCreativite) {
    setEditingId(category.id)
    setForm({
      nom: category.nom,
      description: category.description ?? "",
      type_media: category.type_media,
      ordre: category.ordre,
    })
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) await adminUpdateCategorieCreativite(editingId, form)
      else await adminCreateCategorieCreativite(form)
      toast.success(editingId ? "Categorie mise a jour" : "Categorie creee")
      setEditingId(null)
      setForm({ nom: "", description: "", type_media: "image", ordre: 0 })
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(category: CategorieCreativite) {
    try {
      await adminDeleteCategorieCreativite(category.id)
      toast.success("Categorie supprimee")
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-4 p-5">
        <h2 className="font-semibold">Categories</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            required
            placeholder="Nom"
            value={form.nom}
            onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
          />
          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <div className="grid grid-cols-[1fr_88px] gap-2">
            <Select
              value={form.type_media}
              onValueChange={(value) => setForm((current) => ({ ...current, type_media: value as TypeMediaCreativite }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="texte">Texte</SelectItem>
                <SelectItem value="audio_ou_texte">Audio ou texte</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={form.ordre}
              onChange={(event) => setForm((current) => ({ ...current, ordre: Number(event.target.value) }))}
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {editingId ? "Enregistrer" : "Ajouter"}
          </Button>
        </form>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{category.nom}</p>
                <p className="text-xs text-muted-foreground">{category.type_media}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={() => edit(category)} aria-label="Modifier">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(category)} aria-label="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
