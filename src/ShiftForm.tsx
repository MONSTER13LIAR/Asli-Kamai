import { useState } from 'react'
import type { ParsedEntry } from './api'
import { useLang } from './lang'
import { type MonthlyCosts, type Platform, type Shift, type Slot, PLATFORMS, SLOTS, isoDay, uid } from './model'

// Digits only, so "12ab" can never be banked as ₹12 or silently as ₹0.
export const clean = (s: string) => s.replace(/[^\d]/g, '')
const cleanDecimal = (s: string) => s.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')

const COPY = {
  edit: { en: 'Edit shift', hi: 'शिफ्ट बदलें' },
  add: { en: 'Add a shift', hi: 'शिफ्ट जोड़ें' },
  fromVoice: { en: 'Read from what you said. Check it, then save.', hi: 'आपने जो कहा उससे पढ़ा। जाँचिए, फिर सेव करें।' },
  fromPhoto: { en: 'Read from your photo. Check it, add petrol, then save.', hi: 'आपकी फ़ोटो से पढ़ा। जाँचिए, पेट्रोल डालिए, फिर सेव करें।' },
  day: { en: 'Day', hi: 'दिन' },
  app: { en: 'App', hi: 'ऐप' },
  when: { en: 'When', hi: 'कब' },
  earned: { en: 'Earned', hi: 'कमाए' },
  petrol: { en: 'Petrol', hi: 'पेट्रोल' },
  hours: { en: 'Hours', hi: 'घंटे' },
  cancel: { en: 'Cancel', hi: 'रद्द' },
  saveChanges: { en: 'Save changes', hi: 'बदलाव सेव करें' },
  saveShift: { en: 'Save shift', hi: 'शिफ्ट सेव करें' },
  emiMonth: { en: 'Bike EMI / month', hi: 'बाइक EMI / महीना' },
  rechargeMonth: { en: 'Recharge / month', hi: 'रिचार्ज / महीना' },
  upkeepMonth: { en: 'Upkeep / month', hi: 'मरम्मत / महीना' },
  daysMonth: { en: 'Working days / month', hi: 'काम के दिन / महीना' },
  saveCosts: { en: 'Save costs', hi: 'खर्च सेव करें' },
  slot: { Morning: { en: 'Morning', hi: 'सुबह' }, Afternoon: { en: 'Afternoon', hi: 'दोपहर' }, Evening: { en: 'Evening', hi: 'शाम' }, Night: { en: 'Night', hi: 'रात' } },
}

export const slotName = (s: Slot, lang: 'en' | 'hi') => COPY.slot[s][lang]

export function ShiftForm({
  initial,
  prefill,
  onSave,
  onCancel,
}: {
  initial: Shift | null
  prefill: ParsedEntry | null
  onSave: (s: Shift) => void
  onCancel: () => void
}) {
  const { lang } = useLang()
  const c = (k: Exclude<keyof typeof COPY, 'slot'>) => COPY[k][lang]
  const [date, setDate] = useState(initial?.date ?? prefill?.date ?? isoDay())
  const [platform, setPlatform] = useState<Platform>(initial?.platform ?? prefill?.platform ?? 'Swiggy')
  const [slot, setSlot] = useState<Slot>(initial?.slot ?? prefill?.slot ?? 'Evening')
  const [hours, setHours] = useState(initial ? String(initial.hours) : prefill?.hours != null ? String(prefill.hours) : '4')
  const [gross, setGross] = useState(initial ? String(initial.gross) : prefill?.gross != null ? String(Math.round(prefill.gross)) : '')
  const [fuel, setFuel] = useState(initial ? String(initial.fuel) : prefill?.fuel != null ? String(Math.round(prefill.fuel)) : '')

  const valid = Number(gross) > 0 && Number(hours) > 0
  const got = (v: unknown) => (prefill && v != null ? ' is-read' : '')

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
          ...(initial?.source || prefill?.source ? { source: initial?.source ?? prefill?.source } : {}),
          // No sample flag is carried over: once the rider edits a demo shift
          // it is their own record, and it counts towards the sign-in wall.
        })
      }}
    >
      <div className="form-head full">
        <h2>{initial ? c('edit') : c('add')}</h2>
        {prefill && <p className="muted read-note">{prefill.source === 'photo' ? c('fromPhoto') : c('fromVoice')}{prefill.note ? ` ${prefill.note}` : ''}</p>}
      </div>
      <div className="field full">
        <label htmlFor="date">{c('day')}</label>
        <input id="date" type="date" value={date} max={isoDay()} onChange={(e) => setDate(e.target.value)} className={got(prefill?.date)} />
      </div>
      <div className="field">
        <label htmlFor="platform">{c('app')}</label>
        <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className={got(prefill?.platform)}>
          {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="slot">{c('when')}</label>
        <select id="slot" value={slot} onChange={(e) => setSlot(e.target.value as Slot)} className={got(prefill?.slot)}>
          {SLOTS.map((s) => <option key={s} value={s}>{slotName(s, lang)}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="gross">{c('earned')}</label>
        <div className="unit"><input id="gross" inputMode="numeric" placeholder="0" value={gross} onChange={(e) => setGross(clean(e.target.value))} autoFocus={!prefill} className={got(prefill?.gross)} /></div>
      </div>
      <div className="field">
        <label htmlFor="fuel">{c('petrol')}</label>
        <div className="unit"><input id="fuel" inputMode="numeric" placeholder="0" value={fuel} onChange={(e) => setFuel(clean(e.target.value))} autoFocus={prefill?.source === 'photo'} className={got(prefill?.fuel)} /></div>
      </div>
      <div className="field full">
        <label htmlFor="hours">{c('hours')}</label>
        <input id="hours" inputMode="decimal" value={hours} onChange={(e) => setHours(cleanDecimal(e.target.value))} className={got(prefill?.hours)} />
      </div>
      <div className="actions full">
        <button type="button" className="btn ghost" onClick={onCancel}>{c('cancel')}</button>
        <button type="submit" className="btn" disabled={!valid}>{initial ? c('saveChanges') : c('saveShift')}</button>
      </div>
    </form>
  )
}

export function CostsForm({ value, onSave, onCancel }: { value: MonthlyCosts; onSave: (m: MonthlyCosts) => void; onCancel: () => void }) {
  const { lang } = useLang()
  const c = (k: Exclude<keyof typeof COPY, 'slot'>) => COPY[k][lang]
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
      <div className="field"><label htmlFor="emi">{c('emiMonth')}</label><div className="unit"><input id="emi" inputMode="numeric" placeholder="0" value={v.emi} onChange={set('emi')} /></div></div>
      <div className="field"><label htmlFor="recharge">{c('rechargeMonth')}</label><div className="unit"><input id="recharge" inputMode="numeric" placeholder="0" value={v.recharge} onChange={set('recharge')} /></div></div>
      <div className="field"><label htmlFor="maint">{c('upkeepMonth')}</label><div className="unit"><input id="maint" inputMode="numeric" placeholder="0" value={v.maintenance} onChange={set('maintenance')} /></div></div>
      <div className="field"><label htmlFor="days">{c('daysMonth')}</label><input id="days" inputMode="numeric" placeholder="25" value={v.workingDays} onChange={set('workingDays')} /></div>
      {(days < 1 || days > 31) && <p className="muted full">Working days is counted between 1 and 31; we'll use {Math.min(31, Math.max(1, days || 25))}.</p>}
      <div className="actions full">
        <button type="button" className="btn ghost" onClick={onCancel}>{c('cancel')}</button>
        <button type="submit" className="btn">{c('saveCosts')}</button>
      </div>
    </form>
  )
}
