import { apiRequest, USE_MOCKS } from "./client"
import { mapEpisode, mapEpisodeDetail, mapPodcast } from "./mappers"
import { mockEpisodeDetail } from "./mocks"
import { mockEpisodes as MOCK_EPISODES, mockPodcasts as MOCK_PODCASTS } from "./mocks-admin"
import type { Episode, EpisodeDetail, PaginatedResponse, Podcast } from "./types"

export async function listPodcasts(): Promise<Podcast[]> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 150))
    return MOCK_PODCASTS.filter((p) => p.est_actif)
  }
  return apiRequest<Podcast[]>("/podcasts").then((items) => items.map(mapPodcast))
}

export async function getPodcast(id: string): Promise<Podcast | null> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 120))
    return MOCK_PODCASTS.find((p) => p.id === id) ?? null
  }
  return apiRequest<Podcast>(`/podcasts/${id}`).then(mapPodcast)
}

export async function listEpisodes(
  podcastId: string,
  params: { limit?: number; offset?: number } = {},
): Promise<PaginatedResponse<Episode>> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 150))
    const items = MOCK_EPISODES.filter((e) => e.podcast_id === podcastId && e.est_publie).sort(
      (a, b) => b.numero - a.numero,
    )
    const limit = params.limit ?? 20
    const offset = params.offset ?? 0
    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
      limit,
      offset,
    }
  }

  return apiRequest<PaginatedResponse<Episode>>(`/podcasts/${podcastId}/episodes`, {
    query: params,
  }).then((res) => ({
    ...res,
    items: res.items.map((episode) => mapEpisode(episode)),
  }))
}

export async function getEpisode(id: string): Promise<EpisodeDetail | null> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 200))
    return mockEpisodeDetail(id)
  }

  const detail = await apiRequest<EpisodeDetail>(`/podcasts/episodes/${id}`)
  const podcast = await apiRequest<Podcast>(`/podcasts/${detail.podcast_id}`).then(mapPodcast).catch(() => null)
  return mapEpisodeDetail(detail, podcast)
}
