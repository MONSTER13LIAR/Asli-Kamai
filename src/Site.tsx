import { useEffect, useRef, useState } from 'react'

const APP_URL = '/app/'
const APK_URL = '#download' // replace with the APK link when it exists

type Theme = 'light' | 'dark'
const THEME_KEY = 'aslikamai.theme'

const readTheme = (): Theme => {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t === 'light' || t === 'dark') return t
  } catch {
    /* default below */
  }
  return 'light'
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* fine */
    }
  }, [theme])
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}

// Particle positions around the phone card, in % of the card box.
const PARTICLES = [
  { x: -6, y: 12, s: 6, d: 0 }, { x: 104, y: 20, s: 5, d: 1.2 }, { x: -10, y: 48, s: 4, d: 2.1 },
  { x: 108, y: 55, s: 7, d: 0.6 }, { x: -4, y: 82, s: 5, d: 1.7 }, { x: 102, y: 88, s: 4, d: 2.6 },
  { x: 20, y: -6, s: 5, d: 0.9 }, { x: 70, y: -8, s: 4, d: 2.3 }, { x: 40, y: 104, s: 6, d: 1.4 },
  { x: 85, y: 106, s: 4, d: 0.3 }, { x: -12, y: 30, s: 3, d: 2.9 }, { x: 112, y: 38, s: 3, d: 1.9 },
]

export default function Site() {
  const { theme, toggle } = useTheme()
  return (
    <div className="site">
      <header className="nav">
        <a className="brand" href="/">Asli Kamai</a>
        <nav>
          <a href="#how">How it works</a>
          <a href="#learn">What you learn</a>
          <a className="btn small" href={APP_URL}>Open the app</a>
          <button
            type="button"
            className="switch"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Dark mode"
            onClick={toggle}
          >
            <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <svg className="moon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
            <span className="knob" />
          </button>
        </nav>
      </header>

      <section className="hero-site">
        <div className="hero-copy">
          <p className="eyebrow">For Swiggy, Zomato, Rapido, Porter and Uber riders</p>
          <h1>You earned ₹1,200 today. How much did you actually keep?</h1>
          <p className="lead">
            Asli Kamai logs each shift, takes out petrol, bike EMI and recharge, and shows the number that is really
            yours — then explains, in plain words, where the rest went.
          </p>
          <div className="cta">
            <a className="btn" href={APP_URL}>Try it in your browser</a>
            <a className="btn ghost" href={APK_URL}>Download for Android</a>
          </div>
          <p className="muted">Free. No sign-up. Your numbers stay on your phone.</p>
        </div>

        <div className="float">
          <div className="particles" aria-hidden="true">
            {PARTICLES.map((p, i) => (
              <i key={i} style={{ left: p.x + '%', top: p.y + '%', width: p.s, height: p.s, animationDelay: p.d + 's' }} />
            ))}
          </div>
        <div className="phone" aria-label="Preview of the Asli Kamai app">
          <div className="phone-top">
            <span className="brand">Asli Kamai</span>
            <span className="range">22 – 28 Aug</span>
          </div>
          <div className="eyebrow">Kept this week</div>
          <div className="kept"><span className="rupee">₹</span>5,140</div>
          <p className="sub">of <b>₹7,650</b> earned · <span className="gone">33% gone</span> before you saw it</p>
          <div className="bar">
            <span className="fuel" style={{ width: '17%' }} />
            <span className="emi" style={{ width: '11%' }} />
            <span className="recharge" style={{ width: '5%' }} />
            <span className="kept" style={{ width: '67%' }} />
          </div>
          <div className="legend">
            <span><i style={{ background: 'var(--fuel)' }} />Petrol<span className="v">₹1,300</span></span>
            <span><i style={{ background: 'var(--emi)' }} />EMI<span className="v">₹840</span></span>
            <span><i style={{ background: 'var(--recharge)' }} />Recharge<span className="v">₹370</span></span>
          </div>
          <div className="card explain">
            <span className="tag">From your own numbers</span>
            <p>Evenings paid ₹210 an hour, mornings ₹140. That gap is demand pricing — more orders, fewer riders.</p>
          </div>
        </div>
        </div>
      </section>

      <HowItWorks />

      <section id="learn" className="learn">
        <div className="learn-head">
          <h2>What you learn along the way</h2>
          <p className="lead">Not a course. Each idea shows up only when your own numbers make it real.</p>
        </div>
        <div className="learn-grid">
          <div className="card lesson">
            <span className="tag">Gross vs. net</span>
            <h3>The number on the app is not your number</h3>
            <p>The app shows ₹1,200. After petrol and your EMI share it is ₹930. That 22% is the difference between the two words.</p>
          </div>
          <div className="card lesson">
            <span className="tag">Surge pricing</span>
            <h3>Why evenings pay more</h3>
            <p>When your 6–9pm shifts earn 35% more per hour, Asli Kamai names it: demand pricing, and how to use it.</p>
          </div>
          <div className="card lesson">
            <span className="tag">Fixed cost per day</span>
            <h3>What a loan costs you every morning</h3>
            <p>₹3,000 EMI over 25 working days is ₹120 a day. A two-question quiz each week checks you can do it yourself.</p>
          </div>
          <div className="card lesson">
            <span className="tag">Compounding</span>
            <h3>What ₹50 a day becomes</h3>
            <p>Set a goal and see it grow — and what a recurring deposit adds on top. Your figures, not a textbook's.</p>
          </div>
        </div>
      </section>

      <section className="promise">
        <div className="promise-copy">
          <h2>What Asli Kamai does not do</h2>
          <p className="lead">
            Everything comes from what you type in — your own ground-truth record, saved on your phone only.
          </p>
        </div>
        <ul className="promise-list">
          <li><b>Does not read your platform account.</b> No login to Swiggy or Zomato, ever.</li>
          <li><b>Does not guess how the app pays you.</b> Your record is the truth, not our estimate.</li>
          <li><b>Does not send your numbers anywhere.</b> Only the week's totals go to the coach, never your name.</li>
        </ul>
      </section>

      <section id="download" className="final">
        <div className="final-copy">
          <h2>Start with this week</h2>
          <p className="lead">Add tonight's shift and the number is already there.</p>
          <div className="cta">
            <a className="btn" href={APP_URL}>Open Asli Kamai</a>
            <a className="btn ghost" href={APK_URL}>Android APK — coming soon</a>
          </div>
        </div>
        <img className="final-art" src="/rider-riding.webp" alt="The Asli Kamai rider on a yellow scooter" width="452" height="492" loading="lazy" />
      </section>

      <footer className="site-foot">
        <span className="brand">Asli Kamai</span>
        <nav>
          <a href="#how">How it works</a>
          <a href="#learn">What you learn</a>
          <a href={APP_URL}>Open the app</a>
          <a href="https://github.com/MONSTER13LIAR/Asli-Kamai">Source</a>
        </nav>
        <span className="muted">Built for riders in India.</span>
      </footer>
    </div>
  )
}

