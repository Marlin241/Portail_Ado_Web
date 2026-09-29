"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { getAccessToken, refreshAccessToken } from "@/lib/api/client"
import { inferMediaKind, isProtectedBackendMediaUrl, resolveBackendMediaUrl, type MediaKind } from "@/lib/api/media"
import { cn } from "@/lib/utils"

interface BackendMediaProps {
  src: string | null | undefined
  alt: string
  className?: string
  mediaClassName?: string
  kind?: MediaKind | "auto"
}

export function BackendMedia({
  src,
  alt,
  className,
  mediaClassName,
  kind = "auto",
}: BackendMediaProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [directUrl, setDirectUrl] = useState<string | null>(null)
  const [mediaKind, setMediaKind] = useState<MediaKind>(kind === "auto" ? inferMediaKind(src) : kind)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let currentObjectUrl: string | null = null
    const resolved = resolveBackendMediaUrl(src)
    const protectedMedia = isProtectedBackendMediaUrl(src)

    setFailed(false)
    setObjectUrl(null)
    setDirectUrl(null)
    setMediaKind(kind === "auto" ? inferMediaKind(src) : kind)

    if (!resolved) {
      setLoading(false)
      return
    }
    const mediaUrl = resolved

    if (!protectedMedia) {
      setDirectUrl(mediaUrl)
      setLoading(false)
      setMediaKind(kind === "auto" ? inferMediaKind(mediaUrl) : kind)
      return
    }

    async function fetchMedia() {
      setLoading(true)
      try {
        let token = getAccessToken()
        let response = await fetch(mediaUrl, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })

        if (response.status === 401) {
          const refreshed = await refreshAccessToken()
          token = refreshed?.access_token ?? null
          response = await fetch(mediaUrl, {
            cache: "no-store",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          })
        }

        if (!response.ok) throw new Error(`Media unavailable: ${response.status}`)
        const blob = await response.blob()
        currentObjectUrl = URL.createObjectURL(blob)
        if (!active) return
        setObjectUrl(currentObjectUrl)
        setMediaKind(kind === "auto" ? inferMediaKind(mediaUrl, blob.type || response.headers.get("content-type")) : kind)
      } catch {
        if (active) setFailed(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchMedia()

    return () => {
      active = false
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
    }
  }, [kind, src])

  const renderSrc = objectUrl ?? directUrl
  const canOpenDirectUrl = !!directUrl && !isProtectedBackendMediaUrl(src)

  return (
    <div className={cn("relative flex h-full w-full items-center justify-center bg-muted", className)}>
      {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : null}
      {!loading && failed ? (
        <span className="px-3 text-center text-xs text-muted-foreground">
          Media indisponible
          {canOpenDirectUrl ? (
            <>
              {" "}
              <a className="font-medium text-primary underline underline-offset-2" href={directUrl} target="_blank" rel="noreferrer">
                Ouvrir le lien
              </a>
            </>
          ) : null}
        </span>
      ) : null}
      {!loading && !failed && renderSrc && mediaKind === "video" ? (
        <video
          src={renderSrc}
          controls
          preload="metadata"
          className={cn("h-full w-full object-cover", mediaClassName)}
          onError={() => setFailed(true)}
        >
          {alt}
        </video>
      ) : null}
      {!loading && !failed && renderSrc && mediaKind === "audio" ? (
        <audio
          src={renderSrc}
          controls
          preload="metadata"
          className={cn("w-full", mediaClassName)}
          onError={() => setFailed(true)}
        >
          {alt}
        </audio>
      ) : null}
      {!loading && !failed && renderSrc && mediaKind === "image" ? (
        <img
          src={renderSrc}
          alt={alt}
          className={cn("h-full w-full object-cover", mediaClassName)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  )
}
