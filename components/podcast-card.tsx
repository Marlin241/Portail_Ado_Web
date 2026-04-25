"use client"

import Image from "next/image"
import Link from "next/link"
import { Headphones } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Podcast } from "@/lib/api/types"

interface PodcastCardProps {
  podcast: Podcast
  variant?: "featured" | "list"
  className?: string
}

export function PodcastCard({ podcast, variant = "list", className }: PodcastCardProps) {
  const src =
    podcast.image_url ||
    `/placeholder.svg?height=300&width=300&query=${encodeURIComponent("christian youth podcast cover " + podcast.titre)}`

  if (variant === "featured") {
    return (
      <Link
        href={`/podcasts/${podcast.id}`}
        className={cn(
          "group relative block w-48 shrink-0 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md",
          className,
        )}
      >
        <div className="relative aspect-square w-full bg-muted">
          <Image src={src || "/placeholder.svg"} alt={`Couverture de ${podcast.titre}`} fill sizes="192px" className="object-cover" />
        </div>
        <div className="space-y-0.5 px-3 py-2.5">
          <p className="line-clamp-1 text-sm font-semibold">{podcast.titre}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {podcast.animateur || "Équipe Bethel"} • {podcast.episodes_count} épisodes
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/podcasts/${podcast.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image src={src || "/placeholder.svg"} alt="" fill sizes="80px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="line-clamp-1 text-sm font-semibold leading-tight">{podcast.titre}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {podcast.animateur || "Équipe Bethel"}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-primary">
          <Headphones className="h-3.5 w-3.5" />
          <span className="font-medium">{podcast.episodes_count} épisodes</span>
        </div>
      </div>
    </Link>
  )
}
