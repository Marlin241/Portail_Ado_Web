"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMyQuizResult, getQuiz, submitQuiz } from "@/lib/api/quiz"
import type { ApiError, QuizDetail, QuizResultat } from "@/lib/api/types"
import { cn } from "@/lib/utils"

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [quiz, setQuiz] = useState<QuizDetail | null>(null)
  const [result, setResult] = useState<QuizResultat | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    Promise.all([getQuiz(id), getMyQuizResult(id).catch(() => null)])
      .then(([quizData, resultData]) => {
        if (!active) return
        setQuiz(quizData)
        setResult(resultData)
      })
      .catch((error) => {
        if (!active) return
        setQuiz(null)
        toast.error((error as ApiError).message ?? "Quiz indisponible")
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  const allAnswered = useMemo(() => {
    if (!quiz || quiz.questions.length === 0) return false
    return quiz.questions.every((question) => Boolean(answers[question.id]))
  }, [answers, quiz])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!quiz || !allAnswered || submitting) return
    setSubmitting(true)
    try {
      const next = await submitQuiz(
        quiz.id,
        quiz.questions.map((question) => ({
          question_id: question.id,
          option_id: answers[question.id],
        })),
      )
      setResult(next)
      toast.success("Quiz soumis")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      toast.error((error as ApiError).message ?? "Soumission impossible")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-6 pb-8 pt-6">
      <Button asChild variant="ghost" className="-ml-3 mb-4">
        <Link href="/quiz">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quiz
        </Link>
      </Button>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !quiz ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Ce quiz n'est pas disponible.
          </CardContent>
        </Card>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {quiz.questions.length} question{quiz.questions.length > 1 ? "s" : ""}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{quiz.titre}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{quiz.description}</p>
          </header>

          {result ? <ResultCard result={result} /> : null}

          <form onSubmit={onSubmit} className="space-y-4">
            {quiz.questions.map((question, index) => (
              <Card key={question.id} className="border-border/70">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <CardTitle className="text-base">{question.texte}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {question.options.map((option) => {
                    const checked = answers[question.id] === option.id
                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: option.id,
                          }))
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        <span>{option.texte}</span>
                        {checked ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
                      </button>
                    )
                  })}
                </CardContent>
              </Card>
            ))}

            <div className="sticky bottom-20 z-10 rounded-lg border bg-background/95 p-3 backdrop-blur md:bottom-4">
              <Button type="submit" disabled={!allAnswered || submitting} className="w-full">
                {submitting ? "Analyse en cours..." : result ? "Recalculer mon profil" : "Voir mon profil"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function ResultCard({ result }: { result: QuizResultat }) {
  return (
    <Card className="overflow-hidden border-primary/30 bg-primary/5">
      <CardContent className="grid gap-4 p-5 sm:grid-cols-[112px_1fr]">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
          {result.profil.personnage_biblique_image_url ? (
            // The backend returns a protected/local URL already normalized by the API mapper.
            <img
              src={result.profil.personnage_biblique_image_url}
              alt={result.profil.personnage_biblique_nom}
              className="h-full w-full object-cover"
            />
          ) : (
            <Sparkles className="h-8 w-8 text-primary" />
          )}
        </div>
        <div>
          <Badge className="mb-2">Mon resultat</Badge>
          <h2 className="text-xl font-bold">{result.profil.nom}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{result.profil.description}</p>
          <div className="mt-4 rounded-lg bg-background p-4">
            <p className="text-sm font-semibold">{result.profil.personnage_biblique_nom}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.profil.personnage_biblique_description}
            </p>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-6">{result.profil.conseils}</p>
        </div>
      </CardContent>
    </Card>
  )
}
