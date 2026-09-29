"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  Calendar,
  Feather,
  HeartHandshake,
  HeartPulse,
  MessageCircleQuestion,
  Music2,
  Palette,
  Shirt,
  Sparkles,
  Trophy,
} from "lucide-react"
import { BookCard } from "@/components/book-card"
import { PodcastCard } from "@/components/podcast-card"
import { useSession } from "@/lib/auth/session-provider"
import { listRecommendedBooks } from "@/lib/api/books"
import { listPodcasts } from "@/lib/api/podcasts"
import type { Book, Podcast } from "@/lib/api/types"
import { cn } from "@/lib/utils"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return "Bonne nuit"
  if (h < 12) return "Bonjour"
  if (h < 18) return "Bon apres-midi"
  return "Bonsoir"
}

function SectionHeader({
  title,
  href,
  icon,
}: {
  title: string
  href: string
  icon?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-foreground">
        <span className="h-0.5 w-4 rounded-full bg-accent" aria-hidden />
        {icon && <span className="text-accent">{icon}</span>}
        {title}
      </h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
      >
        Voir tout <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}

function FeatureCard({
  href,
  icon: Icon,
  title,
  description,
  tone,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  tone: "primary" | "accent" | "soft" | "warm"
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
          tone === "primary" && "bg-primary text-primary-foreground",
          tone === "accent" && "bg-accent text-accent-foreground",
          tone === "soft" && "bg-secondary text-secondary-foreground",
          tone === "warm" && "bg-muted text-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export default function AccueilPage() {
  const { user } = useSession()
  const [recommended, setRecommended] = useState<Book[]>([])
  const [podcasts, setPodcasts] = useState<Podcast[]>([])

  useEffect(() => {
    let mounted = true

    async function loadData() {
      const [r, p] = await Promise.all([
        listRecommendedBooks().catch(() => [] as Book[]),
        listPodcasts().catch(() => [] as Podcast[]),
      ])

      if (!mounted) return
      setRecommended(r)
      setPodcasts(p.slice(0, 6))
    }

    loadData()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <section className="relative overflow-hidden px-6 pb-10 pt-7">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.32 0.14 222) 0%, oklch(0.38 0.13 218) 45%, oklch(0.52 0.16 192) 75%, oklch(0.62 0.18 68) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 1) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 1) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative space-y-5">
          <div className="animate-fade-up">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/55">
              {getGreeting()}, {user?.first_name}
            </p>
            <h1 className="mt-2 font-display text-[1.9rem] font-bold leading-[1.15] text-white text-pretty">
              Une nouvelle journee<br />pour grandir en foi.
            </h1>
          </div>

          <div className="animate-fade-up delay-150 rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-2.5 flex items-center gap-1.5">
              <Feather className="h-3 w-3 text-accent" aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/55">
                Pensee du jour
              </span>
            </div>
            <p className="font-display text-[1.05rem] font-semibold italic leading-snug text-white">
              "Que personne ne meprise ta jeunesse, mais sois un modele pour les fideles."
            </p>
            <p className="mt-2 text-[11px] font-medium text-white/50">1 Timothee 4:12</p>
          </div>
        </div>
      </section>

      <section className="mt-8 px-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-0.5 w-4 rounded-full bg-accent" aria-hidden />
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-foreground">Grandir aujourd'hui</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FeatureCard
            href="/agenda"
            icon={Calendar}
            title="Agenda spirituel"
            description="Lis le verset et la meditation du jour."
            tone="primary"
          />
          <FeatureCard
            href="/quiz"
            icon={Brain}
            title="Quiz personnalite"
            description="Decouvre ton profil et un personnage biblique associe."
            tone="accent"
          />
          <FeatureCard
            href="/biblique"
            icon={BookOpenCheck}
            title="Biblique etendu"
            description="Theme du mois, quiz bibliques et classement."
            tone="soft"
          />
          <FeatureCard
            href="/musique"
            icon={Music2}
            title="Musique gospel"
            description="Ecoute les playlists validees et propose un morceau."
            tone="warm"
          />
          <FeatureCard
            href="/creativite"
            icon={Palette}
            title="Creativite"
            description="Partage tes creations et decouvre les talents."
            tone="primary"
          />
          <FeatureCard
            href="/vie-emotionnelle"
            icon={HeartPulse}
            title="Vie emotionnelle"
            description="Articles, videos et temoignages pour avancer."
            tone="accent"
          />
          <FeatureCard
            href="/questions"
            icon={MessageCircleQuestion}
            title="Questions anonymes"
            description="Pose une question et consulte les reponses validees."
            tone="warm"
          />
          <FeatureCard
            href="/bien-etre"
            icon={Shirt}
            title="Bien-etre"
            description="Conseils mode, sante et equilibre pour ton quotidien."
            tone="primary"
          />
          <FeatureCard
            href="/temoignages"
            icon={HeartHandshake}
            title="Temoignages"
            description="Partage ton histoire et lis celles deja validees."
            tone="accent"
          />
          <FeatureCard
            href="/defis"
            icon={Trophy}
            title="Defis"
            description="Releve un defi concret chaque semaine."
            tone="soft"
          />
          <FeatureCard
            href="/exploits"
            icon={Sparkles}
            title="Exploits"
            description="Celebre tes reussites et celles des autres jeunes."
            tone="warm"
          />
        </div>
      </section>

      <section className="mt-8">
        <div className="px-6">
          <SectionHeader
            title="Coups de coeur"
            href="/bibliotheque"
            icon={<Sparkles className="h-3.5 w-3.5" aria-hidden />}
          />
        </div>
        <div className="phone-scroll flex gap-3 overflow-x-auto px-6 pb-2">
          {recommended.map((b) => (
            <BookCard key={b.id} book={b} variant="featured" />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="px-6">
          <SectionHeader title="Podcasts a la une" href="/podcasts" />
        </div>
        <div className="phone-scroll flex gap-3 overflow-x-auto px-6 pb-2">
          {podcasts.map((p) => (
            <PodcastCard key={p.id} podcast={p} variant="featured" />
          ))}
        </div>
      </section>

      <div className="h-8" />
    </div>
  )
}
