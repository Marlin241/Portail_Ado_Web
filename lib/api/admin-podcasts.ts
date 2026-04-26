import { apiRequest } from "./client"
import { mapEpisode, mapPodcast } from "./mappers"
import type {
  AdminEpisodePayload,
  AdminPodcastPayload,
  Episode,
  EpisodeDetail,
  PaginatedResponse,
  Podcast,
} from "./types"

export async function adminListPodcasts(): Promise<Podcast[]> {
  return apiRequest<Podcast[]>("/podcasts").then((items) => items.map(mapPodcast))
}

export async function adminListEpisodes(
  podcastId: string,
  params: { limit?: number; offset?: number; includeAudioPreview?: boolean } = {},
): Promise<PaginatedResponse<Episode>> {
  // Limite max autorisée par le backend : 100
  const response = await apiRequest<PaginatedResponse<Episode>>(`/podcasts/${podcastId}/episodes`, {
    query: { limit: Math.min(params.limit ?? 100, 100), offset: params.offset ?? 0 },
  })

  const includeAudioPreview = params.includeAudioPreview ?? true
  const items = includeAudioPreview
    ? await Promise.all(
        response.items.map(async (episode) => {
          try {
            const detail = await apiRequest<EpisodeDetail>(`/podcasts/episodes/${episode.id}`)
            return mapEpisode(episode, { audio_url: detail.audio.read_url })
          } catch {
            return mapEpisode(episode)
          }
        }),
      )
    : response.items.map((episode) => mapEpisode(episode))

  return { ...response, items }
}

export async function adminGetPodcast(id: string): Promise<Podcast | null> {
  return apiRequest<Podcast>(`/podcasts/${id}`).then(mapPodcast)
}

export async function adminCreatePodcast(payload: AdminPodcastPayload): Promise<Podcast> {
  return apiRequest<Podcast>("/podcasts", { method: "POST", body: payload }).then(mapPodcast)
}

export async function adminUpdatePodcast(
  id: string,
  payload: Partial<AdminPodcastPayload>,
): Promise<Podcast> {
  return apiRequest<Podcast>(`/podcasts/${id}`, { method: "PUT", body: payload }).then(mapPodcast)
}

export async function adminDeletePodcast(id: string): Promise<void> {
  await apiRequest<void>(`/podcasts/${id}`, { method: "DELETE" })
}

export async function adminCreateEpisode(
  podcastId: string,
  payload: Omit<AdminEpisodePayload, "podcast_id">,
): Promise<Episode> {
  return apiRequest<Episode>(`/podcasts/${podcastId}/episodes`, {
    method: "POST",
    body: payload,
  }).then(mapEpisode)
}

export async function adminUpdateEpisode(
  id: string,
  payload: Partial<AdminEpisodePayload>,
): Promise<Episode> {
  return apiRequest<Episode>(`/podcasts/episodes/${id}`, { method: "PUT", body: payload }).then(mapEpisode)
}

export async function adminDeleteEpisode(id: string): Promise<void> {
  await apiRequest<void>(`/podcasts/episodes/${id}`, { method: "DELETE" })
}

export async function adminPublishEpisode(id: string): Promise<Episode> {
  return adminToggleEpisodePublish(id, true)
}

export async function adminUnpublishEpisode(id: string): Promise<Episode> {
  return adminToggleEpisodePublish(id, false)
}

export async function adminToggleEpisodePublish(
  id: string,
  publish: boolean,
): Promise<Episode> {
  return apiRequest<Episode>(`/podcasts/episodes/${id}/publish`, {
    method: "PATCH",
    body: { est_publie: publish },
  }).then(mapEpisode)
}

export async function adminUploadEpisodeAudio(id: string, file: File): Promise<Episode> {
  const form = new FormData()
  form.append("file", file)
  await apiRequest(`/podcasts/episodes/${id}/audio`, {
    method: "POST",
    body: form,
  })
  const detail = await apiRequest<EpisodeDetail>(`/podcasts/episodes/${id}`)
  return mapEpisode(detail, { audio_url: detail.audio.read_url })
}

export async function adminUploadPodcastImage(id: string, file: File): Promise<Podcast> {
  const form = new FormData()
  form.append("file", file)
  await apiRequest(`/podcasts/${id}/image`, {
    method: "POST",
    body: form,
  })
  return apiRequest<Podcast>(`/podcasts/${id}`).then(mapPodcast)
}
