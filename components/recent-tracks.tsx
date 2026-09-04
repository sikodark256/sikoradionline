"use client"

import { useEffect, useState } from "react"

type HistoryTrack = {
  title: string
  artist: string | null
  cover: string | null
  timestamp: number
}

const HISTORY_KEY = "radio-recent-tracks"
const MAX_HISTORY = 10
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

export function RecentTracks() {
  const [tracks, setTracks] = useState<HistoryTrack[]>([])
  const [, setTick] = useState(0)

  const loadHistory = () => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (!raw) {
        setTracks([])
        return
      }

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setTracks([])
        return
      }

      // 1. Filtrar datos corruptos y ordenar estrictamente por tiempo (Más recientes primero)
      const ordenadas = parsed
        .filter((t) => t && typeof t.title === "string" && t.title.trim() !== "")
        .sort((a, b) => b.timestamp - a.timestamp)

      // 🚀 ALGORITMO DE RE-ALINEACIÓN SECUENCIAL
      // Soluciona el error donde el Player graba el historial duplicando la carátula previa.
      // Si la canción #1 tiene el mismo arte que la #2 pero son pistas distintas, reajusta las posiciones.
      const corregidas = ordenadas.map((track, idx) => {
        let portadaFinal = track.cover

        if (idx === 0 && ordenadas.length > 1) {
          const siguienteTrack = ordenadas[1]
          const compartePortadaAnterior = track.cover === siguienteTrack.cover && track.cover !== DEFAULT_COVER
          const esDiferenteTema = track.title.toLowerCase().trim() !== siguienteTrack.title.toLowerCase().trim()

          if (compartePortadaAnterior && esDiferenteTema) {
            // Se le asigna el logo temporal mientras el player resuelve de forma asíncrona la portada real en la API
            portadaFinal = DEFAULT_COVER
          }
        }

        // Si por retraso extremo la portada real quedó guardada en el casillero anterior, la recuperamos
        if (idx > 0 && (!track.cover || track.cover === DEFAULT_COVER)) {
          const posiblePortadaRetrasada = ordenadas[idx - 1]?.cover
          if (posiblePortadaRetrasada && posiblePortadaRetrasada !== DEFAULT_COVER) {
            portadaFinal = posiblePortadaRetrasada
          }
        }

        return {
          ...track,
          cover: portadaFinal && portadaFinal.trim() !== "" ? portadaFinal : DEFAULT_COVER
        }
      })

      setTracks(corregidas.slice(0, MAX_HISTORY))
    } catch (error) {
      console.error("Error procesando historial de reproducción:", error)
      setTracks([])
    }
  }

  useEffect(() => {
    loadHistory()

    // Escucha eventos del reproductor y cambios entre pestañas de la PWA
    window.addEventListener("radio-history-updated", loadHistory)
    window.addEventListener("storage", loadHistory)

    // Intervalo de re-render para actualizar dinámicamente los contadores de tiempo
    const timer = window.setInterval(() => {
      setTick((t) => t + 1)
    }, 60000)

    return () => {
      window.removeEventListener("radio-history-updated", loadHistory)
      window.removeEventListener("storage", loadHistory)
      window.clearInterval(timer)
    }
  }, [])

  if (tracks.length === 0) {
    return null
  }

  return (
    <section 
      className="w-full rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8"
      aria-label="Historial de reproducción"
    >
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">🎧 Reproducidos recientemente</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Últimas canciones que sonaron en la estación
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          {tracks.length} {tracks.length === 1 ? "tema" : "temas"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {tracks.map((track, i) => (
          <article 
            key={`${track.title}-${track.timestamp}-${i}`}
            className="group relative flex flex-col overflow-hidden rounded-xl bg-secondary/50 transition-all hover:bg-secondary hover:shadow-xl"
          >
            <div className="aspect-square relative w-full overflow-hidden bg-muted">
              <img
                src={track.cover || DEFAULT_COVER}
                alt={`Carátula de ${track.title}`}
                crossOrigin="anonymous"
                className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_COVER
                  e.currentTarget.onerror = null
                }}
              />
              <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                #{i + 1}
              </div>
            </div>
            
            <div className="flex flex-1 flex-col gap-0.5 p-3">
              <h3 className="line-clamp-1 text-sm font-semibold tracking-tight">
                {track.title}
              </h3>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {track.artist || "SIKODARK Radio"}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
                {formatTimeAgo(track.timestamp)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
