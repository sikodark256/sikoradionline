// Proxies the Zeno.fm now-playing metadata stream (Server-Sent Events).
// Doing this server-side avoids browser CORS restrictions against api.zeno.fm.

const MOUNT = "xdkqr4btptutv"
const UPSTREAM = `https://api.zeno.fm/mounts/metadata/subscribe/${MOUNT}`

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  const upstream = await fetch(UPSTREAM, {
    headers: { Accept: "text/event-stream" },
    signal: request.signal,
    cache: "no-store",
  })

  if (!upstream.ok || !upstream.body) {
    return new Response("Unable to connect to metadata stream", { status: 502 })
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
