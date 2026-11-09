/*
 * Service worker mínimo para que el juego sea una PWA instalable y funcione sin conexión.
 * Estrategia: red primero para el HTML (para recibir actualizaciones) y
 * caché primero para el resto de archivos (JS, imágenes, audio).
 */
const CACHE = 'kusi-v1';

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['./', './index.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    evento.respondWith(
      fetch(request)
        .then((resp) => { caches.open(CACHE).then((c) => c.put(request, resp.clone())); return resp; })
        .catch(() => caches.match(request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  evento.respondWith(
    caches.match(request).then((enCache) => enCache || fetch(request).then((resp) => {
      if (resp.ok && new URL(request.url).origin === self.location.origin) {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(request, copia));
      }
      return resp;
    }))
  );
});
