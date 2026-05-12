import type { TraductionBiblique } from "./api/types"

const KNOWN_TRANSLATION_NAMES: Record<string, string> = {
  LSG: "Louis Segond 1910",
  PDV: "Parole de Vie",
  PDV2017: "Parole de Vie 2017",
  BEX: "La Bible expliquee",
}

export const DEFAULT_BIBLE_TRANSLATION: TraductionBiblique = {
  code: "LSG",
  nom: "Louis Segond 1910",
  description: null,
  langue: "fr",
  active: true,
}

export function normalizeBibleTranslations(input: unknown): TraductionBiblique[] {
  const source = Array.isArray(input) ? input : []
  const byCode = new Map<string, TraductionBiblique>()

  source.forEach((item) => {
    let code = ""
    let nom = ""
    let description: string | null = null
    let langue = "fr"
    let active = true

    if (typeof item === "string") {
      code = item.trim()
      nom = KNOWN_TRANSLATION_NAMES[code] ?? code
    } else if (item && typeof item === "object") {
      const value = item as Partial<TraductionBiblique>
      code = typeof value.code === "string" ? value.code.trim() : ""
      nom = typeof value.nom === "string" && value.nom.trim()
        ? value.nom.trim()
        : KNOWN_TRANSLATION_NAMES[code] ?? code
      description = typeof value.description === "string" ? value.description : null
      langue = typeof value.langue === "string" && value.langue.trim() ? value.langue : "fr"
      active = typeof value.active === "boolean" ? value.active : true
    }

    if (!code || byCode.has(code)) return
    byCode.set(code, { code, nom, description, langue, active })
  })

  return Array.from(byCode.values())
}

export function bibleTranslationOptions(items: TraductionBiblique[]): TraductionBiblique[] {
  return items.length > 0 ? items : [DEFAULT_BIBLE_TRANSLATION]
}

export function formatBibleTranslation(item: TraductionBiblique): string {
  return item.nom === item.code ? item.code : `${item.nom} (${item.code})`
}

export function findBibleTranslation(
  items: TraductionBiblique[],
  code: string,
): TraductionBiblique {
  return items.find((item) => item.code === code) ?? {
    ...DEFAULT_BIBLE_TRANSLATION,
    code,
    nom: KNOWN_TRANSLATION_NAMES[code] ?? code,
  }
}
