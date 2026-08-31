// Shared plumbing for the Vercel functions. The actual logic lives in
// server/, which is also what `npm run dev:server` runs locally.
import { uidFromHeader } from '../server/auth.js'

export const isLedger = (l) => l && Array.isArray(l.shifts) && l.monthly && typeof l.monthly.emi === 'number'

export function requireUid(req, res) {
  const uid = uidFromHeader(req.headers.authorization)
  if (!uid) res.status(401).json({ error: 'sign in required' })
  return uid
}
