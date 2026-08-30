import { useEffect, useState } from 'react'
import { type Ledger, emptyLedger, seedLedger } from './model'

const KEY = 'aslikamai.ledger.v1'

const load = (): Ledger => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Ledger
  } catch {
    /* fall through to an empty ledger */
  }
  return emptyLedger()
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
