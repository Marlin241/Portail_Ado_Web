"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  ClipboardList,
  FileAudio,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  Podcast,
  Sparkles,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "@/lib/auth/session-provider"
import { Button } from "@/components/ui/button"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  comingSoon?: boolean
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Vue d'ensemble",
    items: [{ href: "/admin", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    section: "Gestion",
    items: [
      { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
      { href: "/admin/livres", label: "Bibliothèque", icon: BookOpen },
      { href: "/admin/podcasts", label: "Podcasts", icon: Podcast },
    ],
  },
  {
    section: "Modération",
    items: [
      { href: "/admin/temoignages", label: "Témoignages", icon: FileAudio, comingSoon: true },
      { href: "/admin/questions", label: "Questions", icon: MessageSquareWarning, comingSoon: true },
      { href: "/admin/exploits", label: "Exploits", icon: Sparkles, comingSoon: true },
    ],
  },
  {
    section: "Journal",
    items: [{ href: "/admin/audit", label: "Journal d'audit", icon: ClipboardList }],
  },
]

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useSession()

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-sidebar-border flex items-center gap-3 border-b px-6 py-5">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl font-serif text-lg font-bold">
          B
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="font-serif text-base font-semibold leading-tight">Bethel Ados</span>
          <span className="text-sidebar-foreground/70 truncate text-xs">Panel administrateur</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((section) => (
          <div key={section.section} className="mb-6">
            <div className="text-sidebar-foreground/60 px-3 pb-2 text-xs font-semibold uppercase tracking-wider">
              {section.section}
            </div>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname?.startsWith(item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.comingSoon ? (
                        <span className="bg-sidebar-primary/20 text-sidebar-primary rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">
                          bientôt
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-sidebar-border flex flex-col gap-2 border-t px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/30 px-3 py-2">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
            {user?.first_name?.[0] ?? "A"}
            {user?.last_name?.[0] ?? ""}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-sidebar-foreground/70 truncate text-xs">
              {user?.is_superadmin ? "Super admin" : user?.role}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground justify-start"
          onClick={() => {
            logout()
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </Button>
        <Link
          href="/accueil"
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground text-center text-xs underline underline-offset-2"
        >
          Retour à l&apos;app utilisateur
        </Link>
      </div>
    </aside>
  )
}
