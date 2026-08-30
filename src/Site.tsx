import { useEffect, useState } from 'react'

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
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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

      <section id="how" className="section">
        <h2>How it works</h2>
        <ol className="steps">
          <li>
            <b>Log a shift</b>
            <p>App, hours, what you earned, petrol you put in. Ten seconds after you park.</p>
          </li>
          <li>
            <b>Set your monthly costs once</b>
            <p>Bike EMI, recharge, upkeep. Asli Kamai spreads them across your working days so every shift carries its share.</p>
          </li>
          <li>
            <b>See what you kept</b>
            <p>One number for the week, a bar for where the rest went, and a short explanation written from your data.</p>
          </li>
        </ol>
      </section>

      <section id="learn" className="section">
        <h2>What you learn along the way</h2>
        <p className="lead">Not a course. Each idea shows up only when your own numbers make it real.</p>
        <div className="grid">
          <div className="card">
            <h3>Gross vs. take-home</h3>
            <p>The app shows ₹1,200. After petrol and your EMI share it is ₹930. That 22% is the difference between the two words.</p>
          </div>
          <div className="card">
            <h3>Why evenings pay more</h3>
            <p>When your 6–9pm shifts earn 35% more per hour, Asli Kamai names it: surge pricing, and how to use it.</p>
          </div>
          <div className="card">
            <h3>Per-day cost of a loan</h3>
            <p>₹3,000 EMI over 25 working days is ₹120 a day. A two-question quiz each week checks you can do it yourself.</p>
          </div>
          <div className="card">
            <h3>What ₹50 a day becomes</h3>
            <p>Set a goal and see it grow — and what a recurring deposit adds on top. That is compounding, with your figures.</p>
          </div>
        </div>
      </section>

      <section className="section band">
        <h2>What Asli Kamai does not do</h2>
        <p className="lead">
          It does not read your platform account or guess how the app pays you. Everything comes from what you type in —
          your own ground-truth record, saved on your phone only.
        </p>
      </section>

      <section id="download" className="section final">
        <h2>Start with this week</h2>
        <p className="lead">Add tonight's shift and the number is already there.</p>
        <div className="cta">
          <a className="btn" href={APP_URL}>Open Asli Kamai</a>
          <a className="btn ghost" href={APK_URL}>Android APK — coming soon</a>
        </div>
      </section>

      <footer className="foot">
        Asli Kamai · built for riders in India · <a href="https://github.com/MONSTER13LIAR/Asli-Kamai">source</a>
      </footer>
    </div>
  )
}
