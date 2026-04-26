"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play, Rewind, FastForward } from "lucide-react"
import { cn } from "@/lib/utils"
import { API_BASE_URL, getAccessToken } from "@/lib/api/client"

interface AudioPlayerProps {
  episodeId: string
  src: string
  mimeType?: string
  initialPosition?: number
  initialDuration?: number | null
  title?: string
  subtitle?: string
  onUnauthorized?: () => Promise<string | null>
  onProgressSave?: (positionSeconds: number, durationSeconds: number, completed: boolean) => void
  className?: string
}

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function AudioPlayer({
  episodeId,
  src,
  initialPosition = 0,
  initialDuration = null,
  title,
  subtitle,
  onUnauthorized,
  onProgressSave,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(initialPosition)
  const [duration, setDuration] = useState<number>(initialDuration ?? 0)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [isSeeking, setIsSeeking] = useState(false)
  const lastSavedRef = useRef<number>(initialPosition)

  // Keep currentSrc in sync with prop changes (e.g. refreshed signed URL)
  useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  // Seek to initial position once metadata loaded
  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const applyPosition = () => {
      if (initialPosition > 0 && isFinite(el.duration) && el.duration > 0) {
        // Pas de "- 1" : évite de clamper à tort sur les fichiers courts
        el.currentTime = Math.min(initialPosition, el.duration)
      }
      setDuration(el.duration || initialDuration || 0)
    }

    el.addEventListener("loadedmetadata", applyPosition)
    // Si les métadonnées sont déjà disponibles (audio en cache navigateur),
    // le listener ne se déclenchera plus — appliquer la position immédiatement
    if (el.readyState >= 1) {
      applyPosition()
    }
    return () => el.removeEventListener("loadedmetadata", applyPosition)
  }, [initialPosition, initialDuration, currentSrc])

  const saveProgress = useCallback(
    (completed = false) => {
      const el = audioRef.current
      if (!el) return
      const pos = Math.floor(el.currentTime)
      const dur = Math.floor(el.duration || 0)

      // Callback mock-aware : met à jour le store local (mock) ou l'API via le parent
      onProgressSave?.(pos, dur, completed)

      // Fetch keepalive pour la production : survit au démontage / changement de page
      const token = getAccessToken()
      if (token && API_BASE_URL) {
        fetch(`${API_BASE_URL}/api/v1/progressions/audio/${episodeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            position_secondes: pos,
            est_termine: completed,
          }),
          keepalive: true,
        }).catch(() => {})
      }

      lastSavedRef.current = pos
    },
    [episodeId, onProgressSave],
  )

  // Autosave every 15 seconds while playing
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      const el = audioRef.current
      if (!el) return
      if (Math.abs(el.currentTime - lastSavedRef.current) >= 15) {
        saveProgress(false)
      }
    }, 5000)
    return () => window.clearInterval(id)
  }, [playing, saveProgress])

  // Save on unmount and when tab is hidden
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") saveProgress(false)
    }
    document.addEventListener("visibilitychange", onHidden)
    return () => {
      document.removeEventListener("visibilitychange", onHidden)
      saveProgress(false)
    }
  }, [saveProgress])

  const handlePlay = async () => {
    const el = audioRef.current
    if (!el) return
    try {
      await el.play()
      setPlaying(true)
    } catch {
      // playback rejected (likely browser policy)
      setPlaying(false)
    }
  }

  const handlePause = () => {
    audioRef.current?.pause()
    setPlaying(false)
    saveProgress(false)
  }

  const skip = (delta: number) => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = Math.max(0, Math.min((el.duration || 0) - 1, el.currentTime + delta))
    setPosition(el.currentTime)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current
    if (!el) return
    const v = Number(e.target.value)
    el.currentTime = v
    setPosition(v)
  }

  const handleError = useCallback(async () => {
    if (!onUnauthorized) return
    const next = await onUnauthorized()
    if (next) setCurrentSrc(next)
  }, [onUnauthorized])

  return (
    <div className={cn("rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60", className)}>
      <audio
        ref={audioRef}
        src={currentSrc}
        preload="metadata"
        onTimeUpdate={(e) => !isSeeking && setPosition(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false)
          saveProgress(true)
        }}
        onError={handleError}
      />

      {(title || subtitle) && (
        <div className="mb-4 text-center">
          {title && <p className="line-clamp-2 text-base font-semibold">{title}</p>}
          {subtitle && <p className="line-clamp-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={1}
          value={Math.min(position, duration || 0)}
          onChange={handleSeek}
          onPointerDown={() => setIsSeeking(true)}
          onPointerUp={() => {
            setIsSeeking(false)
            saveProgress(false)
          }}
          aria-label="Position de lecture"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
        />
        <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>{formatTime(position)}</span>
          <span>{formatTime(duration - position)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => skip(-15)}
          aria-label="Reculer de 15 secondes"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/70"
        >
          <Rewind className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={playing ? handlePause : handlePlay}
          aria-label={playing ? "Pause" : "Lecture"}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105"
        >
          {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
        </button>
        <button
          type="button"
          onClick={() => skip(15)}
          aria-label="Avancer de 15 secondes"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/70"
        >
          <FastForward className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
