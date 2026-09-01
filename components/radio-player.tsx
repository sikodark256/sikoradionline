"use client"
import { useEffect, useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX, Loader2, Radio, Download } from "lucide-react"
import { cn } from "@/lib/utils"

const STREAM_URL = "https://stream.zeno.fm/xdkqr4btptutv"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type NowPlaying = {
  title: string
  artist: string | null
}

type HistoryTrack = {
  title: string
  artist: string | null
  cover: string | null
  timestamp: number
}

const HISTORY_KEY = "radio-recent-tracks"
const MAX_HISTORY = 10 // ✅ SOLO 10 CANCIONES — NO LLENA LA PANTALLA

function saveToHistory(track: HistoryTrack) {
  if (typeof window === "undefined") return
  if (!track.title || track.title === "Conectando…" || track.title === "En vivo") return
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const history: HistoryTrack[] = raw ? JSON.parse(raw) : []
    
    // ✅ Si la canción ya existe y la NUEVA tiene carátula → ACTUALIZAR
    if (history.length > 0) {
      const last = history[0]
      if (last.title === track.title && last.artist === track.artist) {
        // Si la nueva tiene carátula y la vieja no → actualizar
        if (track.cover && track.cover.trim() !== "" && (!last.cover || last.cover.trim() === "")) {
          history[0].cover = track.cover
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
          window.dispatchEvent(new CustomEvent("radio-history-updated"))
        }
        return // No duplicar
      }
    }
    
    // Agregar canción nueva al inicio
    history.unshift(track)
    const trimmed = history.slice(0, MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
    window.dispatchEvent(new CustomEvent("radio-history-updated"))
  } catch {}
}

