"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import useSWR from "swr"
import { ArrowLeft, Pencil, ScanLine, Share2, Trash2 } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  formaterJour,
  getReunion,
  renommerReunion,
  retirerPresence,
  telechargerPdfReunion,
  type PresenceDetail,
} from "@/lib/api/presences"
import type { ApiError } from "@/lib/api/types"

function heure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

export default function ReunionPage() {
  const { id } = useParams<{ id: string }>()
  const { data: reunion, error, mutate } = useSWR(id ? ["presences-reunion", id] : null, () =>
    getReunion(id),
  )
  const [edition, setEdition] = useState(false)
  const [titre, setTitre] = useState("")
  const [aRetirer, setARetirer] = useState<PresenceDetail | null>(null)
  const [partage, setPartage] = useState(false)

  async function enregistrerTitre() {
    try {
      await mutate(await renommerReunion(id, titre), { revalidate: false })
      setEdition(false)
      toast.success("Titre enregistré")
    } catch (e) {
      toast.error((e as ApiError).message ?? "Impossible d'enregistrer le titre")
    }
  }

  async function confirmerRetrait() {
    if (!aRetirer) return
    try {
      await retirerPresence(id, aRetirer.user_id)
      toast.success(`${aRetirer.prenom} ${aRetirer.nom} retiré(e) de la liste`)
      await mutate()
    } catch (e) {
      toast.error((e as ApiError).message ?? "Impossible de retirer la présence")
    } finally {
      setARetirer(null)
    }
  }

  async function partagerPdf() {
    if (!reunion) return
    setPartage(true)
    try {
      const blob = await telechargerPdfReunion(id)
      const nom = `presences-${reunion.jour}.pdf`
      const fichier = new File([blob], nom, { type: "application/pdf" })
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [fichier] })) {
        try {
          await navigator.share({ files: [fichier], title: reunion.titre })
          return
        } catch (e) {
          // Partage annulé par l'utilisateur : rien à faire.
          if ((e as DOMException).name === "AbortError") return
        }
      }
      const url = URL.createObjectURL(blob)
      const lien = document.createElement("a")
      lien.href = url
      lien.download = nom
      document.body.appendChild(lien)
      lien.click()
      lien.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (e) {
      toast.error((e as ApiError).message ?? "Impossible de préparer le PDF")
    } finally {
      setPartage(false)
    }
  }

  if (error) {
    return (
      <div className="px-4 py-10 text-center md:px-10">
        <p className="text-muted-foreground">Réunion introuvable.</p>
        <Button asChild variant="link">
          <Link href="/admin/presences">Retour aux présences</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Présences"
        title={reunion?.titre ?? "Chargement…"}
        description={
          reunion
            ? `${formaterJour(reunion.jour)} · ${reunion.nb_presents} présent${reunion.nb_presents > 1 ? "s" : ""}`
            : undefined
        }
        actions={
          reunion ? (
            <>
              <Button variant="outline" onClick={() => (setTitre(reunion.titre), setEdition(true))}>
                <Pencil className="mr-2 h-4 w-4" />
                Renommer
              </Button>
              <Button onClick={() => void partagerPdf()} disabled={partage}>
                <Share2 className="mr-2 h-4 w-4" />
                {partage ? "Préparation…" : "Partager le PDF"}
              </Button>
            </>
          ) : null
        }
      />
      <div className="flex flex-col gap-4 px-4 py-6 md:px-10 md:py-8">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/presences">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Toutes les réunions
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/presences/scanner">
              <ScanLine className="mr-1 h-4 w-4" />
              Scanner
            </Link>
          </Button>
        </div>

        {edition ? (
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <Input
              autoFocus
              value={titre}
              maxLength={150}
              onChange={(e) => setTitre(e.target.value)}
              aria-label="Titre de la réunion"
            />
            <div className="flex gap-2">
              <Button onClick={() => void enregistrerTitre()} disabled={!titre.trim()}>
                Enregistrer
              </Button>
              <Button variant="outline" onClick={() => setEdition(false)}>
                Annuler
              </Button>
            </div>
          </Card>
        ) : null}

        {reunion && reunion.presences.length === 0 ? (
          <Card className="text-muted-foreground p-5 text-sm">
            Personne n&apos;est encore marqué présent pour cette réunion.
          </Card>
        ) : (
          <Card>
            <ul className="divide-border divide-y">
              {(reunion?.presences ?? []).map((p, index) => (
                <li key={p.user_id} className="flex min-h-14 items-center gap-3 px-4 py-3">
                  <span className="text-muted-foreground w-6 text-right text-sm tabular-nums">
                    {index + 1}.
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">
                      {p.prenom} {p.nom}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {heure(p.heure)} · {p.methode === "scan" ? "scanné" : "coché à la main"}
                      {p.enregistre_par ? ` par ${p.enregistre_par}` : ""}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Retirer ${p.prenom} ${p.nom}`}
                    onClick={() => setARetirer(p)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <AlertDialog open={aRetirer !== null} onOpenChange={(o) => (!o ? setARetirer(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cette présence ?</AlertDialogTitle>
            <AlertDialogDescription>
              {aRetirer ? `${aRetirer.prenom} ${aRetirer.nom}` : ""} ne figurera plus dans la liste
              ni dans le PDF de cette réunion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmerRetrait()}>Retirer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