const STEPS = [
  {
    title: 'Log a shift',
    body: 'App, hours, what you earned, petrol you put in. Ten seconds after you park.',
  },
  {
    title: 'Set your monthly costs once',
    body: 'Bike EMI, recharge, upkeep. Asli Kamai spreads them across your working days so every shift carries its share.',
  },
  {
    title: 'See what you kept',
    body: 'One number for the week, a bar for where the rest went, and a short explanation written from your data.',
  },
]

// Scroll-driven steps: the section is a tall track, the stage inside it is
// pinned, and the active step (text + app card) swaps in place as the
// reader moves through the track. One step visible at a time.
function HowItWorks() {
  const track = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = track.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const travel = el.offsetHeight - window.innerHeight
      const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0
      setActive(Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length)))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const state = (i: number) => (i === active ? 'is-active' : i < active ? 'is-past' : 'is-next')

  return (
    <section id="how" className="how" ref={track}>
      <div className="how-stage">
        <div className="how-copy">
          <h2>How it works</h2>
          <div className="how-steps">
            {STEPS.map((s, i) => (
              <div className={'how-step ' + state(i)} key={s.title} aria-hidden={i !== active}>
                <span className="how-num">{i + 1}</span>
                <b>{s.title}</b>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
          <div className="how-dots" aria-hidden="true">
            {STEPS.map((_, i) => <i key={i} className={i === active ? 'on' : ''} />)}
          </div>
        </div>

        <div className="how-cards">
          <div className={'how-card card ' + state(0)} aria-hidden={active !== 0}>
            <h3>Add a shift</h3>
            <div className="form">
              <div className="field"><label>App</label><div className="fake">Swiggy</div></div>
              <div className="field"><label>When</label><div className="fake">Evening</div></div>
              <div className="field"><label>Earned</label><div className="fake">₹ 1,240</div></div>
              <div className="field"><label>Petrol</label><div className="fake">₹ 100</div></div>
              <div className="field full"><label>Hours</label><div className="fake">4</div></div>
              <div className="actions full"><span className="btn ghost">Cancel</span><span className="btn">Save shift</span></div>
            </div>
          </div>

          <div className={'how-card card ' + state(1)} aria-hidden={active !== 1}>
            <h3>Monthly costs</h3>
            <div className="costs">
              <div className="cost"><span>Bike EMI</span><b>₹3,000</b></div>
              <div className="cost"><span>Recharge</span><b>₹299</b></div>
              <div className="cost"><span>Upkeep</span><b>₹500</b></div>
              <div className="cost"><span>Working days</span><b>25</b></div>
            </div>
            <div className="costs-foot">
              <span>Over 25 working days that is <b>₹152</b> a day</span>
              <span className="btn ghost small">Edit</span>
            </div>
          </div>

          <div className={'how-card card ' + state(2)} aria-hidden={active !== 2}>
            <div className="eyebrow">Kept this week</div>
            <div className="kept"><span className="rupee">₹</span>5,140</div>
            <p className="sub">of <b>₹7,650</b> earned · <span className="gone">33% gone</span> before you saw it</p>
            <div className="bar">
              <span className="fuel" style={{ width: '17%' }} />
              <span className="emi" style={{ width: '11%' }} />
              <span className="recharge" style={{ width: '5%' }} />
              <span className="kept" style={{ width: '67%' }} />
            </div>
            <div className="legend">
              <span><i style={{ background: 'var(--fuel)' }} />Petrol<span className="v">₹1,300</span></span>
              <span><i style={{ background: 'var(--emi)' }} />EMI<span className="v">₹840</span></span>
              <span><i style={{ background: 'var(--recharge)' }} />Recharge<span className="v">₹370</span></span>
            </div>
            <div className="explain-mini">
              <span className="tag">From your own numbers</span>
              <p>₹1,300 went to petrol and ₹1,210 was your share of EMI and recharge. What you kept is ₹5,140.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
