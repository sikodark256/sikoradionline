"use client"

import { useEffect, useState } from "react"
import { Music } from "lucide-react"
import { cn } from "@/lib/utils"

type HistoryTrack = {
  title: string
  artist: string | null
  cover: string | null
  timestamp: number
}

const HISTORY_KEY = "radio-recent-tracks"

// Canciones de ejemplo para que la sección se vea completa desde el primer momento
const DEMO_TRACKS: HistoryTrack[] = [
  { title: "Blinding Lights", artist: "The Weeknd", cover: null, timestamp: Date.now() - 1000 * 60 * 5 },
  { title: "Shape of You", artist: "Ed Sheeran", cover: null, timestamp: Date.now() - 1000 * 60 * 10 },
  { title: "Levitating", artist: "Dua Lipa", cover: null, timestamp: Date.now() - 1000 * 60 * 15 },
  { title: "Watermelon Sugar", artist: "Harry Styles", cover: null, timestamp: Date.now() - 1000 * 60 * 20 },
  { title: "Don't Start Now", artist: "Dua Lipa", cover: null, timestamp: Date.now() - 1000 * 60 * 25 },
  { title: "Peaches", artist: "Justin Bieber", cover: null, timestamp: Date.now() - 1000 * 60 * 30 },
  { title: "Stay", artist: "The Kid LAROI & Justin Bieber", cover: null, timestamp: Date.now() - 1000 * 60 * 35 },
  { title: "Bad Habits", artist: "Ed Sheeran", cover: null, timestamp: Date.now() - 1000 * 60 * 40 },
  { title: "Heat Waves", artist: "Glass Animals", cover: null, timestamp: Date.now() - 1000 * 60 * 45 },
  { title: "Save Your Tears", artist: "The Weeknd", cover: null, timestamp: Date.now() - 1000 * 60 * 50 },
  { title: "Montero", artist: "Lil Nas X", cover: null, timestamp: Date.now() - 1000 * 60 * 55 },
  { title: "Kiss Me More", artist: "Doja Cat ft. SZA", cover: null, timestamp: Date.now() - 1000 * 60 * 60 },
]

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts
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
  const [hasRealHistory, setHasRealHistory] = useState(false)

  const loadHistory = () => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const parsed: HistoryTrack[] = JSON.parse(raw)
        if (parsed.length > 0) {
          setTracks(parsed)
          setHasRealHistory(true)
          return
        }
      }
      // Si no hay historial real, usar canciones demo
      setTracks(DEMO_TRACKS)
      setHasRealHistory(false)
    } catch {
      setTracks(DEMO_TRACKS)
      setHasRealHistory(false)
    }
  }

  useEffect(() => {
    loadHistory()
    window.addEventListener("radio-history-updated", loadHistory)
    window.addEventListener("storage", loadHistory)
    return () => {
      window.removeEventListener("radio-history-updated", loadHistory)
      window.removeEventListener("storage", loadHistory)
    }
  }, [])

  if (tracks.length === 0) return null

  return (
    <section
      className="w-full rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8"
      aria-label="Canciones reproducidas recientemente"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
            <Music className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold sm:text-xl lg:text-2xl">
              Reproducido recientemente
            </h2>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {hasRealHistory ? "Temas que sonaron en la radio" : "Vista previa — se actualiza al reproducir"}
            </p>
          </div>
        </div>
        <span className="hidden rounded-full bg-secondary px-3 py-1 font-mono text-xs text-muted-foreground sm:inline-block">
          {tracks.length} temas
        </span>
      </div>

      {/* Grilla responsiva:
          - Móvil: 2 columnas
          - Tablet: 3-4 columnas
          - Desktop: 5 columnas
          - TV / 4K: 6 columnas
      */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {tracks.map((track, idx) => (
          <article
            key={`${track.title}-${track.artist}-${idx}`}
            className="group flex flex-col overflow-hidden rounded-xl bg-secondary/50 transition-all hover:bg-secondary hover:shadow-lg focus-within:ring-2 focus-within:ring-ring"
            title={`${track.title}${track.artist ? " — " + track.artist : ""}`}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-secondary">
              {track.cover ? (
                <img
                  src={track.cover}
                  alt={`Carátula de ${track.title}`}
                  crossOrigin="anonymous"
                  className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = "/logo-radio.png"; }}
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/20 to-secondary">
                  <Music className="size-8 text-muted-foreground/60" aria-hidden="true" />
                </div>
              )}
              {/* Índice pequeño en la esquina */}
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
        ))}
      </div>
    </section>
  )
}
