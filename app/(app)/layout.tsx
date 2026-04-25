"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { useSession } from "@/lib/auth/session-provider"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() || ""
  const { user, status } = useSession()

  useEffect(() => {
    if (status === "loading") return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.account_status === "suspended") {
      router.replace("/compte-suspendu")
      return
    }
    if (user.must_change_password) {
      router.replace("/activate-password")
    }
  }, [status, user, router])

  if (status === "loading" || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Chargement" />
      </div>
    )
  }

  // Fullscreen reader / player: no chrome, no padding
  const hideNav = /\/lire$/.test(pathname) || /\/episodes\//.test(pathname)

  return (
    <AppShell user={user} hideNav={hideNav}>
      {children}
    </AppShell>
  )
}
