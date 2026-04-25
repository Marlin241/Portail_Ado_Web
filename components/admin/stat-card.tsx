import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  trend?: { value: string; positive?: boolean }
  className?: string
}

export function StatCard({ label, value, hint, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("border-border/70 shadow-sm", className)}>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {label}
          </span>
          {Icon ? (
            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl font-semibold">{value}</span>
          {trend ? (
            <span
              className={cn(
                "text-xs font-semibold",
                trend.positive === false ? "text-destructive" : "text-secondary-foreground",
              )}
            >
              {trend.value}
            </span>
          ) : null}
        </div>
        {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
      </CardContent>
    </Card>
  )
}
