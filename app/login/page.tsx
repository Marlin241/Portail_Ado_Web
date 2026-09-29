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
      if (res.user.role === "moderator") {
        router.replace("/admin/temoignages")
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
          <p className="font-semibold text-foreground">Compte fourni par un administrateur</p>
          <p className="mt-1">
            Le backend impose un mot de passe d&apos;au moins 8 caracteres. A la premiere connexion,
            l&apos;utilisateur definit son mot de passe final.
          </p>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground/70">
            Email ou nom d&apos;utilisateur
          </span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <input
              type="text"
              autoComplete="username"
              inputMode="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="esther@bethel-ados.org"
              className="w-full rounded-2xl border-2 border-border/60 bg-secondary/30 px-10 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:bg-card focus:ring-0"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground/70">
            Mot de passe
          </span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <input
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full rounded-2xl border-2 border-border/60 bg-secondary/30 px-10 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:bg-card focus:ring-0"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <div className="flex items-center justify-end pt-1">
          <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading || !identifier || password.length < 8}
          className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-primary/45 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
          style={{ background: "linear-gradient(135deg, oklch(0.36 0.13 222) 0%, oklch(0.50 0.14 205) 100%)" }}
        >
          {/* Reflet lumineux sur le bouton */}
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-white/10" />
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
