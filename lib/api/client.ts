// Typed HTTP client for the FastAPI backend (prefix /api/v1).
// Uses NEXT_PUBLIC_API_BASE_URL when available; otherwise callers should
// fall back to mock services (see lib/api/mocks.ts).

import type { ApiError, AuthTokens } from "./types"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || ""
export const USE_MOCKS = !API_BASE_URL
export function isMockMode(): boolean {
  return USE_MOCKS
}
const API_PREFIX = "/api/v1"

const TOKEN_KEY = "bethel.auth.tokens"

type TokenStore = AuthTokens | null

function readTokens(): TokenStore {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY)
    return raw ? (JSON.parse(raw) as AuthTokens) : null
  } catch {
    return null
  }
}

export function getStoredTokens(): TokenStore {
  return readTokens()
}

export function writeTokens(tokens: AuthTokens | null) {
  if (typeof window === "undefined") return
  if (tokens) {
    window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
  } else {
    window.localStorage.removeItem(TOKEN_KEY)
  }
}

export function getAccessToken(): string | null {
  return readTokens()?.access_token ?? null
}

let refreshPromise: Promise<AuthTokens | null> | null = null

async function tryRefresh(): Promise<AuthTokens | null> {
  const current = readTokens()
  if (!current?.refresh_token) return null
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: current.refresh_token }),
      })
      if (!res.ok) return null
      const data = (await res.json()) as AuthTokens
      const next: AuthTokens = {
        ...current,
        ...data,
        refresh_token: data.refresh_token || current.refresh_token,
      }
      writeTokens(next)
      return next
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  auth?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
  retryOn401?: boolean
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const base = path.startsWith("http") ? path : `${API_BASE_URL}${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`
  if (!query) return base
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v))
  })
  const str = qs.toString()
  return str ? `${base}?${str}` : base
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (USE_MOCKS) {
    throw new Error(
      "Client API non configuré : définis NEXT_PUBLIC_API_BASE_URL pour activer les appels réseau. " +
        "Les écrans utilisent des données de démonstration en attendant.",
    )
  }

  const { body, auth = true, query, retryOn401 = true, headers, ...rest } = options
  const headersInit = new Headers(headers)
  if (body !== undefined && !(body instanceof FormData)) {
    headersInit.set("Content-Type", "application/json")
  }
  if (auth) {
    const token = getAccessToken()
    if (token) headersInit.set("Authorization", `Bearer ${token}`)
  }

  const init: RequestInit = {
    ...rest,
    headers: headersInit,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  }

  const res = await fetch(buildUrl(path, query), init)

  if (res.status === 401 && auth && retryOn401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retryOn401: false })
    }
    writeTokens(null)
  }

  if (!res.ok) {
    let detail: unknown = null
    let message = `Erreur ${res.status}`
    try {
      detail = await res.json()
      // FastAPI error shape: { detail: string | object[] }
      const d = (detail as { detail?: unknown }).detail
      if (typeof d === "string") message = d
      else if (Array.isArray(d) && d[0] && typeof d[0] === "object" && "msg" in (d[0] as object)) {
        message = (d[0] as { msg: string }).msg
      }
    } catch {
      try {
        message = (await res.text()) || message
      } catch {
        // ignore
      }
    }
    const error: ApiError = { status: res.status, message, detail }
    throw error
  }

  if (res.status === 204) return undefined as T
  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) return (await res.json()) as T
  return (await res.text()) as unknown as T
}
