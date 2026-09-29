"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Heart, Loader2, Palette } from "lucide-react"
import { toast } from "sonner"
import { BackendMedia } from "@/components/backend-media"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getCreation, likeCreation, unlikeCreation } from "@/lib/api/creativite"
import type { ApiError, Creation } from "@/lib/api/types"

export default function CreationDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [item, setItem] = useState<Creation | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    try {
      setItem(await getCreation(id))
    } catch (error) {
      toast.error((error as ApiError).message ?? "Creation indisponible")
      setItem(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function toggleLike() {
    if (!item) return
    setLiked((current) => !current)
    try {
      if (liked) await unlikeCreation(item.id)
      else await likeCreation(item.id)
      await load()
    } catch (error) {
      setLiked((current) => !current)
      toast.error((error as ApiError).message ?? "Action impossible")
    }
  }

  return (
    <div className="px-6 pb-8 pt-6">
      <Button asChild variant="ghost" className="-ml-3 mb-4">
        <Link href="/creativite">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Creativite
        </Link>
      </Button>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !item ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Creation introuvable ou non approuvee.
          </CardContent>
        </Card>
      ) : (
        <article className="mx-auto max-w-3xl">
          <Card className="overflow-hidden border-border/70">
            {item.media_url ? (
              <div className="flex min-h-64 items-center justify-center bg-muted">
                <BackendMedia src={item.media_url} alt={item.titre} className="min-h-64" mediaClassName="max-h-[560px]" />
              </div>
            ) : null}
            <CardContent className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Palette className="h-3.5 w-3.5" />
                    Galerie approuvee
                  </p>
                  <h1 className="mt-2 text-2xl font-bold">{item.titre}</h1>
                  {item.description ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
                <Button variant={liked ? "default" : "outline"} onClick={toggleLike}>
                  <Heart className={liked ? "mr-2 h-4 w-4 fill-current" : "mr-2 h-4 w-4"} />
                  {item.nb_likes}
                </Button>
              </div>

              {item.contenu_texte ? (
                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="whitespace-pre-line text-sm leading-7">{item.contenu_texte}</p>
                </div>
              ) : null}

              <Badge variant="secondary">
                Publie le {new Date(item.created_at).toLocaleDateString("fr-FR")}
              </Badge>
            </CardContent>
          </Card>
        </article>
      )}
    </div>
  )
}
