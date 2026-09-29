"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2, MessageCircleHeart } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getTemoignage } from "@/lib/api/temoignages"
import type { ApiError, Temoignage } from "@/lib/api/types"

function formatDate(value: string | null) {
  if (!value) return ""
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(value),
  )
}

export default function TemoignageDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [item, setItem] = useState<Temoignage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let active = true
    getTemoignage(id)
      .then((data) => active && setItem(data))
      .catch((error) => {
        if (!active) return
        setItem(null)
        toast.error((error as ApiError).message ?? "Temoignage indisponible")
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  return (
    <div className="px-6 pb-8 pt-6">
      <Button asChild variant="ghost" className="-ml-3 mb-4">
        <Link href="/temoignages">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Temoignages
        </Link>
      </Button>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !item ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageCircleHeart className="h-9 w-9 text-muted-foreground" />
            <h1 className="font-semibold">Temoignage introuvable</h1>
            <p className="text-sm text-muted-foreground">Il n'est peut-etre pas publie.</p>
          </CardContent>
        </Card>
      ) : (
        <article className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{item.auteur}</Badge>
            <span className="text-xs text-muted-foreground">{formatDate(item.modere_le ?? item.created_at)}</span>
          </div>
          <h1 className="text-2xl font-bold">Temoignage</h1>
          <Card className="mt-5 border-border/70">
            <CardContent className="p-6">
              <p className="whitespace-pre-line text-sm leading-7 text-foreground">{item.contenu}</p>
            </CardContent>
          </Card>
        </article>
      )}
    </div>
  )
}
