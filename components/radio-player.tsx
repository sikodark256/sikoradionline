"use client"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type HistoryTrack = {
  title: string
  artist: string | null
  cover: string | null
  timestamp: number
}

const HISTORY_KEY = "radio-recent-tracks"
const MAX_MOSTRAR = 5

const DEMO_TRACKS: HistoryTrack[] = [
  { title: "Blinding Lights", artist: "The Weeknd", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 5 },
  { title: "Shape of You", artist: "Ed Sheeran", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 10 },
  { title: "Levitating", artist: "Dua Lipa", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 15 },
  { title: "Watermelon Sugar", artist: "Harry Styles", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 20 },
  { title: "Don't Start Now", artist: "Dua Lipa", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 25 },
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
          setTracks(parsed.slice(0, MAX_MOSTRAR))
          setHasRealHistory(true)
          return
        }
      }
      setTracks(DEMO_TRACKS.slice(0, MAX_MOSTRAR))
      setHasRealHistory(false)
    } catch {
      setTracks(DEMO_TRACKS.slice(0, MAX_MOSTRAR))
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
      {/* ✅ TÍTULO SIMPLE — SIN ÍCONO, SIN SUBTÍTULO */}
      <div className="mb-6">
        <h2 className="text-lg font-bold sm:text-xl lg:text-2xl">
          Reproducido recientemente
        </h2>
      </div>

      {/* ✅ SOLO 5 PORTADAS — grilla más limpia */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {tracks.map((track, idx) => (
          <article
            key={`${track.title}-${track.artist}-${idx}`}
            className="group flex flex-col overflow-hidden rounded-xl bg-secondary/50 transition-all hover:bg-secondary hover:shadow-lg focus-within:ring-2 focus-within:ring-ring"
            title={`${track.title}${track.artist ? " — " + track.artist : ""}`}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-secondary">
              <img
                src={track.cover || "/logo-radio.png"}
                alt={`Carátula de ${track.title}`}
                crossOrigin="anonymous"
                className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/logo-radio.png"
                  e.currentTarget.onerror = null
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
        ))}
      </div>
    </section>
  )
}
