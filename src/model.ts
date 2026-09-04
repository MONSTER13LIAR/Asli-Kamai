export type Platform = 'Swiggy' | 'Zomato' | 'Rapido' | 'Porter' | 'Uber' | 'Other'
export type Slot = 'Morning' | 'Afternoon' | 'Evening' | 'Night'

export const PLATFORMS: Platform[] = ['Swiggy', 'Zomato', 'Rapido', 'Porter', 'Uber', 'Other']
export const SLOTS: Slot[] = ['Morning', 'Afternoon', 'Evening', 'Night']

export interface Shift {
  id: string
  date: string // YYYY-MM-DD
  platform: Platform
  slot: Slot
  hours: number
  gross: number
  fuel: number
  sample?: boolean // came from the demo week, not from the rider
}

export interface MonthlyCosts {
  emi: number
  recharge: number
  maintenance: number
  workingDays: number
}

export interface Ledger {
  shifts: Shift[]
  monthly: MonthlyCosts
}

// A month of costs never spreads over fewer than one working day.
export const workingDays = (m: MonthlyCosts) => Math.max(1, Math.round(m.workingDays) || 1)

export const perDayFixed = (m: MonthlyCosts) =>
  (m.emi + m.recharge + m.maintenance) / workingDays(m)

export const inr = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN')

export const uid = () => Math.random().toString(36).slice(2, 9)

/**
 * The local calendar day, not the UTC one. A rider parking at 1am in India is
 * still logging tonight's shift; toISOString() would file it under yesterday.
 */
export const isoDay = (date: Date = new Date()) => {
  const local = new Date(date)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().slice(0, 10)
}

const asDate = (iso: string) => new Date(iso + 'T00:00:00')
export const monthOf = (iso: string) => asDate(iso).toLocaleDateString('en-IN', { month: 'short' })
export const dayOf = (iso: string) => asDate(iso).getDate()
export const weekdayOf = (iso: string) => asDate(iso).toLocaleDateString('en-IN', { weekday: 'short' })

/** "4 Sept" · "29 – 31 Aug" · "29 Aug – 4 Sept" — never "29 – 4 Sept". */
export const formatRange = (first?: string, last?: string) => {
  if (!first || !last) return ''
  if (first === last) return `${dayOf(first)} ${monthOf(first)}`
  if (first.slice(0, 7) === last.slice(0, 7)) return `${dayOf(first)} – ${dayOf(last)} ${monthOf(last)}`
  return `${dayOf(first)} ${monthOf(first)} – ${dayOf(last)} ${monthOf(last)}`
}

const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return isoDay(d)
}

// First run: no shifts, typical monthly costs to edit.
export const emptyLedger = (): Ledger => ({
  monthly: { emi: 0, recharge: 0, maintenance: 0, workingDays: 25 },
  shifts: [],
})

// One rider's week. Evenings visibly out-earn mornings: that pattern
// is the first lesson the app will teach. Flagged as sample so the app
// never mistakes the demo for the rider's own record.
export const seedLedger = (): Ledger => ({
  monthly: { emi: 3000, recharge: 299, maintenance: 500, workingDays: 25 },
  shifts: [
    { date: day(6), platform: 'Swiggy', slot: 'Morning', hours: 4, gross: 640, fuel: 120 },
    { date: day(6), platform: 'Swiggy', slot: 'Evening', hours: 3.5, gross: 980, fuel: 90 },
    { date: day(5), platform: 'Zomato', slot: 'Evening', hours: 4, gross: 1120, fuel: 110 },
    { date: day(4), platform: 'Rapido', slot: 'Morning', hours: 3, gross: 410, fuel: 95 },
    { date: day(4), platform: 'Swiggy', slot: 'Night', hours: 3, gross: 860, fuel: 80 },
    { date: day(3), platform: 'Zomato', slot: 'Afternoon', hours: 5, gross: 720, fuel: 140 },
    { date: day(2), platform: 'Swiggy', slot: 'Evening', hours: 4, gross: 1240, fuel: 100 },
    { date: day(1), platform: 'Rapido', slot: 'Morning', hours: 2.5, gross: 380, fuel: 70 },
    { date: day(1), platform: 'Zomato', slot: 'Evening', hours: 4, gross: 1090, fuel: 105 },
    { date: day(0), platform: 'Swiggy', slot: 'Evening', hours: 3, gross: 910, fuel: 85 },
  ].map((s) => ({ ...s, id: uid(), sample: true }) as Shift),
})

/** Shifts the rider actually logged — the sample week does not count. */
export const ownShifts = (l: Ledger) => l.shifts.filter((s) => !s.sample)
export const hasSample = (l: Ledger) => l.shifts.some((s) => s.sample)
