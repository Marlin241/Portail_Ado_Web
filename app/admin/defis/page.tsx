"use client"

import { useEffect, useState, type FormEvent } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { CalendarPlus, CheckCircle2, Flag, MoreVertical, Pencil, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { adminCreateDefi, adminDeleteDefi, adminGetDefi, adminListDefis, adminUpdateDefi } from "@/lib/api/defis"
import type { AdminDefi, ApiError, DefiPayload } from "@/lib/api/types"

function emptyForm(): DefiPayload {
  return {
    titre: "",
    description: "",
    date_reference: new Date().toISOString().slice(0, 10),
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  )
}

export default function AdminDefisPage() {
  const [editing, setEditing] = useState<AdminDefi | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<AdminDefi | null>(null)
  const { data, mutate } = useSWR("admin-defis", () => adminListDefis({ page: 1, per_page: 80 }))
  const items = data?.items ?? []

  async function refresh() {
    await mutate()
    globalMutate("admin-audit-recent")
  }

  async function remove(item: AdminDefi) {
    try {
      await adminDeleteDefi(item.id)
      toast.success("Defi supprime")
      setDeleting(null)
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Sprint 3"
        title="Defis de la semaine"
        description="Planifiez les defis hebdomadaires visibles cote ado a partir de leur semaine."
        actions={
          <Button onClick={() => setCreating(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nouveau defi
          </Button>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        {!data ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Flag className="h-10 w-10 text-muted-foreground" />
              <h2 className="font-serif text-lg font-semibold">Aucun defi</h2>
              <p className="max-w-md text-sm text-muted-foreground">Creez un premier defi hebdomadaire.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((item) => (
              <Card key={item.id} className="border-border/70">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge variant="secondary">Semaine du {formatDate(item.semaine_debut)}</Badge>
                      <h2 className="mt-3 text-lg font-semibold">{item.titre}</h2>
                      <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                      <DefiStats defiId={item.id} />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions defi">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(item)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(item)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DefiDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => {
          setCreating(false)
          refresh()
        }}
      />
      <DefiDialog
        open={!!editing}
        defi={editing}
        onOpenChange={(value) => !value && setEditing(null)}
        onSaved={() => {
          setEditing(null)
          refresh()
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce defi ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les participations associees seront aussi supprimees cote backend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && remove(deleting)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function DefiStats({ defiId }: { defiId: string }) {
  const { data } = useSWR(["admin-defi-detail", defiId], () => adminGetDefi(defiId))

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{data ? data.nb_participants : "..."} participants</span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        <span>{data ? data.nb_termines : "..."} termines</span>
      </div>
    </div>
  )
}

function DefiDialog({
  open,
  defi,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  defi?: AdminDefi | null
  onOpenChange: (value: boolean) => void
  onSaved: () => void
}) {
  const isEdit = !!defi
  const [form, setForm] = useState<DefiPayload>(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      defi
        ? {
            titre: defi.titre,
            description: defi.description,
            date_reference: defi.semaine_debut,
          }
        : emptyForm(),
    )
  }, [defi, open])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        titre: form.titre.trim(),
        description: form.description.trim(),
        date_reference: form.date_reference,
      }
      if (isEdit && defi) await adminUpdateDefi(defi.id, payload)
      else await adminCreateDefi(payload)
      toast.success(isEdit ? "Defi mis a jour" : "Defi cree")
      onSaved()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Operation impossible")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le defi" : "Nouveau defi"}</DialogTitle>
          <DialogDescription>
            La date sert a calculer automatiquement le lundi de la semaine cible.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="defi-title">Titre</Label>
            <Input
              id="defi-title"
              required
              minLength={3}
              maxLength={255}
              value={form.titre}
              onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="defi-date">Date de reference</Label>
            <Input
              id="defi-date"
              required
              type="date"
              value={form.date_reference}
              onChange={(event) => setForm((current) => ({ ...current, date_reference: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="defi-description">Description</Label>
            <Textarea
              id="defi-description"
              required
              minLength={10}
              rows={6}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
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
