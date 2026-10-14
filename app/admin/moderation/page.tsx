"use client"

import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { refreshModerationCounts, useModerationCounts } from "@/components/admin/use-moderation-counts"
import { adminListModerationPending } from "@/lib/api/admin-misc"
import { adminAnswerQuestion, adminListQuestions, adminRejectQuestion } from "@/lib/api/questions"
import { adminApproveTemoignage, adminListTemoignages, adminRejectTemoignage } from "@/lib/api/temoignages"
import type { AdminQuestionAnonyme, AdminTemoignage, ApiError, ModerationPendingType } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type Onglet = "temoignages" | "questions"

const FILE_KEY = (o: Onglet) => ["moderation-file", o] as const

function capitaliser(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function quand(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const maintenant = new Date()
  const debut = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const ecart = Math.round((debut(maintenant) - debut(d)) / 86_400_000)
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  if (ecart <= 0) return `Aujourd'hui, ${heure}`
  if (ecart === 1) return `Hier, ${heure}`
  if (ecart < 7) return capitaliser(d.toLocaleDateString("fr-FR", { weekday: "long" }))
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function messageErreur(error: unknown, defaut: string) {
  return (error as ApiError)?.message || defaut
}

const BOUTON_PRINCIPAL =
  "inline-flex min-h-12 flex-1 items-center justify-center rounded-[14px] bg-[var(--k-lime)] px-4 md:min-w-[176px] md:flex-none text-[15px] font-semibold text-[#0C0C12] transition-opacity hover:opacity-90 disabled:opacity-50"
const BOUTON_SECONDAIRE =
  "inline-flex min-h-12 flex-1 items-center justify-center rounded-[14px] border border-border bg-transparent px-4 md:min-w-[176px] md:flex-none text-[15px] font-semibold transition-colors hover:bg-accent disabled:opacity-50"

// ─── Cartes ──────────────────────────────────────────────────────────

function Carte({
  titre,
  date,
  children,
}: {
  titre: string
  date: string
  children: React.ReactNode
}) {
  return (
    <article className="border-border bg-card flex flex-col gap-3.5 rounded-[20px] border p-[18px] md:p-6">
      <header className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[15px] font-semibold">{titre}</span>
        <span className="text-muted-foreground shrink-0 text-xs">{date}</span>
      </header>
      {children}
    </article>
  )
}

function CarteTemoignage({
  item,
  onDecide,
}: {
  item: AdminTemoignage
  onDecide: (item: AdminTemoignage, decision: "approuver" | "refuser") => Promise<void>
}) {
  const [occupe, setOccupe] = useState(false)
  const [confirmer, setConfirmer] = useState(false)

  async function decider(decision: "approuver" | "refuser") {
    setOccupe(true)
    try {
      await onDecide(item, decision)
    } finally {
      setOccupe(false)
    }
  }

  return (
    <Carte
      titre={item.anonyme ? `Témoignage de ${item.auteur} (publié en anonyme)` : `Témoignage de ${item.auteur}`}
      date={quand(item.created_at)}
    >
      <p className="whitespace-pre-line text-[15px] leading-relaxed">« {item.contenu} »</p>
      <div className="flex gap-2.5">
        <button type="button" className={BOUTON_PRINCIPAL} disabled={occupe} onClick={() => void decider("approuver")}>
          Approuver
        </button>
        <button type="button" className={BOUTON_SECONDAIRE} disabled={occupe} onClick={() => setConfirmer(true)}>
          Refuser
        </button>
      </div>

      <AlertDialog open={confirmer} onOpenChange={setConfirmer}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuser ce témoignage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Il ne sera pas publié dans l&apos;app. Tu le retrouves ensuite dans « Tous les témoignages ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void decider("refuser")}
            >
              Refuser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Carte>
  )
}

function CarteQuestion({
  item,
  onRepondre,
  onRefuser,
}: {
  item: AdminQuestionAnonyme
  onRepondre: (item: AdminQuestionAnonyme, reponse: string) => Promise<void>
  onRefuser: (item: AdminQuestionAnonyme) => Promise<void>
}) {
  const [occupe, setOccupe] = useState(false)
  const [confirmer, setConfirmer] = useState(false)
  const [redaction, setRedaction] = useState(false)
  const [reponse, setReponse] = useState("")

  async function publier(e: FormEvent) {
    e.preventDefault()
    if (!reponse.trim()) return
    setOccupe(true)
    try {
      await onRepondre(item, reponse.trim())
    } finally {
      setOccupe(false)
    }
  }

  async function refuser() {
    setOccupe(true)
    try {
      await onRefuser(item)
    } finally {
      setOccupe(false)
    }
  }

  return (
    <Carte titre={item.auteur_alias ? `Question de ${item.auteur_alias}` : "Question anonyme"} date={quand(item.created_at)}>
      <p className="whitespace-pre-line text-[15px] leading-relaxed">{item.contenu}</p>

      {redaction ? (
        <form onSubmit={publier} className="flex flex-col gap-2.5">
          <label htmlFor={`reponse-${item.id}`} className="text-muted-foreground text-sm font-medium">
            Ta réponse, visible par tous les ados dans les questions-réponses
          </label>
          <textarea
            id={`reponse-${item.id}`}
            autoFocus
            rows={5}
            value={reponse}
            onChange={(e) => setReponse(e.target.value)}
            className="border-border bg-background focus-visible:ring-ring/40 w-full rounded-[14px] border p-3 text-[15px] leading-relaxed outline-none focus-visible:ring-4"
          />
          <div className="flex gap-2.5">
            <button type="submit" className={BOUTON_PRINCIPAL} disabled={occupe || !reponse.trim()}>
              {occupe ? "Publication…" : "Publier la réponse"}
            </button>
            <button type="button" className={BOUTON_SECONDAIRE} disabled={occupe} onClick={() => setRedaction(false)}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2.5">
          <button type="button" className={BOUTON_PRINCIPAL} disabled={occupe} onClick={() => setRedaction(true)}>
            Répondre
          </button>
          <button type="button" className={BOUTON_SECONDAIRE} disabled={occupe} onClick={() => setConfirmer(true)}>
            Refuser
          </button>
        </div>
      )}

      <AlertDialog open={confirmer} onOpenChange={setConfirmer}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuser cette question ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle ne recevra pas de réponse publique. Tu la retrouves ensuite dans « Toutes les questions ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => void refuser()}>
              Refuser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Carte>
  )
}

