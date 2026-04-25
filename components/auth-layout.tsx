import { BookOpen } from "lucide-react"

interface AuthLayoutProps {
  eyebrow?: string
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

/**
 * Full-page responsive auth shell.
 * Split layout on desktop (brand panel + form), stacked on mobile.
 */
export function AuthLayout({ eyebrow, title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 px-6 py-10 lg:px-12 lg:py-16">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-20 -left-12 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" aria-hidden />

        <div className="relative flex h-full flex-col justify-between gap-12 lg:min-h-[calc(100dvh-8rem)]">
          <div className="flex items-center gap-2 text-primary-foreground">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur">
              <BookOpen className="h-5 w-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="font-serif text-lg font-semibold">Bethel Ados</p>
              <p className="text-[11px] uppercase tracking-wider text-primary-foreground/70">Portail jeunesse</p>
            </div>
          </div>

          <div className="max-w-md">
            <p className="font-serif text-2xl leading-snug text-primary-foreground lg:text-3xl">
              {"« Que personne ne méprise ta jeunesse ; mais sois un modèle pour les fidèles, en parole, en conduite, en amour, en foi, en pureté. »"}
            </p>
            <p className="mt-4 text-sm text-primary-foreground/70">1 Timothée 4:12</p>
          </div>

          <p className="text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} Église Bethel · Département Ados
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:py-16">
        <div className="w-full max-w-md">
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="text-pretty font-serif text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </section>
    </div>
  )
}
