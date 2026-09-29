"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, HeartPulse, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BackendMedia } from "@/components/backend-media"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getBienEtreArticle } from "@/lib/api/bien-etre"
import type { ApiError, BienEtreArticle } from "@/lib/api/types"

function formatDate(value: string | null) {
  if (!value) return ""
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(value),
  )
}

export default function BienEtreDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [article, setArticle] = useState<BienEtreArticle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let active = true
    getBienEtreArticle(id)
      .then((data) => active && setArticle(data))
      .catch((error) => {
        if (!active) return
        setArticle(null)
        toast.error((error as ApiError).message ?? "Article indisponible")
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  return (
    <div className="px-6 pb-8 pt-6">
      <Button asChild variant="ghost" className="-ml-3 mb-4">
        <Link href="/bien-etre">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Bien-etre
        </Link>
      </Button>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !article ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <HeartPulse className="h-9 w-9 text-muted-foreground" />
            <h1 className="font-semibold">Article introuvable</h1>
            <p className="text-sm text-muted-foreground">Il n'est peut-etre plus publie.</p>
          </CardContent>
        </Card>
      ) : (
        <article className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-2xl bg-muted">
            {article.image_url ? (
              <BackendMedia
                src={article.image_url}
                alt={article.titre}
                className="max-h-[420px]"
                mediaClassName="max-h-[420px] w-full"
              />
            ) : (
              <div className="flex aspect-[16/8] items-center justify-center">
                <HeartPulse className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              {article.categories.map((category) => (
                <Badge key={category.id} variant="secondary">
                  {category.nom}
                </Badge>
              ))}
            </div>
            <h1 className="text-pretty text-2xl font-bold leading-tight">{article.titre}</h1>
            {article.publie_le ? (
              <p className="text-xs text-muted-foreground">Publie le {formatDate(article.publie_le)}</p>
            ) : null}
          </div>
          <Card className="mt-5 border-border/70">
            <CardContent className="p-6">
              <p className="whitespace-pre-line text-sm leading-7">{article.contenu}</p>
            </CardContent>
          </Card>
        </article>
      )}
    </div>
  )
}
