// Realistic preview data. These mocks mirror the FastAPI response shapes so that
// they can be swapped transparently once NEXT_PUBLIC_API_BASE_URL is configured.

import type {
  AudioProgress,
  Book,
  BookAccess,
  BookProgress,
  CategorieLivre,
  Episode,
  EpisodeDetail,
  Podcast,
  User,
} from "./types"

export const MOCK_USER: User = {
  id: "u_demo",
  email: "esther@bethel-ados.org",
  username: "esther.ng",
  first_name: "Esther",
  last_name: "N'Guessan",
  birth_date: "2009-06-12",
  role: "user",
  account_status: "active",
  is_superadmin: false,
  must_change_password: false,
  avatar_url: null,
  created_at: "2026-01-10T10:00:00Z",
  updated_at: "2026-04-10T10:00:00Z",
}

export const MOCK_CATEGORIES: CategorieLivre[] = [
  { id: "c1", nom: "Foi", description: "Grandir dans la relation avec Dieu" },
  { id: "c2", nom: "Identité", description: "Découvrir qui tu es en Christ" },
  { id: "c3", nom: "Relations", description: "Famille, amitiés, amour sain" },
  { id: "c4", nom: "Discipline", description: "Habitudes et croissance personnelle" },
  { id: "c5", nom: "Leadership", description: "Servir et influencer positivement" },
  { id: "c6", nom: "Vie émotionnelle", description: "Comprendre et gérer ses émotions" },
]

export const MOCK_BOOKS: Book[] = [
  {
    id: "b1",
    titre: "Racines profondes",
    auteur: "Pasteur Samuel Koffi",
    description:
      "Un guide lumineux pour les adolescents qui veulent construire une foi solide, ancrée dans la Parole et dans la prière quotidienne.",
    couverture_url: "/book-faith-roots-cover.jpg",
    categorie: MOCK_CATEGORIES[0],
    annee_publication: 2024,
    isbn: "978-2-9876-5432-1",
    lien_achat: null,
    est_recommande: true,
    formats_disponibles: ["pdf", "epub"],
    created_at: "2026-02-01T10:00:00Z",
    updated_at: "2026-02-01T10:00:00Z",
  },
  {
    id: "b2",
    titre: "Qui suis-je vraiment ?",
    auteur: "Marie-Laure Adjovi",
    description:
      "À l'adolescence, l'identité se construit. Ce livre aide à poser les bonnes bases, en Christ, pour une vie libre et confiante.",
    couverture_url: "/book-identity-cover.jpg",
    categorie: MOCK_CATEGORIES[1],
    annee_publication: 2023,
    isbn: null,
    lien_achat: null,
    est_recommande: true,
    formats_disponibles: ["pdf"],
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "b3",
    titre: "Aimer sans se perdre",
    auteur: "Dr Josué Mensah",
    description:
      "Les relations saines ne s'improvisent pas. Un parcours honnête sur l'amitié, la famille et les premiers pas amoureux.",
    couverture_url: "/book-relationships-cover.jpg",
    categorie: MOCK_CATEGORIES[2],
    annee_publication: 2025,
    isbn: null,
    lien_achat: null,
    est_recommande: false,
    formats_disponibles: ["pdf", "epub"],
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "b4",
    titre: "Discipline : la puissance du quotidien",
    auteur: "Équipe Bethel Ados",
    description:
      "Petites habitudes, grands changements. Un livre pratique pour apprendre à se lever, étudier et prier avec constance.",
    couverture_url: "/book-discipline-cover.jpg",
    categorie: MOCK_CATEGORIES[3],
    annee_publication: 2024,
    isbn: null,
    lien_achat: null,
    est_recommande: false,
    formats_disponibles: ["pdf"],
    created_at: "2026-02-10T10:00:00Z",
    updated_at: "2026-02-10T10:00:00Z",
  },
  {
    id: "b5",
    titre: "Un jeune, un appel",
    auteur: "Pasteur Samuel Koffi",
    description:
      "Dieu appelle dès la jeunesse. Découvre comment entendre sa voix, servir ton entourage et grandir en leadership.",
    couverture_url: "/book-leadership-call-cover.jpg",
    categorie: MOCK_CATEGORIES[4],
    annee_publication: 2025,
    isbn: null,
    lien_achat: null,
    est_recommande: true,
    formats_disponibles: ["pdf", "epub"],
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "b6",
    titre: "Mes émotions, mon allié",
    auteur: "Marie-Laure Adjovi",
    description:
      "Colère, tristesse, joie, peur : apprendre à comprendre ses émotions pour mieux les vivre à la lumière de la foi.",
    couverture_url: "/book-emotions-cover.jpg",
    categorie: MOCK_CATEGORIES[5],
    annee_publication: 2024,
    isbn: null,
    lien_achat: null,
    est_recommande: false,
    formats_disponibles: ["pdf"],
    created_at: "2026-02-20T10:00:00Z",
    updated_at: "2026-02-20T10:00:00Z",
  },
]

