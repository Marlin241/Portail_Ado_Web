"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Brain, CheckCircle2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { listQuiz } from "@/lib/api/quiz"
import type { QuizListItem } from "@/lib/api/types"

export default function QuizPage() {
  const [items, setItems] = useState<QuizListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    listQuiz()
      .then((data) => active && setItems(data))
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="px-6 pb-8 pt-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Decouverte de soi</p>
        <h1 className="mt-1 text-2xl font-bold">Quiz personnalite</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reponds aux questions et decouvre un profil associe a un personnage biblique.
        </p>
      </header>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Brain className="h-9 w-9 text-muted-foreground" />
            <h2 className="font-semibold">Aucun quiz publie</h2>
            <p className="text-sm text-muted-foreground">
              Les quiz apparaissent ici quand l'equipe les publie.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((quiz) => (
            <Card key={quiz.id} className="border-border/70">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{quiz.titre}</h2>
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{quiz.description}</p>
                  </div>
                  {quiz.deja_fait ? (
                    <Badge variant="secondary" className="shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      Fait
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-auto">
                  <Button asChild>
                    <Link href={`/quiz/${quiz.id}`}>
                      {quiz.deja_fait ? "Voir ou refaire" : "Commencer"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
