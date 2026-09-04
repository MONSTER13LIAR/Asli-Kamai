import { useCallback, useState, useSyncExternalStore } from 'react'

/**
 * "Add to home screen", so the rider opens Asli Kamai like any other app
 * instead of typing a URL again. Chrome fires beforeinstallprompt once, early
 * — often before React has mounted — so the event is caught at module load and
 * held for whoever asks for it later.
 */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED = 'aslikamai.install.dismissed'

let deferred: InstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const onHomeScreen = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

// iPhone and iPad never offer a prompt; the rider has to use the Share menu.
const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    emit()
  })
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const snapshot = () => (installed ? 'installed' : deferred ? 'ready' : 'none')

const wasDismissed = () => {
  try {
    return localStorage.getItem(DISMISSED) === '1'
  } catch {
    return false
  }
}

export function InstallCard() {
  const state = useSyncExternalStore(subscribe, snapshot, () => 'none' as const)
  const [dismissed, setDismissed] = useState(wasDismissed)

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED, '1')
    } catch {
      /* fine, it just asks again next time */
    }
    setDismissed(true)
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    emit()
    if (outcome === 'dismissed') dismiss()
  }, [dismiss])

  if (dismissed || state === 'installed' || onHomeScreen()) return null

  if (state === 'ready') {
    return (
      <section className="card install" aria-label="Install Asli Kamai">
        <div>
          <b>Keep it on your home screen</b>
          <p className="muted">Opens full screen, no browser, and your week is there without a signal.</p>
        </div>
        <div className="install-actions">
          <button className="btn small" onClick={install}>Install</button>
          <button className="link" onClick={dismiss}>Not now</button>
        </div>
      </section>
    )
  }

  if (isIos()) {
    return (
      <section className="card install" aria-label="Add Asli Kamai to your home screen">
        <div>
          <b>Keep it on your home screen</b>
          <p className="muted">Tap Share at the bottom of Safari, then "Add to Home Screen".</p>
        </div>
        <div className="install-actions">
          <button className="link" onClick={dismiss}>Not now</button>
        </div>
      </section>
    )
  }

  return null
}
