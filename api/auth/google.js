import { signInWithGoogle } from '../../server/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  try {
    res.json(await signInWithGoogle(req.body?.credential))
  } catch (e) {
    res.status(401).json({ error: e.message })
  }
}
