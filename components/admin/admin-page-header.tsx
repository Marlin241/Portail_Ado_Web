import type { ReactNode } from "react"

interface AdminPageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageHeader({ eyebrow, title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 px-5 pb-2 pt-10 md:flex-row md:items-end md:justify-between md:px-10 lg:pt-14">
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow ? (
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em]">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="font-kairos-display text-[26px] font-extrabold leading-[1.15] md:text-[34px]">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-[15px] leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
