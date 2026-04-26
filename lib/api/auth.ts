import { apiRequest, getStoredTokens, writeTokens } from "./client"
import { mapUser } from "./mappers"
import type { AuthTokens, LoginResponse, User } from "./types"

export interface LoginPayload {
  identifier: string
  password: string
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
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
  return apiRequest<User>("/auth/me", { method: "GET" }).then(mapUser)
}

export async function logout(): Promise<void> {
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
  writeTokens(null)
}

export async function activatePassword(newPassword: string): Promise<void> {
  await apiRequest<User>("/auth/activate-password", {
    method: "POST",
    body: { new_password: newPassword },
  })
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest<void>("/auth/change-password", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
  })
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest<void>("/auth/forgot-password", {
    method: "POST",
    auth: false,
    body: { email },
  })
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  await apiRequest<void>("/auth/reset-password", {
    method: "POST",
    auth: false,
    body: { email, code: otp, new_password: newPassword },
  })
}

export async function updateProfile(
  payload: Partial<Pick<User, "first_name" | "last_name" | "username">>,
): Promise<User> {
  return apiRequest<User>("/auth/me", { method: "PATCH", body: payload }).then(mapUser)
}
