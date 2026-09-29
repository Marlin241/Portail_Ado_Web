"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth/session-provider"
import { changePassword, updateProfile } from "@/lib/api/auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { ApiError } from "@/lib/api/types"

function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "??"
}

export default function ProfilPage() {
  const router = useRouter()
  const { user, logout, setUser } = useSession()

  const [editOpen, setEditOpen] = useState(false)
  const [first, setFirst] = useState(user?.first_name ?? "")
  const [last, setLast] = useState(user?.last_name ?? "")
  const [username, setUsername] = useState(user?.username ?? "")
  const [savingProfile, setSavingProfile] = useState(false)

  const [pwdOpen, setPwdOpen] = useState(false)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [savingPwd, setSavingPwd] = useState(false)

  if (!user) return null

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      const updated = await updateProfile({
        first_name: first,
        last_name: last,
        username,
      })
      setUser(updated)
      toast.success("Profil mis à jour.")
      setEditOpen(false)
    } catch (err) {
      toast.error((err as ApiError).message || "Impossible de mettre à jour le profil.")
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePwd() {
    if (next.length < 8 || next !== confirm) {
      toast.error("Les nouveaux mots de passe doivent correspondre (8+ caractères).")
      return
    }
    setSavingPwd(true)
    try {
      await changePassword(current, next)
      toast.success("Mot de passe mis à jour.")
      setPwdOpen(false)
      setCurrent("")
      setNext("")
      setConfirm("")
    } catch (err) {
      toast.error((err as ApiError).message || "Impossible de changer le mot de passe.")
    } finally {
      setSavingPwd(false)
    }
  }

  async function handleLogout() {
    await logout()
    toast.message("À bientôt !")
    router.replace("/login")
  }

  const roleLabel =
    user.role === "admin" ? "Administrateur" : user.role === "moderator" ? "Modérateur" : "Membre"

  return (
    <div className="pb-6">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/15 to-background px-6 pb-6 pt-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/25">
            <span className="text-2xl font-bold tracking-wide">{initials(user.first_name, user.last_name)}</span>
            {user.role !== "user" && (
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground ring-4 ring-background">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold">
              {user.first_name} {user.last_name}
            </h1>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" /> {user.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
              <BadgeCheck className="h-3 w-3" /> {roleLabel}
            </span>
            {user.is_superadmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                <Sparkles className="h-3 w-3" /> Super-admin
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="mt-2 space-y-3 px-6">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <button type="button" className="w-full">
              <RowAction icon={UserIcon} title="Modifier mon profil" subtitle="Nom, prénom, pseudo" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier mon profil</DialogTitle>
              <DialogDescription>Ces informations sont visibles par l&apos;équipe d&apos;encadrement.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Field label="Prénom" value={first} onChange={setFirst} />
              <Field label="Nom" value={last} onChange={setLast} />
              <Field label="Nom d'utilisateur" value={username} onChange={setUsername} />
            </div>
            <DialogFooter>
              <button
                type="button"
                disabled={savingProfile}
                onClick={handleSaveProfile}
                className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                Enregistrer
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
          <DialogTrigger asChild>
            <button type="button" className="w-full">
              <RowAction icon={KeyRound} title="Changer mon mot de passe" subtitle="Sécurise ton compte" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Changer mon mot de passe</DialogTitle>
              <DialogDescription>Choisis un mot de passe solide, que toi seul connais.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Field label="Mot de passe actuel" value={current} onChange={setCurrent} type="password" />
              <Field label="Nouveau mot de passe" value={next} onChange={setNext} type="password" />
              <Field label="Confirmer" value={confirm} onChange={setConfirm} type="password" />
            </div>
            <DialogFooter>
              <button
                type="button"
                disabled={savingPwd}
                onClick={handleChangePwd}
                className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                Enregistrer
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {user && (user.role === "admin" || user.role === "moderator" || user.is_superadmin) ? (
          <Link href={user.role === "moderator" && !user.is_superadmin ? "/admin/temoignages" : "/admin"} className="block">
            <RowAction
              icon={LayoutDashboard}
              title={user.role === "moderator" && !user.is_superadmin ? "Panel moderation" : "Panel administrateur"}
              subtitle="Gérer utilisateurs, contenus et modération"
            />
          </Link>
        ) : null}

        <button type="button" onClick={handleLogout} className="w-full">
          <RowAction icon={LogOut} title="Me déconnecter" subtitle="À bientôt !" tone="destructive" />
        </button>
      </section>

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        Portail Ados Bethel · v1.0 · Pensé pour les jeunes, avec foi.
      </p>
    </div>
  )
}

function RowAction({
  icon: Icon,
  title,
  subtitle,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  tone?: "default" | "destructive"
}) {
  return (
    <div
      className={
        "flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40"
      }
    >
      <div
        className={
          tone === "destructive"
            ? "flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive"
            : "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
        }
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${tone === "destructive" ? "text-destructive" : ""}`}>{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-4"
      />
    </label>
  )
}
