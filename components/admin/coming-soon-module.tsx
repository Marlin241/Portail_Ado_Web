import { Badge } from "@/components/ui/badge"
import { AdminPageHeader } from "./admin-page-header"

interface ComingSoonModuleProps {
  title: string
  description: string
  features: string[]
  backendStatus: string
  sprint?: string
}

export function ComingSoonModule({
  title,
  description,
  features,
  backendStatus,
  sprint,
}: ComingSoonModuleProps) {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={title}
        description={description}
        actions={
          <Badge variant="secondary" className="text-xs uppercase tracking-wider">
            En attente backend
          </Badge>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Fonctionnalités prévues</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ces écrans seront activés dès que les endpoints correspondants seront livrés.
          </p>
          <ul className="mt-4 space-y-2">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Statut backend</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{backendStatus}</p>
          {sprint ? (
            <div className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
              Planifié : {sprint}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
