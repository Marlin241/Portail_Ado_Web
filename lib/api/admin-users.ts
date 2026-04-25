import { apiRequest, isMockMode } from "./client"
import { mapUser } from "./mappers"
import { makeId, mockAppendAudit, mockUsers } from "./mocks-admin"
import type {
  AdminUserCreate,
  AdminUserCreateResult,
  AdminUserUpdate,
  PaginatedResponse,
  User,
} from "./types"

export interface ListUsersParams {
  search?: string
  role?: string
  account_status?: string
  limit?: number
  offset?: number
}

function toPage<T>(items: T[], params: ListUsersParams): PaginatedResponse<T> {
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset }
}

export async function adminListUsers(
  params: ListUsersParams = {},
): Promise<PaginatedResponse<User>> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 150))
    let rows = [...mockUsers]
    if (params.search) {
      const q = params.search.toLowerCase()
      rows = rows.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          `${u.first_name} ${u.last_name}`.toLowerCase().includes(q),
      )
    }
    if (params.role) rows = rows.filter((u) => u.role === params.role)
    if (params.account_status) {
      rows = rows.filter((u) => u.account_status === params.account_status)
    }
    return toPage(rows, params)
  }

  return apiRequest<PaginatedResponse<User>>("/users", {
    query: {
      q: params.search,
      role: params.role,
      account_status: params.account_status,
      limit: params.limit,
      offset: params.offset,
    },
  }).then((res) => ({
    ...res,
    items: res.items.map(mapUser),
  }))
}

export async function adminCreateUser(payload: AdminUserCreate): Promise<AdminUserCreateResult> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 150))
    const now = new Date().toISOString()
    const temporary_password = `Tmp-${Math.random().toString(36).slice(2, 8)}!`
    const user: User = {
      id: makeId("u"),
      email: payload.email,
      username: payload.username,
      first_name: payload.first_name,
      last_name: payload.last_name,
      birth_date: payload.birth_date ?? null,
      role: payload.role,
      account_status: "pending_activation",
      is_superadmin: false,
      must_change_password: true,
      avatar_url: null,
      created_at: now,
      updated_at: now,
    }
    mockUsers.unshift(user)
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "user.create",
      entity_type: "user",
      entity_id: user.id,
      ip_address: null,
      user_agent: null,
      metadata: { email: user.email, role: user.role },
    })
    return { user, temporary_password }
  }

  return apiRequest<{ user: User; temporary_password: string }>("/auth/admin/users", {
    method: "POST",
    body: payload,
  }).then((res) => ({
    user: mapUser(res.user),
    temporary_password: res.temporary_password,
  }))
}

export async function adminUpdateUser(
  id: string,
  payload: AdminUserUpdate,
): Promise<User> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 120))
    const idx = mockUsers.findIndex((u) => u.id === id)
    if (idx === -1) throw new Error("Utilisateur introuvable")
    const prev = mockUsers[idx]
    const next: User = { ...prev, ...payload, updated_at: new Date().toISOString() }
    mockUsers[idx] = next
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "user.update",
      entity_type: "user",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: payload as Record<string, unknown>,
    })
    return next
  }

  return apiRequest<User>(`/users/${id}`, { method: "PATCH", body: payload }).then(mapUser)
}

export async function adminSuspendUser(id: string, reason?: string): Promise<User> {
  if (isMockMode()) {
    const idx = mockUsers.findIndex((u) => u.id === id)
    if (idx === -1) throw new Error("Utilisateur introuvable")
    mockUsers[idx] = {
      ...mockUsers[idx],
      account_status: "suspended",
      is_active: false,
      updated_at: new Date().toISOString(),
    }
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "user.suspend",
      entity_type: "user",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: { reason: reason ?? null },
    })
    return mockUsers[idx]
  }

  return apiRequest<User>(`/users/${id}/suspend`, {
    method: "PATCH",
    body: { reason },
  }).then(mapUser)
}

export async function adminReactivateUser(id: string): Promise<User> {
  if (isMockMode()) {
    const idx = mockUsers.findIndex((u) => u.id === id)
    if (idx === -1) throw new Error("Utilisateur introuvable")
    mockUsers[idx] = {
      ...mockUsers[idx],
      account_status: "active",
      is_active: true,
      updated_at: new Date().toISOString(),
    }
    return mockUsers[idx]
  }

  return apiRequest<User>(`/users/${id}/reactivate`, {
    method: "PATCH",
    body: {},
  }).then(mapUser)
}

export async function adminResetUserPassword(
  id: string,
): Promise<{ temporary_password: string }> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 150))
    const tmp = `Tmp-${Math.random().toString(36).slice(2, 8)}!`
    const idx = mockUsers.findIndex((u) => u.id === id)
    if (idx !== -1) {
      mockUsers[idx] = {
        ...mockUsers[idx],
        must_change_password: true,
        account_status: "pending_activation",
      }
    }
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "user.reset_password",
      entity_type: "user",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: {},
    })
    return { temporary_password: tmp }
  }

  return apiRequest<{ temporary_password: string; user?: User }>(
    `/users/${id}/reset-password`,
    { method: "POST", body: {} },
  ).then((res) => ({ temporary_password: res.temporary_password }))
}

export async function adminDeleteUser(id: string): Promise<void> {
  if (isMockMode()) {
    const idx = mockUsers.findIndex((u) => u.id === id)
    if (idx !== -1) mockUsers.splice(idx, 1)
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "user.delete",
      entity_type: "user",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: {},
    })
    return
  }

  await apiRequest<void>(`/users/${id}`, { method: "DELETE" })
}
