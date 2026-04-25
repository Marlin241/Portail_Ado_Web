"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScreenHeaderProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  right?: React.ReactNode
  className?: string
  variant?: "default" | "transparent"
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  right,
  className,
  variant = "default",
}: ScreenHeaderProps) {
  const router = useRouter()
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex items-center gap-3 px-4 pt-2 pb-3",
        variant === "default" && "bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border/60",
        className,
      )}
    >
      {showBack && (
        <button
          type="button"
          onClick={onBack ?? (() => router.back())}
          aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/70 text-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>}
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  )
}
