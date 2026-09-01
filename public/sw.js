const CACHE = "radio-pwa-v2"; // ✅ Cambié el nombre para limpiar la caché vieja
const archivos = [
  "./",
  "./manifest.json"
];

// ✅ INSTALAR INMEDIATAMENTE — NO ESPERAR
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(archivos))
  );
  self.skipWaiting(); // ✅ Se activa YA, sin esperar
});

// ✅ ACTIVAR INMEDIATAMENTE Y TOMAR EL CONTROL
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(nombres => {
      return Promise.all(
        nombres.filter(n => n !== CACHE).map(n => caches.delete(n))
      );
    }).then(() => self.clients.claim()) // ✅ Toma control de todas las pestañas abiertas
  );
});

// ✅ SIEMPRE BUSCAR LA VERSIÓN NUEVA, NO USAR CACHÉ ANTIGUA
self.addEventListener("fetch", e => {
  e.respondWith(
    fetch(e.request) // ✅ SIEMPRE busca la versión nueva del servidor
      .catch(() => caches.match(e.request)) // Solo si no hay internet usa la guardada
  );
});
