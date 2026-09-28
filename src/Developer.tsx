import { ThemeSwitch, useTheme } from './theme'

const BUILT = [
  { part: 'App and site', how: 'React and Vite in TypeScript. The app installs to the home screen and works without an account.' },
  { part: 'AI', how: 'Qwen3 writes the explanations, coach answers and quiz; Qwen3-VL reads earnings screenshots. Both run on Featherless.' },
  { part: 'The numbers', how: 'Every rupee, rate and quiz answer is computed in plain code. The model only puts finished figures into words, so it cannot invent one.' },
  { part: 'Accounts', how: 'Google sign-in after ten shifts, so the record survives a new phone. Postgres on Neon, one ledger per rider.' },
]

const OTHERS = [
  { name: 'EARTH', note: '1st place, GIC 2030 AI Challenge. Health, education, farming and women’s rights toolkits in Hindi or English.', href: 'https://earth-sepia-seven.vercel.app' },
  { name: 'Aravalli Watch', note: 'Satellite imagery of the Aravalli range year by year, with a ready complaint draft for any area that changed.', href: 'https://aravalli-watch.vercel.app' },
]

export default function Developer() {
  const { theme, toggle } = useTheme()
  return (
    <div className="site dev">
      <header className="nav">
        <a className="brand" href="/">Asli Kamai</a>
        <nav>
          <a href="/">Home</a>
          <a className="btn small" href="/app/">Open the app</a>
          <ThemeSwitch theme={theme} toggle={toggle} />
        </nav>
      </header>

      <section className="dev-hero">
        <div>
          <p className="eyebrow">The developer</p>
          <h1>Abhijay.G</h1>
          <p className="lead">
            Asli Kamai is designed, built and run by one developer in India. If you ride for a delivery app and something
            in it is wrong, I want to hear it.
          </p>
          <div className="dev-links">
            <a className="btn" href="mailto:monster13liar@gmail.com">Email me</a>
            <a href="https://monster13liar.xyz">Portfolio</a>
            <a href="https://github.com/MONSTER13LIAR">GitHub</a>
            <a href="https://github.com/MONSTER13LIAR/Asli-Kamai">Source code</a>
          </div>
        </div>
        <img className="dev-art" src="/mascot-riding.webp" alt="The Asli Kamai rider on a yellow scooter" loading="lazy" />
      </section>

      <section className="dev-block dev-why">
        <h2>Why I built this</h2>
        <p>
          A gig worker sees the payout on every app they ride for, but they know the harsh truth. They are not dumb.
          They know they are not really earning that much, and when anyone asks their salary, they know they have to
          fake the number. Their home runs on money they can't even track. They get ₹500, but what did the petrol cost?
          They never get to keep track of it.
        </p>
        <p>They should have that right, and it is a shame for all of us that they don't. That's why I built Asli Kamai.</p>
      </section>

      <section className="dev-block">
        <h2>How it is built</h2>
        <dl className="dev-built">
          {BUILT.map((b) => (
            <div key={b.part}>
              <dt>{b.part}</dt>
              <dd>{b.how}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="dev-block">
        <h2>Also built</h2>
        <div className="dev-others">
          {OTHERS.map((o) => (
            <a className="card dev-other" key={o.name} href={o.href}>
              <b>{o.name}</b>
              <p>{o.note}</p>
              <span className="dev-open">Open →</span>
            </a>
          ))}
        </div>
      </section>

      <footer className="site-foot">
        <span className="brand">Asli Kamai</span>
        <nav>
          <a href="/">Home</a>
          <a href="/app/">Open the app</a>
          <a href="https://github.com/MONSTER13LIAR/Asli-Kamai">Source</a>
        </nav>
        <span className="muted">Built for riders in India.</span>
      </footer>
    </div>
  )
}
