import cors from 'cors'
import express from 'express'
import db from './db.js'
import { requireUser, signInWithGoogle } from './auth.js'
import { explainLedger } from './explain.js'

const app = express()
// Local dev serves the same /api/* paths the Vercel functions use in production.
const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((s) => s.trim())
app.use(cors({ origin: origins }))
app.use(express.json({ limit: '256kb' }))

const isLedger = (l) => l && Array.isArray(l.shifts) && l.monthly && typeof l.monthly.emi === 'number'

app.get('/api/health', (_req, res) => res.json({ ok: true, storage: db.kind }))

app.post('/api/auth/google', async (req, res) => {
  try {
    res.json(await signInWithGoogle(req.body?.credential))
  } catch (e) {
    res.status(401).json({ error: e.message })
  }
})

app.get('/api/me', requireUser, async (req, res) => {
  const user = await db.getUser(req.uid)
  if (!user) return res.status(401).json({ error: 'unknown user' })
  res.json({ user })
})

app.get('/api/ledger', requireUser, async (req, res) => {
  res.json((await db.getLedger(req.uid)) ?? { ledger: null, updatedAt: null })
})

app.put('/api/ledger', requireUser, async (req, res) => {
  if (!isLedger(req.body?.ledger)) return res.status(400).json({ error: 'bad ledger' })
  res.json({ updatedAt: await db.putLedger(req.uid, req.body.ledger) })
})

app.post('/api/explain', async (req, res) => {
  try {
    if (!isLedger(req.body?.ledger)) return res.status(400).json({ error: 'bad ledger' })
    res.json(await explainLedger(req.body.ledger))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const port = Number(process.env.PORT) || 8787
app.listen(port, () => console.log(`asli-kamai server on :${port} (${db.kind})`))
