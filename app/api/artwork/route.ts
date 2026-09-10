// Busca carátulas de álbum usando la API pública de iTunes
// Funciona en servidor sin restricciones CORS
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type iTunesResult = {
  artworkUrl100?: string
  artworkUrl60?: string
  artworkUrl512?: string
  collectionName?: string
  artistName?: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get("artist")?.trim() ?? ""
  const title = searchParams.get("title")?.trim() ?? ""

  if (!artist && !title) {
    return Response.json({ cover: null })
  }

  // Consulta principal con artista + canción
  const mainQuery = `${artist} ${title}`.trim()
  // Consulta de respaldo solo con el título si la principal falla
  const fallbackQuery = title || artist

  try {
    // Intento 1: búsqueda completa
    let cover = await fetchCoverFromiTunes(mainQuery, request.signal)
    // Intento 2: búsqueda más simple si no hay resultado
    if (!cover) {
      cover = await fetchCoverFromiTunes(fallbackQuery, request.signal)
    }

    return Response.json(
      { cover },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
          "Content-Type": "application/json"
        }
      }
    )
  } catch {
    return Response.json({ cover: null }, { status: 500 })
  }
}

// Función auxiliar que consulta iTunes
async function fetchCoverFromiTunes(query: string, signal: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?media=music&limit=1&term=${encodeURIComponent(query)}`,
      { cache: "no-store", signal }
    )

    if (!res.ok) return null
    const data = await res.json()
    const result: iTunesResult | undefined = data.results?.[0]

    if (!result) return null

    // Obtener la imagen en mayor resolución posible
    let coverUrl = result.artworkUrl512 || result.artworkUrl100 || result.artworkUrl60
    if (!coverUrl) return null

    // ✨ Truco: pedir versión de mayor resolución reemplazando tamaño
    coverUrl = coverUrl.replace(/\/\d+[x]\d+[.]jpg$/, "/1000x1000bb.jpg")

    return coverUrl
  } catch {
    return null
  }
}
