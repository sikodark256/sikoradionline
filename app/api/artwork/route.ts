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

  // Build a Deezer query; prefer artist + track for accuracy.
  const query = [artist && `artist:"${artist}"`, title && `track:"${title}"`]
    .filter(Boolean)
    .join(" ")

  try {
    const res = await fetch(
      `https://api.deezer.com/search?limit=1&q=${encodeURIComponent(query)}`,
      { cache: "no-store", signal: request.signal },
    )

    if (!res.ok) return Response.json({ cover: null })

    const data = (await res.json()) as { data?: DeezerTrack[] }
    const track = data.data?.[0]
    const cover =
      track?.album?.cover_xl ||
      track?.album?.cover_big ||
      track?.album?.cover_medium ||
      track?.artist?.picture_big ||
      null

    return Response.json(
      { cover },
      { headers: { "Cache-Control": "public, max-age=300" } },
    )
  } catch {
    return Response.json({ cover: null })
  }
}
