"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useSession } from "@/lib/auth/session-provider"
import { cn } from "@/lib/utils"
import { useModerationCounts } from "./use-moderation-counts"

// ─── Entrées ─────────────────────────────────────────────────────────

export type AdminSpace = "aujourdhui" | "presences" | "ados" | "contenus" | "moderation" | "plus"

interface NavEntry {
  key: AdminSpace
  href: string
  label: string
  short?: string
  icon: ReactNode
}

const ICON = {
  aujourdhui: <path d="M4 11l8-7 8 7v9H4z" />,
  presences: <path d="M4 7h4M4 12h4M4 17h4M12 5h8v14h-8z" />,
  ados: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c.5-4 3-6 6-6s5.5 2 6 6M17 5a3.5 3.5 0 010 6" />
    </>
  ),
  contenus: <path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3z" />,
  moderation: <path d="M4 5h16v11H9l-5 4z" />,
}

function StrokeIcon({ children, size }: { children: ReactNode; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mx-auto block"
    >
      {children}
    </svg>
  )
}

function DotsIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="mx-auto block">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}

function entries(size: number, moderatorOnly: boolean): NavEntry[] {
  const moderation: NavEntry = {
    key: "moderation",
    // Un modérateur reste limité aux témoignages (voir app/admin/layout.tsx).
    href: moderatorOnly ? "/admin/temoignages" : "/admin/moderation",
    label: "Modération",
    short: "Modér.",
    icon: <StrokeIcon size={size}>{ICON.moderation}</StrokeIcon>,
  }
  if (moderatorOnly) return [moderation]
  return [
    { key: "aujourdhui", href: "/admin", label: "Aujourd'hui", icon: <StrokeIcon size={size}>{ICON.aujourdhui}</StrokeIcon> },
    { key: "presences", href: "/admin/presences", label: "Présences", icon: <StrokeIcon size={size}>{ICON.presences}</StrokeIcon> },
    { key: "ados", href: "/admin/utilisateurs", label: "Ados", icon: <StrokeIcon size={size}>{ICON.ados}</StrokeIcon> },
    { key: "contenus", href: "/admin/contenus", label: "Contenus", icon: <StrokeIcon size={size}>{ICON.contenus}</StrokeIcon> },
    moderation,
    { key: "plus", href: "/admin/plus", label: "Plus", icon: <DotsIcon size={size} /> },
  ]
}

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** Espace actif d'après le chemin. Tout ce qui n'est pas dans les quatre espaces relève de « Plus ». */
export function spaceForPath(pathname: string): AdminSpace {
  if (pathname === "/admin" || pathname === "/admin/") return "aujourdhui"
  if (startsWithAny(pathname, ["/admin/presences"])) return "presences"
  if (startsWithAny(pathname, ["/admin/utilisateurs"])) return "ados"
  if (startsWithAny(pathname, ["/admin/contenus", "/admin/livres", "/admin/podcasts"])) return "contenus"
  if (startsWithAny(pathname, ["/admin/moderation", "/admin/temoignages", "/admin/questions"])) return "moderation"
  return "plus"
}

function useAdminNav(iconSize: number) {
  const pathname = usePathname() || "/admin"
  const { user } = useSession()
  const moderatorOnly = user?.role === "moderator" && !user.is_superadmin
  const counts = useModerationCounts({ questions: !moderatorOnly })
  const pending = moderatorOnly ? counts.temoignages : counts.total
  return {
    items: entries(iconSize, moderatorOnly),
    active: spaceForPath(pathname),
    pending,
    moderatorOnly,
  }
}

// ─── Pastille qui glisse ─────────────────────────────────────────────

interface Box {
  x: number
  y: number
  w: number
  h: number
}

function useSlidingPill(activeKey: string) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLElement>())
  const [box, setBox] = useState<Box | null>(null)
  const [animate, setAnimate] = useState(false)

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = () => {
      const el = itemRefs.current.get(activeKey)
      if (!el) return setBox(null)
      setBox({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight })
    }
    measure()
    if (!container || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [activeKey])

  // Pas d'animation pour la toute première position : la pastille apparaît en place.
  useEffect(() => {
    if (!box || animate) return
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [box, animate])

  const register = (key: string) => (el: HTMLElement | null) => {
    if (el) itemRefs.current.set(key, el)
    else itemRefs.current.delete(key)
  }

  const pill = (
    <span
      aria-hidden="true"
      data-nav-pill=""
      className={cn(
        "pointer-events-none absolute left-0 top-0 rounded-[20px] bg-[var(--k-lime)]",
        animate && "kairos-nav-pill",
      )}
      style={{
        transform: box ? `translate(${box.x}px, ${box.y}px)` : undefined,
        width: box?.w ?? 0,
        height: box?.h ?? 0,
        opacity: box ? 1 : 0,
      }}
    />
  )

  return { containerRef, register, pill }
}

