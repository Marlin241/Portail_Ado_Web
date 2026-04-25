"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { getAccessToken, writeTokens } from "@/lib/api/client"
import { fetchMe, login as loginRequest, logout as logoutRequest } from "@/lib/api/auth"
import type { LoginResponse, User } from "@/lib/api/types"

interface SessionState {
  user: User | null
  status: "loading" | "authenticated" | "unauthenticated"
}

interface SessionContextValue extends SessionState {
  login: (identifier: string, password: string) => Promise<LoginResponse>
  logout: () => Promise<void>
  refresh: () => Promise<User | null>
  setUser: (u: User | null) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ user: null, status: "loading" })

  const refresh = useCallback(async () => {
    if (!getAccessToken()) {
      setState({ user: null, status: "unauthenticated" })
      return null
    }
    try {
      const user = await fetchMe()
      setState({ user, status: "authenticated" })
      return user
    } catch {
      writeTokens(null)
      setState({ user: null, status: "unauthenticated" })
      return null
    }
  }, [])

  useEffect(() => {
    // Initial hydration
    refresh()
  }, [refresh])

  const handleLogin = useCallback<SessionContextValue["login"]>(async (identifier, password) => {
    const res = await loginRequest({ identifier, password })
    setState({ user: res.user, status: "authenticated" })
    return res
  }, [])

  const handleLogout = useCallback(async () => {
    await logoutRequest()
    setState({ user: null, status: "unauthenticated" })
  }, [])

  const setUser = useCallback<SessionContextValue["setUser"]>((u) => {
    setState((prev) => ({ user: u, status: u ? "authenticated" : "unauthenticated" }))
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({ ...state, login: handleLogin, logout: handleLogout, refresh, setUser }),
    [state, handleLogin, handleLogout, refresh, setUser],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used within SessionProvider")
  return ctx
}
