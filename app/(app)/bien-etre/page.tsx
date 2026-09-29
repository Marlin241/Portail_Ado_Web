"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, HeartPulse, Loader2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BackendMedia } from "@/components/backend-media"
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
import { listBienEtreArticles, listBienEtreCategories } from "@/lib/api/bien-etre"
import type { BienEtreArticle, BienEtreCategorie } from "@/lib/api/types"

function formatDate(value: string | null) {
  if (!value) return "Non date"
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  )
}

export default function BienEtrePage() {
  const [categories, setCategories] = useState<BienEtreCategorie[]>([])
  const [articles, setArticles] = useState<BienEtreArticle[]>([])
  const [categoryId, setCategoryId] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listBienEtreCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    listBienEtreArticles({
      page: 1,
      per_page: 60,
      categorie_id: categoryId === "all" ? undefined : categoryId,
    })
      .then((res) => active && setArticles(res.items))
      .catch(() => active && setArticles([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [categoryId])

  const filtered = articles.filter((article) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return (
      article.titre.toLowerCase().includes(query) ||
      article.contenu.toLowerCase().includes(query) ||
      article.categories.some((category) => category.nom.toLowerCase().includes(query))
    )
  })

  return (
    <div className="px-6 pb-8 pt-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mode, sante, bien-etre</p>
        <h1 className="mt-1 text-2xl font-bold">Bien-etre</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conseils pratiques pour prendre soin de ton corps, ton style et ton equilibre.
        </p>
      </header>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un article..."
            className="pl-9"
          />
        </div>
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
      </div>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <HeartPulse className="h-9 w-9 text-muted-foreground" />
            <h2 className="font-semibold">Aucun article</h2>
            <p className="text-sm text-muted-foreground">Essaie un autre filtre ou reviens plus tard.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((article) => (
            <Card key={article.id} className="overflow-hidden border-border/70">
              <div className="flex aspect-[16/9] items-center justify-center bg-muted">
                {article.image_url ? (
                  <BackendMedia src={article.image_url} alt={article.titre} />
                ) : (
                  <HeartPulse className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <CardContent className="flex min-h-56 flex-col gap-3 p-5">
                <div className="flex flex-wrap gap-2">
                  {article.categories.slice(0, 2).map((category) => (
                    <Badge key={category.id} variant="secondary">
                      {category.nom}
                    </Badge>
                  ))}
                </div>
                <div>
                  <h2 className="line-clamp-2 text-lg font-semibold">{article.titre}</h2>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{article.contenu}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
                  <span className="text-xs text-muted-foreground">{formatDate(article.publie_le)}</span>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/bien-etre/${article.id}`}>
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
