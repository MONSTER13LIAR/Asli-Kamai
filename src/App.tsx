import { useCallback, useEffect, useState } from 'react'
import { GoogleButton, useAuth } from './auth'
import { Coach } from './Coach'
import { Goal } from './Goal'
import { Home } from './Home'
import { InstallCard } from './install'
import { useLang } from './lang'
import { Learn } from './Learn'
import { type Ledger, ownShifts, thisWeek } from './model'
import { Nav, TABS, type Tab } from './Nav'
import { useLedger } from './store'
import { useTheme } from './theme'

// Riders get to use the app first; the account comes once there is something
// worth keeping. Only shifts the rider logged themselves count towards it.
const SIGN_IN_AFTER = 10

const tabFromHash = (): Tab => {
  const h = window.location.hash.replace('#', '') as Tab
  return TABS.includes(h) ? h : 'home'
}

export default function App() {
  const { ledger, setLedger, loadSample, clearSample, clear, setGoal, updateProgress, sync } = useLedger()
  const { user, ready, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const { lang, toggle: toggleLang, t } = useLang()
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const [weekStart, setWeekStart] = useState(thisWeek)
  const [coachSeed, setCoachSeed] = useState<string | null>(null)

  // Tabs live in the hash so the phone's back button moves between them.
  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const go = useCallback((next: Tab) => {
    if (next === tabFromHash()) return
    window.location.hash = next === 'home' ? '' : next
    setTab(next)
    window.scrollTo({ top: 0 })
  }, [])

  const askCoach = (q: string) => {
    setCoachSeed(q)
    go('coach')
  }

  const wall = ready && !user && ownShifts(ledger).length >= SIGN_IN_AFTER

  return (
    <main className={'app tab-' + tab}>
      <header className="top">
        <div className="brand">
          Asli Kamai <small>{t('tagline')}</small>
        </div>
        <div className="top-right">
          <button className="lang-btn" onClick={toggleLang} aria-label={lang === 'hi' ? 'Switch to English' : 'हिंदी में देखें'} title={lang === 'hi' ? 'English' : 'हिंदी'}>
            {lang === 'hi' ? 'EN' : 'हिं'}
          </button>
          <button
            className="theme-btn"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          {user && (
            <button className="avatar" onClick={() => window.confirm('Sign out? Your shifts stay on this phone.') && signOut()} title={user.email}>
              {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : (user.name?.[0] ?? '·')}
            </button>
          )}
        </div>
      </header>

      {wall && <SignInWall count={ownShifts(ledger).length} />}

      {tab === 'home' && (
        <>
          <InstallCard />
          <Home
            ledger={ledger}
            setLedger={setLedger as (l: Ledger) => void}
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            updateProgress={updateProgress}
            clearSample={clearSample}
            loadSample={loadSample}
            clear={clear}
            sync={sync}
            signedIn={!!user}
          />
        </>
      )}
      {tab === 'coach' && <Coach ledger={ledger} weekStart={weekStart} seed={coachSeed} onSeedUsed={() => setCoachSeed(null)} />}
      {tab === 'learn' && <Learn ledger={ledger} weekStart={weekStart} updateProgress={updateProgress} />}
      {tab === 'goal' && <Goal ledger={ledger} setGoal={setGoal} onAsk={askCoach} />}

      <Nav tab={tab} onTab={go} />
    </main>
  )
}

function SignInWall({ count }: { count: number }) {
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="wall" role="dialog" aria-modal="true" aria-labelledby="wall-title">
      <div className="wall-card">
        <div className="eyebrow">{count} shifts on this phone</div>
        <h2 id="wall-title">Keep your hisaab safe</h2>
        <p>
          You've logged {count} shifts. Sign in once so your record survives a lost phone, a reset, or a new one — and
          opens on any device.
        </p>
        <GoogleButton onError={setError} />
        {error && <p className="muted">{error}</p>}
        <p className="muted">Only your Google name and email are stored. Nothing is shared with any platform.</p>
        <p className="muted">
          By continuing you agree to the <a href="/terms/">Terms</a> and <a href="/privacy/">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
