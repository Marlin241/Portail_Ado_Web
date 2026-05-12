"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  getQuizBiblique,
  listTentativesQuizBiblique,
  submitQuizBiblique,
} from "@/lib/api/biblique"
import type {
  ApiError,
  QuizBibliqueDetail,
  ResultatSoumissionBiblique,
  TentativeBiblique,
} from "@/lib/api/types"

export default function QuizBibliquePage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [quiz, setQuiz] = useState<QuizBibliqueDetail | null>(null)
  const [tentatives, setTentatives] = useState<TentativeBiblique[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ResultatSoumissionBiblique | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const resultByQuestion = useMemo(() => {
    const map = new Map<string, ResultatSoumissionBiblique["corrections"][number]>()
    result?.corrections.forEach((item) => map.set(item.question_id, item))
    return map
  }, [result])

  useEffect(() => {
    if (!id) return
    let active = true
    async function load() {
      setLoading(true)
      const [quizRes, attemptsRes] = await Promise.all([
        getQuizBiblique(id!).catch((error) => {
          toast.error((error as ApiError).message ?? "Quiz indisponible")
          return null
        }),
        listTentativesQuizBiblique(id!).catch(() => [] as TentativeBiblique[]),
      ])
      if (!active) return
      setQuiz(quizRes)
      setTentatives(attemptsRes)
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!quiz || !id || submitting) return
    if (quiz.questions.some((question) => !answers[question.id])) {
      toast.error("Reponds a toutes les questions avant de soumettre.")
      return
    }
    setSubmitting(true)
    try {
      const saved = await submitQuizBiblique(id, answers)
      setResult(saved)
      const attempts = await listTentativesQuizBiblique(id).catch(() => [] as TentativeBiblique[])
      setTentatives(attempts)
      toast.success(saved.est_nouveau_record ? "Nouveau record !" : "Quiz corrige")
    } catch (error) {
      toast.error((error as ApiError).message ?? "Soumission impossible")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-6 pb-8 pt-6">
      <Button asChild variant="ghost" className="-ml-3 mb-4">
        <Link href="/biblique">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Biblique
        </Link>
      </Button>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !quiz ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Quiz introuvable.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <form onSubmit={onSubmit} className="space-y-5">
            <header>
              <Badge variant="secondary">Quiz biblique</Badge>
              <h1 className="mt-3 text-2xl font-bold">{quiz.titre}</h1>
              {quiz.description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{quiz.description}</p>
              ) : null}
            </header>

            {quiz.questions.map((question, index) => {
              const correction = resultByQuestion.get(question.id)
              return (
                <Card key={question.id} className="border-border/70">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge variant="outline">
                          Question {index + 1} - {question.points} pts
                        </Badge>
                        <h2 className="mt-3 font-semibold">{question.enonce}</h2>
                      </div>
                      {correction ? (
                        correction.est_correct ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )
                      ) : null}
                    </div>

                    <RadioGroup
                      value={answers[question.id]}
                      onValueChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
                      disabled={!!result}
                    >
                      {question.options
                        .slice()
                        .sort((a, b) => a.ordre - b.ordre)
                        .map((option) => {
                          const isCorrect = correction?.option_correcte_id === option.id
                          const isChosen = correction?.option_choisie_id === option.id
                          return (
                            <div
                              key={option.id}
                              className={`flex items-center gap-3 rounded-lg border p-3 ${
                                correction && isCorrect
                                  ? "border-primary/50 bg-primary/10"
                                  : correction && isChosen
                                    ? "border-destructive/50 bg-destructive/10"
                                    : "border-border/70"
                              }`}
                            >
                              <RadioGroupItem id={option.id} value={option.id} />
                              <Label htmlFor={option.id} className="flex-1 cursor-pointer text-sm">
                                {option.texte}
                              </Label>
                            </div>
                          )
                        })}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )
            })}

            {!result ? (
              <Button type="submit" disabled={submitting} size="lg">
                {submitting ? "Correction..." : "Soumettre mes reponses"}
              </Button>
            ) : null}
          </form>

          <aside className="space-y-5">
            {result ? (
              <Card className="border-border/70">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resultat</p>
                  <p className="mt-2 text-3xl font-bold">
                    {result.score_obtenu}/{result.score_max}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {Math.round(result.pourcentage)}% de reussite
                  </p>
                  {result.est_nouveau_record ? <Badge className="mt-4">Nouveau record</Badge> : null}
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-border/70">
              <CardContent className="p-5">
                <h2 className="font-semibold">Mes tentatives</h2>
                <div className="mt-4 space-y-2">
                  {tentatives.slice(0, 6).map((attempt) => (
                    <div key={attempt.id} className="rounded-lg border border-border/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">
                          {attempt.score_obtenu}/{attempt.score_max}
                        </span>
                        {attempt.est_meilleure ? <Badge variant="secondary">Meilleur</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(attempt.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  ))}
                  {tentatives.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune tentative pour ce quiz.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  )
}
