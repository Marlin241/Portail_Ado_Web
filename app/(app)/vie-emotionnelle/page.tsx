"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, Heart, HeartPulse, Loader2, Search, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { likeVieContenu, listMyVieLikes, listVieCategories, listVieContenus, unlikeVieContenu } from "@/lib/api/vie-emotionnelle"
import type { ApiError, CategorieVie, ContenuVieListItem, TypeContenuVie } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const TYPE_LABEL: Record<TypeContenuVie, string> = {
  article: "Article",
  video: "Video",
  temoignage: "Temoignage",
}

export default function VieEmotionnellePage() {
  const [categories, setCategories] = useState<CategorieVie[]>([])
  const [items, setItems] = useState<ContenuVieListItem[]>([])
  const [type, setType] = useState<TypeContenuVie | "all">("all")
  const [categoryId, setCategoryId] = useState("all")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [onlyLikes, setOnlyLikes] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listVieCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    const request = onlyLikes
      ? listMyVieLikes({ limit: 50 })
      : listVieContenus({
          type: type === "all" ? undefined : type,
          categorie_id: categoryId === "all" ? undefined : categoryId,
          q: query || undefined,
          limit: 50,
        })

    request
      .then((res) => active && setItems(res.items))
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [categoryId, onlyLikes, query, type])

  function onSearch(event: FormEvent) {
    event.preventDefault()
    setQuery(search.trim())
  }

  async function toggleLike(item: ContenuVieListItem) {
    try {
      if (item.liked_by_me) {
        await unlikeVieContenu(item.id)
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? { ...entry, liked_by_me: false, likes_count: Math.max(0, entry.likes_count - 1) }
              : entry,
          ),
        )
      } else {
        const res = await likeVieContenu(item.id)
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id ? { ...entry, liked_by_me: true, likes_count: res.likes_count } : entry,
          ),
        )
      }
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  return (
    <div className="px-6 pb-8 pt-6">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vie personnelle</p>
        <h1 className="mt-1 text-2xl font-bold">Vie emotionnelle et relationnelle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Articles, videos et temoignages pour avancer avec sagesse.
        </p>
      </header>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_160px_180px_auto]">
        <form onSubmit={onSearch} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un sujet..."
            className="pl-9 pr-9"
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("")
                setQuery("")
              }}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Effacer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </form>
        <Select value={type} onValueChange={(value) => setType(value as TypeContenuVie | "all")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="article">Articles</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="temoignage">Temoignages</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Categorie" />
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
        <Button
          type="button"
          variant={onlyLikes ? "default" : "outline"}
          onClick={() => setOnlyLikes((current) => !current)}
          className="gap-2"
        >
          <Heart className={cn("h-4 w-4", onlyLikes && "fill-current")} />
          Mes likes
        </Button>
      </div>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <HeartPulse className="h-9 w-9 text-muted-foreground" />
            <h2 className="font-semibold">Aucun contenu trouve</h2>
            <p className="text-sm text-muted-foreground">
              Essaie un autre filtre ou reviens quand de nouveaux contenus seront publies.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border/70">
              <div className="flex aspect-[16/9] items-center justify-center bg-muted">
                {item.image_couverture_url ? (
                  <img src={item.image_couverture_url} alt={item.titre} className="h-full w-full object-cover" />
                ) : (
                  <HeartPulse className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <CardContent className="flex min-h-56 flex-col gap-3 p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{TYPE_LABEL[item.type]}</Badge>
                  <Badge variant="outline">{item.categorie.nom}</Badge>
                </div>
                <div>
                  <h2 className="line-clamp-2 text-lg font-semibold">{item.titre}</h2>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(item)}
                    className="gap-2"
                  >
                    <Heart className={cn("h-4 w-4", item.liked_by_me && "fill-current text-primary")} />
                    {item.likes_count}
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/vie-emotionnelle/${item.id}`}>
                      Lire
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
