"use client"

import { useEffect, useState, type FormEvent } from "react"
import { HelpCircle, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { listMyQuestions, listPublicQuestions, submitQuestion } from "@/lib/api/questions"
import type { ApiError, QuestionAnonyme, StatutQuestion } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<StatutQuestion, string> = {
  pending: "En moderation",
  answered: "Repondue",
  rejected: "Rejetee",
}

export default function QuestionsPage() {
  const [publicQuestions, setPublicQuestions] = useState<QuestionAnonyme[]>([])
  const [myQuestions, setMyQuestions] = useState<QuestionAnonyme[]>([])
  const [activeTab, setActiveTab] = useState<"public" | "mine">("public")
  const [alias, setAlias] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const [publicRes, mineRes] = await Promise.all([
      listPublicQuestions({ page: 1, per_page: 30 }).catch(() => ({ items: [] as QuestionAnonyme[] })),
      listMyQuestions({ page: 1, per_page: 30 }).catch(() => ({ items: [] as QuestionAnonyme[] })),
    ])
    setPublicQuestions(publicRes.items)
    setMyQuestions(mineRes.items)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (content.trim().length < 10 || submitting) return
    setSubmitting(true)
    try {
      await submitQuestion({
        auteur_alias: alias.trim() || null,
        contenu: content.trim(),
      })
      toast.success("Question envoyee en moderation")
      setAlias("")
      setContent("")
      setActiveTab("mine")
      await load()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Envoi impossible")
    } finally {
      setSubmitting(false)
    }
  }

  const questions = activeTab === "public" ? publicQuestions : myQuestions

  return (
    <div className="px-6 pb-8 pt-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Questions anonymes</p>
        <h1 className="mt-1 text-2xl font-bold">Poser une question</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envoie une question avec un alias. Les reponses validees sont visibles dans la rubrique publique.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70">
          <CardContent className="p-5">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="qa">Alias public (optionnel)</Label>
                <Input
                  id="qa"
                  value={alias}
                  onChange={(event) => setAlias(event.target.value)}
                  placeholder="Ex: Ado curieux"
                  maxLength={80}
                />
              </div>
              <div>
                <Label htmlFor="qc">Question</Label>
                <Textarea
                  id="qc"
                  required
                  rows={7}
                  minLength={10}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Ecris ta question ici..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Elle sera lue par l'equipe avant publication de la reponse.
                </p>
              </div>
              <Button type="submit" disabled={content.trim().length < 10 || submitting} className="w-full">
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Envoi..." : "Envoyer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <section>
          <div className="mb-4 flex rounded-lg border bg-card p-1">
            <button
              type="button"
              onClick={() => setActiveTab("public")}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeTab === "public" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              Q&R publiques
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mine")}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeTab === "mine" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              Mes questions
            </button>
          </div>

          {loading ? (
            <div className="flex h-56 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : questions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <HelpCircle className="h-9 w-9 text-muted-foreground" />
                <h2 className="font-semibold">Aucune question</h2>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "public"
                    ? "Les questions repondues apparaitront ici."
                    : "Tes questions envoyees seront listees ici."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {questions.map((question) => (
                <QuestionCard key={question.id} question={question} showStatus={activeTab === "mine"} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function QuestionCard({
  question,
  showStatus,
}: {
  question: QuestionAnonyme
  showStatus: boolean
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {question.auteur_alias || "Anonyme"}
          </p>
          {showStatus ? <Badge variant="outline">{STATUS_LABEL[question.statut]}</Badge> : null}
        </div>
        <p className="text-sm leading-6">{question.contenu}</p>
        {question.reponse ? (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reponse</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6">{question.reponse}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
