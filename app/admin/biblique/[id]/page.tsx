"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useParams } from "next/navigation"
import useSWR, { mutate as globalMutate } from "swr"
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  HelpCircle,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  adminListBibleBooks,
  adminListBibleChapters,
  adminListBibleTranslations,
  adminListVerses,
} from "@/lib/api/agenda"
import {
  bibleTranslationOptions,
  formatBibleTranslation,
} from "@/lib/bible-translations"
import {
  adminAddOptionBiblique,
  adminAddQuestionBiblique,
  adminDeleteOptionBiblique,
  adminDeleteQuestionBiblique,
  adminGetQuizBiblique,
  adminGetStatsQuizBiblique,
  adminListThemesBibliques,
  adminPublishQuizBiblique,
  adminUpdateOptionBiblique,
  adminUpdateQuestionBiblique,
} from "@/lib/api/biblique"
import type {
  ApiError,
  DifficulteBiblique,
  LivreBiblique,
  OptionBibliqueAdmin,
  QuestionBibliqueAdmin,
  QuizBibliqueAdminDetail,
  ThemeBiblique,
  TraductionBiblique,
  TypeQuestionBiblique,
  VersetBiblique,
} from "@/lib/api/types"

const DIFFICULTY_LABELS: Record<DifficulteBiblique, string> = {
  facile: "Facile",
  moyen: "Moyen",
  difficile: "Difficile",
}

const POINTS_LABELS: Record<DifficulteBiblique, string> = {
  facile: "1 pt",
  moyen: "2 pts",
  difficile: "3 pts",
}

function themeName(quiz: QuizBibliqueAdminDetail | undefined, themes: ThemeBiblique[]) {
  if (!quiz?.theme_id) return "Sans theme"
  return themes.find((theme) => theme.id === quiz.theme_id)?.titre ?? "Theme lie"
}

