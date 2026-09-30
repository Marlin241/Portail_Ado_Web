"use client"

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { ArrowLeft, Brain, ImagePlus, Pencil, Plus, Trash2, Upload } from "lucide-react"
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
  adminCreateQuizProfil,
  adminCreateQuizQuestion,
  adminDeleteQuizProfil,
  adminDeleteQuizQuestion,
  adminGetQuiz,
  adminUpdateQuizProfil,
  adminUpdateQuizQuestion,
  adminUploadQuizProfilImage,
} from "@/lib/api/quiz"
import type {
  AdminQuizOptionPayload,
  AdminQuizProfilPayload,
  AdminQuizQuestionPayload,
  ApiError,
  QuizProfil,
  QuizQuestionAdmin,
} from "@/lib/api/types"

function emptyProfileForm(): AdminQuizProfilPayload {
  return {
    nom: "",
    description: "",
    personnage_biblique_nom: "",
    personnage_biblique_description: "",
    conseils: "",
    ordre: 1,
  }
}

function emptyQuestionForm(): AdminQuizQuestionPayload {
  return {
    texte: "",
    ordre: 1,
    options: [
      { texte: "", profil_id: "", ordre: 1 },
      { texte: "", profil_id: "", ordre: 2 },
    ],
  }
}

export default function AdminQuizDetailPage() {
  const params = useParams<{ id: string }>()
  const quizId = params?.id
  const [profileDialog, setProfileDialog] = useState(false)
  const [questionDialog, setQuestionDialog] = useState(false)
  const [editingProfile, setEditingProfile] = useState<QuizProfil | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestionAdmin | null>(null)

  const { data: quiz, mutate } = useSWR(quizId ? ["admin-quiz-detail", quizId] : null, () =>
    adminGetQuiz(quizId),
  )

  const profiles = useMemo(
    () => [...(quiz?.profils ?? [])].sort((a, b) => a.ordre - b.ordre),
    [quiz?.profils],
  )
  const questions = useMemo(
    () => [...(quiz?.questions ?? [])].sort((a, b) => a.ordre - b.ordre),
    [quiz?.questions],
  )

  async function deleteProfile(profile: QuizProfil) {
    try {
      await adminDeleteQuizProfil(profile.quiz_id, profile.id)
      toast.success("Profil supprime")
      mutate()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  async function deleteQuestion(question: QuizQuestionAdmin) {
    if (!quizId) return
    try {
      await adminDeleteQuizQuestion(quizId, question.id)
      toast.success("Question supprimee")
      mutate()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Quiz"
        title={quiz?.titre ?? "Detail du quiz"}
        description={quiz?.description ?? "Chargement des profils et questions..."}
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/quiz">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 px-6 py-6 md:px-10 md:py-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold">Profils</h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingProfile(null)
                setProfileDialog(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Profil
            </Button>
          </div>

          {!quiz ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : profiles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Ajoutez au moins un profil avant de creer des options de reponse.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <Card key={profile.id} className="border-border/70">
                  <CardContent className="grid gap-4 p-4 sm:grid-cols-[80px_1fr_auto]">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      {profile.personnage_biblique_image_url ? (
                        <img
                          src={profile.personnage_biblique_image_url}
                          alt={profile.personnage_biblique_nom}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Brain className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Badge variant="secondary">Ordre {profile.ordre}</Badge>
                      <h3 className="mt-2 font-semibold">{profile.nom}</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{profile.description}</p>
                      <p className="mt-1 text-xs font-medium">{profile.personnage_biblique_nom}</p>
                    </div>
                    <div className="flex items-start gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingProfile(profile)
                          setProfileDialog(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteProfile(profile)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold">Questions</h2>
            <Button
              size="sm"
              disabled={profiles.length === 0}
              onClick={() => {
                setEditingQuestion(null)
                setQuestionDialog(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Question
            </Button>
          </div>

          {!quiz ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : questions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Aucune question pour le moment.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <Card key={question.id} className="border-border/70">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge variant="secondary">Question {question.ordre}</Badge>
                        <CardTitle className="mt-2 text-base">{question.texte}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingQuestion(question)
                            setQuestionDialog(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteQuestion(question)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {question.options
                      .slice()
                      .sort((a, b) => a.ordre - b.ordre)
                      .map((option) => (
                        <div key={option.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
                          <p>{option.texte}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Profil cible: {profiles.find((profile) => profile.id === option.profil_id)?.nom ?? "-"}
                          </p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {quizId ? (
        <>
          <ProfileDialog
            open={profileDialog}
            quizId={quizId}
            profile={editingProfile}
            onOpenChange={setProfileDialog}
            onSaved={() => {
              setProfileDialog(false)
              setEditingProfile(null)
              mutate()
            }}
          />
          <QuestionDialog
            open={questionDialog}
            quizId={quizId}
            profiles={profiles}
            question={editingQuestion}
            onOpenChange={setQuestionDialog}
            onSaved={() => {
              setQuestionDialog(false)
              setEditingQuestion(null)
              mutate()
            }}
          />
        </>
      ) : null}
    </>
  )
}

function ProfileDialog({
  open,
  quizId,
  profile,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  quizId: string
  profile?: QuizProfil | null
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const isEdit = !!profile
  const [form, setForm] = useState<AdminQuizProfilPayload>(emptyProfileForm())
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setFile(null)
    setFileName("")
    setForm(
      profile
        ? {
            nom: profile.nom,
            description: profile.description,
            personnage_biblique_nom: profile.personnage_biblique_nom,
            personnage_biblique_description: profile.personnage_biblique_description,
            conseils: profile.conseils,
            ordre: profile.ordre,
          }
        : emptyProfileForm(),
    )
  }, [open, profile])

  function rememberFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0]
    if (!next) return
    setFile(next)
    setFileName(next.name)
    event.target.value = ""
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const saved = isEdit && profile
        ? await adminUpdateQuizProfil(quizId, profile.id, form)
        : await adminCreateQuizProfil(quizId, form)
      if (file) await adminUploadQuizProfilImage(quizId, saved.id, file)
      toast.success(isEdit ? "Profil mis a jour" : "Profil cree")
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
          <DialogTitle>{isEdit ? "Modifier le profil" : "Nouveau profil"}</DialogTitle>
          <DialogDescription>Ce profil pourra etre associe aux options de reponse.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <div>
              <Label htmlFor="pn">Nom du profil</Label>
              <Input
                id="pn"
                required
                value={form.nom}
                onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="po">Ordre</Label>
              <Input
                id="po"
                type="number"
                min={1}
                value={form.ordre}
                onChange={(event) => setForm((current) => ({ ...current, ordre: Number(event.target.value) }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="pd">Description</Label>
            <Textarea
              id="pd"
              required
              rows={3}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="pbn">Personnage biblique</Label>
            <Input
              id="pbn"
              required
              value={form.personnage_biblique_nom}
              onChange={(event) =>
                setForm((current) => ({ ...current, personnage_biblique_nom: event.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="pbd">Description du personnage</Label>
            <Textarea
              id="pbd"
              required
              rows={3}
              value={form.personnage_biblique_description}
              onChange={(event) =>
                setForm((current) => ({ ...current, personnage_biblique_description: event.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="pc">Conseils</Label>
            <Textarea
              id="pc"
              required
              rows={4}
              value={form.conseils}
              onChange={(event) => setForm((current) => ({ ...current, conseils: event.target.value }))}
            />
          </div>
          <label className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-3 text-sm">
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{fileName || "Image du personnage"}</span>
            <Upload className="h-4 w-4 text-muted-foreground" />
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={rememberFile} />
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

function QuestionDialog({
  open,
  quizId,
  profiles,
  question,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  quizId: string
  profiles: QuizProfil[]
  question?: QuizQuestionAdmin | null
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const isEdit = !!question
  const [form, setForm] = useState<AdminQuizQuestionPayload>(emptyQuestionForm())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      question
        ? {
            texte: question.texte,
            ordre: question.ordre,
            options: question.options
              .slice()
              .sort((a, b) => a.ordre - b.ordre)
              .map((option) => ({
                texte: option.texte,
                profil_id: option.profil_id,
                ordre: option.ordre,
              })),
          }
        : emptyQuestionForm(),
    )
  }, [open, question])

  function updateOption(index: number, patch: Partial<AdminQuizOptionPayload>) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    }))
  }

  const invalid =
    !form.texte.trim() ||
    form.options.length === 0 ||
    form.options.some((option) => !option.texte.trim() || !option.profil_id)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (invalid) return
    setSubmitting(true)
    try {
      const payload: AdminQuizQuestionPayload = {
        ...form,
        texte: form.texte.trim(),
        options: form.options.map((option, index) => ({
          ...option,
          texte: option.texte.trim(),
          ordre: option.ordre || index + 1,
        })),
      }
      if (isEdit && question) await adminUpdateQuizQuestion(quizId, question.id, payload)
      else await adminCreateQuizQuestion(quizId, payload)
      toast.success(isEdit ? "Question mise a jour" : "Question creee")
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
          <DialogTitle>{isEdit ? "Modifier la question" : "Nouvelle question"}</DialogTitle>
          <DialogDescription>Chaque option pointe vers un profil pour calculer le resultat.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <div>
              <Label htmlFor="qtext">Question</Label>
              <Input
                id="qtext"
                required
                value={form.texte}
                onChange={(event) => setForm((current) => ({ ...current, texte: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="qorder">Ordre</Label>
              <Input
                id="qorder"
                type="number"
                min={1}
                value={form.ordre}
                onChange={(event) => setForm((current) => ({ ...current, ordre: Number(event.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    options: [
                      ...current.options,
                      { texte: "", profil_id: profiles[0]?.id ?? "", ordre: current.options.length + 1 },
                    ],
                  }))
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Option
              </Button>
            </div>
            {form.options.map((option, index) => (
              <div key={index} className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_180px_44px]">
                <Input
                  required
                  value={option.texte}
                  placeholder={`Option ${index + 1}`}
                  onChange={(event) => updateOption(index, { texte: event.target.value, ordre: index + 1 })}
                />
                <Select value={option.profil_id} onValueChange={(value) => updateOption(index, { profil_id: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Profil" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      options: current.options.filter((_, optionIndex) => optionIndex !== index),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={invalid || submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
