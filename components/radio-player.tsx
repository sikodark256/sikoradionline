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
    
    // Tomamos la cantidad configurada en MAX_MOSTRAR (por ejemplo, la última carátula registrada)
    setTracks(allTracks.slice(0, MAX_MOSTRAR))
  }

  useEffect(() => {
    updateHistory()

    window.addEventListener("radio-history-updated", updateHistory)
    window.addEventListener("storage", updateHistory)

    return () => {
      window.removeEventListener("radio-history-updated", updateHistory)
      window.removeEventListener("storage", updateHistory)
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

      {/* Grid optimizada para mostrar solo las portadas en tamaño compacto */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {tracks.map((track, idx) => {
          const cover =
            track.cover && track.cover.trim() !== ""
              ? track.cover
              : DEFAULT_COVER

          return (
            <article
              key={`${track.title}-${track.artist ?? ""}-${track.timestamp}`}
              className="group relative flex flex-col overflow-hidden rounded-xl bg-secondary/50 transition-all hover:bg-secondary hover:shadow-lg aspect-square w-full"
              // Al pasar el mouse o presionar, seguirá mostrando discretamente qué tema es
              title={`${track.title}${
                track.artist ? ` — ${track.artist}` : ""
              }`}
            >
              <div className="relative h-full w-full overflow-hidden bg-secondary">
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

                {/* Indicador de posición en el historial (#1) */}
                <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm z-10">
                  #{idx + 1}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
