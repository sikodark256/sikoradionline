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
// Tiempo de espera en milisegundos para considerar que ya "sonó" y debe ir al historial (ej. 5 segundos)
const DELAY_HISTORIAL_MS = 5000 

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
    const ahora = Date.now()

    // Filtramos para que la canción no aparezca en el historial inmediatamente si acaba de registrarse
    const tracksValidos = allTracks
      .filter((track) => ahora - track.timestamp >= DELAY_HISTORIAL_MS)
      .slice(0, MAX_MOSTRAR)

    setTracks(tracksValidos)
  }

  useEffect(() => {
    // Ejecución inicial
    updateHistory()

    // Manejador con un pequeño retraso para asegurar que los datos de localStorage se asentaron
    const handleEventWithDelay = () => {
      setTimeout(updateHistory, DELAY_HISTORIAL_MS)
    }

    // El Player dispara este evento cuando cambia la canción
    window.addEventListener(
      "radio-history-updated",
      handleEventWithDelay
    )

    // Cambios realizados desde otra pestaña
    window.addEventListener(
      "storage",
      updateHistory
    )

    // Actualiza "Hace X min" y verifica si ya se cumplió el tiempo para mostrar la canción retrasada
    const timer = window.setInterval(() => {
      updateHistory()
    }, 10000) // Bajado a 10s para verificar cambios más seguido

    return () => {
      window.removeEventListener(
        "radio-history-updated",
        handleEventWithDelay
      )

      window.removeEventListener(
        "storage",
        updateHistory
      )

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
              title={`${track.title}${
                track.artist ? ` — ${track.artist}` : ""
              }`}
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
