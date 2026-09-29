"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useSession } from "@/lib/auth/session-provider"

export default function RootPage() {
  const router = useRouter()
  const { status, user } = useSession()

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || !user) {
      router.replace("/login")
      return
    }
    if (user.account_status === "suspended") {
      router.replace("/compte-suspendu")
      return
    }
    if (user.must_change_password) {
      router.replace("/activate-password")
      return
    }
    if (user.role === "admin" || user.is_superadmin) {
      router.replace("/admin")
      return
    }
    if (user.role === "moderator") {
      router.replace("/admin/temoignages")
      return
    }
    router.replace("/accueil")
  }, [status, user, router])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Chargement" />
    </div>
  )
}
