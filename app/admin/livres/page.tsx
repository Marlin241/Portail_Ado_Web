"use client"

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import Image from "next/image"
import useSWR, { mutate as globalMutate } from "swr"
import {
  BookOpen,
  FileImage,
  FileText,
  MoreVertical,
  Pencil,
  Plus,
  Sparkles,
  Tag,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  adminCreateBook,
  adminCreateCategory,
  adminDeleteBook,
  adminDeleteCategory,
  adminUpdateBook,
  adminUploadBookCover,
  adminUploadBookFile,
} from "@/lib/api/admin-books"
import { listBooks, listCategories } from "@/lib/api/books"
import type { AdminBookPayload, ApiError, Book, CategorieLivre } from "@/lib/api/types"

function emptyBookForm(): AdminBookPayload {
  return {
    titre: "",
    auteur: "",
    description: "",
    categorie_id: null,
    annee_publication: null,
    isbn: null,
    lien_achat: null,
    est_recommande: false,
  }
}

export default function AdminBooksPage() {
  const [editing, setEditing] = useState<Book | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Book | null>(null)
  const [managingCategories, setManagingCategories] = useState(false)

  const { data: books, mutate: refreshBooks } = useSWR("admin-books", () => listBooks({ limit: 100 }))
  const { data: categories, mutate: refreshCategories } = useSWR("admin-categories", () => listCategories())

  async function refresh() {
    await Promise.all([refreshBooks(), refreshCategories()])
    globalMutate("admin-stats")
    globalMutate("admin-audit-recent")
  }

  async function onDelete(book: Book) {
    try {
      await adminDeleteBook(book.id)
      toast.success(`"${book.titre}" supprime`)
      setDeleting(null)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Bibliotheque"
        title="Livres et categories"
        description="Gerez la liste des livres, leurs metadonnees, fichiers (PDF / ePub) et classez-les par categorie."
        actions={
          <>
            <Button variant="outline" onClick={() => setManagingCategories(true)}>
              <Tag className="mr-2 h-4 w-4" />
              Categories
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau livre
            </Button>
          </>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        <Card className="border-border/70">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Livre</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Formats</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!books ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-sm">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : books.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-sm">
                        Aucun livre pour le moment. Cree-en un via le bouton
                        &laquo;&nbsp;Nouveau livre&nbsp;&raquo;.
                      </TableCell>
                    </TableRow>
                  ) : (
                    books.items.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="bg-muted relative h-14 w-10 shrink-0 overflow-hidden rounded-md">
                              {book.couverture_url ? (
                                <Image
                                  src={book.couverture_url}
                                  alt={book.titre}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <BookOpen className="text-muted-foreground h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-medium">{book.titre}</span>
                              <span className="text-muted-foreground truncate text-xs">{book.auteur}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {book.categorie ? (
                            <Badge variant="outline">{book.categorie.nom}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {book.formats_disponibles.length === 0 ? (
                              <span className="text-muted-foreground text-xs">Aucun</span>
                            ) : (
                              book.formats_disponibles.map((format) => (
                                <Badge key={format} variant="secondary" className="uppercase">
                                  {format}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {book.est_recommande ? (
                            <Badge className="bg-accent/30 text-accent-foreground border-0">
                              <Sparkles className="mr-1 h-3 w-3" />
                              Recommande
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Standard</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Actions pour ${book.titre}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditing(book)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleting(book)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <BookDialog
        open={creating}
        categories={categories ?? []}
        onOpenChange={setCreating}
        onSaved={() => {
          setCreating(false)
          refresh()
        }}
      />

      <BookDialog
        open={!!editing}
        book={editing}
        categories={categories ?? []}
        onOpenChange={(value) => !value && setEditing(null)}
        onSaved={() => {
          setEditing(null)
          refresh()
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce livre ?</AlertDialogTitle>
            <AlertDialogDescription>
              &laquo;&nbsp;{deleting?.titre}&nbsp;&raquo; sera definitivement retire du catalogue.
              La progression associee des utilisateurs sera conservee.
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

      <CategoriesDialog
        open={managingCategories}
        onOpenChange={setManagingCategories}
        categories={categories ?? []}
        onChanged={refresh}
      />
    </>
  )
}

function BookDialog({
  open,
  book,
  categories,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  book?: Book | null
  categories: CategorieLivre[]
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const isEdit = !!book
  const [form, setForm] = useState<AdminBookPayload>(emptyBookForm())
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null)
  const [pendingEpubFile, setPendingEpubFile] = useState<File | null>(null)
  const [coverFileName, setCoverFileName] = useState("")
  const [pdfFileName, setPdfFileName] = useState("")
  const [epubFileName, setEpubFileName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    setPendingCoverFile(null)
    setPendingPdfFile(null)
    setPendingEpubFile(null)
    setCoverFileName("")
    setPdfFileName("")
    setEpubFileName("")

    if (book) {
      setForm({
        titre: book.titre,
        auteur: book.auteur,
        description: book.description ?? "",
        categorie_id: book.categorie?.id ?? null,
        annee_publication: book.annee_publication ?? null,
        isbn: book.isbn ?? null,
        lien_achat: book.lien_achat ?? null,
        est_recommande: book.est_recommande,
      })
      return
    }

    setForm(emptyBookForm())
  }, [book, open])

  function resetForm() {
    setForm(emptyBookForm())
    setPendingCoverFile(null)
    setPendingPdfFile(null)
    setPendingEpubFile(null)
    setCoverFileName("")
    setPdfFileName("")
    setEpubFileName("")
  }

  function rememberFile(
    event: ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setName: (name: string) => void,
    label: string,
  ) {
    const file = event.target.files?.[0]
    if (!file) return
    setFile(file)
    setName(file.name)
    event.target.value = ""
    toast.info(`${label} pret. Il sera envoye apres l'enregistrement du livre.`)
  }

  async function uploadPendingFiles(bookId: string) {
    if (pendingCoverFile) {
      await adminUploadBookCover(bookId, pendingCoverFile)
    }
    if (pendingPdfFile) {
      await adminUploadBookFile(bookId, "pdf", pendingPdfFile)
    }
    if (pendingEpubFile) {
      await adminUploadBookFile(bookId, "epub", pendingEpubFile)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    let savedBook: Book | null = null

    try {
      savedBook =
        isEdit && book ? await adminUpdateBook(book.id, form) : await adminCreateBook(form)

      await uploadPendingFiles(savedBook.id)
      toast.success(isEdit ? "Livre mis a jour" : "Livre cree")
      resetForm()
      onSaved()
    } catch (error) {
      if (savedBook) {
        toast.error(
          (error as ApiError).message ??
            "Le livre a ete enregistre, mais l'envoi d'un fichier a echoue.",
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isEdit ? "Modifier le livre" : "Nouveau livre"}
          </DialogTitle>
          <DialogDescription>
            Les fichiers PDF, ePub et la couverture peuvent etre joints ici. Ils seront envoyes
            automatiquement apres l&apos;enregistrement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bt">Titre</Label>
              <Input
                id="bt"
                required
                value={form.titre}
                onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="ba">Auteur</Label>
              <Input
                id="ba"
                required
                value={form.auteur}
                onChange={(event) => setForm((current) => ({ ...current, auteur: event.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bd">Description</Label>
            <Textarea
              id="bd"
              rows={4}
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Categorie</Label>
              <Select
                value={form.categorie_id ?? "none"}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    categorie_id: value === "none" ? null : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non classe</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="by">Annee</Label>
              <Input
                id="by"
                type="number"
                min={1900}
                max={2100}
                value={form.annee_publication ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    annee_publication: event.target.value ? Number(event.target.value) : null,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="bi">ISBN</Label>
              <Input
                id="bi"
                value={form.isbn ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isbn: event.target.value || null }))
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bl">Lien d&apos;achat (optionnel)</Label>
            <Input
              id="bl"
              type="url"
              placeholder="https://..."
              value={form.lien_achat ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, lien_achat: event.target.value || null }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Couverture</Label>
              <label className="border-border/70 bg-muted/30 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-sm">
                <FileImage className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  {coverFileName
                    ? coverFileName
                    : book?.couverture_url
                      ? "Couverture actuelle presente"
                      : "Choisir une image"}
                </span>
                <Upload className="text-muted-foreground h-4 w-4 shrink-0" />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) =>
                    rememberFile(event, setPendingCoverFile, setCoverFileName, "La couverture")
                  }
                />
              </label>
            </div>
            <div className="grid gap-2">
              <Label>Fichier PDF</Label>
              <label className="border-border/70 bg-muted/30 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-sm">
                <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  {pdfFileName
                    ? pdfFileName
                    : book?.formats_disponibles.includes("pdf")
                      ? "PDF actuel present"
                      : "Choisir un PDF"}
                </span>
                <Upload className="text-muted-foreground h-4 w-4 shrink-0" />
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(event) =>
                    rememberFile(event, setPendingPdfFile, setPdfFileName, "Le PDF")
                  }
                />
              </label>
            </div>
            <div className="grid gap-2">
              <Label>Fichier ePub</Label>
              <label className="border-border/70 bg-muted/30 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-sm">
                <BookOpen className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  {epubFileName
                    ? epubFileName
                    : book?.formats_disponibles.includes("epub")
                      ? "ePub actuel present"
                      : "Choisir un ePub"}
                </span>
                <Upload className="text-muted-foreground h-4 w-4 shrink-0" />
                <input
                  type="file"
                  accept="application/epub+zip,.epub"
                  className="hidden"
                  onChange={(event) =>
                    rememberFile(event, setPendingEpubFile, setEpubFileName, "Le ePub")
                  }
                />
              </label>
            </div>
          </div>

          {(book?.formats_disponibles.length || 0) > 0 ? (
            <div className="flex flex-wrap gap-2">
              {book?.formats_disponibles.map((format) => (
                <Badge key={format} variant="secondary" className="uppercase">
                  {format} disponible
                </Badge>
              ))}
            </div>
          ) : null}

          <label className="border-border/70 bg-muted/30 flex items-center gap-3 rounded-lg border p-4">
            <Checkbox
              checked={!!form.est_recommande}
              onCheckedChange={(value) =>
                setForm((current) => ({ ...current, est_recommande: value === true }))
              }
            />
            <div>
              <span className="text-sm font-medium">Mettre en avant dans les recommandations</span>
              <p className="text-muted-foreground text-xs">
                Le livre apparaitra sur la page d&apos;accueil des utilisateurs.
              </p>
            </div>
          </label>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement..." : isEdit ? "Enregistrer" : "Creer le livre"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CategoriesDialog({
  open,
  onOpenChange,
  categories,
  onChanged,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  categories: CategorieLivre[]
  onChanged: () => void
}) {
  const [nom, setNom] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<CategorieLivre | null>(null)

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    if (!nom.trim()) return

    setSubmitting(true)
    try {
      await adminCreateCategory({ nom: nom.trim(), description: description.trim() || null })
      toast.success("Categorie creee")
      setNom("")
      setDescription("")
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Creation impossible")
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(category: CategorieLivre) {
    try {
      await adminDeleteCategory(category.id)
      toast.success("Categorie supprimee")
      setConfirmingDelete(null)
      onChanged()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Gerer les categories</DialogTitle>
            <DialogDescription>
              Regroupez les livres en thematiques pour aider les jeunes a trouver facilement ce qui
              leur parle.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onCreate} className="border-border/70 grid gap-3 rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
              <div>
                <Label htmlFor="cn">Nom</Label>
                <Input id="cn" required value={nom} onChange={(event) => setNom(event.target.value)} />
              </div>
              <div>
                <Label htmlFor="cd">Description (optionnel)</Label>
                <Input
                  id="cd"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={submitting}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </div>
          </form>

          <div className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-center text-sm">
                      Aucune categorie pour l&apos;instant.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.nom}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {category.description ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Supprimer ${category.nom}`}
                          onClick={() => setConfirmingDelete(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmingDelete} onOpenChange={(value) => !value && setConfirmingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette categorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les livres associes passeront en &laquo;&nbsp;non classe&nbsp;&raquo;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmingDelete && onDelete(confirmingDelete)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
