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
        "relative flex items-start gap-3 overflow-hidden rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4",
        className,
      )}
      aria-disabled="true"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
            Bientôt
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
