import { apiRequest } from "./client"
import { mapEpisode, mapEpisodeDetail, mapPodcast } from "./mappers"
import type { Episode, EpisodeDetail, PaginatedResponse, Podcast } from "./types"

export async function listPodcasts(): Promise<Podcast[]> {
  return apiRequest<Podcast[]>("/podcasts").then((items) => items.map(mapPodcast))
}

export async function getPodcast(id: string): Promise<Podcast | null> {
  return apiRequest<Podcast>(`/podcasts/${id}`).then(mapPodcast)
}

export async function listEpisodes(
  podcastId: string,
  params: { limit?: number; offset?: number } = {},
): Promise<PaginatedResponse<Episode>> {
  return apiRequest<PaginatedResponse<Episode>>(`/podcasts/${podcastId}/episodes`, {
    query: params,
  }).then((res) => ({
    ...res,
    items: res.items.map((episode) => mapEpisode(episode)),
  }))
}

export async function getEpisode(id: string): Promise<EpisodeDetail | null> {
  const detail = await apiRequest<EpisodeDetail>(`/podcasts/episodes/${id}`)
  const podcast = await apiRequest<Podcast>(`/podcasts/${detail.podcast_id}`).then(mapPodcast).catch(() => null)
  return mapEpisodeDetail(detail, podcast)
}