function CountBadge({ value, className }: { value?: number; className?: string }) {
  if (!value) return null
  return (
    <span
      data-count-badge=""
      className={cn(
        "absolute min-w-[18px] rounded-full bg-[#8E6CFF] px-1 text-center text-[11px] font-bold leading-[18px] text-[#0C0C12]",
        className,
      )}
      aria-hidden="true"
    >
      {value > 99 ? "99+" : value}
    </span>
  )
}

function KairosMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <rect x="6" y="5" width="6" height="24" rx="2" fill="#FFFFFF" />
      <path d="M14 17 L27 5 L27 14 Z" fill="#C8FF3E" />
      <path d="M14 17 L27 29 L27 20 Z" fill="#8E6CFF" />
    </svg>
  )
}

function linkLabel(item: NavEntry, pending?: number) {
  if (item.key === "moderation" && pending) return `${item.label}, ${pending} à traiter`
  return item.label
}

// ─── Rail (PC, ≥ 1024 px) ────────────────────────────────────────────

export function AdminRail() {
  const { items, active, pending, moderatorOnly } = useAdminNav(22)
  const { logout } = useSession()
  const { containerRef, register, pill } = useSlidingPill(active)
  const main = items.filter((i) => i.key !== "plus")
  const plus = items.find((i) => i.key === "plus")

  return (
    <nav
      aria-label="Navigation principale"
      className="sticky top-0 flex h-screen w-[104px] shrink-0 flex-col items-center border-r border-[var(--k-rail-border)] bg-[var(--k-rail)] px-3 py-7"
    >
      <div className="mb-7" title="Kairos admin">
        <KairosMark />
      </div>
      <div ref={containerRef} className="relative flex w-20 flex-1 flex-col items-center gap-2">
        {pill}
        {main.map((item) => (
          <RailLink key={item.key} item={item} active={active === item.key} pending={pending} refFn={register(item.key)} />
        ))}
        <div className="flex-1" />
        {plus ? (
          <RailLink item={plus} active={active === "plus"} refFn={register("plus")} />
        ) : (
          <button
            type="button"
            onClick={() => logout()}
            className="w-20 rounded-[20px] py-3 text-center text-xs font-semibold text-[var(--k-rail-ink)] transition-colors hover:text-white"
          >
            Quitter
          </button>
        )}
      </div>
    </nav>
  )
}

function RailLink({
  item,
  active,
  pending,
  refFn,
}: {
  item: NavEntry
  active: boolean
  pending?: number
  refFn: (el: HTMLElement | null) => void
}) {
  return (
    <Link
      ref={refFn}
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={linkLabel(item, pending)}
      data-space={item.key}
      className={cn(
        "relative z-10 w-20 rounded-[20px] py-3 text-center text-xs font-semibold outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#8E6CFF]",
        active ? "text-[#0C0C12]" : "text-[var(--k-rail-ink)] hover:text-white",
      )}
    >
      <span className="mb-1 block">{item.icon}</span>
      {item.label}
      {item.key === "moderation" ? <CountBadge value={pending} className="right-2 top-1.5" /> : null}
    </Link>
  )
}

// ─── Barre basse (téléphone et tablette, < 1024 px) ──────────────────

export function AdminBottomBar() {
  const { items, active, pending, moderatorOnly } = useAdminNav(20)
  const { logout } = useSession()
  const { containerRef, register, pill } = useSlidingPill(active)

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-3.5 bottom-[calc(14px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[560px] rounded-[26px] border border-border bg-[var(--k-surface)] p-1.5 shadow-[0_10px_30px_-12px_rgba(12,12,18,0.35)]"
    >
      <div ref={containerRef} className="relative flex gap-0.5">
        {pill}
        {items.map((item) => {
          const isActive = active === item.key
          return (
            <Link
              key={item.key}
              ref={register(item.key)}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={linkLabel(item, pending)}
              data-space={item.key}
              className={cn(
                "relative z-10 min-w-0 flex-1 rounded-[20px] px-0.5 py-[9px] text-center text-[10px] font-semibold leading-tight outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                isActive ? "text-[#0C0C12]" : "text-muted-foreground",
              )}
            >
              <span className="mb-[3px] block">{item.icon}</span>
              <span className="block truncate">{item.short ?? item.label}</span>
              {item.key === "moderation" ? (
                <CountBadge value={pending} className="right-[calc(50%-24px)] top-0.5" />
              ) : null}
            </Link>
          )
        })}
        {moderatorOnly ? (
          <button
            type="button"
            onClick={() => logout()}
            className="relative z-10 flex-1 rounded-[20px] py-[9px] text-center text-[10px] font-semibold text-muted-foreground"
          >
            <span className="mb-[3px] block">
              <StrokeIcon size={20}>
                <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
              </StrokeIcon>
            </span>
            Quitter
          </button>
        ) : null}
      </div>
    </nav>
  )
}
