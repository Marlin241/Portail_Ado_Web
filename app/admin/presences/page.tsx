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
        title="Présences"
        description="Scanne le QR des ados pendant la réunion, puis partage la liste aux parents."
      />
      <div className="flex flex-col gap-8 px-5 py-6 md:px-10 md:py-8">
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/presences/scanner"
            className="group flex items-center justify-between gap-3 rounded-[24px] bg-[var(--k-lime)] p-[22px] text-[#0C0C12] outline-none transition-transform focus-visible:ring-4 focus-visible:ring-[var(--ring)] active:scale-[0.99] md:px-8 md:py-6"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-kairos-display text-lg font-bold md:text-2xl">Scanner</span>
              <span className="text-sm md:text-base">
                {chargeAujourdhui
                  ? "Ouvre la caméra et passe les cartes une par une."
                  : aujourdhui
                    ? `${aujourdhui.titre} : ${presents(aujourdhui.nb_presents).toLowerCase()}. Continue le scan.`
                    : "Ouvre la caméra et passe les cartes une par une."}
              </span>
            </span>
            <ScanLine className="h-7 w-7 shrink-0 md:h-9 md:w-9" aria-hidden="true" />
          </Link>
          {aujourdhui ? (
            <Link
              href={`/admin/presences/${aujourdhui.id}`}
              className="border-border bg-card hover:bg-accent flex min-h-14 items-center gap-3 rounded-[18px] border px-5 py-3 transition-colors"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em]">
                  Aujourd&apos;hui
                </span>
                <span className="truncate font-semibold">{aujourdhui.titre}</span>
              </span>
              <span className="text-muted-foreground text-sm">{presents(aujourdhui.nb_presents)}</span>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
          ) : null}
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em]">Réunions passées</h2>
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
            <Card className="gap-0 overflow-hidden py-0">
              <ul className="divide-border divide-y">
                {reunions.items.map((r: ReunionResume) => (
                  <li key={r.id}>
                    <Link
                      href={`/admin/presences/${r.id}`}
                      className="hover:bg-muted/50 flex min-h-14 items-center gap-3 px-5 py-3"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{r.titre}</span>
                        <span className="text-muted-foreground text-xs first-letter:uppercase">
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
            <Button variant="outline" className="h-12 rounded-[14px]" onClick={() => setLimite((l) => l + PAR_PAGE)}>
              Voir plus
            </Button>
          ) : null}
        </section>
      </div>
    </>
  )
}
