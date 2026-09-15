// Shared plumbing for the Vercel functions. The actual logic lives in
// server/, which is also what `npm run dev:server` runs locally.
import { uidFromHeader } from '../server/auth.js'

const MAX_SHIFTS = 3000

export const isLedger = (l) =>
  l && Array.isArray(l.shifts) && l.shifts.length <= MAX_SHIFTS && l.monthly && typeof l.monthly.emi === 'number'

// Options every AI route accepts alongside the ledger.
export const opts = (body) => ({
  weekStart: typeof body?.weekStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.weekStart) ? body.weekStart : undefined,
  lang: body?.lang === 'hi' ? 'hi' : 'en',
  taught: Array.isArray(body?.taught) ? body.taught.filter((t) => typeof t === 'string').slice(0, 12) : [],
})

export function requireUid(req, res) {
  const uid = uidFromHeader(req.headers.authorization)
  if (!uid) res.status(401).json({ error: 'sign in required' })
  return uid
}
