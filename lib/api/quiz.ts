import { apiRequest } from "./client"
import { mapQuizProfil } from "./mappers"
import type {
  AdminQuizDetail,
  AdminQuizListItem,
  AdminQuizPayload,
  AdminQuizProfilPayload,
  AdminQuizQuestionPayload,
  PaginatedResponse,
  QuizDetail,
  QuizListItem,
  QuizProfil,
  QuizQuestionAdmin,
  QuizResultat,
} from "./types"

function mapResult(result: QuizResultat): QuizResultat {
  return { ...result, profil: mapQuizProfil(result.profil) }
}

function mapAdminDetail(detail: AdminQuizDetail): AdminQuizDetail {
  return {
    ...detail,
    profils: detail.profils.map(mapQuizProfil),
  }
}

export async function listQuiz(): Promise<QuizListItem[]> {
  return apiRequest<QuizListItem[]>("/quiz/")
}

export async function getQuiz(id: string): Promise<QuizDetail> {
  return apiRequest<QuizDetail>(`/quiz/${id}`)
}

export async function submitQuiz(
  id: string,
  reponses: Array<{ question_id: string; option_id: string }>,
): Promise<QuizResultat> {
  return apiRequest<QuizResultat>(`/quiz/${id}/soumettre`, {
    method: "POST",
    body: { reponses },
  }).then(mapResult)
}

export async function getMyQuizResult(id: string): Promise<QuizResultat> {
  return apiRequest<QuizResultat>(`/quiz/${id}/mon-resultat`).then(mapResult)
}

export async function adminListQuiz(
  params: { limit?: number; offset?: number } = {},
): Promise<PaginatedResponse<AdminQuizListItem>> {
  const res = await apiRequest<{ total: number; items: AdminQuizListItem[] }>("/admin/quiz/", {
    query: params,
  })
  return {
    total: res.total,
    items: res.items,
    limit: params.limit ?? res.items.length,
    offset: params.offset ?? 0,
  }
}

export async function adminGetQuiz(id: string): Promise<AdminQuizDetail> {
  return apiRequest<AdminQuizDetail>(`/admin/quiz/${id}`).then(mapAdminDetail)
}

export async function adminCreateQuiz(payload: AdminQuizPayload): Promise<AdminQuizListItem> {
  return apiRequest<AdminQuizListItem>("/admin/quiz/", { method: "POST", body: payload })
}

export async function adminUpdateQuiz(
  id: string,
  payload: Partial<AdminQuizPayload>,
): Promise<AdminQuizListItem> {
  return apiRequest<AdminQuizListItem>(`/admin/quiz/${id}`, { method: "PUT", body: payload })
}

export async function adminDeleteQuiz(id: string): Promise<void> {
  await apiRequest<void>(`/admin/quiz/${id}`, { method: "DELETE" })
}

export async function adminToggleQuizPublication(id: string): Promise<AdminQuizListItem> {
  return apiRequest<AdminQuizListItem>(`/admin/quiz/${id}/publier`, { method: "POST" })
}

export async function adminCreateQuizProfil(
  quizId: string,
  payload: AdminQuizProfilPayload,
): Promise<QuizProfil> {
  return apiRequest<QuizProfil>(`/admin/quiz/${quizId}/profils/`, {
    method: "POST",
    body: payload,
  }).then(mapQuizProfil)
}

export async function adminUpdateQuizProfil(
  quizId: string,
  profilId: string,
  payload: Partial<AdminQuizProfilPayload>,
): Promise<QuizProfil> {
  return apiRequest<QuizProfil>(`/admin/quiz/${quizId}/profils/${profilId}`, {
    method: "PUT",
    body: payload,
  }).then(mapQuizProfil)
}

export async function adminDeleteQuizProfil(quizId: string, profilId: string): Promise<void> {
  await apiRequest<void>(`/admin/quiz/${quizId}/profils/${profilId}`, { method: "DELETE" })
}

export async function adminUploadQuizProfilImage(
  quizId: string,
  profilId: string,
  file: File,
): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  const res = await apiRequest<{ personnage_biblique_image_url: string }>(
    `/admin/quiz/${quizId}/profils/${profilId}/image`,
    { method: "POST", body: form },
  )
  return res.personnage_biblique_image_url
}

export async function adminCreateQuizQuestion(
  quizId: string,
  payload: AdminQuizQuestionPayload,
): Promise<QuizQuestionAdmin> {
  return apiRequest<QuizQuestionAdmin>(`/admin/quiz/${quizId}/questions/`, {
    method: "POST",
    body: payload,
  })
}

export async function adminUpdateQuizQuestion(
  quizId: string,
  questionId: string,
  payload: Partial<AdminQuizQuestionPayload>,
): Promise<QuizQuestionAdmin> {
  return apiRequest<QuizQuestionAdmin>(`/admin/quiz/${quizId}/questions/${questionId}`, {
    method: "PUT",
    body: payload,
  })
}

export async function adminDeleteQuizQuestion(quizId: string, questionId: string): Promise<void> {
  await apiRequest<void>(`/admin/quiz/${quizId}/questions/${questionId}`, { method: "DELETE" })
}
