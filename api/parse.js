import { parseEntry } from '../server/parse.js'
import { gate } from '../server/limit.js'

// Photos are a few hundred KB as base64; the default 1 MB body cap is too low.
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  const { text, image, today } = req.body ?? {}
  if (!text && !image) return res.status(400).json({ error: 'nothing to read' })
  if (!gate(req, res, 'parse', 40)) return
  try {
    res.json(await parseEntry({ text, image, today: typeof today === 'string' ? today : undefined }))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
