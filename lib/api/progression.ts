import { apiRequest } from "./client"
import { mapAudioProgress, mapBookProgress } from "./mappers"
import type { AudioProgress, BookProgress } from "./types"

export async function getBookProgress(bookId: string): Promise<BookProgress | null> {
  return apiRequest<BookProgress>(`/progressions/livres/${bookId}`).then(mapBookProgress)
}

export async function putBookProgress(
  bookId: string,
  payload: Partial<Pick<BookProgress, "progress_percent" | "current_page" | "total_pages" | "completed_at">>,
): Promise<BookProgress> {
  return apiRequest<BookProgress>(`/progressions/livres/${bookId}`, {
    method: "PUT",
    body: {
      derniere_page_lue: payload.current_page ?? 1,
      pourcentage_progression: payload.progress_percent ?? 0,
      est_termine: Boolean(payload.completed_at) || (payload.progress_percent ?? 0) >= 100,
    },
  }).then((progress) => {
    const mapped = mapBookProgress(progress)
    return {
      ...mapped,
      total_pages: payload.total_pages ?? mapped.total_pages,
    }
  })
}

export async function getAudioProgress(episodeId: string): Promise<AudioProgress | null> {
  return apiRequest<AudioProgress>(`/progressions/audio/${episodeId}`).then(mapAudioProgress)
}

export async function putAudioProgress(
  episodeId: string,
  payload: Pick<AudioProgress, "position_seconds" | "duration_seconds" | "completed">,
): Promise<AudioProgress> {
  return apiRequest<AudioProgress>(`/progressions/audio/${episodeId}`, {
    method: "PUT",
    body: {
      position_secondes: payload.position_seconds,
      est_termine: payload.completed,
    },
  }).then(mapAudioProgress)
}

export async function listContinueReading(): Promise<BookProgress[]> {
  return apiRequest<BookProgress[]>("/progressions/livres").then((items) => items.map(mapBookProgress))
}

export async function listContinueListening(): Promise<AudioProgress[]> {
  return apiRequest<AudioProgress[]>("/progressions/audio").then((items) => items.map(mapAudioProgress))
}
