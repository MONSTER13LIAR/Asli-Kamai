import { coachReply } from '../server/coach.js'
import { gate } from '../server/limit.js'
import { isLedger, opts } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!isLedger(req.body?.ledger)) return res.status(400).json({ error: 'bad ledger' })
  if (!gate(req, res, 'coach', 60)) return
  try {
    res.json(await coachReply({ ledger: req.body.ledger, messages: req.body.messages, ...opts(req.body) }))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
