"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import { useSession } from "@/lib/auth/session-provider"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/admin")
    } else if (status === "authenticated" && user && user.role !== "admin" && !user.is_superadmin) {
      router.replace("/accueil")
    }
  }, [status, user, router])

  if (status === "loading") {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Chargement...</div>
      </div>
    )
  }

  if (!user || (user.role !== "admin" && !user.is_superadmin)) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-serif text-2xl font-semibold">Accès refusé</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Cette zone est réservée aux administrateurs. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur,
          contactez le responsable technique.
        </p>
      </div>
    )
  }

  return <AdminShell>{children}</AdminShell>
}
