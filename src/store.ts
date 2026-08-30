import { useEffect, useState } from 'react'
import { type Ledger, emptyLedger, seedLedger } from './model'

const KEY = 'aslikamai.ledger.v1'

// /app/?sample=1 opens with the sample week, but never over a rider's own data.
const wantsSample = () => {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('sample')) return false
  url.searchParams.delete('sample')
  window.history.replaceState(null, '', url)
  return true
}

const load = (): Ledger => {
  let saved: Ledger | null = null
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) saved = JSON.parse(raw) as Ledger
  } catch {
    /* fall through to an empty ledger */
  }
  if (wantsSample() && !saved?.shifts.length) return seedLedger()
  return saved ?? emptyLedger()
}

export function useLedger() {
  const [ledger, setLedger] = useState<Ledger>(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ledger))
    } catch {
      /* storage unavailable; keep in memory */
    }
  }, [ledger])
  const loadSample = () => setLedger(seedLedger())
  const clear = () => setLedger(emptyLedger())
  return { ledger, setLedger, loadSample, clear }
}
