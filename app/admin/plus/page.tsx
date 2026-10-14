"use client"

import Link from "next/link"
import useSWR from "swr"
import { adminListModerationPending } from "@/lib/api/admin-misc"
import type { ModerationPendingType } from "@/lib/api/types"
import { useSession } from "@/lib/auth/session-provider"

interface Section {
  href: string
  titre: string
  description: string
  attente?: ModerationPendingType
}

const GROUPES: { titre: string; sections: Section[] }[] = [
  {
    titre: "Contenus de l'app",
    sections: [
      { href: "/admin/agenda", titre: "Agenda", description: "Les méditations du jour, programmées à l'avance." },
      { href: "/admin/biblique", titre: "Biblique étendu", description: "Thème du mois, quiz bibliques, ado mis en avant et classement." },
      { href: "/admin/quiz", titre: "Quiz", description: "Les quiz de personnalité, leurs profils et leurs questions." },
      { href: "/admin/musique", titre: "Musique gospel", description: "Playlists, artistes, morceaux et propositions des ados.", attente: "proposition_musique" },
      { href: "/admin/vie-emotionnelle", titre: "Vie émotionnelle", description: "Articles, vidéos et témoignages sur les relations." },
      { href: "/admin/bien-etre", titre: "Bien-être", description: "Articles mode, santé et bien-être." },
      { href: "/admin/defis", titre: "Défis", description: "Le défi de chaque semaine, planifié à l'avance." },
    ],
  },
  {
    titre: "Ce que les ados envoient",
    sections: [
      { href: "/admin/creativite", titre: "Créativité", description: "Les créations à valider et le talent du mois.", attente: "creation" },
      { href: "/admin/exploits", titre: "Exploits", description: "Les exploits à valider et leurs catégories.", attente: "exploit" },
      { href: "/admin/temoignages", titre: "Tous les témoignages", description: "L'historique complet : approuvés, refusés, en attente." },
      { href: "/admin/questions", titre: "Toutes les questions", description: "L'historique complet, avec les réponses publiées." },
    ],
  },
  {
    titre: "Suivi",
    sections: [
      { href: "/admin/audit", titre: "Journal d'audit", description: "Qui a fait quoi dans l'admin, et quand." },
    ],
  },
]

function useEnAttente(type: ModerationPendingType | undefined) {
  const { data } = useSWR(
    type ? ["admin-plus-attente", type] : null,
    () => adminListModerationPending({ type, limit: 1 }).then((r) => r.total),
    { shouldRetryOnError: false },
  )
  return data
}

function Ligne({ section }: { section: Section }) {
  const attente = useEnAttente(section.attente)
  return (
    <li className="border-border border-b">
      <Link href={section.href} className="group flex min-h-16 items-center gap-4 py-4 md:py-5">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-kairos-display text-[15px] font-bold group-hover:underline md:text-[17px]">
            {section.titre}
          </span>
          <span className="text-muted-foreground text-[13px] md:text-[15px]">{section.description}</span>
        </span>
        {attente ? (
          <span className="shrink-0 rounded-full bg-[var(--k-violet-soft)] px-3 py-1.5 text-[13px] font-semibold text-[var(--k-violet-soft-ink)]">
            {attente} à traiter
          </span>
        ) : null}
        <span className="text-muted-foreground shrink-0 text-xl transition-transform group-hover:translate-x-0.5" aria-hidden="true">
          ›
        </span>
      </Link>
    </li>
  )
}

export default function AdminPlusPage() {
  const { user, logout } = useSession()

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-10 px-5 pb-6 pt-14 md:px-10 lg:px-[72px]">
      <header className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em] md:text-sm">Plus</p>
        <h1 className="font-kairos-display text-[28px] font-extrabold leading-[1.15] md:text-[40px]">
          Tout le reste.
        </h1>
        <p className="text-muted-foreground max-w-xl text-[15px]">
          Les sections moins fréquentes. Rien n&apos;a disparu : chaque page garde ses fonctions.
        </p>
      </header>

      {GROUPES.map((groupe) => (
        <section key={groupe.titre} aria-label={groupe.titre} className="flex flex-col">
          <h2 className="text-muted-foreground pb-2 text-xs font-semibold uppercase tracking-[0.08em]">{groupe.titre}</h2>
          <ul className="border-border border-t">
            {groupe.sections.map((s) => (
              <Ligne key={s.href} section={s} />
            ))}
          </ul>
        </section>
      ))}

      <section aria-label="Compte" className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em]">Connecté</span>
          <span className="truncate font-semibold">
            {user?.first_name} {user?.last_name}
          </span>
          <span className="text-muted-foreground truncate text-sm">{user?.email}</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/accueil"
            className="inline-flex h-12 items-center justify-center rounded-[14px] border border-border px-5 text-[15px] font-semibold transition-colors hover:bg-accent"
          >
            Ouvrir l&apos;app des ados
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex h-12 items-center justify-center rounded-[14px] bg-foreground px-5 text-[15px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            Se déconnecter
          </button>
        </div>
      </section>
    </div>
  )
}
