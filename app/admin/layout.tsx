"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import { useSession } from "@/lib/auth/session-provider"

function canEnterBackOffice(user: { role: string; is_superadmin: boolean } | null) {
  return !!user && (user.role === "admin" || user.role === "moderator" || user.is_superadmin)
}

function canOpenAdminPath(user: { role: string; is_superadmin: boolean } | null, pathname: string) {
  if (!user) return false
  if (user.role === "admin" || user.is_superadmin) return true
  return user.role === "moderator" && pathname.startsWith("/admin/temoignages")
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, status } = useSession()
  const router = useRouter()
  const pathname = usePathname() || "/admin"

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/admin")
    } else if (status === "authenticated" && user && !canEnterBackOffice(user)) {
      router.replace("/accueil")
    } else if (status === "authenticated" && user?.role === "moderator" && pathname === "/admin") {
      router.replace("/admin/temoignages")
    } else if (status === "authenticated" && user && !canOpenAdminPath(user, pathname)) {
      router.replace(user.role === "moderator" ? "/admin/temoignages" : "/accueil")
    }
  }, [status, user, router, pathname])

  if (status === "loading") {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Chargement...</div>
      </div>
    )
  }

  if (user?.role === "moderator" && pathname === "/admin") {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Chargement...</div>
      </div>
    )
  }

  if (!canEnterBackOffice(user) || !canOpenAdminPath(user, pathname)) {
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
