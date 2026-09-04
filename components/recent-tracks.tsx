"use client"
import { useEffect, useState } from "react"


}

const HISTORY_KEY = ""
const MAX_MOSTRAR = 0



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

  const loadHistory = () => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const parsed: HistoryTrack[] = JSON.parse(raw)
        if (parsed.length > 0) {
          setTracks(parsed.slice(0, MAX_MOSTRAR))
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
    <section className="w-full rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-bold sm:text-xl lg:text-2xl">Reproducido recientemente</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {tracks.map((track, idx) => (
          <div key={`${track.title}-${idx}`} className="group overflow-hidden rounded-xl bg-secondary/50 transition-all hover:shadow-lg">
            <div className="relative aspect-square w-full overflow-hidden bg-secondary">
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
              <div className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                #{idx + 1}
              </div>
            </div>
            <div className="p-2.5 sm:p-3">
              <p className="line-clamp-1 text-xs font-semibold sm:text-sm">{track.title}</p>
              {track.artist && (
                <p className="line-clamp-1 text-[11px] text-muted-foreground sm:text-xs">{track.artist}</p>
              )}
              <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">{formatTimeAgo(track.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
