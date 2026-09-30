"use client"

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, Heart, ImagePlus, Loader2, Palette, Send, Trophy, Upload } from "lucide-react"
import { toast } from "sonner"
import { BackendMedia } from "@/components/backend-media"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  getTalentDuMois,
  likeCreation,
  listCategoriesCreativite,
  listCreations,
  listMesCreations,
  submitCreation,
  unlikeCreation,
  uploadCreationMedia,
} from "@/lib/api/creativite"
import type {
  ApiError,
  CategorieCreativite,
  Creation,
  StatutCreation,
  TalentDuMois,
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<StatutCreation, string> = {
  pending: "En moderation",
  approved: "Publiee",
  rejected: "Refusee",
}

function mediaAccept(category?: CategorieCreativite | null) {
  if (!category) return ""
  if (category.type_media === "image") return "image/jpeg,image/png,image/webp"
  if (category.type_media === "audio" || category.type_media === "audio_ou_texte") {
    return "audio/mpeg,audio/mp4,audio/ogg,.mp3,.m4a,.ogg"
  }
  return ""
}

function CreationCard({
  item,
  showStatus,
  onLike,
}: {
  item: Creation
  showStatus?: boolean
  onLike?: (item: Creation) => void
}) {
  return (
    <Card className="overflow-hidden border-border/70">
      {item.media_url ? (
        <div className="flex min-h-48 items-center justify-center bg-muted">
          <BackendMedia src={item.media_url} alt={item.titre} className="min-h-48" mediaClassName="max-h-80" />
        </div>
      ) : null}
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              {showStatus ? <Badge variant={item.statut === "pending" ? "default" : "outline"}>{STATUS_LABEL[item.statut]}</Badge> : null}
              <Badge variant="secondary">{item.nb_likes} like{item.nb_likes > 1 ? "s" : ""}</Badge>
            </div>
            <Link href={`/creativite/${item.id}`} className="line-clamp-1 font-semibold hover:text-primary">
              {item.titre}
            </Link>
            {item.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
          {onLike ? (
            <Button variant="outline" size="icon" onClick={() => onLike(item)} aria-label="Liker">
              <Heart className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        {item.contenu_texte ? (
          <p className="whitespace-pre-line rounded-lg bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
            {item.contenu_texte}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default function CreativitePage() {
  const [categories, setCategories] = useState<CategorieCreativite[]>([])
  const [items, setItems] = useState<Creation[]>([])
  const [mine, setMine] = useState<Creation[]>([])
  const [talent, setTalent] = useState<TalentDuMois | null>(null)
  const [tab, setTab] = useState<"gallery" | "mine">("gallery")
  const [filterCategory, setFilterCategory] = useState("all")
  const [sort, setSort] = useState<"recent" | "likes">("recent")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [form, setForm] = useState({
    categorie_id: "",
    titre: "",
    description: "",
    contenu_texte: "",
    media_url_externe: "",
  })

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.categorie_id) ?? null,
    [categories, form.categorie_id],
  )

  async function load() {
    setLoading(true)
    const [categoryRes, galleryRes, mineRes, talentRes] = await Promise.all([
      listCategoriesCreativite().catch(() => [] as CategorieCreativite[]),
      listCreations({
        page: 1,
        per_page: 60,
        categorie_id: filterCategory === "all" ? undefined : filterCategory,
        tri: sort,
      }).catch(() => ({ items: [] as Creation[] })),
      listMesCreations().catch(() => [] as Creation[]),
      getTalentDuMois().catch(() => null),
    ])
    setCategories(categoryRes)
    setItems(galleryRes.items)
    setMine(mineRes)
    setTalent(talentRes)
    setForm((current) => ({ ...current, categorie_id: current.categorie_id || categoryRes[0]?.id || "" }))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [filterCategory, sort])

  function rememberFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0]
    event.target.value = ""
    if (!next) return
    setFile(next)
    setFileName(next.name)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selectedCategory || submitting) return
    const mediaRequired = selectedCategory.type_media === "image" || selectedCategory.type_media === "audio"
    const hasText = Boolean(form.contenu_texte.trim())
    const hasMedia = Boolean(form.media_url_externe.trim() || file)
    if ((mediaRequired || selectedCategory.type_media === "audio_ou_texte") && !hasMedia && !hasText) {
      toast.error("Ajoute un texte, un lien ou un fichier selon la categorie.")
      return
    }
    setSubmitting(true)
    try {
      const saved = await submitCreation({
        categorie_id: form.categorie_id,
        titre: form.titre.trim(),
        description: form.description.trim() || null,
        contenu_texte: form.contenu_texte.trim() || null,
        media_url_externe: form.media_url_externe.trim() || (file ? "upload-pending" : null),
      })
      if (file) await uploadCreationMedia(saved.id, file)
      toast.success("Creation envoyee en moderation")
      setForm({ categorie_id: categories[0]?.id ?? "", titre: "", description: "", contenu_texte: "", media_url_externe: "" })
      setFile(null)
      setFileName("")
      setTab("mine")
      await load()
    } catch (error) {
      toast.error((error as ApiError).message ?? "Envoi impossible")
    } finally {
      setSubmitting(false)
    }
  }

  async function like(item: Creation) {
    try {
      await likeCreation(item.id)
      toast.success("Like ajoute")
      await load()
    } catch (error) {
      const message = (error as ApiError).message ?? "Action impossible"
      if (message.toLowerCase().includes("deja")) {
        await unlikeCreation(item.id).catch(() => undefined)
        toast.success("Like retire")
        await load()
      } else {
        toast.error(message)
      }
    }
  }

  return (
    <div className="px-6 pb-8 pt-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sprint 4</p>
        <h1 className="mt-1 text-2xl font-bold">Creativite</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Partage dessins, textes, slams ou inspirations. Les publications sont moderees avant d'apparaitre dans la galerie.
        </p>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            {talent ? (
              <Card className="border-border/70">
                <CardContent className="space-y-3 p-5">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <Trophy className="h-4 w-4 text-primary" />
                    Talent du mois
                  </h2>
                  <CreationCard item={talent.creation} />
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-border/70">
              <CardContent className="p-5">
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold">
                      <Palette className="h-4 w-4 text-primary" />
                      Soumettre une creation
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Formats image: JPEG, PNG, WebP jusqu'a 10 Mo. Audio: MP3, M4A, OGG jusqu'a 50 Mo.
                    </p>
                  </div>
                  <div>
                    <Label>Categorie</Label>
                    <Select
                      value={form.categorie_id}
                      onValueChange={(value) => {
                        setFile(null)
                        setFileName("")
                        setForm((current) => ({ ...current, categorie_id: value }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="creation-title">Titre</Label>
                    <Input
                      id="creation-title"
                      required
                      value={form.titre}
                      onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="creation-description">Description</Label>
                    <Textarea
                      id="creation-description"
                      rows={3}
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    />
                  </div>
                  {selectedCategory?.type_media !== "image" && selectedCategory?.type_media !== "audio" ? (
                    <div>
                      <Label htmlFor="creation-text">Texte</Label>
                      <Textarea
                        id="creation-text"
                        rows={5}
                        value={form.contenu_texte}
                        onChange={(event) => setForm((current) => ({ ...current, contenu_texte: event.target.value }))}
                      />
                    </div>
                  ) : null}
                  {selectedCategory?.type_media !== "texte" ? (
                    <>
                      <div>
                        <Label htmlFor="creation-url">Lien media externe</Label>
                        <Input
                          id="creation-url"
                          type="url"
                          value={form.media_url_externe}
                          onChange={(event) => setForm((current) => ({ ...current, media_url_externe: event.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                      <label className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-3 text-sm">
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{fileName || "Fichier media"}</span>
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <input type="file" accept={mediaAccept(selectedCategory)} className="hidden" onChange={rememberFile} />
                      </label>
                    </>
                  ) : null}
                  <Button type="submit" disabled={submitting || !form.categorie_id} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? "Envoi..." : "Envoyer"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </aside>

          <section>
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
              <div className="flex rounded-lg border bg-card p-1">
                <button
                  type="button"
                  onClick={() => setTab("gallery")}
                  className={cn("flex-1 rounded-md px-3 py-2 text-sm font-medium", tab === "gallery" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                >
                  Galerie
                </button>
                <button
                  type="button"
                  onClick={() => setTab("mine")}
                  className={cn("flex-1 rounded-md px-3 py-2 text-sm font-medium", tab === "mine" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                >
                  Mes creations
                </button>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory} disabled={tab === "mine"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(value) => setSort(value as "recent" | "likes")} disabled={tab === "mine"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus recent</SelectItem>
                  <SelectItem value="likes">Plus aime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {(tab === "gallery" ? items : mine).map((item) => (
                <CreationCard key={item.id} item={item} showStatus={tab === "mine"} onLike={tab === "gallery" ? like : undefined} />
              ))}
            </div>
            {(tab === "gallery" ? items : mine).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <Palette className="h-10 w-10 text-muted-foreground" />
                  <h2 className="font-serif text-lg font-semibold">Aucune creation</h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {tab === "gallery" ? "Les creations approuvees apparaitront ici." : "Tes soumissions apparaitront ici."}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {tab === "gallery" && items.length > 0 ? (
              <Link href={`/creativite/${items[0].id}`} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Voir un detail <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </section>
        </div>
      )}
    </div>
  )
}
