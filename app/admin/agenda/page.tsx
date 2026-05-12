"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { CalendarDays, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react"
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
  adminCreateMeditation,
  adminDeleteMeditation,
  adminListBibleChapters,
  adminListBibleBooks,
  adminListBibleTranslations,
  adminListMeditations,
  adminListVerses,
  adminUpdateMeditation,
} from "@/lib/api/agenda"
import {
  bibleTranslationOptions,
  formatBibleTranslation,
} from "@/lib/bible-translations"
import type {
  AdminMeditation,
  AdminMeditationPayload,
  ApiError,
  LivreBiblique,
  TraductionBiblique,
  VersetBiblique,
} from "@/lib/api/types"

function emptyForm(): AdminMeditationPayload {
  return {
    titre: "",
    meditation_texte: "",
    verset_debut_id: "",
    verset_fin_id: "",
    mois_jour: "01-01",
    annee: null,
  }
}

export default function AdminAgendaPage() {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminMeditation | null>(null)
  const [deleting, setDeleting] = useState<AdminMeditation | null>(null)

  const { data, mutate } = useSWR("admin-agenda-meditations", () =>
    adminListMeditations({ limit: 80, offset: 0 }),
  )

  async function refresh() {
    await mutate()
    globalMutate("admin-audit-recent")
  }

  async function onDelete(meditation: AdminMeditation) {
    try {
      await adminDeleteMeditation(meditation.id)
      toast.success("Meditation supprimee")
      setDeleting(null)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  const items = data?.items ?? []

  return (
    <>
      <AdminPageHeader
        eyebrow="Sprint 2"
        title="Agenda spirituel"
        description="Programmez les meditations quotidiennes et les surcharges datees visibles par les jeunes."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle meditation
          </Button>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        {!data ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground" />
              <h2 className="font-serif text-lg font-semibold">Aucune meditation</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Creez la premiere entree pour alimenter l'agenda spirituel.
              </p>
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Creer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((meditation) => (
              <Card key={meditation.id} className="border-border/70">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">{meditation.mois_jour}</Badge>
                        {meditation.annee ? <Badge variant="outline">{meditation.annee}</Badge> : null}
                      </div>
                      <h2 className="truncate font-serif text-lg font-semibold">
                        {meditation.titre || "Meditation sans titre"}
                      </h2>
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                        {meditation.meditation_texte}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions meditation">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(meditation)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(meditation)}
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
      </div>

      <MeditationDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => {
          setCreating(false)
          refresh()
        }}
      />
      <MeditationDialog
        open={!!editing}
        meditation={editing}
        onOpenChange={(value) => !value && setEditing(null)}
        onSaved={() => {
          setEditing(null)
          refresh()
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette meditation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle disparaitra de l'agenda des jeunes. Cette action est irreversible.
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

function MeditationDialog({
  open,
  meditation,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  meditation?: AdminMeditation | null
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const isEdit = !!meditation
  const [form, setForm] = useState<AdminMeditationPayload>(emptyForm())
  const [traductions, setTraductions] = useState<TraductionBiblique[]>([])
  const [selectedTraduction, setSelectedTraduction] = useState("LSG")
  const [books, setBooks] = useState<LivreBiblique[]>([])
  const [chapters, setChapters] = useState<number[]>([])
  const [bookId, setBookId] = useState("")
  const [chapter, setChapter] = useState("")
  const [verses, setVerses] = useState<VersetBiblique[]>([])
  const [submitting, setSubmitting] = useState(false)

  const selectedBook = useMemo(() => books.find((book) => book.id === bookId), [bookId, books])
  const startVerse = useMemo(
    () => verses.find((verse) => verse.id === form.verset_debut_id) ?? null,
    [form.verset_debut_id, verses],
  )
  const endVerses = startVerse
    ? verses.filter((verse) => verse.numero >= startVerse.numero)
    : verses

  useEffect(() => {
    if (!open) return
    if (meditation) {
      setForm({
        titre: meditation.titre ?? "",
        meditation_texte: meditation.meditation_texte,
        verset_debut_id: meditation.verset_debut_id,
        verset_fin_id: meditation.verset_fin_id,
        mois_jour: meditation.mois_jour,
        annee: meditation.annee,
      })
    } else {
      setForm(emptyForm())
    }
    setTraductions([])
    setSelectedTraduction("LSG")
    setBooks([])
    setChapters([])
    setBookId("")
    setChapter("")
    setVerses([])
  }, [meditation, open])

  useEffect(() => {
    if (!open) return
    let active = true
    adminListBibleTranslations()
      .then((items) => {
        if (!active) return
        const next = bibleTranslationOptions(items)
        setTraductions(next)
        setSelectedTraduction(next[0].code)
      })
      .catch(() => {
        if (!active) return
        const fallback = bibleTranslationOptions([])
        setTraductions(fallback)
        setSelectedTraduction(fallback[0].code)
      })
    return () => {
      active = false
    }
  }, [open])

  useEffect(() => {
    if (!open || !selectedTraduction) return
    let active = true
    setBooks([])
    setChapters([])
    setBookId("")
    setChapter("")
    setVerses([])
    adminListBibleBooks(selectedTraduction)
      .then((items) => {
        if (!active) return
        setBooks(items)
        setBookId(items[0]?.id ?? "")
      })
      .catch(() => {
        if (active) setBooks([])
      })
    return () => {
      active = false
    }
  }, [open, selectedTraduction])

  useEffect(() => {
    if (!open || !bookId || !selectedTraduction) {
      setChapters([])
      setChapter("")
      setVerses([])
      return
    }
    let active = true
    setChapters([])
    setChapter("")
    setVerses([])
    adminListBibleChapters(bookId, selectedTraduction)
      .then((items) => {
        if (!active) return
        setChapters(items)
        setChapter(items[0] ? String(items[0]) : "")
      })
      .catch(() => {
        if (active) setChapters([])
      })
    return () => {
      active = false
    }
  }, [bookId, open, selectedTraduction])

  useEffect(() => {
    if (!bookId || !chapter || !selectedTraduction) {
      setVerses([])
      return
    }
    let active = true
    adminListVerses(bookId, Number(chapter), selectedTraduction)
      .then((data) => active && setVerses(data))
      .catch(() => active && setVerses([]))
    return () => {
      active = false
    }
  }, [bookId, chapter, selectedTraduction])

  function clearSelectedVerses() {
    setForm((current) => ({
      ...current,
      verset_debut_id: "",
      verset_fin_id: "",
    }))
  }

  function normalizeDateInput(value: string) {
    const trimmed = value.trim()
    const frenchDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
    if (frenchDate) {
      const [, day, month, year] = frenchDate
      setForm((current) => ({
        ...current,
        mois_jour: `${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        annee: Number(year),
      }))
      return
    }

    const isoDate = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed)
    if (isoDate) {
      const [, year, month, day] = isoDate
      setForm((current) => ({
        ...current,
        mois_jour: `${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        annee: Number(year),
      }))
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload: AdminMeditationPayload = {
        ...form,
        titre: form.titre?.trim() || null,
        meditation_texte: form.meditation_texte.trim(),
        annee: form.annee ? Number(form.annee) : null,
      }
      if (isEdit && meditation) await adminUpdateMeditation(meditation.id, payload)
      else await adminCreateMeditation(payload)
      toast.success(isEdit ? "Meditation mise a jour" : "Meditation creee")
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
          <DialogTitle>{isEdit ? "Modifier la meditation" : "Nouvelle meditation"}</DialogTitle>
          <DialogDescription>
            Choisissez le passage biblique, puis renseignez le texte qui sera affiche dans l'agenda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mtitle">Titre</Label>
              <Input
                id="mtitle"
                value={form.titre ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="mdate">Jour annuel (MM-JJ)</Label>
              <Input
                id="mdate"
                required
                inputMode="numeric"
                pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
                placeholder="05-09"
                title="Format attendu : MM-JJ, par exemple 05-09 pour le 9 mai."
                value={form.mois_jour}
                onChange={(event) => setForm((current) => ({ ...current, mois_jour: event.target.value }))}
                onBlur={(event) => normalizeDateInput(event.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Exemple : 05-09 pour le 9 mai. Si vous collez 09/05/2026, il sera converti en
                05-09 avec l'annee 2026.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="myear">Annee specifique (optionnel)</Label>
            <Input
              id="myear"
              type="number"
              min={2000}
              max={2100}
              value={form.annee ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  annee: event.target.value ? Number(event.target.value) : null,
                }))
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <Label>Version biblique</Label>
              <Select
                value={selectedTraduction}
                onValueChange={(value) => {
                  setSelectedTraduction(value)
                  clearSelectedVerses()
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une version" />
                </SelectTrigger>
                <SelectContent>
                  {bibleTranslationOptions(traductions).map((traduction) => (
                    <SelectItem key={traduction.code} value={traduction.code}>
                      {formatBibleTranslation(traduction)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Livre biblique</Label>
              <Select
                value={bookId}
                onValueChange={(value) => {
                  setBookId(value)
                  clearSelectedVerses()
                }}
                disabled={!selectedTraduction || books.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un livre" />
                </SelectTrigger>
                <SelectContent>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Chapitre</Label>
              <Select
                value={chapter}
                onValueChange={(value) => {
                  setChapter(value)
                  clearSelectedVerses()
                }}
                disabled={!selectedBook || chapters.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chapitre" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      Chapitre {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Verset de debut</Label>
              <Select
                value={form.verset_debut_id}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    verset_debut_id: value,
                    verset_fin_id: value,
                  }))
                }
                disabled={verses.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isEdit ? "Verset actuel conserve" : "Choisir"} />
                </SelectTrigger>
                <SelectContent>
                  {verses.map((verse) => (
                    <SelectItem key={verse.id} value={verse.id}>
                      {verse.numero}. {verse.texte.slice(0, 80)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Verset de fin</Label>
              <Select
                value={form.verset_fin_id}
                onValueChange={(value) => setForm((current) => ({ ...current, verset_fin_id: value }))}
                disabled={endVerses.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isEdit ? "Verset actuel conserve" : "Choisir"} />
                </SelectTrigger>
                <SelectContent>
                  {endVerses.map((verse) => (
                    <SelectItem key={verse.id} value={verse.id}>
                      {verse.numero}. {verse.texte.slice(0, 80)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="mtext">Texte de meditation</Label>
            <Textarea
              id="mtext"
              required
              rows={7}
              value={form.meditation_texte}
              onChange={(event) =>
                setForm((current) => ({ ...current, meditation_texte: event.target.value }))
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting || !form.verset_debut_id || !form.verset_fin_id}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
