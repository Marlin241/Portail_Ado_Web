"use client"

import useSWR from "swr"
import {
  BookOpen,
  BookOpenCheck,
  Clock,
  Headphones,
  Inbox,
  Music2,
  Palette,
  Podcast,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { StatCard } from "@/components/admin/stat-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { adminFetchStats, adminListAuditLogs, adminListModerationPending } from "@/lib/api/admin-misc"
import type { ModerationPendingType } from "@/lib/api/types"

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const ACTION_LABELS: Record<string, string> = {
  "user.create": "Creation utilisateur",
  "user.update": "Modification utilisateur",
  "user.suspend": "Suspension utilisateur",
  "user.reactivate": "Reactivation utilisateur",
  "user.reset_password": "Reinitialisation MDP",
  "user.delete": "Suppression utilisateur",
  "book.create": "Ajout de livre",
  "book.update": "Modification livre",
  "book.delete": "Suppression livre",
  "book.upload": "Upload fichier livre",
  "category.create": "Creation categorie",
  "category.delete": "Suppression categorie",
  "podcast.create": "Creation podcast",
  "podcast.update": "Modification podcast",
  "podcast.delete": "Suppression podcast",
  "podcast.episode.create": "Nouvel episode",
  "podcast.episode.update": "Modification episode",
  "podcast.episode.delete": "Suppression episode",
  "podcast.episode.publish": "Publication episode",
  "podcast.episode.unpublish": "Depublication episode",
  "podcast.episode.upload": "Upload audio",
  "auth.login": "Connexion admin",
  question_answered: "Question repondue",
  question_rejected: "Question rejetee",
  question_deleted: "Question supprimee",
  temoignage_approved: "Temoignage approuve",
  temoignage_rejected: "Temoignage rejete",
  temoignage_deleted: "Temoignage supprime",
  bien_etre_article_created: "Article bien-etre cree",
  bien_etre_article_updated: "Article bien-etre modifie",
  bien_etre_article_deleted: "Article bien-etre supprime",
  defi_created: "Defi cree",
  defi_updated: "Defi modifie",
  defi_deleted: "Defi supprime",
  exploit_approved: "Exploit approuve",
  exploit_rejected: "Exploit rejete",
  exploit_deleted: "Exploit supprime",
  theme_biblique_created: "Theme biblique cree",
  theme_biblique_deleted: "Theme biblique supprime",
  quiz_biblique_created: "Quiz biblique cree",
  quiz_biblique_deleted: "Quiz biblique supprime",
  ado_mis_en_avant_created: "Ado mis en avant",
  ado_mis_en_avant_deleted: "Ado mis en avant retire",
  creation_approved: "Creation approuvee",
  creation_rejected: "Creation rejetee",
  creation_deleted: "Creation supprimee",
  artiste_created: "Artiste gospel cree",
  artiste_updated: "Artiste gospel modifie",
  artiste_deleted: "Artiste gospel supprime",
  playlist_musicale_created: "Playlist creee",
  playlist_musicale_updated: "Playlist modifiee",
  playlist_musicale_deleted: "Playlist supprimee",
  morceau_created: "Morceau cree",
  morceau_deleted: "Morceau supprime",
  proposition_musique_approved: "Proposition musique approuvee",
  proposition_musique_rejected: "Proposition musique rejetee",
}

const PENDING_LABELS: Record<ModerationPendingType, string> = {
  question: "Question",
  temoignage: "Temoignage",
  exploit: "Exploit",
  creation: "Creation",
  proposition_musique: "Proposition musique",
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useSWR("admin-stats", () => adminFetchStats())
  const { data: audit } = useSWR("admin-audit-recent", () =>
    adminListAuditLogs({ limit: 8 }),
  )
  const { data: pending } = useSWR(["admin-moderation-pending", "all"], () =>
    adminListModerationPending({ limit: 6 }),
  )

  return (
    <>
      <AdminPageHeader
        eyebrow="Tableau de bord"
        title="Vue d'ensemble de la plateforme"
        description="Statistiques globales, activite recente et alertes de moderation pour le Portail Ados Bethel."
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Utilisateurs
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total inscrits"
              value={isLoading ? "..." : (stats?.users_total ?? 0)}
              icon={Users}
            />
            <StatCard
              label="Comptes actifs"
              value={isLoading ? "..." : (stats?.users_active ?? 0)}
              icon={UserCheck}
              hint="Peuvent se connecter librement"
            />
            <StatCard
              label="En attente d'activation"
              value={isLoading ? "..." : (stats?.users_pending ?? 0)}
              icon={UserPlus}
              hint="Doivent changer leur mot de passe"
            />
            <StatCard
              label="Suspendus"
              value={isLoading ? "..." : (stats?.users_suspended ?? 0)}
              icon={ShieldAlert}
              hint="Acces bloque par un admin"
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contenu publie
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Livres"
              value={isLoading ? "..." : (stats?.books_total ?? 0)}
              hint={`${stats?.books_recommended ?? 0} recommandes - ${stats?.categories_total ?? 0} categories`}
              icon={BookOpen}
            />
            <StatCard
              label="Podcasts actifs"
              value={isLoading ? "..." : `${stats?.podcasts_active ?? 0}/${stats?.podcasts_total ?? 0}`}
              icon={Podcast}
            />
            <StatCard
              label="Episodes publies"
              value={isLoading ? "..." : `${stats?.episodes_published ?? 0}/${stats?.episodes_total ?? 0}`}
              icon={Headphones}
            />
            <StatCard
              label="Sessions 7 j"
              value={
                isLoading
                  ? "..."
                  : `${(stats?.reading_sessions_last_7d ?? 0) + (stats?.audio_sessions_last_7d ?? 0)}`
              }
              hint={`${stats?.reading_sessions_last_7d ?? 0} lecture - ${stats?.audio_sessions_last_7d ?? 0} audio`}
              icon={Clock}
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sprint 4
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Creations en attente"
              value={isLoading ? "..." : (stats?.creations_pending ?? 0)}
              hint={`${stats?.creations_approuvees_total ?? 0} creations approuvees`}
              icon={Palette}
            />
            <StatCard
              label="Propositions musique"
              value={isLoading ? "..." : (stats?.propositions_musique_pending ?? 0)}
              hint={`${stats?.morceaux_total ?? 0} morceaux - ${stats?.playlists_total ?? 0} playlists`}
              icon={Music2}
            />
            <StatCard
              label="Quiz bibliques 7 j"
              value={isLoading ? "..." : (stats?.quiz_resultats_7j ?? 0)}
              icon={BookOpenCheck}
            />
            <StatCard
              label="Engagement 7 j"
              value={
                isLoading
                  ? "..."
                  : (stats?.creation_likes_7j ?? 0) + (stats?.morceau_ecoutes_7j ?? 0)
              }
              hint={`${stats?.creation_likes_7j ?? 0} likes creations - ${stats?.morceau_ecoutes_7j ?? 0} ecoutes`}
              icon={Clock}
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-border/70 lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Activite recente</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {(audit?.items ?? []).map((log) => (
                    <li key={log.id} className="flex items-center justify-between py-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          par {log.actor_email}
                          {log.entity_id ? ` - ${log.entity_type}#${log.entity_id.slice(0, 6)}` : ""}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(log.created_at)}
                      </span>
                    </li>
                  ))}
                  {audit && audit.items.length === 0 ? (
                    <li className="py-6 text-center text-sm text-muted-foreground">
                      Aucune activite enregistree pour le moment.
                    </li>
                  ) : null}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Moderation en attente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Inbox className="h-4 w-4" />
                    Total
                  </span>
                  <Badge variant="secondary">{pending?.total ?? 0}</Badge>
                </div>
                <ul className="divide-y divide-border">
                  {(pending?.items ?? []).map((item) => (
                    <li key={`${item.type}-${item.id}`} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.titre_court}</p>
                          <p className="text-xs text-muted-foreground">
                            {PENDING_LABELS[item.type]}
                            {item.username_auteur ? ` - @${item.username_auteur}` : ""}
                          </p>
                        </div>
                        <Badge variant="outline">{formatDateTime(item.created_at)}</Badge>
                      </div>
                    </li>
                  ))}
                  {pending && pending.items.length === 0 ? (
                    <li className="py-6 text-center text-sm text-muted-foreground">
                      Rien a moderer pour le moment.
                    </li>
                  ) : null}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  )
}
