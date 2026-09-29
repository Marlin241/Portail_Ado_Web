"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, Edit3, Loader2, MessageCircleHeart, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteTemoignage,
  listMyTemoignages,
  listTemoignages,
  submitTemoignage,
  updateTemoignage,
} from "@/lib/api/temoignages"
import type { ApiError, StatutTemoignage, Temoignage } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<StatutTemoignage, string> = {
  pending: "En moderation",
  approved: "Publie",
  rejected: "Rejete",
}

function formatDate(value: string | null) {
  if (!value) return ""
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  )
}

export default function TemoignagesPage() {
  const [publicItems, setPublicItems] = useState<Temoignage[]>([])
  const [myItems, setMyItems] = useState<Temoignage[]>([])
  const [activeTab, setActiveTab] = useState<"public" | "mine">("public")
  const [content, setContent] = useState("")
  const [anonymous, setAnonymous] = useState(true)
  const [editing, setEditing] = useState<Temoignage | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const [publicRes, mineRes] = await Promise.all([
      listTemoignages({ page: 1, per_page: 40 }).catch(() => ({ items: [] as Temoignage[] })),
      listMyTemoignages({ page: 1, per_page: 40 }).catch(() => ({ items: [] as Temoignage[] })),
    ])
    setPublicItems(publicRes.items)
    setMyItems(mineRes.items)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(item: Temoignage) {
    setEditing(item)
    setContent(item.contenu)
    setAnonymous(item.auteur === "Anonyme")
    setActiveTab("mine")
  }

  function resetForm() {
    setEditing(null)
    setContent("")
    setAnonymous(true)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (content.trim().length < 20 || submitting) return
    setSubmitting(true)
    try {
      if (editing) {
        await updateTemoignage(editing.id, { contenu: content.trim(), anonyme: anonymous })
        toast.success("Temoignage mis a jour")
      } else {
        await submitTemoignage({ contenu: content.trim(), anonyme: anonymous })
        toast.success("Temoignage envoye en moderation")
      }
      resetForm()
      setActiveTab("mine")
      await load()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Envoi impossible")
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(item: Temoignage) {
    try {
      await deleteTemoignage(item.id)
      toast.success("Temoignage retire")
      await load()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Suppression impossible")
    }
  }

  const items = activeTab === "public" ? publicItems : myItems

  return (
    <div className="px-6 pb-8 pt-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Communaute</p>
        <h1 className="mt-1 text-2xl font-bold">Temoignages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Partage ce que Dieu fait dans ta vie et lis les temoignages valides par l'equipe.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70">
          <CardContent className="p-5">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <h2 className="font-semibold">{editing ? "Modifier mon temoignage" : "Partager un temoignage"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Les temoignages sont relus avant publication.
                </p>
              </div>
              <div>
                <Label htmlFor="temoignage">Texte</Label>
                <Textarea
                  id="temoignage"
                  required
                  minLength={20}
                  maxLength={5000}
                  rows={8}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Ecris ton temoignage..."
                />
                <p className="mt-1 text-xs text-muted-foreground">{content.trim().length}/5000 caracteres</p>
              </div>
              <label className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-3">
                <span>
                  <span className="block text-sm font-medium">Publier anonymement</span>
                  <span className="block text-xs text-muted-foreground">Sinon seul ton prenom sera affiche.</span>
                </span>
                <Switch checked={anonymous} onCheckedChange={setAnonymous} />
              </label>
              <div className="flex gap-2">
                {editing ? (
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Annuler
                  </Button>
                ) : null}
                <Button type="submit" disabled={content.trim().length < 20 || submitting} className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? "Enregistrement..." : editing ? "Mettre a jour" : "Envoyer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section>
          <div className="mb-4 flex rounded-lg border bg-card p-1">
            <button
              type="button"
              onClick={() => setActiveTab("public")}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeTab === "public" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              Publies
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mine")}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeTab === "mine" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              Mes temoignages
            </button>
          </div>

          {loading ? (
            <div className="flex h-56 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <MessageCircleHeart className="h-9 w-9 text-muted-foreground" />
                <h2 className="font-semibold">Aucun temoignage</h2>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "public"
                    ? "Les temoignages approuves apparaitront ici."
                    : "Tes soumissions seront listees ici."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <TemoignageCard
                  key={item.id}
                  item={item}
                  mine={activeTab === "mine"}
                  onEdit={startEdit}
                  onDelete={remove}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function TemoignageCard({
  item,
  mine,
  onEdit,
  onDelete,
}: {
  item: Temoignage
  mine: boolean
  onEdit: (item: Temoignage) => void
  onDelete: (item: Temoignage) => void
}) {
  const canChange = mine && item.statut === "pending"

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{item.auteur}</Badge>
            {mine ? <Badge variant={item.statut === "pending" ? "default" : "outline"}>{STATUS_LABEL[item.statut]}</Badge> : null}
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
        </div>
        <p className="line-clamp-4 whitespace-pre-line text-sm leading-6">{item.contenu}</p>
        <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
          {canChange ? (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(item)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(item)}>
                <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                Retirer
              </Button>
            </>
          ) : null}
          {item.statut === "approved" ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/temoignages/${item.id}`}>
                Lire
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
