import { explainLedger } from '../server/explain.js'
import { isLedger } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  try {
    if (!isLedger(req.body?.ledger)) return res.status(400).json({ error: 'bad ledger' })
    res.json(await explainLedger(req.body.ledger))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
