"use client"

import { useEffect, useState } from "react"

type HistoryTrack = {
  title: string
  artist: string | null
  cover: string | null
  timestamp: number
}

const HISTORY_KEY = "radio-recent-tracks"
const MAX_MOSTRAR = 1
const DEFAULT_COVER = "/logo-radio.png"

function formatTimeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts)
  const mins = Math.floor(diff / 60000)

  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins} min`

  const hours = Math.floor(mins / 60)

  if (hours < 24) return `Hace ${hours} h`

  const days = Math.floor(hours / 24)
  return `Hace ${days} d`
}

function getHistory(): HistoryTrack[] {
  if (typeof window === "undefined") return []

  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (track) =>
          track &&
          typeof track.title === "string" &&
          track.title.trim() !== "" &&
          typeof track.timestamp === "number"
      )
      .sort((a, b) => b.timestamp - a.timestamp)
  } catch {
    return []
  }
}

export function RecentTracks() {
  const [tracks, setTracks] = useState<HistoryTrack[]>([])

  const updateHistory = () => {
    const allTracks = getHistory()

    // Si hay menos de 2 canciones, no hay un "historial pasado" real que mostrar aún
    if (allTracks.length < 2) {
      setTracks([])
      return
    }

    // CORRECCIÓN BIUNÍVOCA:
    // El reproductor guarda en el índice 0 los datos mezclados (Título nuevo con carátula vieja).
    // Para ver el tema anterior real que ya terminó, reconstruimos el objeto usando:
    // - La carátula del índice 0 (que pertenece al tema que acaba de terminar).
    // - El título y artista del índice 1 (que es el nombre real del tema terminado).
    const temaTerminadoReal: HistoryTrack = {
      title: allTracks[1].title,
      artist: allTracks[1].artist,
      cover: allTracks[0].cover, // Extraemos la portada que se quedó desfasada
      timestamp: allTracks[1].timestamp
    }

    setTracks([temaTerminadoReal])
  }

  useEffect(() => {
    updateHistory()

    window.addEventListener("radio-history-updated", updateHistory)
    window.addEventListener("storage", updateHistory)

    const timer = window.setInterval(() => {
      updateHistory()
    }, 30000)

    return () => {
      window.removeEventListener("radio-history-updated", updateHistory)
      window.removeEventListener("storage", updateHistory)
      window.clearInterval(timer)
    }
  }, [])

  if (tracks.length === 0) {
    return null
  }

  return (
    <section
      className="w-full rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8"
      aria-label="Canciones reproducidas recientemente"
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold sm:text-xl lg:text-2xl">
          Reproducido recientemente
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {tracks.map((track, idx) => {
          const cover =
            track.cover && track.cover.trim() !== ""
              ? track.cover
              : DEFAULT_COVER

          return (
            <article
              key={`${track.title}-${track.artist ?? ""}-${track.timestamp}`}
              className="group flex flex-col overflow-hidden rounded-xl bg-secondary/50 transition-all hover:bg-secondary hover:shadow-lg"
              title={`${track.title}${track.artist ? ` — ${track.artist}` : ""}`}
            >
              <div className="relative aspect-square w-full overflow-hidden bg-secondary">
                <img
                  src={cover}
                  alt={`Carátula de ${track.title}`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = DEFAULT_COVER
                  }}
                />

                <div className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
                  #{idx + 1}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-0.5 p-2.5 sm:p-3">
                <h3 className="line-clamp-1 text-xs font-semibold sm:text-sm">
                  {track.title}
                </h3>

                {track.artist && (
                  <p className="line-clamp-1 text-[11px] text-muted-foreground sm:text-xs">
                    {track.artist}
                  </p>
                )}

                <p className="mt-1 font-mono text-[10px] text-muted-foreground/70 sm:text-[11px]">
                  {formatTimeAgo(track.timestamp)}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
