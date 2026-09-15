import { useEffect, useMemo, useRef, useState } from 'react'
import { useExplanation } from './ai'
import type { ParsedEntry } from './api'
import { Capture, type Mode } from './Capture'
import { DayBars, RateBars } from './Charts'
import { normalizeConcept } from './concepts'
import { byDay, bySlot, explain, inWeek, netForShift, summarize } from './insights'
import { useLang } from './lang'
import {
  type Ledger, type MonthlyCosts, type Progress, type Shift,
  addDays, dayOf, formatRange, hasSample, inr, monthOf, perDayFixed, progressOf, thisWeek, weekStartOf, weekdayOf, workingDays,
} from './model'
import { CostsForm, ShiftForm, slotName } from './ShiftForm'
import type { SyncState } from './store'

interface Props {
  ledger: Ledger
  setLedger: (l: Ledger) => void
  weekStart: string
  setWeekStart: (w: string) => void
  updateProgress: (fn: (p: Progress) => Progress) => void
  clearSample: () => void
  loadSample: () => void
  clear: () => void
  sync: SyncState
  signedIn: boolean
}

export function Home({ ledger, setLedger, weekStart, setWeekStart, updateProgress, clearSample, loadSample, clear, sync, signedIn }: Props) {
  const { lang, t } = useLang()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Shift | null>(null)
  const [prefill, setPrefill] = useState<ParsedEntry | null>(null)
  const [capture, setCapture] = useState<Mode | null>(null)
  const [editingCosts, setEditingCosts] = useState(false)
  const [undo, setUndo] = useState<{ shift: Shift; at: number } | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const weekShifts = useMemo(() => inWeek(ledger, weekStart), [ledger, weekStart])
  const week = useMemo(() => summarize(ledger, weekShifts), [ledger, weekShifts])
  const prevShifts = useMemo(() => inWeek(ledger, addDays(weekStart, -7)), [ledger, weekStart])
  const prev = useMemo(() => summarize(ledger, prevShifts), [ledger, prevShifts])
  const lines = useMemo(() => explain(ledger, weekShifts), [ledger, weekShifts])
  const days = useMemo(() => byDay(ledger, weekStart), [ledger, weekStart])
  const slots = useMemo(() => bySlot(ledger.shifts), [ledger.shifts])
  const taught = progressOf(ledger).concepts
  const ai = useExplanation(ledger, weekStart, lang, weekShifts.length > 0, taught)

  // A concept counts as learned the first time the coach builds a lesson on it.
  useEffect(() => {
    if (ai.status !== 'ready') return
    const id = normalizeConcept(ai.data.concept)
    if (id) updateProgress((p) => (p.concepts.includes(id) ? p : { ...p, concepts: [...p.concepts, id] }))
  }, [ai, updateProgress])

  const shifts = [...weekShifts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const isThisWeek = weekStart === thisWeek()
  const range = formatRange(weekStart, addDays(weekStart, 6))
  const showMonth = weekStart.slice(0, 7) !== addDays(weekStart, 6).slice(0, 7)

  const empty = ledger.shifts.length === 0
  const weekEmpty = weekShifts.length === 0
  const short = week.net < 0
  const delta = prevShifts.length ? week.net - prev.net : null

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
    const id = setTimeout(() => setUndo(null), 7000)
    return () => clearTimeout(id)
  }, [undo])

  const openForm = (shift: Shift | null, read: ParsedEntry | null = null) => {
    setEditing(shift)
    setPrefill(read)
    setAdding(true)
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }
  const closeForm = () => {
    setAdding(false)
    setEditing(null)
    setPrefill(null)
  }

  const saveShift = (s: Shift) => {
    setLedger({
      ...ledger,
      shifts: editing ? ledger.shifts.map((x) => (x.id === s.id ? s : x)) : [...ledger.shifts, s],
    })
    closeForm()
    // Show the week the shift landed in, so a late entry is never invisible.
    if (!editing) setWeekStart(weekStartOf(s.date))
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
    <>
      {capture && (
        <Capture
          mode={capture}
          onClose={() => setCapture(null)}
          onParsed={(e) => {
            setCapture(null)
            openForm(null, e)
          }}
        />
      )}

      {hasSample(ledger) && (
        <div className="sample-note">
          <span>
            <b>{t('sample')}</b> {t('sampleNote')}
          </span>
          <button className="link" onClick={clearSample}>{t('clearIt')}</button>
        </div>
      )}

      {empty ? (
        <section className="start" aria-label={t('startHere')}>
          <div className="eyebrow">{t('startHere')}</div>
          <h1>{t('startTitle')}</h1>
          <p>{t('startBody')}</p>
        </section>
      ) : (
        <section className="hero" aria-label={t('thisWeek')}>
          <div className="week-nav">
            <button className="week-btn" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">‹</button>
            <span className="eyebrow">
              {weekEmpty ? (isThisWeek ? t('thisWeek') : `${t('weekOf')} ${range}`) : short ? (isThisWeek ? t('shortThisWeek') : `${t('shortWeekOf')} ${range}`) : isThisWeek ? t('keptThisWeek') : `${t('keptWeekOf')} ${range}`}
            </span>
            <button className="week-btn" onClick={() => setWeekStart(addDays(weekStart, 7))} disabled={isThisWeek} aria-label="Next week">›</button>
          </div>
          {weekEmpty ? (
            <p className="sub">{t('noShiftsWeek')}</p>
          ) : (
            <>
              <div className={'kept' + (short ? ' is-short' : '')}>
                <span className="rupee">₹</span>
                {Math.abs(Math.round(week.net)).toLocaleString('en-IN')}
              </div>
              <p className="sub">
                {short ? (
                  <>
                    {t('spentMoreThan')} <b>{inr(week.gross)}</b> {t('youEarned')} · <span className="gone">{t('costs')} {inr(week.fuel + week.fixed)}</span>
                  </>
                ) : (
                  <>
                    <b>{inr(week.gross)}</b> {t('earned')} · <span className="gone">{Math.round(week.goneShare * 100)}% {t('gone')}</span> {t('beforeYouSawIt')}
                  </>
                )}
                {delta != null && (
                  <span className={'delta ' + (delta >= 0 ? 'up' : 'down')}>
                    {delta >= 0 ? '+' : '−'}
                    {inr(Math.abs(delta))} {t('vsLastWeek')}
                  </span>
                )}
              </p>
              <div className="bar" role="img" aria-label="Where this week's earnings went">
                <span className="fuel" style={{ width: pct(week.fuel) + '%' }} />
                <span className="emi" style={{ width: pct(emiPart) + '%' }} />
                <span className="recharge" style={{ width: pct(rechargePart) + '%' }} />
                <span className="kept" style={{ width: pct(Math.max(0, week.net)) + '%' }} />
              </div>
              <div className="legend">
                <span><i style={{ background: 'var(--fuel)' }} />{t('petrol')}<span className="v">{inr(week.fuel)}</span></span>
                <span><i style={{ background: 'var(--emi)' }} />{t('emi')}<span className="v">{inr(emiPart)}</span></span>
                <span><i style={{ background: 'var(--recharge)' }} />{t('rechargeUpkeep')}<span className="v">{inr(rechargePart)}</span></span>
                <span><i style={{ background: short ? 'var(--gone)' : 'var(--kept)' }} />{short ? t('short') : t('kept')}<span className="v">{inr(Math.abs(week.net))}</span></span>
              </div>
            </>
          )}
        </section>
      )}

      <div ref={formRef}>
        {adding ? (
          <ShiftForm key={editing?.id ?? prefill?.source ?? 'new'} initial={editing} prefill={prefill} onSave={saveShift} onCancel={closeForm} />
        ) : (
          <div className="quick">
            <button className="btn" onClick={() => openForm(null)}>{t('addShift')}</button>
            <button className="btn ghost icon" onClick={() => setCapture('voice')} title={t('sayIt')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
              {t('sayIt')}
            </button>
            <button className="btn ghost icon" onClick={() => setCapture('photo')} title={t('photo')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              {t('photo')}
            </button>
          </div>
        )}
      </div>

      {undo && (
        <div className="undo" role="status">
          <span>{lang === 'hi' ? 'शिफ्ट हटी।' : 'Shift removed.'}</span>
          <button className="link" onClick={undoRemove}>{lang === 'hi' ? 'वापस लाएँ' : 'Undo'}</button>
        </div>
      )}

      {!weekEmpty && (
        <section className="card explain" aria-label="Explanation" aria-busy={ai.status === 'loading'}>
          {ai.status === 'ready' ? (
            <>
              <span className="tag">{t('fromYourNumbers')} · {ai.data.concept || t('thisWeek')}</span>
              <p>{ai.data.explanation}</p>
              <p>{ai.data.lesson}</p>
            </>
          ) : (
            <>
              <span className="tag">{t('fromYourNumbers')}</span>
              {lines.map((l, i) => (
                <p key={i}>{l}</p>
              ))}
              {ai.status === 'loading' && <p className="muted">{t('writingLesson')}</p>}
              {ai.status === 'error' && <p className="muted">{t('coachOffline')}</p>}
            </>
          )}
        </section>
      )}

      {!weekEmpty && (
        <section className="card" aria-label={t('dayByDay')}>
          <h2>{t('dayByDay')}</h2>
          <DayBars days={days} />
        </section>
      )}

      {slots.filter((s) => s.hours > 0).length >= 2 && (
        <section className="card" aria-label={t('perHourBySlot')}>
          <h2>
            {t('perHourBySlot')} <small>{t('afterPetrol')}</small>
          </h2>
          <RateBars stats={slots.map((s) => ({ ...s, key: slotName(s.key, lang) }))} suffix={t('afterPetrol')} />
        </section>
      )}

      {!weekEmpty && (
        <section className="card" aria-label={t('shifts')}>
          <h2>{t('shifts')}</h2>
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
                      {slotName(s.slot, lang)} · {s.hours}h · {t('petrol').toLowerCase()} {inr(s.fuel)}
                      {s.source && <span className="src" title={s.source}>{s.source === 'photo' ? ' · 📷' : ' · 🎤'}</span>}
                    </small>
                  </button>
                </div>
                <div className="money">
                  <div className={'net' + (netForShift(s, ledger) < 0 ? ' is-short' : '')}>{inr(netForShift(s, ledger))}</div>
                  <div className="gross">{inr(s.gross)}</div>
                  <button className="del" onClick={() => removeShift(s)} aria-label={`Remove ${s.platform} shift on ${s.date}`}>
                    {t('remove').toLowerCase()}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card" aria-label={t('monthlyCosts')}>
        <h2>{t('monthlyCosts')}</h2>
        {editingCosts ? (
          <CostsForm value={ledger.monthly} onSave={saveCosts} onCancel={() => setEditingCosts(false)} />
        ) : (
          <>
            <div className="costs">
              <div className="cost"><span>{t('bikeEmi')}</span><b>{inr(m.emi)}</b></div>
              <div className="cost"><span>{t('recharge')}</span><b>{inr(m.recharge)}</b></div>
              <div className="cost"><span>{t('upkeep')}</span><b>{inr(m.maintenance)}</b></div>
            </div>
            <div className="costs-foot">
              <span>
                {lang === 'hi' ? (
                  <>{workingDays(m)} काम के दिनों में यह <b>{inr(perDayFixed(m))}</b> रोज़ है</>
                ) : (
                  <>Over {workingDays(m)} working days that is <b>{inr(perDayFixed(m))}</b> a day</>
                )}
              </span>
              <button className="btn ghost small" onClick={() => setEditingCosts(true)}>{t('edit')}</button>
            </div>
          </>
        )}
      </section>

      <p className="foot">
        {signedIn ? (sync === 'synced' ? t('savedBacked') : sync === 'syncing' ? t('backingUp') : sync === 'offline' ? t('backupRetry') : '') : t('savedPhone')}{' '}
        {ledger.shifts.length ? (
          <button onClick={() => window.confirm(lang === 'hi' ? 'इस फ़ोन से हर शिफ्ट और खर्च हटाएँ?' : 'Remove every shift and cost from this phone?') && clear()}>{t('clearAll')}</button>
        ) : (
          <button onClick={loadSample}>{t('loadSample')}</button>
        )}
      </p>
    </>
  )
}

