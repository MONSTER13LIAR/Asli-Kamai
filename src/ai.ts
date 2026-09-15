import { useEffect, useState } from 'react'
import { type Explanation, type Lang, api } from './api'
import type { Ledger } from './model'

type State =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; data: Explanation }
  | { status: 'error'; message: string }

const CACHE = 'aslikamai.explain.v2'

// One call per distinct week; the answer is cached so re-renders, reloads and
// flipping between weeks don't re-bill the same numbers.
const keyFor = (ledger: Ledger, weekStart: string, lang: Lang) =>
  JSON.stringify({
    w: weekStart,
    l: lang,
    s: ledger.shifts.map((s) => [s.date, s.platform, s.slot, s.hours, s.gross, s.fuel]),
    m: ledger.monthly,
  })

type Cache = Record<string, Explanation>
const readCache = (): Cache => {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE) ?? '{}') as Cache
  } catch {
    return {}
  }
}
const writeCache = (key: string, data: Explanation) => {
  try {
    const c = readCache()
    const keys = Object.keys(c)
    if (keys.length > 12) delete c[keys[0]]
    c[key] = data
    sessionStorage.setItem(CACHE, JSON.stringify(c))
  } catch {
    /* fine */
  }
}

export function useExplanation(ledger: Ledger, weekStart: string, lang: Lang, hasShifts: boolean, taught: string[]): State {
  const key = keyFor(ledger, weekStart, lang)
  const [state, setState] = useState<State>({ status: 'idle' })

  useEffect(() => {
    if (!hasShifts) {
      setState({ status: 'idle' })
      return
    }
    const cached = readCache()[key]
    if (cached) {
      setState({ status: 'ready', data: cached })
      return
    }
    let live = true
    setState({ status: 'loading' })
    // Riders often log two or three shifts in one sitting. Waiting for the
    // edits to settle turns that burst into a single call instead of one
    // slow, billable request per keystroke-sized change.
    const timer = setTimeout(() => {
      api
        .explain(ledger, { weekStart, lang, taught })
        .then((data) => {
          if (!live) return
          writeCache(key, data)
          setState({ status: 'ready', data })
        })
        .catch((e: Error) => live && setState({ status: 'error', message: e.message }))
    }, 1200)
    return () => {
      live = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hasShifts])

  return state
}
