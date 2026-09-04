// Asli Kamai service worker.
//
// Two jobs: make the app installable so it sits on the rider's home screen,
// and let the shell open on a weak signal. Nothing under /api/ is ever cached
// — the ledger and the coach must always come from the server.

const CACHE = 'aslikamai-v1'
const SHELL = ['/app/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      // allSettled: one missing file must not fail the whole install.
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const keep = async (request, response) => {
  if (response && response.ok && response.type === 'basic') {
    const c = await caches.open(CACHE)
    await c.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', (e) => {
  const request = e.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // fonts etc. stay the browser's business
  if (url.pathname.startsWith('/api/')) return

  // Pages: network first, so a redeploy is picked up straight away. The cached
  // copy is only the offline fallback.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => keep(request, res))
        .catch(async () => (await caches.match(request)) ?? (await caches.match('/app/')) ?? Response.error()),
    )
    return
  }

  // Build assets are content-hashed, so a cached hit is never the wrong file.
  // Serve it immediately and refresh in the background.
  e.respondWith(
    caches.match(request).then((hit) => {
      const live = fetch(request)
        .then((res) => keep(request, res))
        .catch(() => hit)
      return hit ?? live
    }),
  )
})
