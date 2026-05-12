import { apiRequest } from "./client"
import { resolveApiUrl } from "./mappers"
import { normalizeBibleTranslations } from "../bible-translations"
import type {
  AdoMisEnAvant,
  AdoMisEnAvantPayload,
  ClassementBiblique,
  LivreBiblique,
  OptionBibliqueAdmin,
  OptionBibliquePayload,
  QuestionBibliqueAdmin,
  QuestionBibliquePayload,
  QuizBiblique,
  QuizBibliqueAdminDetail,
  QuizBibliqueDetail,
  QuizBibliquePayload,
  ResultatSoumissionBiblique,
  TentativeBiblique,
  ThemeBiblique,
  ThemeBibliquePayload,
  TraductionBiblique,
  VersetBiblique,
} from "./types"

export interface QuizBibliqueStats {
  quiz_id: string
  titre: string
  total_tentatives: number
  nb_participants: number
  score_moyen: number
  score_max: number
}

function mapAdo(item: AdoMisEnAvant): AdoMisEnAvant {
  return { ...item, avatar_url: resolveApiUrl(item.avatar_url) }
}

function mapClassement(item: ClassementBiblique): ClassementBiblique {
  return {
    ...item,
    entrees: item.entrees.map((entry) => ({
      ...entry,
      avatar_url: resolveApiUrl(entry.avatar_url),
    })),
  }
}

export async function getThemeBibliqueActuel(): Promise<ThemeBiblique> {
  return apiRequest<ThemeBiblique>("/biblique/themes/actuel")
}

export async function getThemeBiblique(mois: number, annee: number): Promise<ThemeBiblique> {
  return apiRequest<ThemeBiblique>(`/biblique/themes/${mois}/${annee}`)
}

export async function listTraductionsBibliques(): Promise<TraductionBiblique[]> {
  return apiRequest<unknown>("/biblique/traductions").then(normalizeBibleTranslations)
}

export async function listLivresBibliques(traduction?: string | null): Promise<LivreBiblique[]> {
  return apiRequest<LivreBiblique[]>("/biblique/livres", {
    query: { traduction },
  })
}

export async function listChapitresBibliques(params: {
  livreId: string
  traduction: string
}): Promise<number[]> {
  return apiRequest<number[]>(`/biblique/livres/${params.livreId}/chapitres`, {
    query: { traduction: params.traduction },
  })
}

export async function listVersetsBibliques(params: {
  livreId: string
  chapitre: number
  traduction: string
}): Promise<VersetBiblique[]> {
  return apiRequest<VersetBiblique[]>(`/biblique/livres/${params.livreId}/versets`, {
    query: {
      chapitre: params.chapitre,
      traduction: params.traduction,
    },
  })
}

export async function getClassementBibliqueActuel(): Promise<ClassementBiblique> {
  return apiRequest<ClassementBiblique>("/biblique/classement").then(mapClassement)
}

export async function getClassementBiblique(
  mois: number,
  annee: number,
): Promise<ClassementBiblique> {
  return apiRequest<ClassementBiblique>(`/biblique/classement/${mois}/${annee}`).then(
    mapClassement,
  )
}

export async function getAdoDuMois(): Promise<AdoMisEnAvant> {
  return apiRequest<AdoMisEnAvant>("/biblique/ado-du-mois").then(mapAdo)
}

export async function getAdoDuMoisPasse(mois: number, annee: number): Promise<AdoMisEnAvant> {
  return apiRequest<AdoMisEnAvant>(`/biblique/ado-du-mois/${mois}/${annee}`).then(mapAdo)
}

export async function listQuizBibliques(themeId?: string | null): Promise<QuizBiblique[]> {
  return apiRequest<QuizBiblique[]>("/biblique/quiz", { query: { theme_id: themeId } })
}

export async function getQuizBiblique(id: string): Promise<QuizBibliqueDetail> {
  return apiRequest<QuizBibliqueDetail>(`/biblique/quiz/${id}`)
}

export async function submitQuizBiblique(
  id: string,
  reponses: Record<string, string>,
): Promise<ResultatSoumissionBiblique> {
  return apiRequest<ResultatSoumissionBiblique>(`/biblique/quiz/${id}/soumettre`, {
    method: "POST",
    body: { reponses },
  })
}

export async function listTentativesQuizBiblique(id: string): Promise<TentativeBiblique[]> {
  return apiRequest<TentativeBiblique[]>(`/biblique/quiz/${id}/mes-tentatives`)
}

export async function adminListThemesBibliques(): Promise<ThemeBiblique[]> {
  return apiRequest<ThemeBiblique[]>("/admin/biblique/themes")
}

export async function adminCreateThemeBiblique(
  payload: Required<Pick<ThemeBibliquePayload, "titre" | "mois" | "annee">> &
    Pick<ThemeBibliquePayload, "description">,
): Promise<ThemeBiblique> {
  return apiRequest<ThemeBiblique>("/admin/biblique/themes", {
    method: "POST",
    body: payload,
  })
}

