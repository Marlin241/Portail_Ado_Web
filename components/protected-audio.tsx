"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { getAccessToken, refreshAccessToken } from "@/lib/api/client"
import { isProtectedBackendMediaUrl, resolveBackendMediaUrl } from "@/lib/api/media"
import { cn } from "@/lib/utils"

interface ProtectedAudioProps {
  src: string | null | undefined
  title?: string
  className?: string
  onPlayIntent?: () => void
}

export function ProtectedAudio({ src, title, className, onPlayIntent }: ProtectedAudioProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [directUrl, setDirectUrl] = useState<string | null>(null)
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

    if (!resolved) return
    const audioUrl = resolved
    if (!protectedMedia) {
      setDirectUrl(audioUrl)
      return
    }

    async function fetchAudio() {
      setLoading(true)
      try {
        let token = getAccessToken()
        let response = await fetch(audioUrl, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (response.status === 401) {
          const refreshed = await refreshAccessToken()
          token = refreshed?.access_token ?? null
          response = await fetch(audioUrl, {
            cache: "no-store",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          })
        }
        if (!response.ok) throw new Error(`Audio unavailable: ${response.status}`)
        const blob = await response.blob()
        currentObjectUrl = URL.createObjectURL(blob)
        if (active) setObjectUrl(currentObjectUrl)
      } catch {
        if (active) setFailed(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchAudio()
    return () => {
      active = false
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
    }
  }, [src])

  const playable = objectUrl ?? directUrl

  return (
    <div className={cn("rounded-lg border border-border/70 bg-background p-3", className)}>
      {title ? <p className="mb-2 line-clamp-1 text-sm font-medium">{title}</p> : null}
      {loading ? (
        <div className="flex h-10 items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : null}
      {!loading && failed ? (
        <p className="text-sm text-muted-foreground">Audio indisponible</p>
      ) : null}
      {!loading && !failed && playable ? (
        <audio
          src={playable}
          controls
          preload="metadata"
          className="w-full"
          onPlay={onPlayIntent}
        />
      ) : null}
    </div>
  )
}
