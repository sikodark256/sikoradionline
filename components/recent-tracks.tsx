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

"use client"
import { useState, useEffect } from "react"
import { HistoryTrack } from "./radio-player"

const HISTORY_KEY = "radio-recent-tracks"
const MAX_HISTORY = 10 // ✅ Solo 10 canciones para no llenar la pantalla

// Canciones de ejemplo con tu logo de respaldo
const DEMO_TRACKS: HistoryTrack[] = [
  { title: "Blinding Lights", artist: "The Weeknd", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 5 },
  { title: "Shape of You", artist: "Ed Sheeran", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 10 },
  { title: "Levitating", artist: "Dua Lipa", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 15 },
  { title: "Watermelon Sugar", artist: "Harry Styles", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 20 },
  { title: "Don't Start Now", artist: "Dua Lipa", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 25 },
  { title: "Peaches", artist: "Justin Bieber", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 30 },
  { title: "Stay", artist: "The Kid LAROI & Justin Bieber", cover: "/logo-radio.png", timestamp: Date.now() - 1000 * 60 * 35 },
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
  const [tracks, setTracks] = useState<HistoryTrack[]>([])
  const [hasRealHistory, setHasRealHistory] = useState(false)

  const loadHistory = () => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const parsed: HistoryTrack[] = JSON.parse(raw)
        if (parsed.length > 0) {
          setTracks(parsed.slice(0, MAX_HISTORY)) // ✅ Limitar a 10
          setHasRealHistory(true)
          return
        }
      }
      // Si no hay historial real → mostrar canciones de ejemplo
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
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold">🎧 Reproducidos recientemente</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {tracks.map((track, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl bg-card transition-shadow hover:shadow-lg">
            <div className="aspect-square">
              <img
                src={track.cover || "/logo-radio.png"}
                alt={`Carátula de ${track.title}`}
                crossOrigin="anonymous"
                className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => { e.currentTarget.src = "/logo-radio.png"; }}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
              <p className="truncate font-semibold text-sm">{track.title}</p>
              <p className="truncate text-xs opacity-75">{track.artist || "SIKODARK Radio"}</p>
              <p className="text-xs opacity-50">{formatTimeAgo(track.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
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
                  src={track.cover || "/logo-radio.png"}
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
