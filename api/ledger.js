import db from '../server/db.js'
import { isLedger, requireUid } from './_lib.js'

export default async function handler(req, res) {
  const uid = requireUid(req, res)
  if (!uid) return
  if (req.method === 'GET') {
    return res.json((await db.getLedger(uid)) ?? { ledger: null, updatedAt: null })
  }
  if (req.method === 'PUT') {
    if (!isLedger(req.body?.ledger)) return res.status(400).json({ error: 'bad ledger' })
    return res.json({ updatedAt: await db.putLedger(uid, req.body.ledger) })
  }
  res.status(405).json({ error: 'method not allowed' })
}
