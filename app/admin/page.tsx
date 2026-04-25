"use client"

import useSWR from "swr"
import {
  BookOpen,
  Clock,
  Headphones,
  Podcast,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { StatCard } from "@/components/admin/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { adminFetchStats, adminListAuditLogs } from "@/lib/api/admin-misc"

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const ACTION_LABELS: Record<string, string> = {
  "user.create": "Création utilisateur",
  "user.update": "Modification utilisateur",
  "user.suspend": "Suspension utilisateur",
  "user.reactivate": "Réactivation utilisateur",
  "user.reset_password": "Réinitialisation MDP",
  "user.delete": "Suppression utilisateur",
  "book.create": "Ajout de livre",
  "book.update": "Modification livre",
  "book.delete": "Suppression livre",
  "book.upload": "Upload fichier livre",
  "category.create": "Création catégorie",
  "category.delete": "Suppression catégorie",
  "podcast.create": "Création podcast",
  "podcast.update": "Modification podcast",
  "podcast.delete": "Suppression podcast",
  "podcast.episode.create": "Nouvel épisode",
  "podcast.episode.update": "Modification épisode",
  "podcast.episode.delete": "Suppression épisode",
  "podcast.episode.publish": "Publication épisode",
  "podcast.episode.unpublish": "Dépublication épisode",
  "podcast.episode.upload": "Upload audio",
  "auth.login": "Connexion admin",
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useSWR("admin-stats", () => adminFetchStats())
  const { data: audit } = useSWR("admin-audit-recent", () =>
    adminListAuditLogs({ limit: 8 }),
  )

  return (
    <>
      <AdminPageHeader
        eyebrow="Tableau de bord"
        title="Vue d'ensemble de la plateforme"
        description="Statistiques globales, activité récente et alertes de modération pour le Portail Ados Bethel."
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        <section>
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
            Utilisateurs
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total inscrits"
              value={isLoading ? "…" : (stats?.users_total ?? 0)}
              icon={Users}
            />
            <StatCard
              label="Comptes actifs"
              value={isLoading ? "…" : (stats?.users_active ?? 0)}
              icon={UserCheck}
              hint="Peuvent se connecter librement"
            />
            <StatCard
              label="En attente d'activation"
              value={isLoading ? "…" : (stats?.users_pending ?? 0)}
              icon={UserPlus}
              hint="Doivent changer leur mot de passe"
            />
            <StatCard
              label="Suspendus"
              value={isLoading ? "…" : (stats?.users_suspended ?? 0)}
              icon={ShieldAlert}
              hint="Accès bloqué par un admin"
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
            Contenu publié
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Livres"
              value={isLoading ? "…" : (stats?.books_total ?? 0)}
              hint={`${stats?.books_recommended ?? 0} recommandés · ${stats?.categories_total ?? 0} catégories`}
              icon={BookOpen}
            />
            <StatCard
              label="Podcasts actifs"
              value={isLoading ? "…" : `${stats?.podcasts_active ?? 0}/${stats?.podcasts_total ?? 0}`}
              icon={Podcast}
            />
            <StatCard
              label="Épisodes publiés"
              value={isLoading ? "…" : `${stats?.episodes_published ?? 0}/${stats?.episodes_total ?? 0}`}
              icon={Headphones}
            />
            <StatCard
              label="Sessions 7 j"
              value={
                isLoading
                  ? "…"
                  : `${(stats?.reading_sessions_last_7d ?? 0) + (stats?.audio_sessions_last_7d ?? 0)}`
              }
              hint={`${stats?.reading_sessions_last_7d ?? 0} lecture · ${stats?.audio_sessions_last_7d ?? 0} audio`}
              icon={Clock}
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-border/70 lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-border divide-y">
                  {(audit?.items ?? []).map((log) => (
                    <li key={log.id} className="flex items-center justify-between py-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                        <span className="text-muted-foreground truncate text-xs">
                          par {log.actor_email}
                          {log.entity_id ? ` · ${log.entity_type}#${log.entity_id.slice(0, 6)}` : ""}
                        </span>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {formatDateTime(log.created_at)}
                      </span>
                    </li>
                  ))}
                  {audit && audit.items.length === 0 ? (
                    <li className="text-muted-foreground py-6 text-center text-sm">
                      Aucune activité enregistrée pour le moment.
                    </li>
                  ) : null}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Modules à venir</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Les modules ci-dessous seront activés au fur et à mesure de la livraison des sprints backend.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Témoignages · Sprint 3</Badge>
                  <Badge variant="secondary">Questions · Sprint 3</Badge>
                  <Badge variant="secondary">Exploits · Sprint 3</Badge>
                  <Badge variant="secondary">Quiz · Sprint 2</Badge>
                  <Badge variant="secondary">Défis · Sprint 2</Badge>
                  <Badge variant="secondary">Agenda · Sprint 2</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  )
}