export const MOCK_PODCASTS: Podcast[] = [
  {
    id: "p1",
    titre: "Debout les jeunes",
    description:
      "Un podcast hebdomadaire qui éclaire les questions des ados à partir de la Bible, avec humour et sincérité.",
    image_url: "/podcast-debout-cover.jpg",
    animateur: "Pasteur Samuel Koffi",
    est_actif: true,
    episodes_count: 12,
    created_at: "2026-01-05T10:00:00Z",
  },
  {
    id: "p2",
    titre: "Parole sans filtre",
    description:
      "Conversations honnêtes entre adolescents et encadreurs sur l'amour, l'école, les réseaux et la foi.",
    image_url: "/podcast-filtre-cover.jpg",
    animateur: "Équipe Bethel Ados",
    est_actif: true,
    episodes_count: 8,
    created_at: "2026-02-01T10:00:00Z",
  },
  {
    id: "p3",
    titre: "La Bible expliquée",
    description:
      "Un livre de la Bible expliqué simplement chaque semaine, pour lire plus et mieux comprendre.",
    image_url: "/podcast-bible-cover.jpg",
    animateur: "Dr Josué Mensah",
    est_actif: true,
    episodes_count: 20,
    created_at: "2026-01-15T10:00:00Z",
  },
]

export const MOCK_EPISODES: Episode[] = [
  {
    id: "e1",
    podcast_id: "p1",
    titre: "Pourquoi prier quand Dieu semble silencieux ?",
    description:
      "Quand les prières semblent sans réponse, comment garder la foi ? Témoignages et enseignement biblique.",
    numero: 1,
    duree_secondes: 1580,
    date_publication: "2026-04-15",
    est_publie: true,
  },
  {
    id: "e2",
    podcast_id: "p1",
    titre: "Les écrans, amis ou ennemis ?",
    description:
      "TikTok, Insta, jeux... Comment vivre avec les écrans sans s'y perdre. Des pistes concrètes.",
    numero: 2,
    duree_secondes: 1820,
    date_publication: "2026-04-08",
    est_publie: true,
  },
  {
    id: "e3",
    podcast_id: "p1",
    titre: "Je me sens seul(e) — et maintenant ?",
    description: "La solitude à l'adolescence est réelle. Voici comment la traverser avec foi.",
    numero: 3,
    duree_secondes: 1420,
    date_publication: "2026-04-01",
    est_publie: true,
  },
  {
    id: "e4",
    podcast_id: "p2",
    titre: "Premier amour : où poser les limites ?",
    description: "Une conversation ouverte et bienveillante sur les premières relations amoureuses.",
    numero: 1,
    duree_secondes: 1950,
    date_publication: "2026-04-10",
    est_publie: true,
  },
  {
    id: "e5",
    podcast_id: "p2",
    titre: "Conflits à la maison : comment garder la paix",
    description: "Frères, sœurs, parents... Apprendre à gérer les tensions avec sagesse.",
    numero: 2,
    duree_secondes: 1700,
    date_publication: "2026-04-03",
    est_publie: true,
  },
  {
    id: "e6",
    podcast_id: "p3",
    titre: "Jean 1 : la Parole faite chair",
    description: "Plongée dans le premier chapitre de l'Évangile selon Jean.",
    numero: 1,
    duree_secondes: 1240,
    date_publication: "2026-04-18",
    est_publie: true,
  },
]

export const MOCK_BOOK_PROGRESS: Record<string, BookProgress> = {
  b1: {
    book_id: "b1",
    user_id: MOCK_USER.id,
    progress_percent: 42,
    current_page: 58,
    total_pages: 140,
    last_opened_at: "2026-04-19T18:30:00Z",
    completed_at: null,
  },
  b5: {
    book_id: "b5",
    user_id: MOCK_USER.id,
    progress_percent: 18,
    current_page: 22,
    total_pages: 120,
    last_opened_at: "2026-04-17T20:10:00Z",
    completed_at: null,
  },
}

export const MOCK_AUDIO_PROGRESS: Record<string, AudioProgress> = {
  e1: {
    episode_id: "e1",
    user_id: MOCK_USER.id,
    position_seconds: 620,
    duration_seconds: 1580,
    completed: false,
    last_listened_at: "2026-04-20T07:45:00Z",
  },
}

export function mockBookAccess(bookId: string): BookAccess {
  const book = MOCK_BOOKS.find((b) => b.id === bookId)
  const formats = book?.formats_disponibles ?? ["pdf"]
  const expires = new Date(Date.now() + 1000 * 60 * 10).toISOString()
  return {
    book_id: bookId,
    assets: formats.map((f) => ({
      format: f,
      mime_type: f === "pdf" ? "application/pdf" : "application/epub+zip",
      expires_at: expires,
      read_url: `#mock-${bookId}-${f}`,
    })),
  }
}

export function mockEpisodeDetail(episodeId: string): EpisodeDetail | null {
  const ep = MOCK_EPISODES.find((e) => e.id === episodeId)
  if (!ep) return null
  const podcast = MOCK_PODCASTS.find((p) => p.id === ep.podcast_id)
  return {
    ...ep,
    podcast: podcast
      ? { id: podcast.id, titre: podcast.titre, image_url: podcast.image_url }
      : undefined,
    audio: {
      // Public CC sample audio so the preview player is actually playable
      read_url:
        "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3",
      mime_type: "audio/mpeg",
      expires_at: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    },
  }
}

export const MOCK_ADMIN_USER: User = {
  ...MOCK_USER,
  id: "u_admin",
  email: "admin@bethel-ados.org",
  username: "admin.bethel",
  first_name: "Paul",
  last_name: "Admin",
  role: "admin",
}
