import cors from 'cors'
import express from 'express'
import db from './db.js'
import { requireUser, signInWithGoogle } from './auth.js'
import { coachReply } from './coach.js'
import { explainLedger } from './explain.js'
import { gate } from './limit.js'
import { parseEntry } from './parse.js'
import { buildQuiz } from './quiz.js'
import { isLedger, opts } from '../api/_lib.js'

const app = express()
// Local dev serves the same /api/* paths the Vercel functions use in production.
const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((s) => s.trim())
app.use(cors({ origin: origins }))
app.use(express.json({ limit: '4mb' }))

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

// The AI routes. Each one is the same shape as its Vercel function in api/.
const ai = (route, max, run) => async (req, res) => {
  if (!gate(req, res, route, max)) return
  try {
    res.json(await run(req))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
const withLedger = (run) => (req) => {
  if (!isLedger(req.body?.ledger)) throw new Error('bad ledger')
  return run(req)
}

app.post('/api/explain', ai('explain', 40, withLedger((req) => explainLedger(req.body.ledger, opts(req.body)))))
app.post('/api/coach', ai('coach', 60, withLedger((req) => coachReply({ ledger: req.body.ledger, messages: req.body.messages, ...opts(req.body) }))))
app.post('/api/quiz', ai('quiz', 30, withLedger((req) => buildQuiz(req.body.ledger, opts(req.body)))))
app.post('/api/parse', ai('parse', 40, (req) => parseEntry({ text: req.body?.text, image: req.body?.image, today: req.body?.today })))

const port = Number(process.env.PORT) || 8787
app.listen(port, () => console.log(`asli-kamai server on :${port} (${db.kind})`))
