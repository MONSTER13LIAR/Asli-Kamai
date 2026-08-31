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

// Returns the user id for a Bearer token, or null.
export function uidFromHeader(header) {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    return jwt.verify(token, secret).uid
  } catch {
    return null
  }
}

export function requireUser(req, res, next) {
  const uid = uidFromHeader(req.get('authorization'))
  if (!uid) return res.status(401).json({ error: 'sign in required' })
  req.uid = uid
  next()
}
