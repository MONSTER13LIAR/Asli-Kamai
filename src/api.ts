import type { Ledger, Platform, Slot } from './model'

export const API = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
const TOKEN_KEY = 'aslikamai.token'

export interface User {
  id: number
  email: string
  name: string
  picture: string
}

export type Lang = 'en' | 'hi'

export interface AiOptions {
  weekStart?: string
  lang: Lang
  taught?: string[]
}

export interface Explanation {
  explanation: string
  lesson: string
  concept: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface QuizQuestion {
  id: string
  concept: string
  question: string
  options: string[]
  answer: number
  why: string
}

export interface Quiz {
  week: string
  questions: QuizQuestion[]
}

/** What the model read from a voice note or a screenshot; every field may be missing. */
export interface ParsedEntry {
  platform: Platform | null
  slot: Slot | null
  hours: number | null
  gross: number | null
  fuel: number | null
  date: string | null
  note: string
  source: 'voice' | 'photo'
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

const post = <T,>(path: string, body: unknown) => call<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const api = {
  signInWithGoogle: (credential: string) => post<{ token: string; user: User }>('/api/auth/google', { credential }),
  me: () => call<{ user: User }>('/api/me'),
  getLedger: () => call<{ ledger: Ledger | null; updatedAt: string | null }>('/api/ledger'),
  putLedger: (ledger: Ledger) => call<{ updatedAt: string }>('/api/ledger', { method: 'PUT', body: JSON.stringify({ ledger }) }),
  explain: (ledger: Ledger, o: AiOptions) => post<Explanation>('/api/explain', { ledger, ...o }),
  coach: (ledger: Ledger, messages: ChatMessage[], o: AiOptions) => post<{ reply: string }>('/api/coach', { ledger, messages, ...o }),
  quiz: (ledger: Ledger, o: AiOptions) => post<Quiz>('/api/quiz', { ledger, ...o }),
  parse: (input: { text?: string; image?: string; today: string }) => post<ParsedEntry>('/api/parse', input),
}
