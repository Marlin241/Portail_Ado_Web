"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import useSWR, { mutate as globalMutate } from "swr"
import { Brain, ChevronRight, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  adminCreateQuiz,
  adminDeleteQuiz,
  adminListQuiz,
  adminToggleQuizPublication,
  adminUpdateQuiz,
} from "@/lib/api/quiz"
import type { AdminQuizListItem, AdminQuizPayload, ApiError } from "@/lib/api/types"

function emptyForm(): AdminQuizPayload {
  return { titre: "", description: "" }
}

export default function AdminQuizPage() {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminQuizListItem | null>(null)
  const [deleting, setDeleting] = useState<AdminQuizListItem | null>(null)

  const { data, mutate } = useSWR("admin-quiz", () => adminListQuiz({ limit: 80, offset: 0 }))
  const items = data?.items ?? []

  async function refresh() {
    await mutate()
    globalMutate("admin-audit-recent")
  }

  async function togglePublication(quiz: AdminQuizListItem) {
    try {
      await adminToggleQuizPublication(quiz.id)
      toast.success(quiz.publie ? "Quiz masque" : "Quiz publie")
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  async function onDelete(quiz: AdminQuizListItem) {
    try {
      await adminDeleteQuiz(quiz.id)
      toast.success("Quiz supprime")
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
        title="Quiz personnalite"
        description="Creez les quiz, puis gerez les profils et les questions dans le detail."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau quiz
          </Button>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        {!data ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Brain className="h-10 w-10 text-muted-foreground" />
              <h2 className="font-serif text-lg font-semibold">Aucun quiz</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Creez un quiz, ajoutez ses profils, puis ses questions et options.
              </p>
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Creer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((quiz) => (
              <Card key={quiz.id} className="border-border/70">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge variant={quiz.publie ? "default" : "outline"}>
                        {quiz.publie ? "Publie" : "Brouillon"}
                      </Badge>
                      <h2 className="mt-2 truncate font-serif text-lg font-semibold">{quiz.titre}</h2>
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{quiz.description}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions quiz">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(quiz)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublication(quiz)}>
                          {quiz.publie ? "Masquer" : "Publier"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(quiz)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 flex justify-end border-t pt-3">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/quiz/${quiz.id}`}>
                        Profils et questions
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

      <QuizDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => {
          setCreating(false)
          refresh()
        }}
      />
      <QuizDialog
        open={!!editing}
        quiz={editing}
        onOpenChange={(value) => !value && setEditing(null)}
        onSaved={() => {
          setEditing(null)
          refresh()
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce quiz ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les profils, questions et resultats lies seront supprimes selon les regles du backend.
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

function QuizDialog({
  open,
  quiz,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  quiz?: AdminQuizListItem | null
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const isEdit = !!quiz
  const [form, setForm] = useState<AdminQuizPayload>(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(quiz ? { titre: quiz.titre, description: quiz.description } : emptyForm())
  }, [open, quiz])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (isEdit && quiz) await adminUpdateQuiz(quiz.id, form)
      else await adminCreateQuiz(form)
      toast.success(isEdit ? "Quiz mis a jour" : "Quiz cree")
      onSaved()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Operation impossible")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le quiz" : "Nouveau quiz"}</DialogTitle>
          <DialogDescription>Le quiz reste brouillon tant qu'il n'est pas publie.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="qt">Titre</Label>
            <Input
              id="qt"
              required
              value={form.titre}
              onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="qd">Description</Label>
            <Textarea
              id="qd"
              required
              rows={4}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
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
