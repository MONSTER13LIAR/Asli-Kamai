import type { Ledger } from './model'

export const API = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
const TOKEN_KEY = 'aslikamai.token'

export interface User {
  id: number
  email: string
  name: string
  picture: string
}

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
export const setToken = (t: string | null) => {
  try {
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* fine */
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(API + path, { ...init, headers })
  const body = await r.json().catch(() => ({}))
  if (r.status === 401 && token) setToken(null)
  if (!r.ok) throw new Error(body.error ?? r.statusText)
  return body as T
}

export const api = {
  signInWithGoogle: (credential: string) =>
    call<{ token: string; user: User }>('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  me: () => call<{ user: User }>('/api/me'),
  getLedger: () => call<{ ledger: Ledger | null; updatedAt: string | null }>('/api/ledger'),
  putLedger: (ledger: Ledger) => call<{ updatedAt: string }>('/api/ledger', { method: 'PUT', body: JSON.stringify({ ledger }) }),
  explain: (ledger: Ledger) =>
    call<{ explanation: string; lesson: string; concept: string }>('/api/explain', { method: 'POST', body: JSON.stringify({ ledger }) }),
}
