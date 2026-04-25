"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AuthLayout } from "@/components/auth-layout"
import { resetPassword } from "@/lib/api/auth"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import type { ApiError } from "@/lib/api/types"

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const initialEmail = params.get("email") || ""

  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  const canSubmit = email && otp.length === 6 && password.length >= 8 && password === confirm

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      await resetPassword(email, otp, password)
      toast.success("Mot de passe mis à jour. Tu peux te reconnecter.")
      router.replace("/login")
    } catch (err) {
      toast.error((err as ApiError).message || "Réinitialisation impossible.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-4"
        />
      </label>

      <div className="block">
        <span className="mb-1.5 block text-xs font-semibold">Code reçu par email</span>
        <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
          <InputOTPGroup className="gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-12 w-10 rounded-xl border-border bg-card text-base font-semibold"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

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
          Au moins 8 caractères, idéalement avec des chiffres.
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
        Réinitialiser
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Sécurité"
      title="Nouveau mot de passe"
      description="Saisis le code à 6 chiffres reçu par email, puis choisis ton nouveau mot de passe."
    >
      <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
