import { API_BASE_URL } from "./client"

const API_PREFIX = "/api/v1"
const PROTECTED_MEDIA_PATHS = [
  "/api/v1/bien-etre/articles/",
  "/api/v1/exploits/",
  "/api/v1/creativite/",
  "/api/v1/musique/morceaux/",
]

export type MediaKind = "image" | "video" | "audio"

export function resolveBackendMediaUrl(src: string | null | undefined): string | null {
  if (!src) return null
  if (src.startsWith("blob:") || src.startsWith("data:")) return src
  if (/^https?:\/\//i.test(src)) return src
  if (src.startsWith(API_PREFIX)) return `${API_BASE_URL}${src}`
  if (
    src.startsWith("/bien-etre/") ||
    src.startsWith("/exploits/") ||
    src.startsWith("/creativite/") ||
    src.startsWith("/musique/")
  ) {
    return `${API_BASE_URL}${API_PREFIX}${src}`
  }
  return src
}

export function isProtectedBackendMediaUrl(src: string | null | undefined): boolean {
  const resolved = resolveBackendMediaUrl(src)
  if (!resolved) return false
  try {
    const url = new URL(resolved, typeof window === "undefined" ? "http://localhost" : window.location.origin)
    return PROTECTED_MEDIA_PATHS.some((path) => url.pathname.startsWith(path))
  } catch {
    return PROTECTED_MEDIA_PATHS.some((path) => resolved.startsWith(path))
  }
}

export function inferMediaKind(src: string | null | undefined, contentType?: string | null): MediaKind {
  const type = contentType?.toLowerCase() ?? ""
  if (type.startsWith("audio/")) return "audio"
  if (type.startsWith("video/")) return "video"
  if (type.startsWith("image/")) return "image"

  const clean = (src ?? "").split("?")[0]?.toLowerCase() ?? ""
  if (/\.(mp3|m4a|aac|ogg|oga|wav)$/.test(clean)) return "audio"
  if (/\.(mp4|webm|ogg|ogv)$/.test(clean)) return "video"
  return "image"
}
