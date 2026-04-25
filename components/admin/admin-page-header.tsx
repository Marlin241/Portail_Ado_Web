import type { ReactNode } from "react"

interface AdminPageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageHeader({ eyebrow, title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="border-border flex flex-col gap-4 border-b px-6 py-6 md:flex-row md:items-end md:justify-between md:px-10 md:py-8">
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <span className="text-primary text-xs font-semibold uppercase tracking-widest">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="font-serif text-2xl font-semibold md:text-3xl">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
