import { useEffect, useState } from 'react'
import { api } from './api'
import type { Ledger } from './model'

export interface AiExplanation {
  explanation: string
  lesson: string
  concept: string
}

type State =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; data: AiExplanation }
  | { status: 'error'; message: string }

const CACHE = 'aslikamai.explain.v1'

// One call per distinct ledger; the answer is cached so re-renders and
// reloads don't re-bill the same week.
const keyFor = (ledger: Ledger) => JSON.stringify({ s: ledger.shifts.map((s) => [s.date, s.platform, s.slot, s.hours, s.gross, s.fuel]), m: ledger.monthly })

const readCache = (key: string): AiExplanation | null => {
  try {
    const raw = sessionStorage.getItem(CACHE)
    const c = raw ? (JSON.parse(raw) as { key: string; data: AiExplanation }) : null
    return c && c.key === key ? c.data : null
  } catch {
    return null
  }
}

export function useExplanation(ledger: Ledger): State {
  const key = keyFor(ledger)
  const [state, setState] = useState<State>({ status: 'idle' })

  useEffect(() => {
    if (!ledger.shifts.length) return
    const cached = readCache(key)
    if (cached) {
      setState({ status: 'ready', data: cached })
      return
    }
    let live = true
    setState({ status: 'loading' })
    api
      .explain(ledger)
      .then((data) => {
        if (!live) return
        try {
          sessionStorage.setItem(CACHE, JSON.stringify({ key, data }))
        } catch {
          /* fine */
        }
        setState({ status: 'ready', data })
      })
      .catch((e: Error) => live && setState({ status: 'error', message: e.message }))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}
