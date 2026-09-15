// A small sliding-window limiter for the AI routes. The endpoints are open
// (the app works without an account), so this is what keeps one script from
// spending the whole model budget. Per warm instance; good enough for that.

const windows = new Map()
const WINDOW_MS = 10 * 60 * 1000

export function allow(key, max) {
  const now = Date.now()
  const hits = (windows.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (hits.length >= max) {
    windows.set(key, hits)
    return false
  }
  hits.push(now)
  windows.set(key, hits)
  if (windows.size > 5000) windows.clear() // never grow without bound
  return true
}

export const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'

// Shared by the Express server and the Vercel functions: false means a 429
// has already been written.
export function gate(req, res, route, max = 40) {
  if (allow(route + ':' + clientIp(req), max)) return true
  res.status(429).json({ error: 'too many requests, try again in a few minutes' })
  return false
}
