import { apiRequest, isMockMode } from "./client"
import { mapAuditLog } from "./mappers"
import { computeMockStats, mockAuditLogs } from "./mocks-admin"
import type { AdminStats, AuditLog, PaginatedResponse } from "./types"

export async function adminFetchStats(): Promise<AdminStats> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 120))
    return computeMockStats()
  }
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
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 100))
    let rows = [...mockAuditLogs]
    const action = params.action
    const entityType = params.entity_type
    const actorId = params.actor_id
    if (action) rows = rows.filter((l) => l.action.includes(action))
    if (entityType) rows = rows.filter((l) => l.entity_type === entityType)
    if (actorId) rows = rows.filter((l) => l.actor_id === actorId)
    const limit = params.limit ?? 50
    const offset = params.offset ?? 0
    return {
      items: rows.slice(offset, offset + limit),
      total: rows.length,
      limit,
      offset,
    }
  }

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