// ─── États ───────────────────────────────────────────────────────────

function Vide({ onglet }: { onglet: Onglet }) {
  return (
    <div className="border-border flex flex-col items-start gap-1.5 rounded-[20px] border border-dashed px-6 py-10 md:items-center md:text-center">
      <p className="font-kairos-display text-lg font-bold">Rien à traiter.</p>
      <p className="text-muted-foreground text-[15px]">
        {onglet === "temoignages"
          ? "Les prochains témoignages envoyés par les ados arriveront ici."
          : "Les prochaines questions envoyées par les ados arriveront ici."}
      </p>
    </div>
  )
}

function Erreur({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border-border flex flex-col items-start gap-3 rounded-[20px] border px-6 py-8">
      <p className="text-[15px]">Impossible de charger la file pour le moment.</p>
      <button type="button" onClick={onRetry} className={cn(BOUTON_SECONDAIRE, "flex-none")}>
        Réessayer
      </button>
    </div>
  )
}

// ─── Autres demandes ─────────────────────────────────────────────────

const AUTRES: { type: ModerationPendingType; label: string; href: string }[] = [
  { type: "creation", label: "Créations", href: "/admin/creativite" },
  { type: "exploit", label: "Exploits", href: "/admin/exploits" },
  { type: "proposition_musique", label: "Propositions de musique", href: "/admin/musique" },
]

function AutreDemande({ type, label, href }: { type: ModerationPendingType; label: string; href: string }) {
  const { data } = useSWR(
    ["admin-plus-attente", type],
    () => adminListModerationPending({ type, limit: 1 }).then((r) => r.total),
    { shouldRetryOnError: false },
  )
  return (
    <li className="border-border border-b">
      <Link href={href} className="group flex min-h-14 items-center gap-3 py-3">
        <span className="flex-1 text-[15px] font-medium group-hover:underline">{label}</span>
        {data ? (
          <span className="rounded-full bg-[var(--k-violet-soft)] px-3 py-1 text-[13px] font-semibold text-[var(--k-violet-soft-ink)]">
            {data} à traiter
          </span>
        ) : null}
        <span className="text-muted-foreground text-xl" aria-hidden="true">
          ›
        </span>
      </Link>
    </li>
  )
}

// ─── Page ────────────────────────────────────────────────────────────

