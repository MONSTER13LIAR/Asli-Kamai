import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type MonthlyCosts, type Platform, type Shift, type Slot,
  PLATFORMS, SLOTS, dayOf, formatRange, hasSample, inr, isoDay, monthOf, ownShifts, perDayFixed, uid, weekdayOf, workingDays,
} from './model'
import { explain, netForShift, summarize } from './insights'
import { useLedger } from './store'
import { useExplanation } from './ai'
import { GoogleButton, useAuth } from './auth'
import { InstallCard } from './install'
import { useTheme } from './theme'

// Riders get to use the app first; the account comes once there is something
// worth keeping. Only shifts the rider logged themselves count towards it.
const SIGN_IN_AFTER = 10

export default function App() {
  const { ledger, setLedger, loadSample, clearSample, clear, sync } = useLedger()
  const { user, ready, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Shift | null>(null)
  const [editingCosts, setEditingCosts] = useState(false)
  const [undo, setUndo] = useState<{ shift: Shift; at: number } | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const week = useMemo(() => summarize(ledger), [ledger])
  const lines = useMemo(() => explain(ledger), [ledger])
  const ai = useExplanation(ledger)

  const shifts = [...ledger.shifts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const first = shifts[shifts.length - 1]?.date
  const last = shifts[0]?.date
  const range = formatRange(first, last)
  // Aug 31 and Sep 1 both read "31" and "1"; show the month once the week crosses one.
  const showMonth = !!first && !!last && first.slice(0, 7) !== last.slice(0, 7)

  const empty = ledger.shifts.length === 0
  const short = week.net < 0

  // Segment widths. When costs outrun earnings the bar is scaled by the
  // outgoings instead, so a segment can never run past the end of the track.
  const m = ledger.monthly
  const fixedTotal = m.emi + m.recharge + m.maintenance || 1
  const emiPart = (week.fixed * m.emi) / fixedTotal
  const rechargePart = week.fixed - emiPart // recharge + maintenance together
  const scale = Math.max(week.gross, week.fuel + week.fixed) || 1
  const pct = (n: number) => (n / scale) * 100

  // The undo strip clears itself so a stale "Undo" can never resurrect a shift
  // the rider has moved on from.
  useEffect(() => {
    if (!undo) return
    const t = setTimeout(() => setUndo(null), 7000)
    return () => clearTimeout(t)
  }, [undo])

  const openForm = (shift: Shift | null) => {
    setEditing(shift)
    setAdding(true)
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }
  const closeForm = () => {
    setAdding(false)
    setEditing(null)
  }

  const saveShift = (s: Shift) => {
    setLedger({
      ...ledger,
      shifts: editing ? ledger.shifts.map((x) => (x.id === s.id ? s : x)) : [...ledger.shifts, s],
    })
    closeForm()
  }
  const removeShift = (shift: Shift) => {
    setLedger({ ...ledger, shifts: ledger.shifts.filter((s) => s.id !== shift.id) })
    setUndo({ shift, at: Date.now() })
  }
  const undoRemove = () => {
    if (!undo) return
    setLedger({ ...ledger, shifts: [...ledger.shifts, undo.shift] })
    setUndo(null)
  }
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

      {ready && !user && ownShifts(ledger).length >= SIGN_IN_AFTER && <SignInWall count={ownShifts(ledger).length} />}

      <InstallCard />

      {hasSample(ledger) && (
        <div className="sample-note">
          <span>
            <b>Sample week.</b> These are demo numbers, not yours.
          </span>
          <button className="link" onClick={clearSample}>Clear it</button>
        </div>
      )}

      {empty ? (
        <section className="start" aria-label="Get started">
          <div className="eyebrow">Start here</div>
          <h1>What did you actually keep today?</h1>
          <p>
            Log what you earned and what petrol cost. Asli Kamai takes out your EMI, recharge and upkeep, shows the
            number that is really yours, and explains where the rest went.
          </p>
        </section>
      ) : (
        <section className="hero" aria-label="This week">
          <div className="eyebrow">{short ? 'Short this week' : 'Kept this week'}</div>
          <div className={'kept' + (short ? ' is-short' : '')}>
            <span className="rupee">₹</span>
            {Math.abs(Math.round(week.net)).toLocaleString('en-IN')}
          </div>
          <p className="sub">
            {short ? (
              <>
                you spent more than the <b>{inr(week.gross)}</b> you earned ·{' '}
                <span className="gone">costs {inr(week.fuel + week.fixed)}</span>
              </>
            ) : (
              <>
                of <b>{inr(week.gross)}</b> earned · <span className="gone">{Math.round(week.goneShare * 100)}% gone</span> before you saw it
              </>
            )}
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
            <span><i style={{ background: short ? 'var(--gone)' : 'var(--kept)' }} />{short ? 'Short' : 'Kept'}<span className="v">{inr(Math.abs(week.net))}</span></span>
          </div>
        </section>
      )}

      <div ref={formRef}>
        {adding ? (
          <ShiftForm initial={editing} onSave={saveShift} onCancel={closeForm} />
        ) : (
          <button className="btn" onClick={() => openForm(null)}>Add a shift</button>
        )}
      </div>

      {undo && (
        <div className="undo" role="status">
          <span>Shift removed.</span>
          <button className="link" onClick={undoRemove}>Undo</button>
        </div>
      )}

      {!empty && (
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
      )}

      {!empty && (
        <section className="card" aria-label="Shifts">
          <h2>Shifts</h2>
          <div className="list">
            {shifts.map((s) => (
              <div className="row" key={s.id}>
                <div className="date">
                  <b>{dayOf(s.date)}</b>
                  {showMonth ? monthOf(s.date) : weekdayOf(s.date)}
                </div>
                <div className="what">
                  <button className="row-edit" onClick={() => openForm(s)} aria-label={`Edit ${s.platform} shift on ${s.date}`}>
                    {s.platform}
                    <small>
                      {s.slot} · {s.hours}h · petrol {inr(s.fuel)}
                    </small>
                  </button>
                </div>
                <div className="money">
                  <div className={'net' + (netForShift(s, ledger) < 0 ? ' is-short' : '')}>{inr(netForShift(s, ledger))}</div>
                  <div className="gross">{inr(s.gross)}</div>
                  <button className="del" onClick={() => removeShift(s)} aria-label={`Remove ${s.platform} shift on ${s.date}`}>
                    remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
                Over {workingDays(m)} working days that is <b>{inr(perDayFixed(m))}</b> a day
              </span>
              <button className="btn ghost small" onClick={() => setEditingCosts(true)}>Edit</button>
            </div>
          </>
        )}
      </section>

      <p className="foot">
        {user ? (sync === 'synced' ? 'Saved on this phone and backed up. ' : sync === 'syncing' ? 'Backing up… ' : sync === 'offline' ? 'Saved on this phone; backup will retry. ' : '') : 'Saved on this phone only. '}
        {ledger.shifts.length ? (
          <button onClick={() => window.confirm('Remove every shift and cost from this phone?') && clear()}>Clear everything</button>
        ) : (
          <button onClick={loadSample}>Load a sample week</button>
        )}
      </p>
    </main>
  )
}

// Digits only, so "12ab" can never be banked as ₹12 or silently as ₹0.
const clean = (s: string) => s.replace(/[^\d]/g, '')
const cleanDecimal = (s: string) => s.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')

function ShiftForm({ initial, onSave, onCancel }: { initial: Shift | null; onSave: (s: Shift) => void; onCancel: () => void }) {
  const [date, setDate] = useState(initial?.date ?? isoDay())
  const [platform, setPlatform] = useState<Platform>(initial?.platform ?? 'Swiggy')
  const [slot, setSlot] = useState<Slot>(initial?.slot ?? 'Evening')
  const [hours, setHours] = useState(initial ? String(initial.hours) : '4')
  const [gross, setGross] = useState(initial ? String(initial.gross) : '')
  const [fuel, setFuel] = useState(initial ? String(initial.fuel) : '')

  const valid = Number(gross) > 0 && Number(hours) > 0

  return (
    <form
      className="card form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onSave({
          id: initial?.id ?? uid(),
          date,
          platform,
          slot,
          hours: Number(hours),
          gross: Number(gross),
          fuel: Number(fuel) || 0,
          // No sample flag is carried over: once the rider edits a demo shift
          // it is their own record, and it counts towards the sign-in wall.
        })
      }}
    >
      <div className="form-head full">
        <h2>{initial ? 'Edit shift' : 'Add a shift'}</h2>
      </div>
      <div className="field full">
        <label htmlFor="date">Day</label>
        <input id="date" type="date" value={date} max={isoDay()} onChange={(e) => setDate(e.target.value)} />
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
        <div className="unit"><input id="gross" inputMode="numeric" placeholder="0" value={gross} onChange={(e) => setGross(clean(e.target.value))} autoFocus /></div>
      </div>
      <div className="field">
        <label htmlFor="fuel">Petrol</label>
        <div className="unit"><input id="fuel" inputMode="numeric" placeholder="0" value={fuel} onChange={(e) => setFuel(clean(e.target.value))} /></div>
      </div>
      <div className="field full">
        <label htmlFor="hours">Hours</label>
        <input id="hours" inputMode="decimal" value={hours} onChange={(e) => setHours(cleanDecimal(e.target.value))} />
      </div>
      <div className="actions full">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn" disabled={!valid}>{initial ? 'Save changes' : 'Save shift'}</button>
      </div>
    </form>
  )
}

