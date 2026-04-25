"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  ClipboardList,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { adminListAuditLogs } from "@/lib/api/admin-misc"
import type { AuditLog } from "@/lib/api/types"

const ACTION_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  suspend: "destructive",
  reactivate: "default",
  reset_password: "outline",
  publish: "default",
  unpublish: "secondary",
}

function toneFor(action: string) {
  for (const key of Object.keys(ACTION_TONE)) {
    if (action.includes(key)) return ACTION_TONE[key]
  }
  return "outline" as const
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AdminAuditPage() {
  const { data, isLoading, isValidating, mutate } = useSWR(
    ["admin", "audit"],
    () => adminListAuditLogs({ limit: 200 }),
    { revalidateOnFocus: false },
  )

  const [search, setSearch] = useState("")
  const [entityFilter, setEntityFilter] = useState<string>("all")

  const logs: AuditLog[] = data?.items ?? []

  const entityTypes = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => set.add(l.entity_type))
    return Array.from(set).sort()
  }, [logs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return logs.filter((log) => {
      if (entityFilter !== "all" && log.entity_type !== entityFilter) return false
      if (!q) return true
      return (
        log.action.toLowerCase().includes(q) ||
        log.actor_email.toLowerCase().includes(q) ||
        log.entity_type.toLowerCase().includes(q) ||
        (log.entity_id ?? "").toLowerCase().includes(q)
      )
    })
  }, [logs, search, entityFilter])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Journal d'audit"
        description="Tracez toutes les actions administratives : création, modification, suspension, publication."
        actions={
          <Button
            variant="outline"
            onClick={() => mutate()}
            disabled={isValidating}
          >
            <RefreshCw className={isValidating ? "size-4 animate-spin" : "size-4"} />
            Actualiser
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par acteur, action, entité..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les entités</SelectItem>
              {entityTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <ClipboardList className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Aucune entrée d&apos;audit</EmptyTitle>
          <EmptyDescription>
            {logs.length === 0
              ? "Les actions des administrateurs s'afficheront ici au fil de l'eau."
              : "Aucun résultat ne correspond à vos filtres."}
          </EmptyDescription>
          {logs.length > 0 ? (
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setEntityFilter("all")
                }}
              >
                Réinitialiser les filtres
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Acteur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entité</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border/70 transition hover:bg-muted/30"
                >
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(log.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="size-3.5 text-primary" />
                      <span className="font-medium text-foreground">{log.actor_email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={toneFor(log.action)} className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{log.entity_type}</span>
                      {log.entity_id ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.entity_id.slice(0, 8)}...
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.ip_address ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
