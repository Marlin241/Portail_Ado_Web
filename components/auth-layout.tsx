import { BookOpen } from "lucide-react"

interface AuthLayoutProps {
  eyebrow?: string
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthLayout({ eyebrow, title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-2">

      {/* ── Panneau marque ───────────────────────────────────── */}
      <aside className="relative overflow-hidden px-8 py-10 lg:px-14 lg:py-16"
        style={{ background: "linear-gradient(135deg, oklch(0.32 0.14 222) 0%, oklch(0.36 0.13 222) 40%, oklch(0.50 0.16 195) 70%, oklch(0.62 0.18 68) 100%)" }}
      >
        {/* Orbes lumineux bien visibles */}
        <div aria-hidden className="absolute -right-16 -top-16 h-80 w-80 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, oklch(0.78 0.17 68 / 0.55) 0%, transparent 70%)" }} />
        <div aria-hidden className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, oklch(0.70 0.12 198 / 0.45) 0%, transparent 70%)" }} />
        <div aria-hidden className="absolute right-8 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.78 0.17 68 / 0.25) 0%, transparent 70%)" }} />

        {/* Grille géométrique subtile */}
        <div aria-hidden className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(oklch(1 0 0 / 0.06) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

        {/* Cercle décoratif grand */}
        <div aria-hidden className="absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full border border-white/10" />
        <div aria-hidden className="absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-white/8" />

        <div className="relative flex h-full flex-col justify-between gap-12 lg:min-h-[calc(100dvh-8rem)]">
          {/* Logo */}
          <div className="flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm">
              <BookOpen className="h-5 w-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="font-display text-xl font-bold tracking-tight">Bethel Ados</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/55">Portail jeunesse</p>
            </div>
          </div>

          {/* Citation */}
          <div className="max-w-sm space-y-5">
            {/* Ornement SVG à la place du guillemet */}
            <svg width="36" height="28" viewBox="0 0 36 28" fill="none" aria-hidden className="opacity-70">
              <path d="M0 28V17.5C0 12.8333 1.08333 9.08333 3.25 6.25C5.41667 3.33333 8.75 1.33333 13.25 0.25L14.75 3C12 3.75 9.91667 5.08333 8.5 7C7.16667 8.83333 6.5 11.0833 6.5 13.75H13V28H0ZM21.5 28V17.5C21.5 12.8333 22.5833 9.08333 24.75 6.25C26.9167 3.33333 30.25 1.33333 34.75 0.25L36.25 3C33.5 3.75 31.4167 5.08333 30 7C28.6667 8.83333 28 11.0833 28 13.75H34.5V28H21.5Z"
                fill="oklch(0.78 0.17 68)" />
            </svg>

            <p className="font-display text-[1.45rem] font-bold leading-snug text-white lg:text-[1.65rem]">
              Que personne ne méprise ta jeunesse&nbsp;; mais sois un modèle pour les fidèles.
            </p>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 rounded-full bg-white/40" />
              <p className="text-sm font-semibold text-white/60">1 Timothée 4:12</p>
            </div>
          </div>

          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} Église Bethel · Département Ados
          </p>
        </div>
      </aside>

      {/* ── Panneau formulaire ───────────────────────────────── */}
      <section className="relative flex items-center justify-center px-6 py-12 sm:px-10 lg:py-16">
        {/* Pattern de fond subtil côté form */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, oklch(0.36 0.13 222) 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }} />

        <div className="relative w-full max-w-md animate-fade-up">
          {eyebrow ? (
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary">
              <span className="inline-block h-[2px] w-5 rounded-full bg-accent" aria-hidden />
              {eyebrow}
            </p>
          ) : null}

          <h1 className="font-display text-[1.75rem] font-bold leading-tight text-foreground sm:text-3xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </section>
    </div>
  )
}
