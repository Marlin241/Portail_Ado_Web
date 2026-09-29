"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ExternalLink, Heart, HeartPulse, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getVieContenu, likeVieContenu, unlikeVieContenu } from "@/lib/api/vie-emotionnelle"
import type { ApiError, ContenuVieDetail, TypeContenuVie } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const TYPE_LABEL: Record<TypeContenuVie, string> = {
  article: "Article",
  video: "Video",
  temoignage: "Temoignage",
}

export default function VieEmotionnelleDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [content, setContent] = useState<ContenuVieDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    getVieContenu(id)
      .then((data) => active && setContent(data))
      .catch((error) => {
        if (!active) return
        setContent(null)
        toast.error((error as ApiError).message ?? "Contenu indisponible")
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  async function toggleLike() {
    if (!content || liking) return
    setLiking(true)
    try {
      if (content.liked_by_me) {
        await unlikeVieContenu(content.id)
        setContent((current) =>
          current
            ? { ...current, liked_by_me: false, likes_count: Math.max(0, current.likes_count - 1) }
            : current,
        )
      } else {
        const res = await likeVieContenu(content.id)
        setContent((current) =>
          current ? { ...current, liked_by_me: true, likes_count: res.likes_count } : current,
        )
      }
    } catch (error) {
      toast.error((error as ApiError).message ?? "Action impossible")
    } finally {
      setLiking(false)
    }
  }

  return (
    <div className="px-6 pb-8 pt-6">
      <Button asChild variant="ghost" className="-ml-3 mb-4">
        <Link href="/vie-emotionnelle">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Vie emotionnelle
        </Link>
      </Button>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !content ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Ce contenu n'est pas disponible.
          </CardContent>
        </Card>
      ) : (
        <article className="mx-auto max-w-3xl">
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge>{TYPE_LABEL[content.type]}</Badge>
            <Badge variant="outline">{content.categorie.nom}</Badge>
          </div>
          <h1 className="text-3xl font-bold leading-tight">{content.titre}</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">{content.description}</p>

          <div className="mt-6 overflow-hidden rounded-lg border bg-muted">
            {content.video_fichier_url ? (
              <video controls src={content.video_fichier_url} className="aspect-video w-full bg-black" />
            ) : content.image_couverture_url ? (
              <img src={content.image_couverture_url} alt={content.titre} className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center">
                <HeartPulse className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>

          {content.video_url ? (
            <Button asChild variant="outline" className="mt-4">
              <a href={content.video_url} target="_blank" rel="noreferrer">
                Ouvrir la video
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : null}

          {content.contenu_texte ? (
            <div className="prose prose-sm mt-6 max-w-none whitespace-pre-line leading-8 text-foreground">
              {content.contenu_texte}
            </div>
          ) : null}

          <div className="mt-8 border-t pt-5">
            <Button
              variant={content.liked_by_me ? "default" : "outline"}
              onClick={toggleLike}
              disabled={liking}
              className="gap-2"
            >
              <Heart className={cn("h-4 w-4", content.liked_by_me && "fill-current")} />
              {content.likes_count} like{content.likes_count > 1 ? "s" : ""}
            </Button>
          </div>
        </article>
      )}
    </div>
  )
}
