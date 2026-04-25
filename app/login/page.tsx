"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import { AuthLayout } from "@/components/auth-layout"
import { useSession } from "@/lib/auth/session-provider"
import type { ApiError } from "@/lib/api/types"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect")
  const { login } = useSession()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await login(identifier, password)
      toast.success(`Bon retour, ${res.user.first_name} !`)
      if (res.user.account_status === "suspended") {
        router.replace("/compte-suspendu")
        return
      }
      if (res.user.must_change_password) {
        const target = redirect ? `/activate-password?redirect=${encodeURIComponent(redirect)}` : "/activate-password"
        router.replace(target)
        return
      }
      if (redirect) {
        router.replace(redirect)
        return
      }
      if (res.user.role === "admin" || res.user.is_superadmin) {
        router.replace("/admin")
        return
      }
      router.replace("/accueil")
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr.message || "Connexion impossible. Vérifie tes identifiants.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Espace jeunesse"
      title="Connecte-toi à ton portail"
      description="Utilise les identifiants remis par ton encadreur. Pas encore de compte ? Rapproche-toi de ton responsable jeunesse."
      footer={
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Comptes de démo</p>
          <p className="mt-1">
            Essaie <span className="font-semibold text-foreground">admin@test</span> ou{" "}
            <span className="font-semibold text-foreground">nouveau@test</span> avec n&apos;importe quel mot de passe (4+
            caractères).
          </p>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-foreground">Email ou nom d&apos;utilisateur</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              autoComplete="username"
              inputMode="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="esther@bethel-ados.org"
              className="w-full rounded-2xl border border-border bg-card px-10 py-3 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-foreground">Mot de passe</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-border bg-card px-10 py-3 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading || !identifier || !password}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Se connecter
        </button>
      </form>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
