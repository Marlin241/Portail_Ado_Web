import { apiRequest } from "./client"
import { resolveApiUrl } from "./mappers"
import type {
  ArtisteGospel,
  ArtisteGospelPayload,
  GenreMusical,
  GenreMusicalPayload,
  Morceau,
  MorceauAdmin,
  MorceauPayload,
  PlaylistMusicale,
  PlaylistMusicaleAdminDetail,
  PlaylistMusicaleDetail,
  PlaylistMusicalePayload,
  PropositionMusique,
  PropositionMusiqueAdmin,
  PropositionMusiquePayload,
  StatutPropositionMusique,
} from "./types"

function mapArtiste<T extends ArtisteGospel>(item: T): T {
  return { ...item, photo_url: resolveApiUrl(item.photo_url) } as T
}

function mapMorceau<T extends Morceau | MorceauAdmin>(item: T): T {
  return {
    ...item,
    audio_url: resolveApiUrl(item.audio_url),
    artiste: item.artiste ? mapArtiste(item.artiste) : null,
  } as T
}

function mapPlaylist<T extends PlaylistMusicale | PlaylistMusicaleDetail | PlaylistMusicaleAdminDetail>(
  item: T,
): T {
  return {
    ...item,
    image_url: resolveApiUrl(item.image_url),
    ...("morceaux" in item ? { morceaux: item.morceaux.map(mapMorceau) } : {}),
  } as T
}

export async function listPlaylistsMusique(): Promise<PlaylistMusicale[]> {
  return apiRequest<PlaylistMusicale[]>("/musique/playlists").then((items) =>
    items.map(mapPlaylist),
  )
}

export async function getPlaylistMusique(id: string): Promise<PlaylistMusicaleDetail> {
  return apiRequest<PlaylistMusicaleDetail>(`/musique/playlists/${id}`).then(mapPlaylist)
}

export async function listArtistesGospel(): Promise<ArtisteGospel[]> {
  return apiRequest<ArtisteGospel[]>("/musique/artistes").then((items) => items.map(mapArtiste))
}

export async function listGenresMusicaux(): Promise<GenreMusical[]> {
  return apiRequest<GenreMusical[]>("/musique/genres")
}

export async function listMorceauxParGenre(genreId: string): Promise<Morceau[]> {
  return apiRequest<Morceau[]>(`/musique/genres/${genreId}/morceaux`).then((items) =>
    items.map(mapMorceau),
  )
}

export async function getMorceau(id: string): Promise<Morceau> {
  return apiRequest<Morceau>(`/musique/morceaux/${id}`).then(mapMorceau)
}

export async function likeMorceau(id: string): Promise<void> {
  await apiRequest(`/musique/morceaux/${id}/like`, { method: "POST" })
}

export async function unlikeMorceau(id: string): Promise<void> {
  await apiRequest<void>(`/musique/morceaux/${id}/like`, { method: "DELETE" })
}

export async function listMesLikesMusique(): Promise<Morceau[]> {
  return apiRequest<Morceau[]>("/musique/mes-likes").then((items) => items.map(mapMorceau))
}

export async function marquerMorceauEcoute(id: string): Promise<void> {
  await apiRequest(`/musique/morceaux/${id}/ecouter`, { method: "POST" })
}

export async function listMesEcoutesMusique(): Promise<Morceau[]> {
  return apiRequest<Morceau[]>("/musique/mes-ecoutes").then((items) => items.map(mapMorceau))
}

export async function proposerMorceau(
  payload: PropositionMusiquePayload,
): Promise<PropositionMusique> {
  return apiRequest<PropositionMusique>("/musique/propositions", {
    method: "POST",
    body: payload,
  })
}

export async function listMesPropositionsMusique(): Promise<PropositionMusique[]> {
  return apiRequest<PropositionMusique[]>("/musique/mes-propositions")
}

export async function adminListArtistesGospel(): Promise<ArtisteGospel[]> {
  return apiRequest<ArtisteGospel[]>("/admin/musique/artistes").then((items) =>
    items.map(mapArtiste),
  )
}

export async function adminCreateArtisteGospel(
  payload: ArtisteGospelPayload,
): Promise<ArtisteGospel> {
  return apiRequest<ArtisteGospel>("/admin/musique/artistes", {
    method: "POST",
    body: payload,
  }).then(mapArtiste)
}

export async function adminUpdateArtisteGospel(
  id: string,
  payload: Partial<ArtisteGospelPayload>,
): Promise<ArtisteGospel> {
  return apiRequest<ArtisteGospel>(`/admin/musique/artistes/${id}`, {
    method: "PATCH",
    body: payload,
  }).then(mapArtiste)
}

