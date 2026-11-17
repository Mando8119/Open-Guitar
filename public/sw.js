/* Same-origin app-shell cache; microphone data never passes through this worker. */
const CACHE = 'openguitar-v1'
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['/', '/favicon.svg', '/manifest.webmanifest'])),
  )
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('openguitar-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  // Same-origin static assets may carry Vary: Origin from the host. The
  // precache request and a module's CORS request need the same cached bytes.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)))
        }
        return response
      })
      .catch(async () => {
        const cache = await caches.open(CACHE)
        return (
          (await cache.match(request, { ignoreVary: true })) ||
          (request.mode === 'navigate' ? await cache.match('/') : undefined) ||
          Response.error()
        )
      }),
  )
})
