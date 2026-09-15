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
  source?: 'voice' | 'photo' // how the numbers got in, when not typed
}

export interface MonthlyCosts {
  emi: number
  recharge: number
  maintenance: number
  workingDays: number
}

/** Something the rider is saving for: "new phone, ₹12,000 by Diwali". */
export interface Goal {
  name: string
  amount: number
  by: string // YYYY-MM-DD
  saved: number
}

/** What the coach has taught and how the weekly quizzes went. Synced with the ledger. */
export interface Progress {
  concepts: string[]
  quizzes: { week: string; score: number; total: number }[]
}

export interface Ledger {
  shifts: Shift[]
  monthly: MonthlyCosts
  goal?: Goal | null
  progress?: Progress
}

export const emptyProgress = (): Progress => ({ concepts: [], quizzes: [] })
export const progressOf = (l: Ledger): Progress => l.progress ?? emptyProgress()

// A month of costs never spreads over fewer than one working day.
export const workingDays = (m: MonthlyCosts) => Math.min(31, Math.max(1, Math.round(m.workingDays) || 1))

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

export const addDays = (iso: string, n: number) => {
  const d = asDate(iso)
  d.setDate(d.getDate() + n)
  return isoDay(d)
}
export const daysBetween = (from: string, to: string) => Math.round((asDate(to).getTime() - asDate(from).getTime()) / 86400000)

/** Monday of the week that holds `iso` — riders count weeks the way the platforms pay them. */
export const weekStartOf = (iso: string) => {
  const d = asDate(iso)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return isoDay(d)
}
export const thisWeek = () => weekStartOf(isoDay())

/** "4 Sept" · "29 – 31 Aug" · "29 Aug – 4 Sept" — never "29 – 4 Sept". */
export const formatRange = (first?: string, last?: string) => {
  if (!first || !last) return ''
  if (first === last) return `${dayOf(first)} ${monthOf(first)}`
  if (first.slice(0, 7) === last.slice(0, 7)) return `${dayOf(first)} – ${dayOf(last)} ${monthOf(last)}`
  return `${dayOf(first)} ${monthOf(first)} – ${dayOf(last)} ${monthOf(last)}`
}
export const formatDate = (iso: string) => asDate(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

// First run: no shifts, typical monthly costs to edit.
export const emptyLedger = (): Ledger => ({
  monthly: { emi: 0, recharge: 0, maintenance: 0, workingDays: 25 },
  shifts: [],
  goal: null,
  progress: emptyProgress(),
})

// Two weeks of one rider's life, laid out on real weekdays: all of last
// week (Monday to Sunday, with a rain day that went negative) and this week
// up to today. Evenings visibly out-earn mornings and this week is running
// ahead of last: enough real pattern for every lesson the app teaches.
// Flagged as sample so the app never mistakes the demo for the rider's record.
type Seed = [Platform, Slot, number, number, number]
const LAST_WEEK: Seed[][] = [
  [['Swiggy', 'Evening', 4, 940, 95]],
  [['Rapido', 'Morning', 3, 390, 90], ['Zomato', 'Evening', 4, 1010, 100]],
  [['Zomato', 'Afternoon', 2, 180, 60]], // rain
  [['Swiggy', 'Evening', 4.5, 1180, 110]],
  [['Swiggy', 'Night', 3, 820, 80]],
  [['Zomato', 'Evening', 4, 1060, 100]],
  [['Swiggy', 'Evening', 4, 1240, 100]],
]
const THIS_WEEK: Seed[][] = [
  [['Swiggy', 'Morning', 4, 640, 120], ['Swiggy', 'Evening', 3.5, 980, 90]],
  [['Zomato', 'Evening', 4, 1120, 110]],
  [['Rapido', 'Morning', 3, 410, 95], ['Swiggy', 'Night', 3, 860, 80]],
  [['Zomato', 'Afternoon', 5, 720, 140]],
  [['Swiggy', 'Evening', 4, 1240, 100]],
  [['Rapido', 'Morning', 2.5, 380, 70], ['Zomato', 'Evening', 4, 1090, 105]],
  [['Swiggy', 'Evening', 3, 910, 85]],
]
export const seedLedger = (): Ledger => {
  const today = isoDay()
  const monday = thisWeek()
  const place = (week: Seed[][], from: string) =>
    week.flatMap((day, i) => {
      const date = addDays(from, i)
      return date > today ? [] : day.map(([platform, slot, hours, gross, fuel]) => ({ id: uid(), date, platform, slot, hours, gross, fuel, sample: true as const }))
    })
  return {
    monthly: { emi: 3000, recharge: 299, maintenance: 500, workingDays: 25 },
    goal: { name: 'New phone', amount: 12000, by: addDays(today, 45), saved: 2500 },
    progress: emptyProgress(),
    shifts: [...place(LAST_WEEK, addDays(monday, -7)), ...place(THIS_WEEK, monday)],
  }
}

/** Shifts the rider actually logged — the sample week does not count. */
export const ownShifts = (l: Ledger) => l.shifts.filter((s) => !s.sample)
export const hasSample = (l: Ledger) => l.shifts.some((s) => s.sample)