function CostsForm({ value, onSave, onCancel }: { value: MonthlyCosts; onSave: (m: MonthlyCosts) => void; onCancel: () => void }) {
  const [v, setV] = useState({
    emi: String(value.emi),
    recharge: String(value.recharge),
    maintenance: String(value.maintenance),
    workingDays: String(value.workingDays),
  })
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: clean(e.target.value) })
  const days = Number(v.workingDays) || 0

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({
          emi: Number(v.emi) || 0,
          recharge: Number(v.recharge) || 0,
          maintenance: Number(v.maintenance) || 0,
          // A month cannot have fewer than one working day, or the per-day
          // share becomes a whole month's costs landing on one shift.
          workingDays: Math.min(31, Math.max(1, days || 25)),
        })
      }}
    >
      <div className="field"><label htmlFor="emi">Bike EMI / month</label><div className="unit"><input id="emi" inputMode="numeric" placeholder="0" value={v.emi} onChange={set('emi')} /></div></div>
      <div className="field"><label htmlFor="recharge">Recharge / month</label><div className="unit"><input id="recharge" inputMode="numeric" placeholder="0" value={v.recharge} onChange={set('recharge')} /></div></div>
      <div className="field"><label htmlFor="maint">Upkeep / month</label><div className="unit"><input id="maint" inputMode="numeric" placeholder="0" value={v.maintenance} onChange={set('maintenance')} /></div></div>
      <div className="field"><label htmlFor="days">Working days / month</label><input id="days" inputMode="numeric" placeholder="25" value={v.workingDays} onChange={set('workingDays')} /></div>
      {(days < 1 || days > 31) && <p className="muted full">Working days is counted between 1 and 31; we'll use {Math.min(31, Math.max(1, days || 25))}.</p>}
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