function parseStreamTitle(raw: string): NowPlaying {
  const clean = raw.trim()
  if (!clean) return { title: "En vivo", artist: null }
  const sep = clean.indexOf(" - ")
  if (sep > 0) {
    return {
      artist: clean.slice(0, sep).trim(),
      title: clean.slice(sep + 3).trim(),
    }
  }
  return { title: clean, artist: null }
}

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({
    title: "Conectando…",
    artist: null,
  })
  const [cover, setCover] = useState<string | null>(null)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", () => setInstallPrompt(null))
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  // ✅ SERVICE WORKER QUE SE ACTUALIZA SOLO — SIN ESPERAR
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            reg.updateViaCache = "none"
            setInterval(() => reg.update(), 300000) // Revisa cada 5 minutos
          })
          .catch(() => {})
      })
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  useEffect(() => {
    const source = new EventSource("/api/metadata")
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (typeof data.streamTitle === "string") {
          setNowPlaying(parseStreamTitle(data.streamTitle))
        }
      } catch {}
    }
    source.onerror = () => {}
    return () => source.close()
  }, [])

  useEffect(() => {
    const { title, artist } = nowPlaying
    if (!title || title === "Conectando…" || title === "En vivo") {
      setCover(null)
      return
    }
    const controller = new AbortController()
    const params = new URLSearchParams({ title, artist: artist ?? "" })
    fetch(`/api/artwork?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { cover: string | null }) => setCover(d.cover))
      .catch(() => {})
    return () => controller.abort()
  }, [nowPlaying])

  useEffect(() => {
    if (!nowPlaying.title || nowPlaying.title === "Conectando…" || nowPlaying.title === "En vivo") return
    saveToHistory({
      title: nowPlaying.title,
      artist: nowPlaying.artist,
      cover: cover,
      timestamp: Date.now(),
    })
  }, [nowPlaying.title, nowPlaying.artist, cover])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = muted
    }
  }, [volume, muted])

  const startPlayback = async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      setIsLoading(true)
      audio.src = STREAM_URL
      audio.load()
      await audio.play()
    } catch {
      setIsLoading(false)
      setIsPlaying(false)
    }
  }

  const stopPlayback = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.removeAttribute("src")
    audio.load()
    setIsPlaying(false)
    setIsLoading(false)
  }

  const togglePlay = () => {
    if (isPlaying) stopPlayback()
    else startPlayback()
  }

  // ✅ NOTIFICACIÓN PERSONALIZADA — DICE SIKODARK
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlaying.title || "En vivo",
      artist: nowPlaying.artist || "SIKODARK Radio Online",
      album: "sikodarkfm",
      artwork: [
        { src: cover || "/logo-radio.png", sizes: "512x512", type: "image/png" }
      ]
    })
  }, [nowPlaying, cover])

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return
    navigator.mediaSession.setActionHandler("play", () => startPlayback())
    navigator.mediaSession.setActionHandler("pause", () => stopPlayback())
    navigator.mediaSession.setActionHandler("stop", () => stopPlayback())
    return () => {
      navigator.mediaSession.setActionHandler("play", null)
      navigator.mediaSession.setActionHandler("pause", null)
      navigator.mediaSession.setActionHandler("stop", null)
    }
  }, [])

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"
  }, [isPlaying])

  return (
    <section
      className="w-full rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8"
      aria-label="Reproductor de radio"
    >
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => {
          setIsPlaying(true)
          setIsLoading(false)
        }}
        onWaiting={() => setIsLoading(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsLoading(false)
          setIsPlaying(false)
        }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Radio className="size-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Radio Online
            </p>
            <p className="text-sm font-semibold">SIKODARK</p>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors",
            isPlaying
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              isPlaying ? "animate-pulse bg-primary" : "bg-muted-foreground",
            )}
          />
          {isPlaying ? "En vivo" : "Detenido"}
        </span>
      </div>

      <div className="relative mt-6 aspect-square overflow-hidden rounded-2xl bg-secondary">
        <img
  src={cover && cover.trim() !== "" ? cover : "/logo-radio.png"}
  alt={cover ? `Carátula de ${nowPlaying.title}` : "Logo de la radio"}
  crossOrigin="anonymous"
  className="absolute inset-0 size-full object-cover transition-opacity duration-500"
  onError={(e) => {
    e.currentTarget.src = "/logo-radio.png";
    e.currentTarget.onerror = null;
  }}
/>
        <div className="absolute inset-x-0 bottom-0 flex h-1/3 items-end justify-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent p-8">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "w-2.5 rounded-full bg-primary transition-all",
                isPlaying ? "animate-bounce" : "h-3 opacity-40",
              )}
              style={
                isPlaying
                  ? {
                      height: `${20 + ((i * 37) % 60)}%`,
                      animationDelay: `${i * 90}ms`,
                      animationDuration: `${700 + ((i * 130) % 500)}ms`,
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      <div className="mt-6 min-h-16 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Sonando ahora
        </p>
        <p className="mt-1 text-balance text-lg font-bold leading-tight">
          {nowPlaying.title}
        </p>
        {nowPlaying.artist && (
          <p className="text-pretty text-sm text-muted-foreground">
            {nowPlaying.artist}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
          className="grid size-16 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-95"
        >
          {isLoading ? (
            <Loader2 className="size-7 animate-spin" aria-hidden="true" />
          ) : isPlaying ? (
            <Pause className="size-7 fill-current" aria-hidden="true" />
          ) : (
            <Play className="size-7 translate-x-0.5 fill-current" aria-hidden="true" />
          )}
        </button>
        <div className="flex flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Activar sonido" : "Silenciar"}
            className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
          >
            {muted || volume === 0 ? (
              <VolumeX className="size-5" aria-hidden="true" />
            ) : (
              <Volume2 className="size-5" aria-hidden="true" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value))
              setMuted(false)
            }}
            aria-label="Volumen"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
          />
        </div>
      </div>

      {installPrompt && (
        <button
          type="button"
          onClick={handleInstall}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-secondary py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="size-4" aria-hidden="true" />
          Instalar app
        </button>
      )}
    </section>
  )
}
