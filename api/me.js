import db from '../server/db.js'
import { requireUid } from './_lib.js'

export default async function handler(req, res) {
  const uid = requireUid(req, res)
  if (!uid) return
  const user = await db.getUser(uid)
  if (!user) return res.status(401).json({ error: 'unknown user' })
  res.json({ user })
}
