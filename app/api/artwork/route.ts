// Looks up album cover art from Deezer's public search API.
// Runs server-side to avoid browser CORS restrictions against api.deezer.com.

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type DeezerTrack = {
  album?: { cover_medium?: string; cover_big?: string; cover_xl?: string }
  artist?: { picture_big?: string }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get("artist")?.trim() ?? ""
  const title = searchParams.get("title")?.trim() ?? ""

  if (!artist && !title) {
    return Response.json({ cover: null })
  }

  // CORRECCIÓN 1: Sintaxis correcta para filtros avanzados de Deezer (sin comillas internas)
  // Ejemplo correcto: q=artist:Dimmu Borgir track:Hybrid Stigmata
  const advancedQuery = [
    artist && `artist:${artist}`, 
    title && `track:${title}`
  ].filter(Boolean).join(" ")

  // Fallback en texto plano si la búsqueda avanzada es muy estricta (ej: remixes o caracteres raros)
  const fallbackQuery = `${artist} ${title}`.trim()

  try {
    // Intentar búsqueda avanzada
    let cover = await fetchCoverFromDeezer(advancedQuery, request.signal)

    // CORRECCIÓN 2: Si no encuentra nada, re-intenta con texto plano para evitar carátulas vacías
    if (!cover) {
      cover = await fetchCoverFromDeezer(fallbackQuery, request.signal)
    }

    // CORRECCIÓN 3: Envío correcto de Headers de control de caché en Response.json
    return Response.json(
      { cover },
      { 
        status: 200,
        headers: { 
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
          "Content-Type": "application/json"
        } 
      },
    )
  } catch {
    return Response.json({ cover: null }, { status: 500 })
  }
}

// Función auxiliar para reutilizar la lógica de fetch de Deezer
async function fetchCoverFromDeezer(query: string, signal: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.deezer.com/search?limit=1&q=${encodeURIComponent(query)}`,
      { cache: "no-store", signal },
    )

    if (!res.ok) return null

    const data = (await res.json()) as { data?: DeezerTrack[] }
    const track = data.data?.[0]

    return (
      track?.album?.cover_xl ||
      track?.album?.cover_big ||
      track?.album?.cover_medium ||
      track?.artist?.picture_big ||
      null
    )
  } catch {
    return null
  }
}