export async function adminDeleteArtisteGospel(id: string): Promise<void> {
  await apiRequest<void>(`/admin/musique/artistes/${id}`, { method: "DELETE" })
}

export async function adminUploadPhotoArtiste(id: string, file: File): Promise<ArtisteGospel> {
  const form = new FormData()
  form.append("file", file)
  return apiRequest<ArtisteGospel>(`/admin/musique/artistes/${id}/photo`, {
    method: "POST",
    body: form,
  }).then(mapArtiste)
}

export async function adminListGenresMusicaux(): Promise<GenreMusical[]> {
  return apiRequest<GenreMusical[]>("/admin/musique/genres")
}

export async function adminCreateGenreMusical(
  payload: GenreMusicalPayload,
): Promise<GenreMusical> {
  return apiRequest<GenreMusical>("/admin/musique/genres", {
    method: "POST",
    body: payload,
  })
}

export async function adminDeleteGenreMusical(id: string): Promise<void> {
  await apiRequest<void>(`/admin/musique/genres/${id}`, { method: "DELETE" })
}

export async function adminListPlaylistsMusique(): Promise<PlaylistMusicale[]> {
  return apiRequest<PlaylistMusicale[]>("/admin/musique/playlists").then((items) =>
    items.map(mapPlaylist),
  )
}

export async function adminCreatePlaylistMusique(
  payload: PlaylistMusicalePayload,
): Promise<PlaylistMusicale> {
  return apiRequest<PlaylistMusicale>("/admin/musique/playlists", {
    method: "POST",
    body: payload,
  }).then(mapPlaylist)
}

export async function adminGetPlaylistMusique(id: string): Promise<PlaylistMusicaleAdminDetail> {
  return apiRequest<PlaylistMusicaleAdminDetail>(`/admin/musique/playlists/${id}`).then(
    mapPlaylist,
  )
}

export async function adminUpdatePlaylistMusique(
  id: string,
  payload: Partial<PlaylistMusicalePayload>,
): Promise<PlaylistMusicale> {
  return apiRequest<PlaylistMusicale>(`/admin/musique/playlists/${id}`, {
    method: "PATCH",
    body: payload,
  }).then(mapPlaylist)
}

export async function adminDeletePlaylistMusique(id: string): Promise<void> {
  await apiRequest<void>(`/admin/musique/playlists/${id}`, { method: "DELETE" })
}

export async function adminUploadImagePlaylist(id: string, file: File): Promise<PlaylistMusicale> {
  const form = new FormData()
  form.append("file", file)
  return apiRequest<PlaylistMusicale>(`/admin/musique/playlists/${id}/image`, {
    method: "POST",
    body: form,
  }).then(mapPlaylist)
}

export async function adminAddMorceau(
  playlistId: string,
  payload: MorceauPayload,
): Promise<MorceauAdmin> {
  return apiRequest<MorceauAdmin>(`/admin/musique/playlists/${playlistId}/morceaux`, {
    method: "POST",
    body: payload,
  }).then(mapMorceau)
}

export async function adminUpdateMorceau(
  id: string,
  payload: Partial<MorceauPayload>,
): Promise<MorceauAdmin> {
  return apiRequest<MorceauAdmin>(`/admin/musique/morceaux/${id}`, {
    method: "PATCH",
    body: payload,
  }).then(mapMorceau)
}

export async function adminDeleteMorceau(id: string): Promise<void> {
  await apiRequest<void>(`/admin/musique/morceaux/${id}`, { method: "DELETE" })
}

export async function adminUploadAudioMorceau(id: string, file: File): Promise<MorceauAdmin> {
  const form = new FormData()
  form.append("file", file)
  return apiRequest<MorceauAdmin>(`/admin/musique/morceaux/${id}/audio`, {
    method: "POST",
    body: form,
  }).then(mapMorceau)
}

export async function adminTogglePublierMorceau(id: string): Promise<MorceauAdmin> {
  return apiRequest<MorceauAdmin>(`/admin/musique/morceaux/${id}/publier`, {
    method: "PATCH",
  }).then(mapMorceau)
}

export async function adminListPropositionsMusique(
  statut?: StatutPropositionMusique | "all",
): Promise<PropositionMusiqueAdmin[]> {
  return apiRequest<PropositionMusiqueAdmin[]>("/admin/musique/propositions", {
    query: { statut: statut === "all" ? undefined : statut },
  })
}

export async function adminChangePropositionMusiqueStatus(
  id: string,
  statut: StatutPropositionMusique,
): Promise<PropositionMusiqueAdmin> {
  return apiRequest<PropositionMusiqueAdmin>(`/admin/musique/propositions/${id}/statut`, {
    method: "PATCH",
    body: { statut },
  })
}
