"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, BookOpen, CalendarDays, Heart, Loader2, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getTodayMeditation, likeMeditation, listMeditationCalendar, unlikeMeditation } from "@/lib/api/agenda"
import type { ApiError, CalendrierEntry, Meditation } from "@/lib/api/types"
import { cn } from "@/lib/utils"

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value))
}

export default function AgendaPage() {
  const [today, setToday] = useState<Meditation | null>(null)
  const [entries, setEntries] = useState<CalendrierEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [meditation, calendar] = await Promise.all([
        getTodayMeditation(),
        listMeditationCalendar({ avant: todayIso(), limit: 12 }).catch(() => []),
      ])
      setToday(meditation)
      setEntries(calendar)
    } catch (error) {
      setToday(null)
      setEntries([])
      toast.error((error as ApiError).message ?? "Agenda indisponible")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleLike() {
    if (!today || liking) return
    setLiking(true)
    try {
      if (today.liked_by_me) {
        await unlikeMeditation(today.id)
        setToday((current) =>
          current
            ? { ...current, liked_by_me: false, likes_count: Math.max(0, current.likes_count - 1) }
            : current,
        )
      } else {
        const next = await likeMeditation(today.id)
        setToday(next)
      }
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    } finally {
      setLiking(false)
    }
  }

  return (
    <div className="px-6 pb-8 pt-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sprint 2</p>
        <h1 className="mt-1 text-2xl font-bold">Agenda spirituel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Une meditation quotidienne, le verset associe et l'historique recent.
        </p>
      </header>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !today ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarDays className="h-9 w-9 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Aucune meditation pour aujourd'hui</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                L'equipe admin peut la programmer depuis le panel.
              </p>
            </div>
            <Button variant="outline" onClick={load}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reessayer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card className="overflow-hidden border-border/70">
            <CardContent className="p-0">
              <div className="bg-primary px-5 py-5 text-primary-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-white/20 bg-white/15 text-primary-foreground">
                    {formatDate(today.date_resolue)}
                  </Badge>
                  {today.is_surcharge ? (
                    <Badge className="border-white/20 bg-white/15 text-primary-foreground">Special</Badge>
                  ) : null}
                </div>
                <h2 className="mt-4 text-2xl font-bold">{today.titre ?? "Meditation du jour"}</h2>
              </div>
              <div className="space-y-5 p-5">
                <blockquote className="rounded-lg border-l-4 border-accent bg-muted/40 p-4">
                  <p className="font-serif text-lg leading-relaxed">{today.verset.texte}</p>
                  <footer className="mt-2 text-sm font-semibold text-muted-foreground">
                    {today.verset.reference} - {today.verset.traduction_nom}
                  </footer>
                </blockquote>

                <p className="whitespace-pre-line text-sm leading-7 text-foreground">
                  {today.meditation_texte}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <Button
                    variant={today.liked_by_me ? "default" : "outline"}
                    onClick={toggleLike}
                    disabled={liking}
                    className="gap-2"
                  >
                    <Heart className={cn("h-4 w-4", today.liked_by_me && "fill-current")} />
                    {today.likes_count} Amen
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href={`/agenda/${today.id}`}>
                      Ouvrir
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wide">Calendrier recent</h2>
            </div>
            <div className="space-y-3">
              {entries.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Aucune autre meditation disponible.
                </p>
              ) : (
                entries.map((entry) => (
                  <Link
                    key={`${entry.date}-${entry.meditation.id}`}
                    href={`/agenda/${entry.meditation.id}`}
                    className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatDate(entry.date)}
                    </p>
                    <h3 className="mt-1 font-semibold">
                      {entry.meditation.titre ?? entry.meditation.verset.reference}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {entry.meditation.meditation_texte}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
