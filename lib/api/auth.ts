// Auth service talks to the FastAPI backend when configured,
// otherwise simulates the contract using mock data.

import { apiRequest, getStoredTokens, USE_MOCKS, writeTokens } from "./client"
import { mapUser } from "./mappers"
import { MOCK_ADMIN_USER, MOCK_USER } from "./mocks"
import type { AuthTokens, LoginResponse, User } from "./types"

export interface LoginPayload {
  identifier: string
  password: string
}

const MOCK_USER_KEY = "bethel.auth.mock_user"

function persistMockUser(user: User | null) {
  if (typeof window === "undefined") return
  if (user) window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user))
  else window.localStorage.removeItem(MOCK_USER_KEY)
}

function readMockUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(MOCK_USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function buildMockTokens(): AuthTokens {
  return {
    access_token: `mock.access.${Date.now()}`,
    refresh_token: `mock.refresh.${Date.now()}`,
    token_type: "bearer",
    expires_in: 1800,
  }
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 450))
    const id = payload.identifier.trim().toLowerCase()
    if (!id || payload.password.length < 4) {
      throw { status: 400, message: "Identifiant ou mot de passe invalide." }
    }
    const isAdmin = id.includes("admin")
    const mustChange = id.includes("first") || id.includes("nouveau")
    const user: User = {
      ...(isAdmin ? MOCK_ADMIN_USER : MOCK_USER),
      must_change_password: mustChange,
    }
    const tokens = buildMockTokens()
    writeTokens(tokens)
    persistMockUser(user)
    return { ...tokens, user }
  }

  const data = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: { identifier: payload.identifier, password: payload.password },
  })

  writeTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    expires_at: data.expires_at,
    refresh_expires_at: data.refresh_expires_at,
  })

  return { ...data, user: mapUser(data.user) }
}

export async function fetchMe(): Promise<User> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 200))
    return readMockUser() ?? MOCK_USER
  }
  return apiRequest<User>("/auth/me", { method: "GET" }).then(mapUser)
}

export async function logout(): Promise<void> {
  if (!USE_MOCKS) {
    try {
      const refreshToken = getStoredTokens()?.refresh_token
      if (refreshToken) {
        await apiRequest<void>("/auth/logout", {
          method: "POST",
          body: { refresh_token: refreshToken },
        })
      }
    } catch {
      // ignore - we still clear local session
    }
  }
  writeTokens(null)
  persistMockUser(null)
}

export async function activatePassword(newPassword: string): Promise<void> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 400))
    if (newPassword.length < 8) {
      throw { status: 400, message: "Le mot de passe doit contenir au moins 8 caracteres." }
    }
    return
  }
  await apiRequest<User>("/auth/activate-password", {
    method: "POST",
    body: { new_password: newPassword },
  })
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 400))
    if (newPassword.length < 8) {
      throw { status: 400, message: "Le nouveau mot de passe doit contenir au moins 8 caracteres." }
    }
    return
  }
  await apiRequest<void>("/auth/change-password", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
  })
}

export async function forgotPassword(email: string): Promise<void> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 350))
    return
  }
  await apiRequest<void>("/auth/forgot-password", {
    method: "POST",
    auth: false,
    body: { email },
  })
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 400))
    if (otp.length !== 6) {
      throw { status: 400, message: "Le code OTP doit contenir 6 chiffres." }
    }
    return
  }
  await apiRequest<void>("/auth/reset-password", {
    method: "POST",
    auth: false,
    body: { email, code: otp, new_password: newPassword },
  })
}

export async function updateProfile(
  payload: Partial<Pick<User, "first_name" | "last_name" | "username">>,
): Promise<User> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300))
    return { ...MOCK_USER, ...payload, updated_at: new Date().toISOString() }
  }
  return apiRequest<User>("/auth/me", { method: "PATCH", body: payload }).then(mapUser)
}
