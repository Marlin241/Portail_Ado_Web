"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { CheckCircle2, MessageSquareText, MoreVertical, Trash2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useSession } from "@/lib/auth/session-provider"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  adminApproveTemoignage,
  adminDeleteTemoignage,
  adminListTemoignages,
  adminRejectTemoignage,
} from "@/lib/api/temoignages"
import type { AdminTemoignage, ApiError, StatutTemoignage } from "@/lib/api/types"
import { useState } from "react"

const STATUS_LABEL: Record<StatutTemoignage, string> = {
  pending: "En attente",
  approved: "Approuve",
  rejected: "Rejete",
}

export default function AdminTemoignagesPage() {
  const { user } = useSession()
  const [status, setStatus] = useState<StatutTemoignage | "all">("pending")
  const [deleting, setDeleting] = useState<AdminTemoignage | null>(null)
  const canDelete = user?.role === "admin" || !!user?.is_superadmin
  const { data, mutate } = useSWR(["admin-temoignages", status], () =>
    adminListTemoignages({
      statut: status === "all" ? undefined : status,
      page: 1,
      per_page: 80,
    }),
  )
  const items = data?.items ?? []

  async function refresh() {
    await mutate()
    globalMutate("admin-audit-recent")
  }

  async function approve(item: AdminTemoignage) {
    try {
      await adminApproveTemoignage(item.id)
      toast.success("Temoignage approuve")
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  async function reject(item: AdminTemoignage) {
    try {
      await adminRejectTemoignage(item.id)
      toast.success("Temoignage rejete")
      refresh()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  async function remove(item: AdminTemoignage) {
    try {
      await adminDeleteTemoignage(item.id)
      toast.success("Temoignage supprime")
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
        title="Temoignages"
        description="Validez ou refusez les temoignages soumis par les jeunes avant publication."
        actions={
          <Select value={status} onValueChange={(value) => setStatus(value as StatutTemoignage | "all")}>
            <SelectTrigger className="w-44 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuves</SelectItem>
              <SelectItem value="rejected">Rejetes</SelectItem>
              <SelectItem value="all">Tous</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        {!data ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <MessageSquareText className="h-10 w-10 text-muted-foreground" />
              <h2 className="font-serif text-lg font-semibold">Aucun temoignage</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Les nouvelles soumissions apparaitront ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((item) => (
              <Card key={item.id} className="border-border/70">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge variant={item.statut === "pending" ? "default" : "outline"}>
                          {STATUS_LABEL[item.statut]}
                        </Badge>
                        <Badge variant="secondary">{item.auteur}</Badge>
                        {item.anonyme ? <Badge variant="outline">Anonyme</Badge> : null}
                      </div>
                      <p className="whitespace-pre-line text-sm leading-6">{item.contenu}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions temoignage">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => approve(item)} disabled={item.statut !== "pending"}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approuver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => reject(item)} disabled={item.statut !== "pending"}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeter
                        </DropdownMenuItem>
                        {canDelete ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(item)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce temoignage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette suppression est definitive et retire le temoignage de la moderation.
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
