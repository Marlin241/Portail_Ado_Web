"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import {
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  adminCreateAdoMisEnAvant,
  adminCreateQuizBiblique,
  adminCreateThemeBiblique,
  adminDeleteAdoMisEnAvant,
  adminDeleteQuizBiblique,
  adminDeleteThemeBiblique,
  adminGetClassementBiblique,
  adminListAdosMisEnAvant,
  adminListQuizBibliques,
  adminListThemesBibliques,
  adminPublishQuizBiblique,
  adminUpdateQuizBiblique,
  adminUpdateThemeBiblique,
} from "@/lib/api/biblique"
import { adminListUsers } from "@/lib/api/admin-users"
import type { AdoMisEnAvant, ApiError, QuizBiblique, ThemeBiblique, User } from "@/lib/api/types"

const MONTHS = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
]

function monthLabel(month: number, year: number) {
  return `${MONTHS[month - 1] ?? month} ${year}`
}

function themeLabel(theme: ThemeBiblique | undefined | null) {
  return theme ? `${theme.titre} - ${monthLabel(theme.mois, theme.annee)}` : "Sans theme"
}

export default function AdminBibliquePage() {
  const now = new Date()
  const [themeDialog, setThemeDialog] = useState<ThemeBiblique | "new" | null>(null)
  const [quizDialog, setQuizDialog] = useState<QuizBiblique | "new" | null>(null)
  const [adoDialog, setAdoDialog] = useState(false)
  const [themeFilter, setThemeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [rankMonth, setRankMonth] = useState(String(now.getMonth() + 1))
  const [rankYear, setRankYear] = useState(String(now.getFullYear()))

  const { data: themes = [], mutate: mutateThemes } = useSWR(
    "admin-biblique-themes",
    adminListThemesBibliques,
  )
  const { data: quizzes = [], mutate: mutateQuizzes, isLoading: quizLoading } = useSWR(
    ["admin-biblique-quiz", themeFilter, statusFilter],
    () =>
      adminListQuizBibliques({
        theme_id: themeFilter === "all" ? undefined : themeFilter,
        est_publie:
          statusFilter === "all" ? undefined : statusFilter === "published" ? true : false,
      }),
  )
  const { data: ados = [], mutate: mutateAdos } = useSWR(
    "admin-biblique-ados",
    adminListAdosMisEnAvant,
  )
  const { data: users } = useSWR("admin-biblique-users", () =>
    adminListUsers({ role: "user", account_status: "active", limit: 200 }).then((page) => page.items),
  )
  const { data: ranking } = useSWR(["admin-biblique-ranking", rankMonth, rankYear], () =>
    adminGetClassementBiblique(Number(rankMonth), Number(rankYear)),
  )

  const themeById = useMemo(() => new Map(themes.map((theme) => [theme.id, theme])), [themes])
  const pendingDrafts = quizzes.filter((quiz) => !quiz.est_publie).length

  async function refreshAll() {
    await Promise.all([mutateThemes(), mutateQuizzes(), mutateAdos()])
    globalMutate("admin-stats")
    globalMutate("admin-audit-recent")
  }

  async function onDeleteTheme(theme: ThemeBiblique) {
    try {
      await adminDeleteThemeBiblique(theme.id)
      toast.success("Theme supprime")
      refreshAll()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  async function onDeleteQuiz(quiz: QuizBiblique) {
    try {
      await adminDeleteQuizBiblique(quiz.id)
      toast.success("Quiz supprime")
      refreshAll()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  async function onToggleQuiz(quiz: QuizBiblique) {
    try {
      await adminPublishQuizBiblique(quiz.id, !quiz.est_publie)
      toast.success(quiz.est_publie ? "Quiz de-publie" : "Quiz publie")
      refreshAll()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Publication impossible")
    }
  }

  async function onDeleteAdo(ado: AdoMisEnAvant) {
    try {
      await adminDeleteAdoMisEnAvant(ado.id)
      toast.success("Ado du mois retire")
      mutateAdos()
      globalMutate("admin-audit-recent")
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Sprint 4"
        title="Biblique etendu"
        description="Themes mensuels, quiz bibliques publies aux ados, ado mis en avant et classement."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setThemeDialog("new")}>
              <Plus className="mr-2 h-4 w-4" />
              Theme
            </Button>
            <Button onClick={() => setQuizDialog("new")}>
              <Plus className="mr-2 h-4 w-4" />
              Quiz
            </Button>
          </div>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70">
            <CardContent className="flex items-center gap-4 p-5">
              <BookOpenCheck className="h-9 w-9 text-primary" />
              <div>
                <p className="text-2xl font-semibold">{themes.length}</p>
                <p className="text-sm text-muted-foreground">Themes planifies</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardContent className="flex items-center gap-4 p-5">
              <CheckCircle2 className="h-9 w-9 text-primary" />
              <div>
                <p className="text-2xl font-semibold">
                  {quizzes.filter((quiz) => quiz.est_publie).length}/{quizzes.length}
                </p>
                <p className="text-sm text-muted-foreground">Quiz publies</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardContent className="flex items-center gap-4 p-5">
              <EyeOff className="h-9 w-9 text-primary" />
              <div>
                <p className="text-2xl font-semibold">{pendingDrafts}</p>
                <p className="text-sm text-muted-foreground">Brouillons a completer</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="font-serif text-lg">Themes mensuels</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setThemeDialog("new")}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {themes.map((theme) => (
                <div key={theme.id} className="rounded-lg border border-border/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge variant="secondary">{monthLabel(theme.mois, theme.annee)}</Badge>
                      <h2 className="mt-2 truncate font-serif text-lg font-semibold">{theme.titre}</h2>
                      {theme.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {theme.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setThemeDialog(theme)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDeleteTheme(theme)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {themes.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Aucun theme biblique n'est encore programme.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <CardTitle className="font-serif text-lg">Quiz bibliques</CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={themeFilter} onValueChange={setThemeFilter}>
                    <SelectTrigger className="w-full sm:w-52">
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les themes</SelectItem>
                      {themes.map((theme) => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.titre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="published">Publies</SelectItem>
                      <SelectItem value="draft">Brouillons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {quizLoading ? (
                <p className="text-sm text-muted-foreground">Chargement des quiz...</p>
              ) : quizzes.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Aucun quiz ne correspond a ces filtres.
                </p>
              ) : (
                quizzes.map((quiz) => (
                  <div key={quiz.id} className="rounded-lg border border-border/70 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={quiz.est_publie ? "secondary" : "outline"}>
                            {quiz.est_publie ? "Publie" : "Brouillon"}
                          </Badge>
                          <Badge variant="outline">{themeLabel(themeById.get(quiz.theme_id ?? ""))}</Badge>
                        </div>
                        <h2 className="mt-2 truncate font-serif text-lg font-semibold">{quiz.titre}</h2>
                        {quiz.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {quiz.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/biblique/${quiz.id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Editer
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setQuizDialog(quiz)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Infos
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onToggleQuiz(quiz)}>
                          {quiz.est_publie ? "De-publier" : "Publier"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onDeleteQuiz(quiz)}>
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="font-serif text-lg">Ado mis en avant</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setAdoDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {ados.map((ado) => (
                <div key={ado.id} className="rounded-lg border border-border/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">@{ado.username}</Badge>
                        <Badge variant="outline">{monthLabel(ado.mois, ado.annee)}</Badge>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {ado.description}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => onDeleteAdo(ado)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {ados.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Aucun ado du mois n'a encore ete selectionne.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <CardTitle className="font-serif text-lg">Classement biblique</CardTitle>
                <div className="flex gap-2">
                  <Select value={rankMonth} onValueChange={setRankMonth}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, index) => (
                        <SelectItem key={month} value={String(index + 1)}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="w-28"
                    type="number"
                    min={2020}
                    value={rankYear}
                    onChange={(event) => setRankYear(event.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span>{ranking?.theme_titre ?? "Aucun theme pour cette periode"}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">Rang</th>
                      <th className="py-2 pr-3">Ado</th>
                      <th className="py-2 pr-3">Score</th>
                      <th className="py-2">Quiz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(ranking?.entrees ?? []).map((entry) => (
                      <tr key={entry.user_id}>
                        <td className="py-2 pr-3 font-medium">#{entry.rang}</td>
                        <td className="py-2 pr-3">@{entry.username}</td>
                        <td className="py-2 pr-3">{entry.score_total}</td>
                        <td className="py-2">{entry.nb_quiz_completes}</td>
                      </tr>
                    ))}
                    {ranking && ranking.entrees.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          Aucun score pour cette periode.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <ThemeDialog
        open={!!themeDialog}
        theme={themeDialog === "new" ? null : themeDialog}
        onOpenChange={(open) => !open && setThemeDialog(null)}
        onSaved={() => {
          setThemeDialog(null)
          refreshAll()
        }}
      />
      <QuizDialog
        open={!!quizDialog}
        quiz={quizDialog === "new" ? null : quizDialog}
        themes={themes}
        onOpenChange={(open) => !open && setQuizDialog(null)}
        onSaved={() => {
          setQuizDialog(null)
          mutateQuizzes()
          globalMutate("admin-audit-recent")
        }}
      />
      <AdoDialog
        open={adoDialog}
        users={users ?? []}
        onOpenChange={setAdoDialog}
        onSaved={() => {
          setAdoDialog(false)
          mutateAdos()
          globalMutate("admin-audit-recent")
        }}
      />
    </>
  )
}

function ThemeDialog({
  open,
  theme,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  theme: ThemeBiblique | null
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const now = new Date()
  const [form, setForm] = useState({
    titre: "",
    description: "",
    mois: String(now.getMonth() + 1),
    annee: String(now.getFullYear()),
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (theme) {
      setForm({
        titre: theme.titre,
        description: theme.description ?? "",
        mois: String(theme.mois),
        annee: String(theme.annee),
      })
    } else {
      setForm({
        titre: "",
        description: "",
        mois: String(now.getMonth() + 1),
        annee: String(now.getFullYear()),
      })
    }
  }, [open, theme])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (theme) {
        await adminUpdateThemeBiblique(theme.id, {
          titre: form.titre.trim(),
          description: form.description.trim() || null,
        })
      } else {
        await adminCreateThemeBiblique({
          titre: form.titre.trim(),
          description: form.description.trim() || null,
          mois: Number(form.mois),
          annee: Number(form.annee),
        })
      }
      toast.success(theme ? "Theme mis a jour" : "Theme cree")
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
          <DialogTitle>{theme ? "Modifier le theme" : "Nouveau theme"}</DialogTitle>
          <DialogDescription>
            Le mois et l'annee associent le theme aux quiz et au classement biblique.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="theme-title">Titre</Label>
            <Input
              id="theme-title"
              required
              value={form.titre}
              onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="theme-description">Description</Label>
            <Textarea
              id="theme-description"
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Mois</Label>
              <Select
                value={form.mois}
                onValueChange={(value) => setForm((current) => ({ ...current, mois: value }))}
                disabled={!!theme}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={month} value={String(index + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="theme-year">Annee</Label>
              <Input
                id="theme-year"
                type="number"
                min={2020}
                required
                disabled={!!theme}
                value={form.annee}
                onChange={(event) => setForm((current) => ({ ...current, annee: event.target.value }))}
              />
            </div>
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

function QuizDialog({
  open,
  quiz,
  themes,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  quiz: QuizBiblique | null
  themes: ThemeBiblique[]
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({ titre: "", description: "", theme_id: "none" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({
      titre: quiz?.titre ?? "",
      description: quiz?.description ?? "",
      theme_id: quiz?.theme_id ?? "none",
    })
  }, [open, quiz])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        titre: form.titre.trim(),
        description: form.description.trim() || null,
        theme_id: form.theme_id === "none" ? null : form.theme_id,
      }
      if (quiz) await adminUpdateQuizBiblique(quiz.id, payload)
      else await adminCreateQuizBiblique(payload)
      toast.success(quiz ? "Quiz mis a jour" : "Quiz cree")
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
          <DialogTitle>{quiz ? "Modifier le quiz" : "Nouveau quiz"}</DialogTitle>
          <DialogDescription>
            Les questions et options se gerent ensuite dans l'editeur du quiz.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quiz-title">Titre</Label>
            <Input
              id="quiz-title"
              required
              value={form.titre}
              onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="quiz-description">Description</Label>
            <Textarea
              id="quiz-description"
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>
          <div>
            <Label>Theme</Label>
            <Select
              value={form.theme_id}
              onValueChange={(value) => setForm((current) => ({ ...current, theme_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sans theme</SelectItem>
                {themes.map((theme) => (
                  <SelectItem key={theme.id} value={theme.id}>
                    {themeLabel(theme)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

function AdoDialog({
  open,
  users,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  users: User[]
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const now = new Date()
  const [form, setForm] = useState({
    user_id: "",
    mois: String(now.getMonth() + 1),
    annee: String(now.getFullYear()),
    description: "",
  })
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await adminCreateAdoMisEnAvant({
        user_id: form.user_id,
        mois: Number(form.mois),
        annee: Number(form.annee),
        description: form.description.trim(),
      })
      toast.success("Ado du mois ajoute")
      setForm({
        user_id: "",
        mois: String(now.getMonth() + 1),
        annee: String(now.getFullYear()),
        description: "",
      })
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
          <DialogTitle>Ado mis en avant</DialogTitle>
          <DialogDescription>
            Selection visible dans le module biblique cote ado pour le mois choisi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Ado</Label>
            <Select
              value={form.user_id}
              onValueChange={(value) => setForm((current) => ({ ...current, user_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un ado" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} - @{user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" />
              Seuls les comptes utilisateur actifs sont proposes.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Mois</Label>
              <Select
                value={form.mois}
                onValueChange={(value) => setForm((current) => ({ ...current, mois: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={month} value={String(index + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ado-year">Annee</Label>
              <Input
                id="ado-year"
                type="number"
                min={2020}
                value={form.annee}
                onChange={(event) => setForm((current) => ({ ...current, annee: event.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="ado-description">Description</Label>
            <Textarea
              id="ado-description"
              required
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting || !form.user_id}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
