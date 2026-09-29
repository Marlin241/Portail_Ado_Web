"use client"

import { useEffect, useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import {
  Copy,
  Eye,
  KeyRound,
  MoreVertical,
  Pencil,
  Search,
  ShieldBan,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  adminCreateUser,
  adminDeleteUser,
  adminGetUserActivity,
  adminGetUser,
  adminListUsers,
  adminReactivateUser,
  adminResetUserPassword,
  adminSuspendUser,
  adminUpdateUser,
} from "@/lib/api/admin-users"
import type { AccountStatus, ApiError, User, UserActivity, UserRole } from "@/lib/api/types"

function statusBadge(status: AccountStatus) {
  const map: Record<AccountStatus, { label: string; className: string }> = {
    active: { label: "Actif", className: "bg-secondary text-secondary-foreground" },
    suspended: {
      label: "Suspendu",
      className: "bg-destructive/10 text-destructive border-destructive/30",
    },
    pending_activation: {
      label: "En attente",
      className: "bg-accent/30 text-accent-foreground",
    },
  }
  const value = map[status]
  return <Badge className={`${value.className} border-0`}>{value.label}</Badge>
}

function roleBadge(role: UserRole, superadmin: boolean) {
  if (superadmin) {
    return <Badge className="bg-primary text-primary-foreground border-0">Super admin</Badge>
  }

  const map: Record<UserRole, string> = {
    admin: "Admin",
    moderator: "Modérateur",
    user: "Utilisateur",
  }

  return <Badge variant="outline">{map[role]}</Badge>
}

function formatUserDate(value?: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function UserDetailsDialog({
  user,
  activity,
  onClose,
}: {
  user: User | null
  activity: UserActivity | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Detail du compte</DialogTitle>
          <DialogDescription>
            {user ? `${user.first_name} ${user.last_name} - @${user.username}` : ""}
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
              <span className="text-muted-foreground">Statut</span>
              {statusBadge(user.account_status)}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
              <span className="text-muted-foreground">Role</span>
              {roleBadge(user.role, user.is_superadmin)}
            </div>
            <DetailLine label="Email" value={user.email} />
            <DetailLine label="Nom d'utilisateur" value={`@${user.username}`} />
            <DetailLine label="Date de naissance" value={formatUserDate(user.birth_date)} />
            <DetailLine
              label="Activation"
              value={user.must_change_password ? "Mot de passe temporaire" : "Mot de passe final defini"}
            />
            <DetailLine label="Cree le" value={formatUserDate(user.created_at)} />
            <DetailLine label="Active le" value={formatUserDate(user.activated_at)} />
            {activity ? (
              <div className="mt-2 rounded-lg border border-border/70 p-3">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Activite Sprint 4
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <DetailLine label="Creations" value={`${activity.creations_approuvees}/${activity.creations_soumises}`} />
                  <DetailLine
                    label="Quiz termines"
                    value={String(activity.quiz_completes)}
                  />
                  <DetailLine
                    label="Propositions"
                    value={String(activity.propositions_musique_soumises)}
                  />
                  <DetailLine
                    label="Defis termines"
                    value={`${activity.defis_termines}/${activity.participations_defis}`}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [viewing, setViewing] = useState<User | null>(null)
  const [viewingActivity, setViewingActivity] = useState<UserActivity | null>(null)
  const [confirmingSuspend, setConfirmingSuspend] = useState<User | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<User | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const swrKey = ["admin-users", search, role, status] as const
  const { data, isLoading, mutate } = useSWR(swrKey, () =>
    adminListUsers({
      search: search || undefined,
      role: role === "all" ? undefined : role,
      account_status: status === "all" ? undefined : status,
    }),
  )

  async function refresh() {
    await mutate()
    globalMutate("admin-stats")
    globalMutate("admin-audit-recent")
  }

  async function onView(user: User) {
    setViewing(user)
    setViewingActivity(null)
    try {
      const [fresh, activity] = await Promise.all([
        adminGetUser(user.id),
        adminGetUserActivity(user.id),
      ])
      setViewing(fresh)
      setViewingActivity(activity)
    } catch (error) {
      toast.error((error as ApiError).message ?? "Consultation impossible")
    }
  }

  async function onSuspend(user: User) {
    try {
      await adminSuspendUser(user.id)
      toast.success(`${user.first_name} ${user.last_name} a été suspendu`)
      setConfirmingSuspend(null)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Opération impossible")
    }
  }

  async function onReactivate(user: User) {
    try {
      await adminReactivateUser(user.id)
      toast.success(`${user.first_name} ${user.last_name} réactivé`)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Opération impossible")
    }
  }

  async function onResetPassword(user: User) {
    try {
      const result = await adminResetUserPassword(user.id)
      setTempPassword(result.temporary_password)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Opération impossible")
    }
  }

  async function onDelete(user: User) {
    try {
      await adminDeleteUser(user.id)
      toast.success(`${user.first_name} ${user.last_name} supprimé`)
      setConfirmingDelete(null)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Opération impossible")
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Gestion des utilisateurs"
        title="Utilisateurs"
        description="Créez, modifiez, suspendez ou réinitialisez le mot de passe des comptes. Les ados ne peuvent pas s'inscrire eux-mêmes."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouveau compte
          </Button>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        <Card className="border-border/70">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-end">
            <div className="flex-1">
              <Label htmlFor="search" className="text-xs font-semibold uppercase tracking-wider">
                Recherche
              </Label>
              <div className="relative mt-1.5">
                <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, email ou nom d'utilisateur"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full md:w-52">
              <Label className="text-xs font-semibold uppercase tracking-wider">Rôle</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="moderator">Modérateur</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-52">
              <Label className="text-xs font-semibold uppercase tracking-wider">Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="pending_activation">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 mt-6">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-sm">
                        Chargement des utilisateurs...
                      </TableCell>
                    </TableRow>
                  ) : (data?.items.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-sm">
                        Aucun utilisateur ne correspond à ces critères.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data!.items.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {user.first_name} {user.last_name}
                            </span>
                            <span className="text-muted-foreground text-xs">@{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                        <TableCell>{roleBadge(user.role, user.is_superadmin)}</TableCell>
                        <TableCell>{statusBadge(user.account_status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Actions pour ${user.first_name}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onView(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Consulter
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditing(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onResetPassword(user)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Réinitialiser le mot de passe
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.account_status === "suspended" ? (
                                <DropdownMenuItem onClick={() => onReactivate(user)}>
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Réactiver le compte
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setConfirmingSuspend(user)}
                                  disabled={user.is_superadmin}
                                >
                                  <ShieldBan className="mr-2 h-4 w-4" />
                                  Suspendre
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setConfirmingDelete(user)}
                                disabled={user.is_superadmin}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(password) => {
          setTempPassword(password)
          refresh()
        }}
      />

      <EditUserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />

      <UserDetailsDialog
        user={viewing}
        activity={viewingActivity}
        onClose={() => {
          setViewing(null)
          setViewingActivity(null)
        }}
      />

      <AlertDialog open={!!confirmingSuspend} onOpenChange={(open) => !open && setConfirmingSuspend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspendre ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmingSuspend
                ? `${confirmingSuspend.first_name} ${confirmingSuspend.last_name} ne pourra plus se connecter tant qu'il n'est pas réactivé.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmingSuspend && onSuspend(confirmingSuspend)}>
              Suspendre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmingDelete} onOpenChange={(open) => !open && setConfirmingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les données de l&apos;utilisateur (progression, historique) seront effacées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmingDelete && onDelete(confirmingDelete)}
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TempPasswordDialog password={tempPassword} onClose={() => setTempPassword(null)} />
    </>
  )
}

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (tempPassword: string) => void
}) {
  const [form, setForm] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    birth_date: "",
    role: "user" as UserRole,
  })
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setForm({
      email: "",
      username: "",
      first_name: "",
      last_name: "",
      birth_date: "",
      role: "user",
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const created = await adminCreateUser({
        email: form.email,
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        birth_date: form.birth_date || null,
        role: form.role,
      })
      toast.success("Compte créé avec succès")
      onCreated(created.temporary_password)
      reset()
      onOpenChange(false)
    } catch (error) {
      toast.error((error as ApiError).message ?? "Création impossible")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Créer un compte</DialogTitle>
          <DialogDescription>
            Le backend génère automatiquement un mot de passe temporaire que vous pourrez copier après la création.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fn">Prénom</Label>
              <Input
                id="fn"
                required
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="ln">Nom</Label>
              <Input
                id="ln"
                required
                value={form.last_name}
                onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="username">Nom d&apos;utilisateur</Label>
              <Input
                id="username"
                required
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bd">Date de naissance</Label>
              <Input
                id="bd"
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm((prev) => ({ ...prev, birth_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Rôle</Label>
            <Select
              value={form.role}
              onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as UserRole }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="moderator">Modérateur</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Création..." : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: User | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    role: "user" as UserRole,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      setForm({ first_name: "", last_name: "", role: "user" })
      return
    }

    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    })
  }, [user])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      await adminUpdateUser(user.id, form)
      toast.success("Profil mis à jour")
      onSaved()
      onClose()
      setForm({ first_name: "", last_name: "", role: "user" })
    } catch (error) {
      toast.error((error as ApiError).message ?? "Mise à jour impossible")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Modifier le compte</DialogTitle>
          <DialogDescription>
            {user ? `${user.email} · @${user.username}` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="efn">Prénom</Label>
              <Input
                id="efn"
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="eln">Nom</Label>
              <Input
                id="eln"
                value={form.last_name}
                onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Rôle</Label>
            <Select
              value={form.role}
              onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as UserRole }))}
              disabled={user?.is_superadmin}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="moderator">Modérateur</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            Le statut du compte se gère via les actions suspendre / réactiver afin de respecter le backend.
          </p>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TempPasswordDialog({
  password,
  onClose,
}: {
  password: string | null
  onClose: () => void
}) {
  async function copy() {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      toast.success("Mot de passe copié")
    } catch {
      toast.error("Impossible de copier")
    }
  }

  return (
    <Dialog open={!!password} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Mot de passe temporaire</DialogTitle>
          <DialogDescription>
            Transmettez ce mot de passe à l&apos;utilisateur. Il ne sera plus affiché après fermeture.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted/50 flex items-center justify-between gap-2 rounded-lg border px-4 py-3">
          <code className="font-mono text-base">{password}</code>
          <Button size="sm" variant="outline" onClick={copy}>
            <Copy className="mr-1.5 h-4 w-4" />
            Copier
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>J&apos;ai noté le mot de passe</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
