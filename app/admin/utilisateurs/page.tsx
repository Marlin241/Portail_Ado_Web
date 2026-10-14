"use client"

import { useEffect, useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import {
  Copy,
  Eye,
  KeyRound,
  MoreVertical,
  Pencil,
  QrCode,
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
import { regenererCodeAdo } from "@/lib/api/presences"

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
    user: "Ado",
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
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  )
}

interface FicheActions {
  onEdit: (user: User) => void
  onResetPassword: (user: User) => void
  onChangeQr: (user: User) => void
  onSuspend: (user: User) => void
  onReactivate: (user: User) => void
  onDelete: (user: User) => void
}

function ActionFiche({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={`h-12 justify-start rounded-[14px] px-4 text-[15px] ${danger ? "text-destructive hover:text-destructive" : ""}`}
    >
      {children}
    </Button>
  )
}

function UserDetailsDialog({
  user,
  activity,
  onClose,
  actions,
}: {
  user: User | null
  activity: UserActivity | null
  onClose: () => void
  actions: FicheActions
}) {
  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {user ? `${user.first_name} ${user.last_name}` : "Fiche"}
          </DialogTitle>
          <DialogDescription>
            {user ? `@${user.username}` : ""}
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="divide-border grid divide-y text-sm">
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-muted-foreground">Compte</span>
              <span className="flex gap-1.5">
                {statusBadge(user.account_status)}
                {roleBadge(user.role, user.is_superadmin)}
              </span>
            </div>
            <DetailLine label="Email" value={user.email} />
            <DetailLine label="Date de naissance" value={formatUserDate(user.birth_date)} />
            <DetailLine
              label="Activation"
              value={user.must_change_password ? "Mot de passe temporaire" : "Mot de passe choisi"}
            />
            <DetailLine label="Créé le" value={formatUserDate(user.created_at)} />
            <DetailLine label="Activé le" value={formatUserDate(user.activated_at)} />
            {activity ? (
              <div className="pt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Activité
                </h3>
                <div className="divide-border grid divide-y sm:grid-cols-2 sm:gap-x-6">
                  <DetailLine label="Créations" value={`${activity.creations_approuvees}/${activity.creations_soumises}`} />
                  <DetailLine
                    label="Quiz terminés"
                    value={String(activity.quiz_completes)}
                  />
                  <DetailLine
                    label="Propositions"
                    value={String(activity.propositions_musique_soumises)}
                  />
                  <DetailLine
                    label="Défis terminés"
                    value={`${activity.defis_termines}/${activity.participations_defis}`}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {user ? (
          <div className="flex flex-col gap-2 border-t pt-4">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Actions</span>
            <div className="grid gap-2 sm:grid-cols-2">
              <ActionFiche onClick={() => actions.onEdit(user)}>
                <Pencil className="h-4 w-4" /> Modifier
              </ActionFiche>
              <ActionFiche onClick={() => actions.onResetPassword(user)}>
                <KeyRound className="h-4 w-4" /> Nouveau mot de passe
              </ActionFiche>
              {user.role === "user" ? (
                <ActionFiche onClick={() => actions.onChangeQr(user)}>
                  <QrCode className="h-4 w-4" /> Changer son QR
                </ActionFiche>
              ) : null}
              {user.account_status === "suspended" ? (
                <ActionFiche onClick={() => actions.onReactivate(user)}>
                  <ShieldCheck className="h-4 w-4" /> Réactiver
                </ActionFiche>
              ) : (
                <ActionFiche onClick={() => actions.onSuspend(user)} disabled={user.is_superadmin}>
                  <ShieldBan className="h-4 w-4" /> Suspendre
                </ActionFiche>
              )}
              <ActionFiche onClick={() => actions.onDelete(user)} disabled={user.is_superadmin} danger>
                <Trash2 className="h-4 w-4" /> Supprimer
              </ActionFiche>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AdoCarte({ user, onOpen }: { user: User; onOpen: (user: User) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(user)}
        className="border-border bg-card flex min-h-16 w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left"
      >
        <span className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          {user.first_name?.[0] ?? ""}
          {user.last_name?.[0] ?? ""}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">
            {user.first_name} {user.last_name}
          </span>
          <span className="text-muted-foreground truncate text-xs">@{user.username}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {statusBadge(user.account_status)}
          {user.role !== "user" || user.is_superadmin ? roleBadge(user.role, user.is_superadmin) : null}
        </span>
      </button>
    </li>
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
  const [confirmingQr, setConfirmingQr] = useState<User | null>(null)
  const [confirmingReset, setConfirmingReset] = useState<User | null>(null)

  // Arrivée depuis la page Aujourd'hui : recherche pré-remplie ou création directe.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get("q")
    if (q) setSearch(q)
    if (params.get("nouveau") === "1") setCreateOpen(true)
  }, [])

  const ficheActions: FicheActions = {
    onEdit: (u) => {
      setViewing(null)
      setEditing(u)
    },
    onResetPassword: (u) => setConfirmingReset(u),
    onChangeQr: (u) => setConfirmingQr(u),
    onSuspend: (u) => setConfirmingSuspend(u),
    onReactivate: (u) => {
      setViewing(null)
      void onReactivate(u)
    },
    onDelete: (u) => setConfirmingDelete(u),
  }

  async function onRegenererQr(user: User) {
    try {
      await regenererCodeAdo(user.id)
      toast.success(`Nouveau QR créé pour ${user.first_name} ${user.last_name}. L'ancien ne marche plus.`)
    } catch (error) {
      toast.error((error as ApiError).message ?? "Impossible de changer le QR")
    } finally {
      setConfirmingQr(null)
    }
  }
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
      setViewing(null)
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
    setConfirmingReset(null)
    setViewing(null)
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
      setViewing(null)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Opération impossible")
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Ados"
        description="Cherche un ado, ouvre sa fiche ou crée son compte. Les ados ne peuvent pas s'inscrire seuls."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="h-12 rounded-[14px] px-5 text-[15px]">
            <UserPlus className="mr-1 h-4 w-4" />
            Ajouter un ado
          </Button>
        }
      />

      <div className="px-5 py-6 md:px-10 md:py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Rechercher
              </Label>
              <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un ado (nom, email, pseudo)"
                  className="bg-card h-12 rounded-[14px] pl-10 text-[15px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
            <div className="w-full md:w-48">
              <Label className="sr-only">Rôle</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-card h-12! w-full rounded-[14px]" aria-label="Rôle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les comptes</SelectItem>
                  <SelectItem value="user">Ados</SelectItem>
                  <SelectItem value="moderator">Modérateurs</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Label className="sr-only">Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-card h-12! w-full rounded-[14px]" aria-label="Statut">
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
            </div>
        </div>

        {/* Téléphone : cartes. Un appui ouvre la fiche, où sont regroupées les actions. */}
        <div className="mt-5 md:hidden">
          {isLoading ? (
            <p className="text-muted-foreground py-6 text-sm">Chargement…</p>
          ) : (data?.items.length ?? 0) === 0 ? (
            <p className="text-muted-foreground py-6 text-sm">Aucun compte ne correspond à cette recherche.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data!.items.map((user) => (
                <AdoCarte key={user.id} user={user} onOpen={onView} />
              ))}
            </ul>
          )}
        </div>

        <Card className="border-border/70 mt-6 hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
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
                        Chargement…
                      </TableCell>
                    </TableRow>
                  ) : (data?.items.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-sm">
                        Aucun compte ne correspond à cette recherche.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data!.items.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => onView(user)}
                              className="w-fit text-left font-medium hover:underline"
                            >
                              {user.first_name} {user.last_name}
                            </button>
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
                                Ouvrir la fiche
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditing(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setConfirmingReset(user)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Nouveau mot de passe
                              </DropdownMenuItem>
                              {user.role === "user" ? (
                                <DropdownMenuItem onClick={() => setConfirmingQr(user)}>
                                  <QrCode className="mr-2 h-4 w-4" />
                                  Changer son QR
                                </DropdownMenuItem>
                              ) : null}
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
        actions={ficheActions}
      />

      <AlertDialog open={!!confirmingReset} onOpenChange={(open) => !open && setConfirmingReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Créer un nouveau mot de passe ?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmingReset
                ? `L'ancien mot de passe de ${confirmingReset.first_name} ${confirmingReset.last_name} ne marchera plus. Un mot de passe temporaire s'affichera, à lui transmettre.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmingReset && void onResetPassword(confirmingReset)}>
              Créer le mot de passe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmingQr} onOpenChange={(open) => !open && setConfirmingQr(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Changer le QR de présence ?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmingQr
                ? `L'ancien QR de ${confirmingQr.first_name} ${confirmingQr.last_name} ne marchera plus. Son app affichera le nouveau dès sa prochaine ouverture avec internet.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmingQr && void onRegenererQr(confirmingQr)}>
              Changer le QR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            Un mot de passe temporaire est créé automatiquement. Tu pourras le copier juste après.
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
                <SelectItem value="user">Ado</SelectItem>
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
                <SelectItem value="user">Ado</SelectItem>
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
            À transmettre à la personne. Il ne sera plus affiché après fermeture.
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
