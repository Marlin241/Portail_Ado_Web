"use client"

import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import { ChevronRight, ScanLine, Users } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  formaterJour,
  listerReunions,
  reunionAujourdhui,
  type ReunionResume,
} from "@/lib/api/presences"

const PAR_PAGE = 20

function presents(n: number) {
  return n === 0 ? "Aucun présent" : `${n} présent${n > 1 ? "s" : ""}`
}

export default function PresencesPage() {
  const { data: aujourdhui, isLoading: chargeAujourdhui } = useSWR(
    "presences-aujourdhui",
    reunionAujourdhui,
  )
  const [limite, setLimite] = useState(PAR_PAGE)
  const { data: reunions, isLoading } = useSWR(["presences-reunions", limite], () =>
    listerReunions({ limit: limite }),
  )

  return (
    <>
      <AdminPageHeader
        eyebrow="Présences"
        title="Présences aux réunions"
        description="Scannez le QR des ados à la fin de la réunion, puis partagez la liste aux parents."
      />
      <div className="flex flex-col gap-6 px-4 py-6 md:px-10 md:py-8">
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Aujourd&apos;hui
              </span>
              {chargeAujourdhui ? (
                <span className="text-muted-foreground text-sm">Chargement…</span>
              ) : aujourdhui ? (
                <>
                  <span className="text-lg font-semibold">{aujourdhui.titre}</span>
                  <span className="text-muted-foreground text-sm">
                    {presents(aujourdhui.nb_presents)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-semibold">Pas encore de présence aujourd&apos;hui</span>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {aujourdhui ? (
                <Button asChild variant="outline">
                  <Link href={`/admin/presences/${aujourdhui.id}`}>Voir la liste</Link>
                </Button>
              ) : null}
              <Button asChild size="lg">
                <Link href="/admin/presences/scanner">
                  <ScanLine className="mr-2 h-5 w-5" />
                  Scanner
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Réunions passées</h2>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Chargement…</p>
          ) : !reunions || reunions.items.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground flex items-center gap-3 p-5 text-sm">
                <Users className="h-5 w-5" />
                Aucune réunion pour l&apos;instant. La première se crée toute seule au premier scan.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <ul className="divide-border divide-y">
                {reunions.items.map((r: ReunionResume) => (
                  <li key={r.id}>
                    <Link
                      href={`/admin/presences/${r.id}`}
                      className="hover:bg-muted/50 flex min-h-14 items-center gap-3 px-5 py-3"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{r.titre}</span>
                        <span className="text-muted-foreground text-xs capitalize">
                          {formaterJour(r.jour)}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-sm">{presents(r.nb_presents)}</span>
                      <ChevronRight className="text-muted-foreground h-4 w-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {reunions && reunions.total > reunions.items.length ? (
            <Button variant="outline" onClick={() => setLimite((l) => l + PAR_PAGE)}>
              Voir plus
            </Button>
          ) : null}
        </section>
      </div>
    </>
  )
}
