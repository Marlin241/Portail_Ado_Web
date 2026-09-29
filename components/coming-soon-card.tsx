import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface ComingSoonCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export function ComingSoonCard({ icon: Icon, title, description, className }: ComingSoonCardProps) {
  return (
    <div
      className={cn(
        "group relative flex items-start gap-3.5 overflow-hidden rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 transition-colors hover:bg-muted/50",
        className,
      )}
      aria-disabled="true"
    >
      {/* Reflet subtil en haut à droite */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-bl-3xl bg-linear-to-bl from-accent/8 to-transparent"
      />

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-sm">
        <Icon className="h-5 w-5" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent-foreground">
            Bientôt
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
