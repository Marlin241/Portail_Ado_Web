"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AuthLayout } from "@/components/auth-layout"
import { activatePassword } from "@/lib/api/auth"
import { useSession } from "@/lib/auth/session-provider"
import type { ApiError } from "@/lib/api/types"

export default function ActivatePasswordPage() {
  const router = useRouter()
  const { user, setUser, refresh } = useSession()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  const canSubmit = password.length >= 8 && password === confirm

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      await activatePassword(password)
      if (user) setUser({ ...user, must_change_password: false })
      await refresh()
      toast.success("Compte activé ! Bienvenue.")
      router.replace("/accueil")
    } catch (err) {
      toast.error((err as ApiError).message || "Impossible d'activer le compte.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Première connexion"
      title={user ? `Bienvenue ${user.first_name} !` : "Bienvenue !"}
      description="Pour sécuriser ton compte, remplace le mot de passe temporaire par un mot de passe personnel. Garde-le confidentiel : il te sera demandé à chaque connexion."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold">Nouveau mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-4"
          />
          <span className="mt-1 block text-[11px] text-muted-foreground">
            Au moins 8 caractères. Évite ton prénom ou ta date de naissance.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold">Confirmer le mot de passe</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-4"
          />
          {confirm && confirm !== password && (
            <span className="mt-1 block text-[11px] text-destructive">Les mots de passe ne correspondent pas.</span>
          )}
        </label>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Activer mon compte
        </button>
      </form>
    </AuthLayout>
  )
}
