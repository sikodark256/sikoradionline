/* =========================================================
   Service Worker para Mi Radio PWA
   Permite instalar la app y funcionamiento offline básico
   ========================================================= */

const CACHE_NAME = "mi-radio-pwa-v1"
const CORE_ASSETS = [
  "/",
  "/icon-192.png",
  "/icon-512.png",
  "/logo-radio.png",
  "/apple-icon.png",
  "/manifest.webmanifest",
]

// Instalación: cachear activos principales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch(() => {
        // Ignorar errores — algunos activos podrían no estar disponibles
      })
    })
  )
  self.skipWaiting()
})

// Activación: limpiar cachés antiguas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Estrategia de fetch:
// - Navegación: network first, fallback a caché
// - Activos estáticos: cache first, fallback a network
// - Stream de audio / APIs: network only (no cachear)
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // No cachear peticiones a otras APIs o el stream de audio
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return
  if (url.pathname.includes("stream")) return

  // Navegación de páginas
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    )
    return
  }

  // Activos estáticos: cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request)
          .then((response) => {
            if (response.ok && response.type === "basic") {
              const copy = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            }
            return response
          })
          .catch(() => cached)
      )
    })
  )
})
