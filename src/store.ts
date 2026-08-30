import { useEffect, useRef, useState } from 'react'
import { api } from './api'
import { useAuth } from './auth'
import { type Ledger, emptyLedger, seedLedger } from './model'

const KEY = 'aslikamai.ledger.v1'
const SAVED_KEY = 'aslikamai.ledger.savedAt'

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

const savedAt = () => {
  try {
    return localStorage.getItem(SAVED_KEY) ?? ''
  } catch {
    return ''
  }
}

export type SyncState = 'local' | 'syncing' | 'synced' | 'offline'

/**
 * The phone is always the working copy. Once the rider is signed in, the
 * ledger is mirrored to the server: on sign-in the newer of the two copies
 * wins, after that every change is pushed (debounced).
 */
export function useLedger() {
  const { user } = useAuth()
  const [ledger, setLedger] = useState<Ledger>(load)
  const [sync, setSync] = useState<SyncState>('local')
  const pulled = useRef<number | null>(null) // user id we already reconciled with

  // Persist locally on every change.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ledger))
      localStorage.setItem(SAVED_KEY, new Date().toISOString())
    } catch {
      /* storage unavailable; keep in memory */
    }
  }, [ledger])

  // Reconcile once per sign-in: newer copy wins.
  useEffect(() => {
    if (!user) {
      pulled.current = null
      setSync('local')
      return
    }
    if (pulled.current === user.id) return
    pulled.current = user.id
    setSync('syncing')
    api
      .getLedger()
      .then(async ({ ledger: remote, updatedAt }) => {
        const localHasData = ledger.shifts.length > 0
        const remoteNewer = remote && updatedAt && (!localHasData || updatedAt > savedAt())
        if (remoteNewer) {
          setLedger(remote)
        } else if (localHasData) {
          await api.putLedger(ledger)
        }
        setSync('synced')
      })
      .catch(() => setSync('offline'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Push changes while signed in (skip until the first reconcile finished).
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!user || sync === 'syncing') return
    const t = setTimeout(() => {
      setSync('syncing')
      api
        .putLedger(ledger)
        .then(() => setSync('synced'))
        .catch(() => setSync('offline'))
    }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger])

  const loadSample = () => setLedger(seedLedger())
  const clear = () => setLedger(emptyLedger())
  return { ledger, setLedger, loadSample, clear, sync }
}
