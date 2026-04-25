import { apiRequest, isMockMode } from "./client"
import { mapEpisode, mapPodcast } from "./mappers"
import { makeId, mockAppendAudit, mockEpisodes, mockPodcasts } from "./mocks-admin"
import type {
  AdminEpisodePayload,
  AdminPodcastPayload,
  Episode,
  EpisodeDetail,
  PaginatedResponse,
  Podcast,
} from "./types"

export async function adminListPodcasts(): Promise<Podcast[]> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 120))
    return [...mockPodcasts]
  }
  return apiRequest<Podcast[]>("/podcasts").then((items) => items.map(mapPodcast))
}

export async function adminListEpisodes(
  podcastId: string,
  params: { limit?: number; offset?: number; includeAudioPreview?: boolean } = {},
): Promise<PaginatedResponse<Episode>> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 120))
    const items = mockEpisodes
      .filter((e) => e.podcast_id === podcastId)
      .sort((a, b) => b.numero - a.numero)
    return { items, total: items.length, limit: items.length, offset: 0 }
  }

  // Limite max autorisée par le backend : 100 (Query le=100)
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
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 80))
    return mockPodcasts.find((p) => p.id === id) ?? null
  }
  return apiRequest<Podcast>(`/podcasts/${id}`).then(mapPodcast)
}

export async function adminCreatePodcast(payload: AdminPodcastPayload): Promise<Podcast> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 120))
    const now = new Date().toISOString()
    const podcast: Podcast = {
      id: makeId("p"),
      titre: payload.titre,
      description: payload.description ?? null,
      image_url: payload.image_url ?? null,
      animateur: payload.animateur ?? null,
      est_actif: payload.est_actif ?? true,
      episodes_count: 0,
      created_at: now,
    }
    mockPodcasts.unshift(podcast)
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "podcast.create",
      entity_type: "podcast",
      entity_id: podcast.id,
      ip_address: null,
      user_agent: null,
      metadata: { titre: podcast.titre },
    })
    return podcast
  }
  return apiRequest<Podcast>("/podcasts", { method: "POST", body: payload }).then(mapPodcast)
}

export async function adminUpdatePodcast(
  id: string,
  payload: Partial<AdminPodcastPayload>,
): Promise<Podcast> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 100))
    const idx = mockPodcasts.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error("Podcast introuvable")
    mockPodcasts[idx] = { ...mockPodcasts[idx], ...payload }
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "podcast.update",
      entity_type: "podcast",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: payload as Record<string, unknown>,
    })
    return mockPodcasts[idx]
  }
  return apiRequest<Podcast>(`/podcasts/${id}`, { method: "PUT", body: payload }).then(mapPodcast)
}

export async function adminDeletePodcast(id: string): Promise<void> {
  if (isMockMode()) {
    const idx = mockPodcasts.findIndex((p) => p.id === id)
    if (idx !== -1) mockPodcasts.splice(idx, 1)
    for (let i = mockEpisodes.length - 1; i >= 0; i--) {
      if (mockEpisodes[i].podcast_id === id) mockEpisodes.splice(i, 1)
    }
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "podcast.delete",
      entity_type: "podcast",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: {},
    })
    return
  }
  await apiRequest<void>(`/podcasts/${id}`, { method: "DELETE" })
}

export async function adminCreateEpisode(
  podcastId: string,
  payload: Omit<AdminEpisodePayload, "podcast_id">,
): Promise<Episode> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 150))
    const ep: Episode = {
      id: makeId("e"),
      podcast_id: podcastId,
      titre: payload.titre,
      description: payload.description ?? null,
      numero: payload.numero,
      duree_secondes: payload.duree_secondes ?? null,
      date_publication: payload.date_publication,
      est_publie: payload.est_publie ?? false,
    }
    mockEpisodes.unshift(ep)
    const idx = mockPodcasts.findIndex((p) => p.id === podcastId)
    if (idx !== -1) {
      mockPodcasts[idx] = {
        ...mockPodcasts[idx],
        episodes_count: mockPodcasts[idx].episodes_count + 1,
      }
    }
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "podcast.episode.create",
      entity_type: "episode",
      entity_id: ep.id,
      ip_address: null,
      user_agent: null,
      metadata: { podcast_id: podcastId, numero: ep.numero },
    })
    return ep
  }
  return apiRequest<Episode>(`/podcasts/${podcastId}/episodes`, {
    method: "POST",
    body: payload,
  }).then(mapEpisode)
}

export async function adminUpdateEpisode(
  id: string,
  payload: Partial<AdminEpisodePayload>,
): Promise<Episode> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 100))
    const idx = mockEpisodes.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error("Episode introuvable")
    mockEpisodes[idx] = { ...mockEpisodes[idx], ...payload }
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "podcast.episode.update",
      entity_type: "episode",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: payload as Record<string, unknown>,
    })
    return mockEpisodes[idx]
  }
  return apiRequest<Episode>(`/podcasts/episodes/${id}`, { method: "PUT", body: payload }).then(mapEpisode)
}

export async function adminDeleteEpisode(id: string): Promise<void> {
  if (isMockMode()) {
    const idx = mockEpisodes.findIndex((e) => e.id === id)
    if (idx === -1) return
    const podcastId = mockEpisodes[idx].podcast_id
    mockEpisodes.splice(idx, 1)
    const pIdx = mockPodcasts.findIndex((p) => p.id === podcastId)
    if (pIdx !== -1) {
      mockPodcasts[pIdx] = {
        ...mockPodcasts[pIdx],
        episodes_count: Math.max(0, mockPodcasts[pIdx].episodes_count - 1),
      }
    }
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "podcast.episode.delete",
      entity_type: "episode",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: {},
    })
    return
  }
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
  if (isMockMode()) {
    const ep = await adminUpdateEpisode(id, { est_publie: publish })
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: publish ? "podcast.episode.publish" : "podcast.episode.unpublish",
      entity_type: "episode",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: {},
    })
    return ep
  }
  return apiRequest<Episode>(`/podcasts/episodes/${id}/publish`, {
    method: "PATCH",
    body: { est_publie: publish },
  }).then(mapEpisode)
}

export async function adminUploadEpisodeAudio(id: string, file: File): Promise<Episode> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 300))
    const idx = mockEpisodes.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error("Episode introuvable")
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "podcast.episode.upload",
      entity_type: "episode",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: { filename: file.name, size: file.size },
    })
    return mockEpisodes[idx]
  }

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
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 200))
    const idx = mockPodcasts.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error("Podcast introuvable")
    mockPodcasts[idx] = {
      ...mockPodcasts[idx],
      image_url: URL.createObjectURL(file),
      updated_at: new Date().toISOString(),
    }
    mockAppendAudit({
      actor_id: "u_admin",
      actor_email: "admin@bethel-ados.org",
      action: "podcast.update",
      entity_type: "podcast",
      entity_id: id,
      ip_address: null,
      user_agent: null,
      metadata: { filename: file.name, size: file.size, image_upload: true },
    })
    return mockPodcasts[idx]
  }

  const form = new FormData()
  form.append("file", file)
  await apiRequest(`/podcasts/${id}/image`, {
    method: "POST",
    body: form,
  })
  return apiRequest<Podcast>(`/podcasts/${id}`).then(mapPodcast)
}
