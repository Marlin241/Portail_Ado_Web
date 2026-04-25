import { apiRequest, USE_MOCKS } from "./client"
import { mapAudioProgress, mapBookProgress } from "./mappers"
import { MOCK_AUDIO_PROGRESS, MOCK_BOOK_PROGRESS } from "./mocks"
import type { AudioProgress, BookProgress } from "./types"

export async function getBookProgress(bookId: string): Promise<BookProgress | null> {
  if (USE_MOCKS) {
    return MOCK_BOOK_PROGRESS[bookId] ?? null
  }
  return apiRequest<BookProgress>(`/progressions/livres/${bookId}`).then(mapBookProgress)
}

export async function putBookProgress(
  bookId: string,
  payload: Partial<Pick<BookProgress, "progress_percent" | "current_page" | "total_pages" | "completed_at">>,
): Promise<BookProgress> {
  if (USE_MOCKS) {
    const existing = MOCK_BOOK_PROGRESS[bookId]
    const next: BookProgress = {
      book_id: bookId,
      user_id: existing?.user_id ?? "u_demo",
      progress_percent: payload.progress_percent ?? existing?.progress_percent ?? 0,
      current_page: payload.current_page ?? existing?.current_page ?? null,
      total_pages: payload.total_pages ?? existing?.total_pages ?? null,
      last_opened_at: new Date().toISOString(),
      completed_at: payload.completed_at ?? existing?.completed_at ?? null,
    }
    MOCK_BOOK_PROGRESS[bookId] = next
    return next
  }

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
  if (USE_MOCKS) {
    return MOCK_AUDIO_PROGRESS[episodeId] ?? null
  }
  return apiRequest<AudioProgress>(`/progressions/audio/${episodeId}`).then(mapAudioProgress)
}

export async function putAudioProgress(
  episodeId: string,
  payload: Pick<AudioProgress, "position_seconds" | "duration_seconds" | "completed">,
): Promise<AudioProgress> {
  if (USE_MOCKS) {
    const next: AudioProgress = {
      episode_id: episodeId,
      user_id: "u_demo",
      position_seconds: payload.position_seconds,
      duration_seconds: payload.duration_seconds,
      completed: payload.completed,
      last_listened_at: new Date().toISOString(),
    }
    MOCK_AUDIO_PROGRESS[episodeId] = next
    return next
  }

  return apiRequest<AudioProgress>(`/progressions/audio/${episodeId}`, {
    method: "PUT",
    body: {
      position_secondes: payload.position_seconds,
      est_termine: payload.completed,
    },
  }).then(mapAudioProgress)
}

export async function listContinueReading(): Promise<BookProgress[]> {
  if (USE_MOCKS) {
    return Object.values(MOCK_BOOK_PROGRESS).sort((a, b) =>
      (b.last_opened_at ?? "").localeCompare(a.last_opened_at ?? ""),
    )
  }
  return []
}

export async function listContinueListening(): Promise<AudioProgress[]> {
  if (USE_MOCKS) {
    return Object.values(MOCK_AUDIO_PROGRESS)
      .filter((a) => !a.completed)
      .sort((a, b) => (b.last_listened_at ?? "").localeCompare(a.last_listened_at ?? ""))
  }
  return []
}
