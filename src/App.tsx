import { useMemo, useState } from 'react'
import { type MonthlyCosts, type Platform, type Shift, type Slot, PLATFORMS, SLOTS, inr, perDayFixed, uid } from './model'
import { explain, netForShift, summarize } from './insights'
import { useLedger } from './store'
import { useExplanation } from './ai'
import { GoogleButton, useAuth } from './auth'

// Riders get to use the app first; the account comes once there is something worth keeping.
const SIGN_IN_AFTER = 10

const today = () => new Date().toISOString().slice(0, 10)

const dayLabel = (iso: string) => {
  const d = new Date(iso + 'T00:00:00')
  return { dow: d.toLocaleDateString('en-IN', { weekday: 'short' }), num: d.getDate() }
}

export default function App() {
  const { ledger, setLedger, loadSample, clear, sync } = useLedger()
  const { user, ready, signOut } = useAuth()
  const [adding, setAdding] = useState(false)
  const [editingCosts, setEditingCosts] = useState(false)

  const week = useMemo(() => summarize(ledger), [ledger])
  const lines = useMemo(() => explain(ledger), [ledger])
  const ai = useExplanation(ledger)

  const shifts = [...ledger.shifts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const first = shifts[shifts.length - 1]?.date
  const last = shifts[0]?.date
  const range =
    first && last
      ? `${dayLabel(first).num} – ${dayLabel(last).num} ${new Date(last + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}`
      : ''

  // Segment widths for the "where it went" bar. Fixed costs split by
  // their monthly share so the legend can name each one.
  const m = ledger.monthly
  const fixedTotal = m.emi + m.recharge + m.maintenance || 1
  const emiPart = (week.fixed * m.emi) / fixedTotal
  const rechargePart = week.fixed - emiPart // recharge + maintenance together
  const pct = (n: number) => (week.gross ? (n / week.gross) * 100 : 0)

  const addShift = (s: Shift) => {
    setLedger({ ...ledger, shifts: [...ledger.shifts, s] })
    setAdding(false)
  }
  const removeShift = (id: string) =>
    setLedger({ ...ledger, shifts: ledger.shifts.filter((s) => s.id !== id) })
  const saveCosts = (monthly: MonthlyCosts) => {
    setLedger({ ...ledger, monthly })
    setEditingCosts(false)
  }

  return (
    <main className="app">
      <header className="top">
        <div className="brand">
          Asli Kamai <small>your real take-home</small>
        </div>
        <div className="top-right">
          <span className="range">{range}</span>
          {user && (
            <button className="avatar" onClick={() => window.confirm('Sign out? Your shifts stay on this phone.') && signOut()} title={user.email}>
              {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : user.name?.[0] ?? '·'}
            </button>
          )}
        </div>
      </header>

      {ready && !user && ledger.shifts.length >= SIGN_IN_AFTER && <SignInWall count={ledger.shifts.length} />}

      <section className="hero" aria-label="This week">
        <div className="eyebrow">Kept this week</div>
        <div className="kept">
          <span className="rupee">₹</span>
          {Math.round(week.net).toLocaleString('en-IN')}
        </div>
        <p className="sub">
          of <b>{inr(week.gross)}</b> earned · <span className="gone">{Math.round(week.goneShare * 100)}% gone</span> before you saw it
        </p>
        <div className="bar" role="img" aria-label="Where this week's earnings went">
          <span className="fuel" style={{ width: pct(week.fuel) + '%' }} />
          <span className="emi" style={{ width: pct(emiPart) + '%' }} />
          <span className="recharge" style={{ width: pct(rechargePart) + '%' }} />
          <span className="kept" style={{ width: pct(Math.max(0, week.net)) + '%' }} />
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--fuel)' }} />Petrol<span className="v">{inr(week.fuel)}</span></span>
          <span><i style={{ background: 'var(--emi)' }} />EMI<span className="v">{inr(emiPart)}</span></span>
          <span><i style={{ background: 'var(--recharge)' }} />Recharge, upkeep<span className="v">{inr(rechargePart)}</span></span>
          <span><i style={{ background: 'var(--kept)' }} />Kept<span className="v">{inr(week.net)}</span></span>
        </div>
      </section>

      {adding ? (
        <ShiftForm onSave={addShift} onCancel={() => setAdding(false)} />
      ) : (
        <button className="btn" onClick={() => setAdding(true)}>Add a shift</button>
      )}

      <section className="card explain" aria-label="Explanation" aria-busy={ai.status === 'loading'}>
        {ai.status === 'ready' ? (
          <>
            <span className="tag">From your own numbers · {ai.data.concept || 'this week'}</span>
            <p>{ai.data.explanation}</p>
            <p>{ai.data.lesson}</p>
          </>
        ) : (
          <>
            <span className="tag">From your own numbers</span>
            {lines.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
            {ai.status === 'loading' && <p className="muted">Writing your lesson…</p>}
            {ai.status === 'error' && <p className="muted">Coach is offline right now; the numbers above are still yours.</p>}
          </>
        )}
      </section>

      <section className="card" aria-label="Shifts">
        <h2>Shifts</h2>
        {shifts.length === 0 ? (
          <p className="muted">
            No shifts yet. Add one and your week starts here, or{' '}
            <button className="link" onClick={loadSample}>load a sample week</button> to see how it looks.
          </p>
        ) : (
          <div className="list">
            {shifts.map((s) => {
              const d = dayLabel(s.date)
              return (
                <div className="row" key={s.id}>
                  <div className="date">
                    <b>{d.num}</b>
                    {d.dow}
                  </div>
                  <div className="what">
                    {s.platform}
                    <small>
                      {s.slot} · {s.hours}h · petrol {inr(s.fuel)}
                    </small>
                    <button className="del" onClick={() => removeShift(s.id)} aria-label={`Remove ${s.platform} shift on ${s.date}`}>
                      remove
                    </button>
                  </div>
                  <div className="money">
                    <div className="net">{inr(netForShift(s, ledger))}</div>
                    <div className="gross">{inr(s.gross)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="card" aria-label="Monthly costs">
        <h2>Monthly costs</h2>
        {editingCosts ? (
          <CostsForm value={ledger.monthly} onSave={saveCosts} onCancel={() => setEditingCosts(false)} />
        ) : (
          <>
            <div className="costs">
              <div className="cost"><span>Bike EMI</span><b>{inr(m.emi)}</b></div>
              <div className="cost"><span>Recharge</span><b>{inr(m.recharge)}</b></div>
              <div className="cost"><span>Upkeep</span><b>{inr(m.maintenance)}</b></div>
            </div>
            <div className="costs-foot">
              <span>
                Over {m.workingDays} working days that is <b>{inr(perDayFixed(m))}</b> a day
              </span>
              <button className="btn ghost small" onClick={() => setEditingCosts(true)}>Edit</button>
            </div>
          </>
        )}
      </section>

      <p className="foot">
        {user ? (sync === 'synced' ? 'Saved on this phone and backed up. ' : sync === 'syncing' ? 'Backing up… ' : sync === 'offline' ? 'Saved on this phone; backup will retry. ' : '') : 'Saved on this phone only. '}
        {shifts.length ? (
          <button onClick={() => window.confirm('Remove every shift and cost from this phone?') && clear()}>Clear everything</button>
        ) : (
          <button onClick={loadSample}>Load the sample week</button>
        )}
      </p>
    </main>
  )
}

function ShiftForm({ onSave, onCancel }: { onSave: (s: Shift) => void; onCancel: () => void }) {
  const [date, setDate] = useState(today())
  const [platform, setPlatform] = useState<Platform>('Swiggy')
  const [slot, setSlot] = useState<Slot>('Evening')
  const [hours, setHours] = useState('4')
  const [gross, setGross] = useState('')
  const [fuel, setFuel] = useState('')

  const valid = Number(gross) > 0 && Number(hours) > 0

  return (
    <form
      className="card form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onSave({ id: uid(), date, platform, slot, hours: Number(hours), gross: Number(gross), fuel: Number(fuel) || 0 })
      }}
    >
      <div className="field full">
        <label htmlFor="date">Day</label>
        <input id="date" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="platform">App</label>
        <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
          {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="slot">When</label>
        <select id="slot" value={slot} onChange={(e) => setSlot(e.target.value as Slot)}>
          {SLOTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="gross">Earned</label>
        <div className="unit"><input id="gross" inputMode="numeric" placeholder="0" value={gross} onChange={(e) => setGross(e.target.value)} autoFocus /></div>
      </div>
      <div className="field">
        <label htmlFor="fuel">Petrol</label>
        <div className="unit"><input id="fuel" inputMode="numeric" placeholder="0" value={fuel} onChange={(e) => setFuel(e.target.value)} /></div>
      </div>
      <div className="field">
        <label htmlFor="hours">Hours</label>
        <input id="hours" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
      </div>
      <div className="actions full">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn" disabled={!valid}>Save shift</button>
      </div>
    </form>
  )
}

function CostsForm({ value, onSave, onCancel }: { value: MonthlyCosts; onSave: (m: MonthlyCosts) => void; onCancel: () => void }) {
  const [v, setV] = useState({ ...value })
  const num = (k: keyof MonthlyCosts) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV({ ...v, [k]: Number(e.target.value) || 0 })
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(v)
      }}
    >
      <div className="field"><label htmlFor="emi">Bike EMI / month</label><div className="unit"><input id="emi" inputMode="numeric" value={v.emi} onChange={num('emi')} /></div></div>
      <div className="field"><label htmlFor="recharge">Recharge / month</label><div className="unit"><input id="recharge" inputMode="numeric" value={v.recharge} onChange={num('recharge')} /></div></div>
      <div className="field"><label htmlFor="maint">Upkeep / month</label><div className="unit"><input id="maint" inputMode="numeric" value={v.maintenance} onChange={num('maintenance')} /></div></div>
      <div className="field"><label htmlFor="days">Working days / month</label><input id="days" inputMode="numeric" value={v.workingDays} onChange={num('workingDays')} /></div>
      <div className="actions full">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn">Save costs</button>
      </div>
    </form>
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
      </div>
    </div>
  )
}
