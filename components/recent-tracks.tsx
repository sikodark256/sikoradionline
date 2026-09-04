"use client"

import { useEffect, useState } from "react"

type HistoryTrack = {
  title: string
  artist: string | null
  cover: string | null
  timestamp: number
}

const HISTORY_KEY = "radio-recent-tracks"
const MAX_HISTORY = 6
const DEFAULT_COVER = "/logo-radio.png"

function formatTimeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours} h`
  return `Hace ${Math.floor(hours / 24)} d`
}

export function RecentTracks() {
  const [tracks, setTracks] = useState<HistoryTrack[]>([])
  const [, setTick] = useState(0)

  // Función maestra independiente que carga, valida y corrige las portadas en vivo
  const processAndSyncHistory = async () => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || parsed.length === 0) return

      // Filtrar registros inválidos y ordenar (más recientes primero)
      const rawTracks = parsed
        .filter((t) => t && typeof t.title === "string" && t.title.trim() !== "")
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_HISTORY)

      // Guardamos el estado inicial rápido para no bloquear la UI
      setTracks(rawTracks)

      // 🚀 MÉTODO DEFENSIVO: Verificación asíncrona de portadas en background
      // Si detectamos que la canción más reciente tiene una portada sospechosa (repetida o rota),
      // le consultamos directamente a tu API interna de Deezer para forzar la sincronización correcta.
      const primeraTrack = rawTracks[0]
      const segundaTrack = rawTracks[1]

      if (primeraTrack && segundaTrack) {
        const esMismaPortada = primeraTrack.cover === segundaTrack.cover && primeraTrack.cover !== DEFAULT_COVER
        const esDiferenteTema = primeraTrack.title.toLowerCase().trim() !== segundaTrack.title.toLowerCase().trim()

        // Si se cumple que el reproductor le "robó" la foto a la de abajo:
        if (esMismaPortada && esDiferenteTema) {
          try {
            // Consultamos directamente a tu endpoint interno de arte
            const res = await fetch(
              `/api/artwork?artist=${encodeURIComponent(primeraTrack.artist || "")}&title=${encodeURIComponent(primeraTrack.title)}`
            )
            const data = await res.json()

            if (data && data.cover) {
              // Corregimos solo la primera canción con su portada real e independiente
              setTracks((currentTracks) => {
                if (currentTracks.length === 0) return currentTracks
                const nuevas = [...currentTracks]
                nuevas[0] = { ...nuevas[0], cover: data.cover }
                
                // Opcional: Guardamos la corrección de vuelta en el localStorage para que persista bien
                localStorage.setItem(HISTORY_KEY, JSON.stringify(nuevas))
                return nuevas
              })
            } else {
              // Si Deezer no encuentra nada, le ponemos el logo por defecto en vez de dejar la portada robada
              setTracks((currentTracks) => {
                if (currentTracks.length === 0) return currentTracks
                const nuevas = [...currentTracks]
                nuevas[0] = { ...nuevas[0], cover: DEFAULT_COVER }
                return nuevas
              })
            }
          } catch (e) {
            console.error("Error en la auto-sincronización de carátulas:", e)
          }
        }
      }
    } catch (error) {
      console.error("Error leyendo el historial:", error)
    }
  }

  useEffect(() => {
    // Primera carga al montar el componente
    processAndSyncHistory()

    // Escuchar el evento nativo cuando v0 actualiza la canción
    window.addEventListener("radio-history-updated", processAndSyncHistory)
    window.addEventListener("storage", processAndSyncHistory)

    // Forzar re-render cada minuto para actualizar los textos de tiempo ("Hace 2 min", etc.)
    const timer = window.setInterval(() => {
      setTick((t) => t + 1)
    }, 60000)

    return () => {
      window.removeEventListener("radio-history-updated", processAndSyncHistory)
      window.removeEventListener("storage", processAndSyncHistory)
      window.clearInterval(timer)
    }
  }, [])

  if (tracks.length === 0) {
    return null
  }

  return (
    <section className="w-full rounded-2xl border border-border bg-card/60 p-4 shadow-xl backdrop-blur-md sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            📜 Historial de canciones
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Temas emitidos recientemente
          </p>
        </div>
        <span className="rounded-full bg-secondary/80 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
          {tracks.length} {tracks.length === 1 ? "tema" : "temas"}
        </span>
      </div>

      {/* Nuevo diseño: Lista vertical optimizada con portadas pequeñas */}
      <div className="flex flex-col gap-2">
        {tracks.map((track, i) => (
          <article
            key={`${track.title}-${track.timestamp}-${i}`}
            className="flex items-center gap-3 rounded-xl bg-secondary/30 p-2 transition-all hover:bg-secondary/60"
          >
            {/* Portada compacta pequeña */}
            <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:h-12 sm:w-12">
              <img
                src={track.cover && track.cover.trim() !== "" ? track.cover : DEFAULT_COVER}
                alt=""
                crossOrigin="anonymous"
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_COVER
                  e.currentTarget.onerror = null
                }}
              />
              <div className="absolute bottom-0 right-0 rounded-tl-md bg-black/70 px-1 font-mono text-[8px] font-bold text-white/90">
                #{i + 1}
              </div>
            </div>

            {/* Información de la canción alineada de forma horizontal */}
            <div className="flex flex-1 flex-col min-w-0">
              <h3 className="truncate text-xs font-semibold text-foreground sm:text-sm">
                {track.title}
              </h3>
              <p className="truncate text-[11px] text-muted-foreground">
                {track.artist || "SIKODARK Radio"}
              </p>
            </div>

            {/* Tiempo transcurrido a la derecha */}
            <div className="flex-shrink-0 text-right pr-1">
              <span className="font-mono text-[10px] text-muted-foreground/70">
                {formatTimeAgo(track.timestamp)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
