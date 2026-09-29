"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Flag, Loader2, Trophy } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { completeDefi, listCurrentDefis, listDefis, listMyDefiParticipations, participateDefi } from "@/lib/api/defis"
import type { ApiError, Defi, ParticipationDefi } from "@/lib/api/types"

function formatWeek(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(
    new Date(value),
  )
}

export default function DefisPage() {
  const [current, setCurrent] = useState<Defi[]>([])
  const [history, setHistory] = useState<Defi[]>([])
  const [participations, setParticipations] = useState<ParticipationDefi[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [currentRes, historyRes, participationRes] = await Promise.all([
      listCurrentDefis().catch(() => [] as Defi[]),
      listDefis({ page: 1, per_page: 50 }).catch(() => ({ items: [] as Defi[] })),
      listMyDefiParticipations({ page: 1, per_page: 50 }).catch(() => ({ items: [] as ParticipationDefi[] })),
    ])
    setCurrent(currentRes)
    setHistory(historyRes.items)
    setParticipations(participationRes.items)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function join(defi: Defi) {
    setBusyId(defi.id)
    try {
      await participateDefi(defi.id)
      toast.success("Participation enregistree")
      await load()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    } finally {
      setBusyId(null)
    }
  }

  async function finish(defi: Defi) {
    setBusyId(defi.id)
    try {
      await completeDefi(defi.id)
      toast.success("Defi marque comme termine")
      await load()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="px-6 pb-8 pt-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Engagement</p>
        <h1 className="mt-1 text-2xl font-bold">Defis de la semaine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Des actions simples pour vivre ta foi avec constance, sans pression de performance.
        </p>
      </header>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-0.5 w-4 rounded-full bg-accent" aria-hidden />
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-foreground">Cette semaine</h2>
            </div>
            {current.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <Flag className="h-9 w-9 text-muted-foreground" />
                  <h3 className="font-semibold">Aucun defi cette semaine</h3>
                  <p className="text-sm text-muted-foreground">Reviens quand un nouveau defi sera publie.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {current.map((defi) => (
                  <DefiCard
                    key={defi.id}
                    defi={defi}
                    primary
                    busy={busyId === defi.id}
                    onJoin={join}
                    onFinish={finish}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-0.5 w-4 rounded-full bg-accent" aria-hidden />
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-foreground">Mes participations</h2>
            </div>
            {participations.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                  <Trophy className="h-9 w-9 text-muted-foreground" />
                  <h3 className="font-semibold">Aucune participation</h3>
                  <p className="text-sm text-muted-foreground">Tes defis rejoints apparaitront ici.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {participations.map((participation) => {
                  const defi = [...current, ...history].find((item) => item.ma_participation?.id === participation.id)
                  return <ParticipationCard key={participation.id} participation={participation} defi={defi} />
                })}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-0.5 w-4 rounded-full bg-accent" aria-hidden />
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-foreground">Historique</h2>
            </div>
            {history.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <Trophy className="h-9 w-9 text-muted-foreground" />
                  <h3 className="font-semibold">Aucun defi disponible</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {history.map((defi) => (
                  <DefiCard
                    key={defi.id}
                    defi={defi}
                    busy={busyId === defi.id}
                    onJoin={join}
                    onFinish={finish}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function ParticipationCard({
  participation,
  defi,
}: {
  participation: ParticipationDefi
  defi?: Defi
}) {
  const done = participation.statut === "termine"

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant={done ? "default" : "secondary"}>{done ? "Termine" : "En cours"}</Badge>
          <span className="text-xs text-muted-foreground">Rejoint le {formatDateTime(participation.created_at)}</span>
        </div>
        <div>
          <h3 className="font-semibold">{defi?.titre ?? "Participation enregistree"}</h3>
          {defi ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{defi.description}</p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Detail du defi disponible dans l'historique.</p>
          )}
        </div>
        {participation.termine_le ? (
          <p className="border-t pt-3 text-xs text-muted-foreground">
            Termine le {formatDateTime(participation.termine_le)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function DefiCard({
  defi,
  primary,
  busy,
  onJoin,
  onFinish,
}: {
  defi: Defi
  primary?: boolean
  busy: boolean
  onJoin: (defi: Defi) => void
  onFinish: (defi: Defi) => void
}) {
  const participation = defi.ma_participation
  const done = participation?.statut === "termine"

  return (
    <Card className={primary ? "border-primary/30 bg-primary/5" : "border-border/70"}>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant={done ? "default" : participation ? "secondary" : "outline"}>
            {done ? "Termine" : participation ? "En cours" : "Disponible"}
          </Badge>
          <span className="text-xs text-muted-foreground">Semaine du {formatWeek(defi.semaine_debut)}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold">{defi.titre}</h3>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">{defi.description}</p>
        </div>
        <div className="flex justify-end gap-2 border-t pt-3">
          {!participation ? (
            <Button type="button" onClick={() => onJoin(defi)} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flag className="mr-2 h-4 w-4" />}
              Participer
            </Button>
          ) : done ? (
            <Button type="button" variant="secondary" disabled>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Termine
            </Button>
          ) : (
            <Button type="button" onClick={() => onFinish(defi)} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Marquer termine
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
