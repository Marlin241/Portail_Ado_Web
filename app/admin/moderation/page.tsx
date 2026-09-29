"use client"

import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import { ArrowRight, Inbox, Loader2 } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { adminListModerationPending } from "@/lib/api/admin-misc"
import type { ModerationPendingType } from "@/lib/api/types"

const TYPE_LABEL: Record<ModerationPendingType, string> = {
  question: "Question",
  temoignage: "Temoignage",
  exploit: "Exploit",
  creation: "Creation",
  proposition_musique: "Proposition musique",
}

const TYPE_LINK: Record<ModerationPendingType, string> = {
  question: "/admin/questions",
  temoignage: "/admin/temoignages",
  exploit: "/admin/exploits",
  creation: "/admin/creativite",
  proposition_musique: "/admin/musique",
}

export default function AdminModerationPage() {
  const [type, setType] = useState<ModerationPendingType | "all">("all")
  const { data, isLoading } = useSWR(["admin-moderation-pending", type], () =>
    adminListModerationPending({ type, limit: 80 }),
  )

  return (
    <>
      <AdminPageHeader
        eyebrow="Sprint 4"
        title="Moderation consolidee"
        description="Vue lecture seule des contenus en attente. Les decisions restent dans chaque module dedie."
        actions={
          <Select value={type} onValueChange={(value) => setType(value as ModerationPendingType | "all")}>
            <SelectTrigger className="w-56 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="question">Questions</SelectItem>
              <SelectItem value="temoignage">Temoignages</SelectItem>
              <SelectItem value="exploit">Exploits</SelectItem>
              <SelectItem value="creation">Creations</SelectItem>
              <SelectItem value="proposition_musique">Propositions musique</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (data?.items.length ?? 0) === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground" />
              <h2 className="font-serif text-lg font-semibold">File vide</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Aucun contenu en attente pour ce filtre.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {data!.items.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={TYPE_LINK[item.type]}
                className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge>{TYPE_LABEL[item.type]}</Badge>
                    {item.username_auteur ? <Badge variant="secondary">@{item.username_auteur}</Badge> : null}
                  </div>
                  <p className="line-clamp-2 text-sm font-medium">{item.titre_court}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.created_at ? new Date(item.created_at).toLocaleString("fr-FR") : ""}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
