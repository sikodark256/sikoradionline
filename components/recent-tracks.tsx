"use client"
import { useEffect, useState } from "react"

type HistoryTrack = {
  title: string
  artist: string | null
  cover: string
  timestamp: number
}

const HISTORY_KEY = "radio-recent-tracks"
const MAX_MOSTRAR = 5

const DEMO_TRACKS: HistoryTrack[] = [
  { title: "1", artist: null, cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 5 },
  { title: "2", artist: null, cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 10 },
  { title: "3", artist: null, cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 15 },
  { title: "4", artist: null, cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 20 },
  { title: "5", artist: null, cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 25 },
]

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
      
      {/* ✅ SOLO LAS FOTOS — grilla limpia de 5 */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {tracks.map((track, idx) => (
          <div
            key={`${track.title}-${idx}`}
            className="group relative aspect-square overflow-hidden rounded-xl bg-secondary transition-all hover:shadow-lg hover:scale-105"
            title={track.title}
          >
            <img
              src={track.cover}
              alt={track.title}
              crossOrigin="anonymous"
              className="absolute inset-0 size-full object-cover transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/logo-radio.png"
                e.currentTarget.onerror = null
              }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