export async function adminUpdateThemeBiblique(
  id: string,
  payload: Pick<ThemeBibliquePayload, "titre" | "description">,
): Promise<ThemeBiblique> {
  return apiRequest<ThemeBiblique>(`/admin/biblique/themes/${id}`, {
    method: "PATCH",
    body: payload,
  })
}

export async function adminDeleteThemeBiblique(id: string): Promise<void> {
  await apiRequest<void>(`/admin/biblique/themes/${id}`, { method: "DELETE" })
}

export async function adminListQuizBibliques(params: {
  theme_id?: string | null
  est_publie?: boolean | null
} = {}): Promise<QuizBiblique[]> {
  return apiRequest<QuizBiblique[]>("/admin/biblique/quiz", { query: params })
}

export async function adminCreateQuizBiblique(
  payload: QuizBibliquePayload,
): Promise<QuizBiblique> {
  return apiRequest<QuizBiblique>("/admin/biblique/quiz", {
    method: "POST",
    body: payload,
  })
}

export async function adminGetQuizBiblique(id: string): Promise<QuizBibliqueAdminDetail> {
  return apiRequest<QuizBibliqueAdminDetail>(`/admin/biblique/quiz/${id}`)
}

export async function adminUpdateQuizBiblique(
  id: string,
  payload: QuizBibliquePayload,
): Promise<QuizBiblique> {
  return apiRequest<QuizBiblique>(`/admin/biblique/quiz/${id}`, {
    method: "PATCH",
    body: payload,
  })
}

export async function adminPublishQuizBiblique(
  id: string,
  publier: boolean,
): Promise<QuizBiblique> {
  return apiRequest<QuizBiblique>(`/admin/biblique/quiz/${id}/publier`, {
    method: "PATCH",
    body: { publier },
  })
}

export async function adminDeleteQuizBiblique(id: string): Promise<void> {
  await apiRequest<void>(`/admin/biblique/quiz/${id}`, { method: "DELETE" })
}

export async function adminGetStatsQuizBiblique(id: string): Promise<QuizBibliqueStats> {
  return apiRequest<QuizBibliqueStats>(`/admin/biblique/quiz/${id}/stats`)
}

export async function adminAddQuestionBiblique(
  quizId: string,
  payload: QuestionBibliquePayload & { type_question: "libre" | "verset" },
): Promise<QuestionBibliqueAdmin> {
  return apiRequest<QuestionBibliqueAdmin>(`/admin/biblique/quiz/${quizId}/questions`, {
    method: "POST",
    body: payload,
  })
}

export async function adminUpdateQuestionBiblique(
  id: string,
  payload: Partial<QuestionBibliquePayload>,
): Promise<QuestionBibliqueAdmin> {
  return apiRequest<QuestionBibliqueAdmin>(`/admin/biblique/questions/${id}`, {
    method: "PATCH",
    body: payload,
  })
}

export async function adminDeleteQuestionBiblique(id: string): Promise<void> {
  await apiRequest<void>(`/admin/biblique/questions/${id}`, { method: "DELETE" })
}

export async function adminAddOptionBiblique(
  questionId: string,
  payload: OptionBibliquePayload,
): Promise<OptionBibliqueAdmin> {
  return apiRequest<OptionBibliqueAdmin>(`/admin/biblique/questions/${questionId}/options`, {
    method: "POST",
    body: payload,
  })
}

export async function adminUpdateOptionBiblique(
  id: string,
  payload: Partial<OptionBibliquePayload>,
): Promise<OptionBibliqueAdmin> {
  return apiRequest<OptionBibliqueAdmin>(`/admin/biblique/options/${id}`, {
    method: "PATCH",
    body: payload,
  })
}

export async function adminDeleteOptionBiblique(id: string): Promise<void> {
  await apiRequest<void>(`/admin/biblique/options/${id}`, { method: "DELETE" })
}

export async function adminListAdosMisEnAvant(): Promise<AdoMisEnAvant[]> {
  return apiRequest<AdoMisEnAvant[]>("/admin/biblique/ados-mis-en-avant").then((items) =>
    items.map(mapAdo),
  )
}

export async function adminCreateAdoMisEnAvant(
  payload: AdoMisEnAvantPayload,
): Promise<AdoMisEnAvant> {
  return apiRequest<AdoMisEnAvant>("/admin/biblique/ados-mis-en-avant", {
    method: "POST",
    body: payload,
  }).then(mapAdo)
}

export async function adminDeleteAdoMisEnAvant(id: string): Promise<void> {
  await apiRequest<void>(`/admin/biblique/ados-mis-en-avant/${id}`, { method: "DELETE" })
}

export async function adminGetClassementBiblique(
  mois: number,
  annee: number,
): Promise<ClassementBiblique> {
  return apiRequest<ClassementBiblique>(`/admin/biblique/classement/${mois}/${annee}`).then(
    mapClassement,
  )
}
