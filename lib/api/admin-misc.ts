import { apiRequest } from "./client"
import { mapAuditLog } from "./mappers"
import type { AdminStats, AuditLog, PaginatedResponse } from "./types"

export async function adminFetchStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>("/admin/stats")
}

export interface ListAuditParams {
  action?: string
  entity_type?: string
  actor_id?: string
  limit?: number
  offset?: number
}

export async function adminListAuditLogs(
  params: ListAuditParams = {},
): Promise<PaginatedResponse<AuditLog>> {
  return apiRequest<PaginatedResponse<AuditLog>>("/admin/audit-logs", {
    query: {
      action: params.action,
      admin_id: params.actor_id,
      limit: params.limit,
      offset: params.offset,
    },
  }).then((res) => ({
    ...res,
    items: res.items.map(mapAuditLog),
  }))
}
