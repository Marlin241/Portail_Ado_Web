"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ONGLETS = [
  { href: "/admin/livres", label: "Livres" },
  { href: "/admin/podcasts", label: "Podcasts" },
]

/** Onglets de l'espace Contenus, en tête des pages Livres et Podcasts. */
export function ContenusTabs() {
  const pathname = usePathname() || ""
  return (
    <div className="flex flex-col gap-3 px-5 pt-10 md:px-10 lg:pt-12">
      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em]">Contenus</span>
      <nav aria-label="Contenus" className="flex gap-2">
        {ONGLETS.map((o) => {
          const actif = pathname === o.href || pathname.startsWith(`${o.href}/`)
          return (
            <Link
              key={o.href}
              href={o.href}
              aria-current={actif ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold transition-colors",
                actif
                  ? "bg-[var(--k-lime)] text-[#0C0C12]"
                  : "border-border text-muted-foreground hover:text-foreground border",
              )}
            >
              {o.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

/** Mise en page commune : les onglets, puis la page (son en-tête remonte un peu). */
export function ContenusLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ContenusTabs />
      <div className="[&>div:first-child]:pt-6! lg:[&>div:first-child]:pt-8!">{children}</div>
    </>
  )
}
