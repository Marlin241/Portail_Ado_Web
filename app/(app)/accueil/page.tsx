"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar, Feather, HeartHandshake, MessageCircleQuestion, Sparkles, Trophy, Play } from "lucide-react"
import { BookCard } from "@/components/book-card"
import { PodcastCard } from "@/components/podcast-card"
import { ComingSoonCard } from "@/components/coming-soon-card"
import { useSession } from "@/lib/auth/session-provider"
import { listRecommendedBooks } from "@/lib/api/books"
import { listPodcasts } from "@/lib/api/podcasts"
import { listContinueListening, listContinueReading } from "@/lib/api/progression"
import { MOCK_BOOKS, MOCK_EPISODES, MOCK_PODCASTS } from "@/lib/api/mocks"
import type { AudioProgress, Book, BookProgress, Podcast } from "@/lib/api/types"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return "Bonne nuit"
  if (h < 12) return "Bonjour"
  if (h < 18) return "Bon après-midi"
  return "Bonsoir"
}

export default function AccueilPage() {
  const { user } = useSession()
  const [recommended, setRecommended] = useState<Book[]>([])
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [readingProgress, setReadingProgress] = useState<BookProgress[]>([])
  const [audioProgress, setAudioProgress] = useState<AudioProgress[]>([])

  useEffect(() => {
    let mounted = true
    Promise.all([
      listRecommendedBooks().catch(() => []),
      listPodcasts().catch(() => []),
      listContinueReading().catch(() => []),
      listContinueListening().catch(() => []),
    ]).then(([r, p, br, ar]) => {
      if (!mounted) return
      setRecommended(r)
      setPodcasts(p.slice(0, 6))
      setReadingProgress(br)
      setAudioProgress(ar)
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/85 px-6 pb-10 pt-6 text-primary-foreground">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />

        <div className="relative">
          <p className="text-xs font-medium text-primary-foreground/70">
            {getGreeting()}, {user?.first_name}
          </p>
          <h1 className="mt-1 text-pretty text-2xl font-bold leading-tight">
            Une nouvelle journée pour grandir en foi.
          </h1>

          <div className="mt-5 rounded-3xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground/80">
              <Feather className="h-3.5 w-3.5" />
              Pensée du jour
            </div>
            <p className="mt-2 text-pretty text-sm leading-relaxed">
              « Que personne ne méprise ta jeunesse, mais sois un modèle pour les fidèles. »
            </p>
            <p className="mt-1.5 text-xs text-primary-foreground/70">1 Timothée 4:12</p>
          </div>
        </div>
      </section>

      {/* Continuer la lecture */}
      {readingProgress.length > 0 && (
        <section className="mt-6 px-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Continuer la lecture</h2>
            <Link href="/bibliotheque" className="text-xs font-semibold text-primary">
              Voir tout
            </Link>
          </div>
          <div className="space-y-2">
            {readingProgress.slice(0, 2).map((p) => {
              const book = MOCK_BOOKS.find((b) => b.id === p.book_id)
              if (!book) return null
              return <BookCard key={p.book_id} book={book} variant="compact" progress={p.progress_percent} />
            })}
          </div>
        </section>
      )}

      {/* Continuer l'écoute */}
      {audioProgress.length > 0 && (
        <section className="mt-6 px-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Reprendre l&apos;écoute</h2>
            <Link href="/podcasts" className="text-xs font-semibold text-primary">
              Voir tout
            </Link>
          </div>
          <div className="space-y-2">
            {audioProgress.slice(0, 2).map((ap) => {
              const ep = MOCK_EPISODES.find((e) => e.id === ap.episode_id)
              if (!ep) return null
              const podcast = MOCK_PODCASTS.find((p) => p.id === ep.podcast_id)
              const pct =
                ap.duration_seconds && ap.duration_seconds > 0
                  ? Math.round((ap.position_seconds / ap.duration_seconds) * 100)
                  : 0
              return (
                <Link
                  key={ap.episode_id}
                  href={`/podcasts/episodes/${ap.episode_id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {podcast?.image_url ? (
                      <Image src={podcast.image_url || "/placeholder.svg"} alt="" fill sizes="56px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{ep.titre}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{podcast?.titre}</p>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Play className="ml-0.5 h-4 w-4" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Livres recommandés */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between px-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
            <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-accent-foreground" />
            Coups de cœur
          </h2>
          <Link href="/bibliotheque" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="phone-scroll flex gap-3 overflow-x-auto px-6 pb-2">
          {recommended.map((b) => (
            <BookCard key={b.id} book={b} variant="featured" />
          ))}
        </div>
      </section>

      {/* Podcasts à la une */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between px-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Podcasts à la une</h2>
          <Link href="/podcasts" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="phone-scroll flex gap-3 overflow-x-auto px-6 pb-2">
          {podcasts.map((p) => (
            <PodcastCard key={p.id} podcast={p} variant="featured" />
          ))}
        </div>
      </section>

      {/* Bientôt disponible */}
      <section className="mt-8 px-6 pb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">Bientôt</h2>
        <div className="space-y-2">
          <ComingSoonCard
            icon={Calendar}
            title="Agenda spirituel"
            description="Un verset et une méditation chaque jour de l'année."
          />
          <ComingSoonCard
            icon={HeartHandshake}
            title="Témoignages"
            description="Partage ton histoire, lis celle des autres, encouragez-vous."
          />
          <ComingSoonCard
            icon={Trophy}
            title="Défis de la semaine"
            description="Un défi concret chaque semaine, à relever seul ou en groupe."
          />
          <ComingSoonCard
            icon={MessageCircleQuestion}
            title="Questions anonymes"
            description="Pose tes questions en toute sécurité, obtiens des réponses."
          />
        </div>
      </section>
    </div>
  )
}
