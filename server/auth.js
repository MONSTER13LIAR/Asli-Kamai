import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import db from './db.js'

const clientId = process.env.GOOGLE_CLIENT_ID
const secret = process.env.JWT_SECRET
if (!clientId) console.warn('GOOGLE_CLIENT_ID not set: sign-in will fail')
if (!secret) throw new Error('JWT_SECRET must be set')

const google = new OAuth2Client(clientId)

// Google Identity Services gives the browser an ID token; we verify it here
// and hand back our own long-lived session token.
export async function signInWithGoogle(credential) {
  const ticket = await google.verifyIdToken({ idToken: credential, audience: clientId })
  const p = ticket.getPayload()
  if (!p?.sub) throw new Error('invalid Google token')
  const user = await db.upsertUser({ sub: p.sub, email: p.email, name: p.name, picture: p.picture })
  const token = jwt.sign({ uid: user.id }, secret, { expiresIn: '90d' })
  return { token, user }
}

export function requireUser(req, res, next) {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'sign in required' })
  try {
    req.uid = jwt.verify(token, secret).uid
    next()
  } catch {
    res.status(401).json({ error: 'session expired' })
  }
}