export default function AdminBibliqueQuizEditorPage() {
  const params = useParams<{ id: string }>()
  const quizId = params?.id
  const [questionDialog, setQuestionDialog] = useState<QuestionBibliqueAdmin | "new" | null>(null)
  const [optionDialog, setOptionDialog] = useState<{
    question: QuestionBibliqueAdmin
    option: OptionBibliqueAdmin | null
  } | null>(null)

  const { data: quiz, mutate: mutateQuiz } = useSWR(
    quizId ? ["admin-biblique-quiz-detail", quizId] : null,
    () => adminGetQuizBiblique(quizId!),
  )
  const { data: stats } = useSWR(
    quizId ? ["admin-biblique-quiz-stats", quizId] : null,
    () => adminGetStatsQuizBiblique(quizId!),
  )
  const { data: themes = [] } = useSWR("admin-biblique-themes", adminListThemesBibliques)
  const questions = useMemo(
    () => [...(quiz?.questions ?? [])].sort((a, b) => a.ordre - b.ordre),
    [quiz?.questions],
  )
  const validQuestions = questions.filter(
    (question) => question.options.length >= 2 && question.options.filter((option) => option.est_correcte).length === 1,
  ).length
  const canPublish = validQuestions > 0

  async function refresh() {
    await Promise.all([mutateQuiz(), globalMutate(["admin-biblique-quiz-stats", quizId])])
    globalMutate("admin-stats")
    globalMutate("admin-audit-recent")
  }

  async function onTogglePublish() {
    if (!quiz) return
    try {
      await adminPublishQuizBiblique(quiz.id, !quiz.est_publie)
      toast.success(quiz.est_publie ? "Quiz de-publie" : "Quiz publie")
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Publication impossible")
    }
  }

  async function onDeleteQuestion(question: QuestionBibliqueAdmin) {
    try {
      await adminDeleteQuestionBiblique(question.id)
      toast.success("Question supprimee")
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  async function onDeleteOption(option: OptionBibliqueAdmin) {
    try {
      await adminDeleteOptionBiblique(option.id)
      toast.success("Option supprimee")
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Biblique etendu"
        title={quiz?.titre ?? "Editeur de quiz biblique"}
        description={quiz ? `${themeName(quiz, themes)} - ${quiz.est_publie ? "publie" : "brouillon"}` : "Chargement..."}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/biblique">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
            </Button>
            <Button
              variant={quiz?.est_publie ? "outline" : "default"}
              disabled={!quiz || (!quiz.est_publie && !canPublish)}
              onClick={onTogglePublish}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {quiz?.est_publie ? "De-publier" : "Publier"}
            </Button>
          </div>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        <section className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/70">
            <CardContent className="flex items-center gap-4 p-5">
              <HelpCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-semibold">{questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardContent className="flex items-center gap-4 p-5">
              <ListChecks className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-semibold">{validQuestions}</p>
                <p className="text-sm text-muted-foreground">Publiables</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardContent className="flex items-center gap-4 p-5">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-semibold">{stats?.total_tentatives ?? 0}</p>
                <p className="text-sm text-muted-foreground">Tentatives</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardContent className="flex items-center gap-4 p-5">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-semibold">{stats?.score_moyen ?? 0}/{stats?.score_max ?? 0}</p>
                <p className="text-sm text-muted-foreground">Score moyen</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-semibold">Questions et options</h2>
              <p className="text-sm text-muted-foreground">
                Pour publier, le backend exige au moins une question avec deux options et une seule bonne reponse.
              </p>
            </div>
            <Button onClick={() => setQuestionDialog("new")}>
              <Plus className="mr-2 h-4 w-4" />
              Question
            </Button>
          </div>

          {!quiz ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : questions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Ajoutez la premiere question du quiz biblique.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => {
                const sortedOptions = [...question.options].sort((a, b) => a.ordre - b.ordre)
                const isValid =
                  sortedOptions.length >= 2 && sortedOptions.filter((option) => option.est_correcte).length === 1
                return (
                  <Card key={question.id} className="border-border/70">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Ordre {question.ordre}</Badge>
                            <Badge variant="outline">{DIFFICULTY_LABELS[question.difficulte]}</Badge>
                            <Badge variant="outline">{POINTS_LABELS[question.difficulte]}</Badge>
                            <Badge variant={isValid ? "secondary" : "outline"}>
                              {isValid ? "Publiable" : "A completer"}
                            </Badge>
                          </div>
                          <CardTitle className="mt-2 text-base">{question.enonce}</CardTitle>
                          {question.type_question === "verset" ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Question liee a un verset biblique.
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setOptionDialog({ question, option: null })}>
                            <Plus className="mr-2 h-4 w-4" />
                            Option
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setQuestionDialog(question)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onDeleteQuestion(question)}>
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      {sortedOptions.map((option) => (
                        <div key={option.id} className="rounded-lg border border-border/70 bg-muted/30 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Badge variant={option.est_correcte ? "secondary" : "outline"}>
                                {option.est_correcte ? "Bonne reponse" : `Ordre ${option.ordre}`}
                              </Badge>
                              <p className="mt-2 text-sm">{option.texte}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setOptionDialog({ question, option })}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => onDeleteOption(option)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {sortedOptions.length === 0 ? (
                        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground md:col-span-2">
                          Aucune option pour cette question.
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {quizId ? (
        <QuestionDialog
          open={!!questionDialog}
          quizId={quizId}
          question={questionDialog === "new" ? null : questionDialog}
          onOpenChange={(open) => !open && setQuestionDialog(null)}
          onSaved={() => {
            setQuestionDialog(null)
            refresh()
          }}
        />
      ) : null}
      <OptionDialog
        open={!!optionDialog}
        data={optionDialog}
        onOpenChange={(open) => !open && setOptionDialog(null)}
        onSaved={() => {
          setOptionDialog(null)
          refresh()
        }}
      />
    </>
  )
}

function QuestionDialog({
  open,
  quizId,
  question,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  quizId: string
  question: QuestionBibliqueAdmin | null
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    enonce: "",
    type_question: "libre" as TypeQuestionBiblique,
    difficulte: "moyen" as DifficulteBiblique,
    verset_id: "",
    ordre: "1",
  })
  const [traductions, setTraductions] = useState<TraductionBiblique[]>([])
  const [selectedTraduction, setSelectedTraduction] = useState("LSG")
  const [books, setBooks] = useState<LivreBiblique[]>([])
  const [chapters, setChapters] = useState<number[]>([])
  const [bookId, setBookId] = useState("")
  const [chapter, setChapter] = useState("")
  const [verses, setVerses] = useState<VersetBiblique[]>([])
  const [submitting, setSubmitting] = useState(false)

  const selectedBook = useMemo(() => books.find((book) => book.id === bookId), [bookId, books])

  useEffect(() => {
    if (!open) return
    setForm({
      enonce: question?.enonce ?? "",
      type_question: question?.type_question ?? "libre",
      difficulte: question?.difficulte ?? "moyen",
      verset_id: question?.verset_id ?? "",
      ordre: String(question?.ordre ?? 1),
    })
    setTraductions([])
    setSelectedTraduction("LSG")
    setBooks([])
    setChapters([])
    setBookId("")
    setChapter("")
    setVerses([])
  }, [open, question])

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
      .then((items) => active && setVerses(items))
      .catch(() => active && setVerses([]))
    return () => {
      active = false
    }
  }, [bookId, chapter, selectedTraduction])

  function clearSelectedVerse() {
    setForm((current) => ({ ...current, verset_id: "" }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        enonce: form.enonce.trim(),
        difficulte: form.difficulte,
        verset_id: form.type_question === "verset" ? form.verset_id || null : null,
        ordre: Number(form.ordre),
      }
      if (question) {
        await adminUpdateQuestionBiblique(question.id, payload)
      } else {
        await adminAddQuestionBiblique(quizId, {
          ...payload,
          type_question: form.type_question,
        })
      }
      toast.success(question ? "Question mise a jour" : "Question ajoutee")
      onSaved()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Enregistrement impossible")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{question ? "Modifier la question" : "Nouvelle question"}</DialogTitle>
          <DialogDescription>
            Les questions de type verset doivent pointer vers un verset existant dans le module Agenda.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question-enonce">Enonce</Label>
            <Textarea
              id="question-enonce"
              required
              rows={4}
              value={form.enonce}
              onChange={(event) => setForm((current) => ({ ...current, enonce: event.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Type</Label>
              <Select
                value={form.type_question}
                disabled={!!question}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, type_question: value as TypeQuestionBiblique }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="libre">Libre</SelectItem>
                  <SelectItem value="verset">Verset</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulte</Label>
              <Select
                value={form.difficulte}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, difficulte: value as DifficulteBiblique }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facile">Facile</SelectItem>
                  <SelectItem value="moyen">Moyen</SelectItem>
                  <SelectItem value="difficile">Difficile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="question-order">Ordre</Label>
              <Input
                id="question-order"
                type="number"
                min={0}
                value={form.ordre}
                onChange={(event) => setForm((current) => ({ ...current, ordre: event.target.value }))}
              />
            </div>
          </div>

          {form.type_question === "verset" ? (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <Label>Version biblique</Label>
                  <Select
                    value={selectedTraduction}
                    onValueChange={(value) => {
                      setSelectedTraduction(value)
                      clearSelectedVerse()
                    }}
                  >
                    <SelectTrigger>
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
                      clearSelectedVerse()
                    }}
                    disabled={!selectedTraduction || books.length === 0}
                  >
                    <SelectTrigger>
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
                      clearSelectedVerse()
                    }}
                    disabled={!selectedBook || chapters.length === 0}
                  >
                    <SelectTrigger>
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
              <div>
                <Label>Verset</Label>
                <Select
                  value={form.verset_id}
                  onValueChange={(value) => setForm((current) => ({ ...current, verset_id: value }))}
                  disabled={verses.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={question?.verset_id ? "Verset actuel conserve" : "Choisir"} />
                  </SelectTrigger>
                  <SelectContent>
                    {verses.map((verse) => (
                      <SelectItem key={verse.id} value={verse.id}>
                        {verse.numero}. {verse.texte.slice(0, 90)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting || (form.type_question === "verset" && !form.verset_id)}
            >
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function OptionDialog({
  open,
  data,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  data: { question: QuestionBibliqueAdmin; option: OptionBibliqueAdmin | null } | null
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    texte: "",
    est_correcte: false,
    ordre: "1",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({
      texte: data?.option?.texte ?? "",
      est_correcte: data?.option?.est_correcte ?? false,
      ordre: String(data?.option?.ordre ?? (data?.question.options.length ?? 0) + 1),
    })
  }, [open, data])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!data) return
    setSubmitting(true)
    try {
      const payload = {
        texte: form.texte.trim(),
        est_correcte: form.est_correcte,
        ordre: Number(form.ordre),
      }
      if (data.option) await adminUpdateOptionBiblique(data.option.id, payload)
      else await adminAddOptionBiblique(data.question.id, payload)
      toast.success(data.option ? "Option mise a jour" : "Option ajoutee")
      onSaved()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Enregistrement impossible")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.option ? "Modifier l'option" : "Nouvelle option"}</DialogTitle>
          <DialogDescription>
            Le backend autorise la publication si une question contient exactement une bonne option.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="option-text">Texte</Label>
            <Textarea
              id="option-text"
              required
              rows={3}
              value={form.texte}
              onChange={(event) => setForm((current) => ({ ...current, texte: event.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="option-order">Ordre</Label>
              <Input
                id="option-order"
                type="number"
                min={0}
                value={form.ordre}
                onChange={(event) => setForm((current) => ({ ...current, ordre: event.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm">
              <Checkbox
                checked={form.est_correcte}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, est_correcte: checked === true }))
                }
              />
              Bonne reponse
            </label>
          </div>
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
