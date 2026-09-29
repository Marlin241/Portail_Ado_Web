"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  Headphones,
  Home,
  Music2,
  Palette,
  Shield,
  User,
} from "lucide-react"
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
    href: "/agenda",
    label: "Agenda",
    icon: CalendarDays,
    match: (p) => p.startsWith("/agenda"),
  },
  {
    href: "/bibliotheque",
    label: "Bibliothèque",
    icon: BookOpen,
    match: (p) => p.startsWith("/bibliotheque"),
  },
  {
    href: "/biblique",
    label: "Biblique",
    icon: BookOpenCheck,
    match: (p) => p.startsWith("/biblique"),
  },
  {
    href: "/podcasts",
    label: "Podcasts",
    icon: Headphones,
    match: (p) => p.startsWith("/podcasts"),
  },
  {
    href: "/musique",
    label: "Musique",
    icon: Music2,
    match: (p) => p.startsWith("/musique"),
  },
  {
    href: "/creativite",
    label: "Creativite",
    icon: Palette,
    match: (p) => p.startsWith("/creativite"),
  },
  { href: "/profil", label: "Profil", icon: User, match: (p) => p.startsWith("/profil") },
]

function buildNav(user: AppUser): NavItem[] {
  const isAdmin = user.role === "admin" || user.is_superadmin
  const isModerator = user.role === "moderator"
  if (!isAdmin && !isModerator) return baseNav
  return [
    ...baseNav.slice(0, -1),
    {
      href: isModerator ? "/admin/temoignages" : "/admin",
      label: isModerator ? "Moderation" : "Admin",
      icon: Shield,
      match: (p) => p.startsWith("/admin"),
    },
    baseNav[baseNav.length - 1],
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
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/accueil" className="group flex items-center gap-2.5">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/25 transition-shadow group-hover:shadow-primary/40">
                <BookOpen className="h-4 w-4 text-primary-foreground" aria-hidden />
                {/* Reflet lumineux sur le logo */}
                <span className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-b from-white/20 to-transparent" />
              </span>
              <div className="leading-tight">
                <p className="font-display text-base font-semibold text-foreground">Bethel Ados</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Portail jeunesse</p>
              </div>
            </Link>

            {/* Nav desktop */}
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
                          "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
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

            {/* Avatar mobile */}
            <Link
              href="/profil"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:shadow-primary/40 md:hidden"
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
          className="fixed inset-x-0 bottom-0 z-30 md:hidden"
        >
          {/* Barre de séparation gradient */}
          <div className="h-px w-full bg-linear-to-r from-transparent via-border to-transparent" />
          <div className="bg-background/92 backdrop-blur-lg">
            <ul className="phone-scroll mx-auto flex max-w-6xl items-stretch justify-start gap-1 overflow-x-auto px-1 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-1.5">
              {nav.map((item) => {
                const Icon = item.icon
                const active = item.match(pathname)
                return (
                  <li key={item.href} className="min-w-20 flex-1">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex flex-col items-center gap-1 py-1 text-[10px] font-semibold transition-colors duration-200",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {/* Pill actif */}
                      <span
                        className={cn(
                          "flex h-9 w-14 items-center justify-center rounded-full transition-all duration-250",
                          active
                            ? "bg-primary shadow-md shadow-primary/30 animate-tab-pop"
                            : "hover:bg-muted",
                        )}
                      >
                        <Icon
                          className={cn(
                            "transition-all duration-200",
                            active ? "h-4.5 w-4.5 text-primary-foreground" : "h-5 w-5",
                          )}
                          aria-hidden
                        />
                      </span>
                      <span className={cn("tracking-wide", active && "font-bold")}>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
      )}
    </div>
  )
}
