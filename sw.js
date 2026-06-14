// MercadoLocal - Service Worker
// Hace que la app funcione sin conexión (offline-first)

const CACHE_NAME = 'mercadolocal-v2';

// Archivos que se guardan apenas se instala la app
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './favicon-16.png'
];

// INSTALL: guarda los archivos base. Si alguno falla, NO rompe todo
// (antes usaba addAll, que era todo o nada)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] No se pudo cachear:', url, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// ACTIVATE: borra cachés viejas y toma control inmediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// FETCH:
// - Navegación (abrir la app): red primero, si no hay internet usa el index.html guardado
// - Resto de archivos (íconos, manifest, etc): caché primero, y si no está, lo busca y lo guarda
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => cached);
    })
  );
});
