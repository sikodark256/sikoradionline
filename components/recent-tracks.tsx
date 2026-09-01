"use client"
import { useState, useEffect } from "react"
import type { HistoryTrack } from "./radio-player"

const HISTORY_KEY = "radio-recent-tracks"
const MAX_HISTORY = 10

// ✅ Canciones de ejemplo — TODAS con tu logo
const DEMO_TRACKS: HistoryTrack[] = [
  { title: "Blinding Lights", artist: "The Weeknd", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 5 },
  { title: "Shape of You", artist: "Ed Sheeran", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 10 },
  { title: "Levitating", artist: "Dua Lipa", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 15 },
  { title: "Watermelon Sugar", artist: "Harry Styles", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 20 },
  { title: "Don't Start Now", artist: "Dua Lipa", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 25 },
  { title: "Peaches", artist: "Justin Bieber", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 30 },
  { title: "Stay", artist: "The Kid LAROI & Bieber", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 35 },
  { title: "Bad Habits", artist: "Ed Sheeran", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 40 },
  { title: "Heat Waves", artist: "Glass Animals", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 45 },
  { title: "Save Your Tears", artist: "The Weeknd", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 50 },
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
  const [tracks, setTracks] = useState<HistoryTrack[]>(DEMO_TRACKS)
  const [hasRealHistory, setHasRealHistory] = useState(false)

  const loadHistory = () => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const parsed: HistoryTrack[] = JSON.parse(raw)
        if (parsed.length > 0) {
          // ✅ ASEGURAR que TODAS tengan carátula o logo
          const seguras = parsed.map(t => ({
            ...t,
            cover: (t.cover && t.cover.trim() !== "") ? t.cover : "/logo-radio.png"
          }))
          setTracks(seguras.slice(0, MAX_HISTORY))
          setHasRealHistory(true)
          return
        }
      }
      setTracks(DEMO_TRACKS)
    } catch {
      setTracks(DEMO_TRACKS)
    }
  }

  useEffect(() => {
    loadHistory()
    window.addEventListener("radio-history-updated", loadHistory)
    return () => window.removeEventListener("radio-history-updated", loadHistory)
  }, [])

  return (
    <section className="w-full rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">🎧 Reproducidos recientemente</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {hasRealHistory ? "Últimas canciones que sonaron" : "Vista previa — se actualiza al reproducir"}
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          {tracks.length} temas
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {tracks.map((track, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl bg-secondary/50 transition-all hover:shadow-lg">
            <div className="aspect-square relative">
              {/* ✅ SIEMPRE muestra carátula o tu logo */}
              <img
                src={track.cover}
                alt={`Carátula de ${track.title}`}
                crossOrigin="anonymous"
                className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/logo-radio.png"
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
