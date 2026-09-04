"use client"
import { useState, useEffect } from "react"
import type { HistoryTrack } from "./radio-player"

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
  // Estado para forzar la actualización de los textos de tiempo ("Hace X min") cada minuto
  const [, setTick] = useState(0)

  const loadHistory = () => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (!raw) {
        setTracks([])
        return
      }

      const parsed: HistoryTrack[] = JSON.parse(raw)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setTracks([])
        return
      }
          
      // Ordenamos cronológicamente (las más recientes primero)
      const ordenadas = parsed.sort((a, b) => b.timestamp - a.timestamp)

      // 🔥 ALGORITMO ANTIDESFASE AUTOMÁTICO:
      // Corrige en tiempo de renderizado el retraso de guardado del Player
      const corregidas = ordenadas.map((track, idx) => {
        const portadaRezagada = ordenadas[idx - 1]?.cover
        const tienePortadaValida = portadaRezagada && 
                                   portadaRezagada.trim() !== "" && 
                                   portadaRezagada !== DEFAULT_COVER

        return {
          ...track,
          cover: tienePortadaValida ? portadaRezagada : (track.cover || DEFAULT_COVER)
        }
      })

      setTracks(corregidas.slice(0, MAX_HISTORY))
    } catch {
      setTracks([])
    }
  }

  useEffect(() => {
    loadHistory()
    window.addEventListener("radio-history-updated", loadHistory)
    window.addEventListener("storage", loadHistory)

    // Forzar el refresco visual de los minutos ("Hace 2 min", etc.)
    const timer = window.setInterval(() => {
      setTick((t) => t + 1)
    }, 60000)

    return () => {
      window.removeEventListener("radio-history-updated", loadHistory)
      window.removeEventListener("storage", loadHistory)
      window.clearInterval(timer)
    }
  }, [])

  // 💡 MEJORA: Si no hay historial real guardado, la sección se oculta elegantemente
  if (tracks.length === 0) {
    return null
  }

  return (
    <section className="w-full rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">🎧 Reproducidos recientemente</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Últimas canciones que sonaron en la estación
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          {tracks.length} {tracks.length === 1 ? 'tema' : 'temas'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {tracks.map((track, i) => (
          <div 
            key={`${track.title}-${track.timestamp}-${i}`} 
            className="group relative overflow-hidden rounded-xl bg-secondary/50 transition-all hover:shadow-lg"
          >
            <div className="aspect-square relative">
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
              <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                #{i + 1}
              </div>
            </div>
            <div className="p-2.5">
              <p className="truncate text-sm font-semibold">{track.title}</p>
              <p className="truncate text-xs text-muted-foreground">{track.artist || "SIKODARK Radio"}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">{formatTimeAgo(track.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
