import { useEffect, useState } from 'react'
import { type Ledger, seedLedger } from './model'

const KEY = 'hisaab.ledger.v1'

const load = (): Ledger => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Ledger
  } catch {
    /* fall through to seed */
  }
  return seedLedger()
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
  const reset = () => setLedger(seedLedger())
  return { ledger, setLedger, reset }
}
