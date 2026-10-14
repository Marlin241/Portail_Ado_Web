"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { adminListQuestions } from "@/lib/api/questions"
import { adminListTemoignages } from "@/lib/api/temoignages"

export const MOD_COUNT_KEYS = {
  temoignages: "admin-mod-count-temoignages",
  questions: "admin-mod-count-questions",
} as const

const SWR_OPTIONS = {
  shouldRetryOnError: false,
  refreshInterval: 60_000,
  revalidateOnFocus: true,
}

/**
 * Nombre de témoignages et de questions en attente. Tolérant aux erreurs :
 * si un appel échoue (réseau, droits), son compteur reste simplement inconnu.
 */
export function useModerationCounts({ questions = true }: { questions?: boolean } = {}) {
  const t = useSWR(
    MOD_COUNT_KEYS.temoignages,
    () => adminListTemoignages({ statut: "pending", page: 1, per_page: 1 }).then((r) => r.total),
    SWR_OPTIONS,
  )
  const q = useSWR(
    questions ? MOD_COUNT_KEYS.questions : null,
    () => adminListQuestions({ statut: "pending", page: 1, per_page: 1 }).then((r) => r.total),
    SWR_OPTIONS,
  )
  const temoignages = t.error ? undefined : t.data
  const questionsCount = q.error ? undefined : q.data
  const known = temoignages !== undefined || questionsCount !== undefined
  return {
    temoignages,
    questions: questionsCount,
    total: known ? (temoignages ?? 0) + (questionsCount ?? 0) : undefined,
  }
}

export function refreshModerationCounts() {
  void globalMutate(MOD_COUNT_KEYS.temoignages)
  void globalMutate(MOD_COUNT_KEYS.questions)
}
