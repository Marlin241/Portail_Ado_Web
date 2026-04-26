import { apiRequest } from "./client"
import { mapUser } from "./mappers"
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

export async function adminListUsers(
  params: ListUsersParams = {},
): Promise<PaginatedResponse<User>> {
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
  return apiRequest<User>(`/users/${id}`, { method: "PATCH", body: payload }).then(mapUser)
}

export async function adminSuspendUser(id: string, reason?: string): Promise<User> {
  return apiRequest<User>(`/users/${id}/suspend`, {
    method: "PATCH",
    body: { reason },
  }).then(mapUser)
}

export async function adminReactivateUser(id: string): Promise<User> {
  return apiRequest<User>(`/users/${id}/reactivate`, {
    method: "PATCH",
    body: {},
  }).then(mapUser)
}

export async function adminResetUserPassword(
  id: string,
): Promise<{ temporary_password: string }> {
  return apiRequest<{ temporary_password: string; user?: User }>(
    `/users/${id}/reset-password`,
    { method: "POST", body: {} },
  ).then((res) => ({ temporary_password: res.temporary_password }))
}

export async function adminDeleteUser(id: string): Promise<void> {
  await apiRequest<void>(`/users/${id}`, { method: "DELETE" })
}
