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
  if (saved && !Array.isArray(saved.shifts)) saved = null
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

  // Always push the copy on screen, not the one captured when the timer was set.
  const latest = useRef(ledger)
  latest.current = ledger

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
        const localHasData = latest.current.shifts.length > 0
        const remoteNewer = remote && updatedAt && (!localHasData || updatedAt > savedAt())
        if (remoteNewer) {
          setLedger(remote)
        } else if (localHasData) {
          await api.putLedger(latest.current)
        }
        setSync('synced')
      })
      .catch(() => setSync('offline'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Push changes while signed in. `dirty` survives an in-flight sync, so an
  // edit made while a push is running is still sent once that push lands
  // instead of sitting on the phone until the next unrelated change.
  const dirty = useRef(false)
  const firstChange = useRef(true)
  useEffect(() => {
    if (firstChange.current) {
      firstChange.current = false
      return
    }
    dirty.current = true
  }, [ledger])

  useEffect(() => {
    if (!user || !dirty.current || sync === 'syncing') return
    const t = setTimeout(() => {
      dirty.current = false
      setSync('syncing')
      api
        .putLedger(latest.current)
        .then(() => setSync('synced'))
        .catch(() => {
          dirty.current = true // keep it queued for the next attempt
          setSync('offline')
        })
    }, 800)
    return () => clearTimeout(t)
  }, [ledger, user, sync])

  const loadSample = () => setLedger(seedLedger())
  const clearSample = () =>
    setLedger((l) => ({ ...l, shifts: l.shifts.filter((s) => !s.sample) }))
  const clear = () => setLedger(emptyLedger())
  return { ledger, setLedger, loadSample, clearSample, clear, sync }
}