export default function AdminModerationPage() {
  const [onglet, setOnglet] = useState<Onglet>("temoignages")
  const [traites, setTraites] = useState<Set<string>>(() => new Set())
  const counts = useModerationCounts()

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("onglet") === "questions") setOnglet("questions")
  }, [])

  const temoignages = useSWR(onglet === "temoignages" ? FILE_KEY("temoignages") : null, () =>
    adminListTemoignages({ statut: "pending", page: 1, per_page: 50 }),
  )
  const questions = useSWR(onglet === "questions" ? FILE_KEY("questions") : null, () =>
    adminListQuestions({ statut: "pending", page: 1, per_page: 50 }),
  )

  function retirer(id: string) {
    setTraites((prev) => new Set(prev).add(id))
    refreshModerationCounts()
    void globalMutate("admin-audit-recent")
  }

  async function deciderTemoignage(item: AdminTemoignage, decision: "approuver" | "refuser") {
    try {
      if (decision === "approuver") {
        await adminApproveTemoignage(item.id)
        toast.success("Témoignage approuvé : il est visible dans l'app.")
      } else {
        await adminRejectTemoignage(item.id)
        toast.success("Témoignage refusé.")
      }
      retirer(item.id)
      void temoignages.mutate()
      void globalMutate((key) => Array.isArray(key) && key[0] === "admin-temoignages")
    } catch (error) {
      toast.error(messageErreur(error, "La décision n'a pas pu être enregistrée."))
    }
  }

  async function repondreQuestion(item: AdminQuestionAnonyme, reponse: string) {
    try {
      await adminAnswerQuestion(item.id, reponse)
      toast.success("Réponse publiée.")
      retirer(item.id)
      void questions.mutate()
      void globalMutate((key) => Array.isArray(key) && key[0] === "admin-questions")
    } catch (error) {
      toast.error(messageErreur(error, "La réponse n'a pas pu être publiée."))
    }
  }

  async function refuserQuestion(item: AdminQuestionAnonyme) {
    try {
      await adminRejectQuestion(item.id)
      toast.success("Question refusée.")
      retirer(item.id)
      void questions.mutate()
      void globalMutate((key) => Array.isArray(key) && key[0] === "admin-questions")
    } catch (error) {
      toast.error(messageErreur(error, "La décision n'a pas pu être enregistrée."))
    }
  }

  const courant = onglet === "temoignages" ? temoignages : questions
  const items = (courant.data?.items ?? []).filter((i) => !traites.has(i.id))

  const onglets: { id: Onglet; label: string; n?: number }[] = [
    { id: "temoignages", label: "Témoignages", n: counts.temoignages },
    { id: "questions", label: "Questions", n: counts.questions },
  ]

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5 px-5 pb-6 pt-14 md:gap-6 md:px-10 lg:px-[72px]">
      <header className="flex flex-col gap-2">
        <h1 className="font-kairos-display text-[26px] font-extrabold leading-[1.15] md:text-[40px]">Modération</h1>
        <p className="text-muted-foreground text-[15px]">
          Ce que les ados envoient passe ici avant d&apos;être visible dans l&apos;app.
        </p>
      </header>

      <div role="tablist" aria-label="Type de contenu" className="flex gap-2">
        {onglets.map((o) => {
          const actif = onglet === o.id
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              id={`onglet-${o.id}`}
              aria-selected={actif}
              aria-controls="file-moderation"
              onClick={() => setOnglet(o.id)}
              className={cn(
                "inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors md:text-[15px]",
                actif
                  ? "bg-[var(--k-lime)] text-[#0C0C12]"
                  : "border-border text-muted-foreground hover:text-foreground border",
              )}
            >
              {o.label}
              {o.n !== undefined ? ` · ${o.n}` : ""}
            </button>
          )
        })}
      </div>

      <section id="file-moderation" role="tabpanel" aria-labelledby={`onglet-${onglet}`} className="flex flex-col gap-3 md:gap-4">
        {courant.error ? (
          <Erreur onRetry={() => void courant.mutate()} />
        ) : !courant.data ? (
          <p className="text-muted-foreground py-6 text-sm">Chargement…</p>
        ) : items.length === 0 ? (
          <Vide onglet={onglet} />
        ) : onglet === "temoignages" ? (
          (items as AdminTemoignage[]).map((item) => (
            <CarteTemoignage key={item.id} item={item} onDecide={deciderTemoignage} />
          ))
        ) : (
          (items as AdminQuestionAnonyme[]).map((item) => (
            <CarteQuestion key={item.id} item={item} onRepondre={repondreQuestion} onRefuser={refuserQuestion} />
          ))
        )}
      </section>

      <section aria-label="Autres demandes" className="mt-6 flex flex-col">
        <div className="flex items-baseline justify-between gap-3 pb-2">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em]">Autres demandes</h2>
          <Link href="/admin/plus" className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4">
            Tout voir dans Plus
          </Link>
        </div>
        <ul className="border-border border-t">
          {AUTRES.map((a) => (
            <AutreDemande key={a.type} {...a} />
          ))}
        </ul>
      </section>
    </div>
  )
}
