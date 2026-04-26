import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")
  if (!raw) return new NextResponse("Paramètre url manquant", { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return new NextResponse("URL invalide", { status: 400 })
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new NextResponse("Protocole non autorisé", { status: 400 })
  }

  try {
    const upstream = await fetch(raw, { cache: "no-store" })
    if (!upstream.ok) {
      return new NextResponse("Impossible de récupérer la ressource", { status: upstream.status })
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream"

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=600",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new NextResponse("Erreur lors de la récupération de la ressource", { status: 502 })
  }
}
