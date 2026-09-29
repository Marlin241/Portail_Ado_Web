"use client"

import { useEffect, useState, type FormEvent } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { CheckCircle2, MessageSquareWarning, MoreVertical, Send, Trash2, XCircle } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  adminAnswerQuestion,
  adminDeleteQuestion,
  adminListQuestions,
  adminRejectQuestion,
} from "@/lib/api/questions"
import type { AdminQuestionAnonyme, ApiError, StatutQuestion } from "@/lib/api/types"

const STATUS_LABEL: Record<StatutQuestion, string> = {
  pending: "En attente",
  answered: "Repondue",
  rejected: "Rejetee",
}

export default function AdminQuestionsPage() {
  const [status, setStatus] = useState<StatutQuestion | "all">("pending")
  const [answering, setAnswering] = useState<AdminQuestionAnonyme | null>(null)
  const [deleting, setDeleting] = useState<AdminQuestionAnonyme | null>(null)

  const { data, mutate } = useSWR(["admin-questions", status], () =>
    adminListQuestions({
      statut: status === "all" ? undefined : status,
      page: 1,
      per_page: 60,
    }),
  )
  const items = data?.items ?? []

  async function refresh() {
    await mutate()
    globalMutate("admin-audit-recent")
  }

  async function reject(question: AdminQuestionAnonyme) {
    try {
      await adminRejectQuestion(question.id)
      toast.success("Question rejetee")
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  async function remove(question: AdminQuestionAnonyme) {
    try {
      await adminDeleteQuestion(question.id)
      toast.success("Question supprimee")
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
        title="Questions anonymes"
        description="Moderez les questions envoyees par les jeunes et publiez les reponses validees."
        actions={
          <Select value={status} onValueChange={(value) => setStatus(value as StatutQuestion | "all")}>
            <SelectTrigger className="w-44 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="answered">Repondues</SelectItem>
              <SelectItem value="rejected">Rejetees</SelectItem>
              <SelectItem value="all">Toutes</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        {!data ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <MessageSquareWarning className="h-10 w-10 text-muted-foreground" />
              <h2 className="font-serif text-lg font-semibold">Aucune question</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Les nouvelles questions apparaitront ici pour moderation.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((question) => (
              <Card key={question.id} className="border-border/70">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge variant={question.statut === "pending" ? "default" : "outline"}>
                          {STATUS_LABEL[question.statut]}
                        </Badge>
                        <Badge variant="secondary">{question.auteur_alias || "Anonyme"}</Badge>
                      </div>
                      <p className="text-sm leading-6">{question.contenu}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions question">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setAnswering(question)}>
                          <Send className="mr-2 h-4 w-4" />
                          Repondre
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => reject(question)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeter
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(question)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {question.reponse ? (
                    <div className="rounded-lg bg-muted p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Reponse publiee
                      </div>
                      <p className="whitespace-pre-line text-sm leading-6">{question.reponse}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AnswerDialog
        open={!!answering}
        question={answering}
        onOpenChange={(value) => !value && setAnswering(null)}
        onSaved={() => {
          setAnswering(null)
          refresh()
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette question ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle ne sera plus visible dans l'espace utilisateur ni dans la moderation.
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

function AnswerDialog({
  open,
  question,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  question?: AdminQuestionAnonyme | null
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const [answer, setAnswer] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setAnswer(question?.reponse ?? "")
  }, [open, question])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!question || !answer.trim()) return
    setSubmitting(true)
    try {
      await adminAnswerQuestion(question.id, answer.trim())
      toast.success("Reponse publiee")
      onSaved()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Publication impossible")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Repondre a la question</DialogTitle>
          <DialogDescription>La reponse validee sera visible dans la rubrique Q&R publique.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm leading-6">{question?.contenu}</div>
          <Textarea
            required
            rows={6}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Rediger la reponse..."
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting || !answer.trim()}>
              {submitting ? "Publication..." : "Publier la reponse"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
