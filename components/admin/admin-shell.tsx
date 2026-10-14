"use client"

import { AdminBottomBar, AdminRail } from "./admin-sidebar"

/**
 * Coque de l'admin Kairos : rail étroit à gauche sur PC (≥ 1024 px),
 * barre basse flottante sur téléphone et tablette.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground flex min-h-screen">
      <div className="hidden shrink-0 bg-[var(--k-rail)] lg:block">
        <AdminRail />
      </div>

      <main className="min-w-0 flex-1 pb-[calc(112px+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>

      <div className="lg:hidden">
        <AdminBottomBar />
      </div>
    </div>
  )
}
