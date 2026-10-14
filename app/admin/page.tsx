"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent, type ReactNode } from "react"
import useSWR from "swr"
import { useModerationCounts } from "@/components/admin/use-moderation-counts"
import { reunionAujourdhui } from "@/lib/api/presences"
import { cn } from "@/lib/utils"

function dateDuJour(d: Date) {
  const texte = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

function phraseDuJour(jour: number) {
  if (jour === 6) return "C'est réunion aujourd'hui."
  if (jour === 5) return "Réunion demain."
  if (jour === 0) return "Belle semaine qui commence."
  return "Prochaine réunion samedi."
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

const ACTION_PLEINE =
  "inline-flex h-12 items-center rounded-[14px] bg-foreground px-5 text-[15px] font-semibold text-background transition-opacity hover:opacity-90"
const ACTION_CONTOUR =
  "inline-flex h-12 items-center rounded-[14px] border border-foreground px-5 text-[15px] font-semibold transition-colors hover:bg-foreground hover:text-background"

function ATraiter({ n }: { n: number }) {
  return n > 0 ? (
    <span className="shrink-0 rounded-full bg-[var(--k-violet-soft)] px-3 py-1.5 text-[13px] font-semibold text-[var(--k-violet-soft-ink)] md:px-3.5 md:py-2 md:text-sm">
      {n} à traiter
    </span>
  ) : (
    <span className="text-muted-foreground shrink-0 text-[13px] font-medium md:text-sm">Rien à traiter</span>
  )
}

function Ligne({
  titre,
  description,
  courte,
  href,
  fin,
  actions,
}: {
  titre: string
  description: string
  courte: string
  href: string
  fin?: ReactNode
  actions: ReactNode
}) {
  return (
    <div className="border-border border-b">
      {/* Téléphone : toute la ligne est un lien. */}
      <Link href={href} className="flex min-h-12 items-center justify-between gap-3 py-5 md:hidden">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-kairos-display text-[15px] font-bold">{titre}</span>
          <span className="text-muted-foreground text-[13px]">{courte}</span>
        </span>
        {fin ?? (
          <span className="text-muted-foreground text-xl" aria-hidden="true">
            ›
          </span>
        )}
      </Link>
      {/* PC : la ligne propose directement les actions. */}
      <div className="hidden items-center gap-6 py-6 md:flex">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Link href={href} className="font-kairos-display w-fit text-lg font-bold hover:underline">
            {titre}
          </Link>
          <span className="text-muted-foreground text-[15px]">{description}</span>
        </div>
        {fin}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">{actions}</div>
      </div>
    </div>
  )
}

export default function AdminAujourdhuiPage() {
  const router = useRouter()
  const [maintenant] = useState(() => new Date())
  const samedi = maintenant.getDay() === 6
  const [recherche, setRecherche] = useState("")
  const counts = useModerationCounts()
  const { data: reunion } = useSWR("presences-aujourdhui", reunionAujourdhui, { shouldRetryOnError: false })

  function chercher(e: FormEvent) {
    e.preventDefault()
    const q = recherche.trim()
    router.push(q ? `/admin/utilisateurs?q=${encodeURIComponent(q)}` : "/admin/utilisateurs")
  }

  const presents = reunion?.nb_presents ?? 0
  const action = samedi
    ? {
        href: "/admin/presences/scanner",
        titre: "Scanner les présences",
        detail:
          presents > 0
            ? `${presents} présent${presents > 1 ? "s" : ""} pour l'instant. Continue avec la caméra.`
            : "Ouvre la caméra et passe les cartes une par une.",
      }
    : {
        href: "/admin/presences",
        titre: "Voir les présences",
        detail: "Les réunions passées et la liste des présents.",
      }

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-5 pb-6 pt-14 md:gap-10 md:px-10 lg:px-[72px]">
      <header className="flex flex-col gap-2 md:gap-2.5">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em] md:text-sm">
          {dateDuJour(maintenant)}
        </p>
        <h1 className="font-kairos-display text-[28px] font-extrabold leading-[1.15] md:text-[44px] md:leading-[1.1]">
          {phraseDuJour(maintenant.getDay())}
        </h1>
      </header>

      <div className="flex flex-col gap-3">
        <Link
          href={action.href}
          data-testid="action-principale"
          className="group flex items-center justify-between gap-3 rounded-[24px] bg-[var(--k-lime)] p-[22px] text-[#0C0C12] outline-none transition-transform focus-visible:ring-4 focus-visible:ring-[var(--ring)] active:scale-[0.99] md:gap-6 md:rounded-[28px] md:px-8 md:py-7"
        >
          <span className="flex min-w-0 flex-col gap-0.5 md:gap-1">
            <span className="font-kairos-display text-lg font-bold md:text-[26px]">{action.titre}</span>
            <span className="text-sm md:text-base">{action.detail}</span>
          </span>
          <Arrow className="h-7 w-7 transition-transform group-hover:translate-x-1 md:h-10 md:w-10" />
        </Link>
        {!samedi ? (
          <Link
            href="/admin/presences/scanner"
            className="text-muted-foreground hover:text-foreground w-fit px-1 py-1 text-sm font-medium underline underline-offset-4"
          >
            Une réunion exceptionnelle ? Scanner maintenant
          </Link>
        ) : null}
      </div>

      <section aria-label="Autres tâches" className="border-border flex flex-col border-t">
        <Ligne
          titre="Ados"
          description="Trouver quelqu'un ou ajouter un nouveau compte."
          courte="Trouver ou ajouter un compte"
          href="/admin/utilisateurs"
          actions={
            <>
              <form onSubmit={chercher} role="search">
                <label className="sr-only" htmlFor="recherche-ado">
                  Rechercher un ado
                </label>
                <input
                  id="recherche-ado"
                  type="search"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher un ado"
                  className="border-border bg-card placeholder:text-muted-foreground focus-visible:ring-ring/40 h-12 w-[220px] rounded-[14px] border px-4 text-[15px] outline-none focus-visible:ring-4 xl:w-[260px]"
                />
              </form>
              <Link href="/admin/utilisateurs?nouveau=1" className={ACTION_PLEINE}>
                Ajouter un ado
              </Link>
            </>
          }
        />
        <Ligne
          titre="Contenus"
          description="Ce que les ados voient dans l'app : livres et podcasts."
          courte="Livres et podcasts de l'app"
          href="/admin/contenus"
          actions={
            <>
              <Link href="/admin/livres?nouveau=1" className={ACTION_CONTOUR}>
                Ajouter un livre
              </Link>
              <Link href="/admin/podcasts" className={ACTION_CONTOUR}>
                Gérer les podcasts
              </Link>
            </>
          }
        />
        <Ligne
          titre="Modération"
          description="Témoignages et questions envoyés par les ados."
          courte="Témoignages et questions"
          href="/admin/moderation"
          fin={counts.total !== undefined ? <ATraiter n={counts.total} /> : undefined}
          actions={
            <Link href="/admin/moderation" className={ACTION_PLEINE}>
              Ouvrir la file
            </Link>
          }
        />
      </section>
    </div>
  )
}
