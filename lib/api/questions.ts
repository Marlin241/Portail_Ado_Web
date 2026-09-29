import { apiRequest } from "./client"
import type {
  AdminQuestionAnonyme,
  PaginatedPageResponse,
  QuestionAnonyme,
  StatutQuestion,
} from "./types"

export async function listPublicQuestions(
  params: { page?: number; per_page?: number } = {},
): Promise<PaginatedPageResponse<QuestionAnonyme>> {
  return apiRequest<PaginatedPageResponse<QuestionAnonyme>>("/questions", {
    auth: false,
    query: params,
  })
}

export async function submitQuestion(payload: {
  contenu: string
  auteur_alias?: string | null
}): Promise<QuestionAnonyme> {
  return apiRequest<QuestionAnonyme>("/questions", { method: "POST", body: payload })
}

export async function listMyQuestions(
  params: { page?: number; per_page?: number } = {},
): Promise<PaginatedPageResponse<QuestionAnonyme>> {
  return apiRequest<PaginatedPageResponse<QuestionAnonyme>>("/questions/mes-questions", {
    query: params,
  })
}

export async function adminListQuestions(
  params: { statut?: StatutQuestion; page?: number; per_page?: number } = {},
): Promise<PaginatedPageResponse<AdminQuestionAnonyme>> {
  return apiRequest<PaginatedPageResponse<AdminQuestionAnonyme>>("/admin/questions", {
    query: params,
  })
}

export async function adminAnswerQuestion(id: string, reponse: string): Promise<AdminQuestionAnonyme> {
  return apiRequest<AdminQuestionAnonyme>(`/admin/questions/${id}/repondre`, {
    method: "PATCH",
    body: { reponse },
  })
}

export async function adminRejectQuestion(id: string): Promise<AdminQuestionAnonyme> {
  return apiRequest<AdminQuestionAnonyme>(`/admin/questions/${id}/rejeter`, {
    method: "PATCH",
  })
}

export async function adminDeleteQuestion(id: string): Promise<void> {
  await apiRequest<void>(`/admin/questions/${id}`, { method: "DELETE" })
}
