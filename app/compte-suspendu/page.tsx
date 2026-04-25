"use client"

import { useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { useSession } from "@/lib/auth/session-provider"

export default function SuspendedPage() {
  const router = useRouter()
  const { logout } = useSession()

  async function handleLogout() {
    await logout()
    router.replace("/login")
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="mt-6 font-serif text-2xl font-semibold text-foreground">Compte suspendu</h1>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
          L&apos;accès à ton compte est temporairement désactivé. Contacte ton encadreur pour en savoir plus et
          réactiver ton compte.
        </p>
        <button
          onClick={handleLogout}
          className="mt-8 w-full rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:shadow-primary/30"
        >
          Me déconnecter
        </button>
      </div>
    </main>
  )
}
