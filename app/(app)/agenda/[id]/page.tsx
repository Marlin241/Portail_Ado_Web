"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Heart, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getMeditation, likeMeditation, unlikeMeditation } from "@/lib/api/agenda"
import type { ApiError, Meditation } from "@/lib/api/types"
import { cn } from "@/lib/utils"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

export default function MeditationDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [meditation, setMeditation] = useState<Meditation | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    getMeditation(id)
      .then((data) => active && setMeditation(data))
      .catch((error) => {
        if (!active) return
        setMeditation(null)
        toast.error((error as ApiError).message ?? "Meditation introuvable")
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  async function toggleLike() {
    if (!meditation || liking) return
    setLiking(true)
    try {
      if (meditation.liked_by_me) {
        await unlikeMeditation(meditation.id)
        setMeditation((current) =>
          current
            ? { ...current, liked_by_me: false, likes_count: Math.max(0, current.likes_count - 1) }
            : current,
        )
      } else {
        setMeditation(await likeMeditation(meditation.id))
      }
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    } finally {
      setLiking(false)
    }
  }

  return (
    <div className="px-6 pb-8 pt-6">
      <Button asChild variant="ghost" className="-ml-3 mb-4">
        <Link href="/agenda">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Agenda
        </Link>
      </Button>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !meditation ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Cette meditation n'est pas disponible.
          </CardContent>
        </Card>
      ) : (
        <article className="mx-auto max-w-3xl">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{formatDate(meditation.date_resolue)}</Badge>
            {meditation.is_surcharge ? <Badge>Special</Badge> : null}
          </div>
          <h1 className="text-3xl font-bold leading-tight">{meditation.titre ?? "Meditation"}</h1>

          <blockquote className="mt-6 rounded-lg border-l-4 border-accent bg-muted/40 p-5">
            <p className="font-serif text-xl leading-relaxed">{meditation.verset.texte}</p>
            <footer className="mt-3 text-sm font-semibold text-muted-foreground">
              {meditation.verset.reference} - {meditation.verset.traduction_nom}
            </footer>
          </blockquote>

          <p className="mt-6 whitespace-pre-line text-base leading-8">{meditation.meditation_texte}</p>

          <div className="mt-8 border-t pt-5">
            <Button
              variant={meditation.liked_by_me ? "default" : "outline"}
              onClick={toggleLike}
              disabled={liking}
              className="gap-2"
            >
              <Heart className={cn("h-4 w-4", meditation.liked_by_me && "fill-current")} />
              {meditation.likes_count} Amen
            </Button>
          </div>
        </article>
      )}
    </div>
  )
}
