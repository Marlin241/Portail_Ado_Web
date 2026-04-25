// Mutable in-memory state used when NEXT_PUBLIC_API_BASE_URL is not set.
// Lets the admin panel simulate CRUD operations in the v0 preview.

import {
  MOCK_ADMIN_USER,
  MOCK_BOOKS,
  MOCK_CATEGORIES,
  MOCK_EPISODES,
  MOCK_PODCASTS,
  MOCK_USER,
} from "./mocks"
import type {
  AdminStats,
  AuditLog,
  Book,
  CategorieLivre,
  Episode,
  Podcast,
  User,
} from "./types"

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

// ---- USERS ------------------------------------------------------------------

const extraUsers: User[] = [
  {
    ...clone(MOCK_USER),
    id: "u_jean",
    email: "jean@bethel-ados.org",
    username: "jean.k",
    first_name: "Jean",
    last_name: "Kouamé",
    role: "user",
    account_status: "active",
  },
  {
    ...clone(MOCK_USER),
    id: "u_grace",
    email: "grace@bethel-ados.org",
    username: "grace.m",
    first_name: "Grâce",
    last_name: "Mbala",
    role: "moderator",
    account_status: "active",
  },
  {
    ...clone(MOCK_USER),
    id: "u_david",
    email: "david@bethel-ados.org",
    username: "david.t",
    first_name: "David",
    last_name: "Toto",
    role: "user",
    account_status: "suspended",
  },
  {
    ...clone(MOCK_USER),
    id: "u_new",
    email: "new@bethel-ados.org",
    username: "new.member",
    first_name: "Nouveau",
    last_name: "Membre",
    role: "user",
    account_status: "pending_activation",
    must_change_password: true,
  },
]

export const mockUsers: User[] = [
  clone(MOCK_ADMIN_USER),
  clone(MOCK_USER),
  ...extraUsers,
]

// ---- BOOKS / CATEGORIES -----------------------------------------------------

export const mockBooks: Book[] = MOCK_BOOKS.map((b) => clone(b))
export const mockCategories: CategorieLivre[] = MOCK_CATEGORIES.map((c) => clone(c))

// ---- PODCASTS / EPISODES ----------------------------------------------------

export const mockPodcasts: Podcast[] = MOCK_PODCASTS.map((p) => clone(p))
export const mockEpisodes: Episode[] = MOCK_EPISODES.map((e) => clone(e))

// ---- AUDIT LOGS -------------------------------------------------------------

export const mockAuditLogs: AuditLog[] = [
  {
    id: "a1",
    actor_id: "u_admin",
    actor_email: "admin@bethel-ados.org",
    action: "user.create",
    entity_type: "user",
    entity_id: "u_new",
    ip_address: "196.200.12.4",
    user_agent: "Mozilla/5.0",
    metadata: { email: "new@bethel-ados.org", role: "user" },
    created_at: "2026-04-22T09:15:00Z",
  },
  {
    id: "a2",
    actor_id: "u_admin",
    actor_email: "admin@bethel-ados.org",
    action: "book.create",
    entity_type: "book",
    entity_id: "b6",
    ip_address: "196.200.12.4",
    user_agent: "Mozilla/5.0",
    metadata: { titre: "Mes émotions, mon allié" },
    created_at: "2026-04-21T14:02:00Z",
  },
  {
    id: "a3",
    actor_id: "u_admin",
    actor_email: "admin@bethel-ados.org",
    action: "user.suspend",
    entity_type: "user",
    entity_id: "u_david",
    ip_address: "196.200.12.4",
    user_agent: "Mozilla/5.0",
    metadata: { reason: "Signalement conduite inappropriée" },
    created_at: "2026-04-20T11:30:00Z",
  },
  {
    id: "a4",
    actor_id: "u_admin",
    actor_email: "admin@bethel-ados.org",
    action: "podcast.episode.publish",
    entity_type: "episode",
    entity_id: "e6",
    ip_address: "196.200.12.4",
    user_agent: "Mozilla/5.0",
    metadata: { podcast_id: "p3", numero: 1 },
    created_at: "2026-04-18T16:45:00Z",
  },
  {
    id: "a5",
    actor_id: "u_admin",
    actor_email: "admin@bethel-ados.org",
    action: "auth.login",
    entity_type: "session",
    entity_id: null,
    ip_address: "196.200.12.4",
    user_agent: "Mozilla/5.0",
    metadata: {},
    created_at: "2026-04-22T08:00:00Z",
  },
]

export function mockAppendAudit(entry: Omit<AuditLog, "id" | "created_at">): AuditLog {
  const log: AuditLog = {
    ...entry,
    id: makeId("a"),
    created_at: new Date().toISOString(),
  }
  mockAuditLogs.unshift(log)
  return log
}

// ---- STATS ------------------------------------------------------------------

export function computeMockStats(): AdminStats {
  return {
    users_total: mockUsers.length,
    users_active: mockUsers.filter((u) => u.account_status === "active").length,
    users_suspended: mockUsers.filter((u) => u.account_status === "suspended").length,
    users_pending: mockUsers.filter((u) => u.account_status === "pending_activation").length,
    books_total: mockBooks.length,
    books_recommended: mockBooks.filter((b) => b.est_recommande).length,
    categories_total: mockCategories.length,
    podcasts_total: mockPodcasts.length,
    podcasts_active: mockPodcasts.filter((p) => p.est_actif).length,
    episodes_total: mockEpisodes.length,
    episodes_published: mockEpisodes.filter((e) => e.est_publie).length,
    reading_sessions_last_7d: 284,
    audio_sessions_last_7d: 192,
  }
}

export { makeId }
