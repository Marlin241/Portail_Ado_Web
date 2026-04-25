"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { AuthLayout } from "@/components/auth-layout"
import { forgotPassword } from "@/lib/api/auth"
import type { ApiError } from "@/lib/api/types"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await forgotPassword(email)
      toast.success("Si un compte existe, un code a été envoyé.")
      router.push(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err) {
      toast.error((err as ApiError).message || "Une erreur est survenue.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Récupération"
      title="Mot de passe oublié"
      description="Indique l'email associé à ton compte. Tu recevras un code à 6 chiffres pour choisir un nouveau mot de passe."
      footer={
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Retour à la connexion
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-foreground">Email</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton.email@exemple.com"
              className="w-full rounded-2xl border border-border bg-card px-10 py-3 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-4"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={loading || !email}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Envoyer le code
        </button>
      </form>
    </AuthLayout>
  )
}
