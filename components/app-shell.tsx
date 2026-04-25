"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Headphones, Home, Shield, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { User as AppUser } from "@/lib/api/types"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match: (p: string) => boolean
}

const baseNav: NavItem[] = [
  { href: "/accueil", label: "Accueil", icon: Home, match: (p) => p === "/accueil" },
  {
    href: "/bibliotheque",
    label: "Bibliothèque",
    icon: BookOpen,
    match: (p) => p.startsWith("/bibliotheque"),
  },
  {
    href: "/podcasts",
    label: "Podcasts",
    icon: Headphones,
    match: (p) => p.startsWith("/podcasts"),
  },
  { href: "/profil", label: "Profil", icon: User, match: (p) => p.startsWith("/profil") },
]

function buildNav(user: AppUser): NavItem[] {
  const isAdmin = user.role === "admin" || user.is_superadmin
  if (!isAdmin) return baseNav
  return [
    ...baseNav.slice(0, 3),
    { href: "/admin", label: "Admin", icon: Shield, match: (p) => p.startsWith("/admin") },
    baseNav[3],
  ]
}

export function AppShell({
  user,
  hideNav,
  children,
}: {
  user: AppUser
  hideNav?: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname() || "/"
  const nav = buildNav(user)
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?"

  return (
    <div className="min-h-dvh bg-background">
      {!hideNav && (
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/accueil" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BookOpen className="h-4 w-4" aria-hidden />
              </span>
              <div className="leading-tight">
                <p className="font-serif text-base font-semibold text-foreground">Bethel Ados</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Portail jeunesse</p>
              </div>
            </Link>

            <nav aria-label="Navigation principale" className="hidden md:block">
              <ul className="flex items-center gap-1">
                {nav.map((item) => {
                  const Icon = item.icon
                  const active = item.match(pathname)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <Link
              href="/profil"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground transition hover:bg-accent md:hidden"
              aria-label="Profil"
            >
              {initials}
            </Link>
          </div>
        </header>
      )}

      <main className={cn(hideNav ? "min-h-dvh w-full" : "mx-auto w-full max-w-6xl pb-24 md:pb-10")}>
        {children}
      </main>

      {!hideNav && (
        <nav
          aria-label="Navigation mobile"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 backdrop-blur md:hidden"
        >
          <ul className="mx-auto flex max-w-6xl items-stretch justify-around px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2">
            {nav.map((item) => {
              const Icon = item.icon
              const active = item.match(pathname)
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-14 items-center justify-center rounded-full transition-colors",
                        active && "bg-primary/10",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
  )
}
