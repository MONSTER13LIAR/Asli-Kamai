import {
  type Goal, type Ledger, type Platform, type Shift, type Slot,
  addDays, daysBetween, inr, isoDay, perDayFixed, weekStartOf, workingDays,
} from './model'

export interface WeekSummary {
  gross: number
  fuel: number
  fixed: number // prorated EMI + recharge + maintenance for the days worked
  net: number
  goneShare: number // 0..1
  days: number
  hours: number
  shifts: number
}

const uniqueDays = (shifts: Shift[]) => new Set(shifts.map((s) => s.date)).size

export const summarize = (ledger: Ledger, shifts: Shift[] = ledger.shifts): WeekSummary => {
  const gross = shifts.reduce((a, s) => a + s.gross, 0)
  const fuel = shifts.reduce((a, s) => a + s.fuel, 0)
  const hours = shifts.reduce((a, s) => a + s.hours, 0)
  const days = uniqueDays(shifts)
  const fixed = perDayFixed(ledger.monthly) * days
  const net = gross - fuel - fixed
  return { gross, fuel, fixed, net, goneShare: gross ? (gross - net) / gross : 0, days, hours, shifts: shifts.length }
}

/** Shifts that fall in the week starting on `weekStart` (Monday). */
export const inWeek = (ledger: Ledger, weekStart: string) => {
  const end = addDays(weekStart, 7)
  return ledger.shifts.filter((s) => s.date >= weekStart && s.date < end)
}

/** Every week that has a shift, newest first. */
export const weeksWithShifts = (ledger: Ledger) =>
  [...new Set(ledger.shifts.map((s) => weekStartOf(s.date)))].sort().reverse()

export const netForShift = (s: Shift, ledger: Ledger) => {
  // Fixed costs are shared across the shifts worked that day.
  const sameDay = ledger.shifts.filter((x) => x.date === s.date).length
  return s.gross - s.fuel - perDayFixed(ledger.monthly) / Math.max(1, sameDay)
}

export interface RateStat<K extends string> {
  key: K
  perHour: number
  hours: number
  shifts: number
}

const rates = <K extends string>(shifts: Shift[], pick: (s: Shift) => K): RateStat<K>[] => {
  const acc = new Map<K, { after: number; hours: number; shifts: number }>()
  for (const s of shifts) {
    const k = pick(s)
    const cur = acc.get(k) ?? { after: 0, hours: 0, shifts: 0 }
    acc.set(k, { after: cur.after + s.gross - s.fuel, hours: cur.hours + s.hours, shifts: cur.shifts + 1 })
  }
  return [...acc.entries()]
    .map(([key, v]) => ({ key, perHour: v.hours ? v.after / v.hours : 0, hours: v.hours, shifts: v.shifts }))
    .sort((a, b) => b.perHour - a.perHour)
}

export const bySlot = (shifts: Shift[]) => rates<Slot>(shifts, (s) => s.slot)
export const byPlatform = (shifts: Shift[]) => rates<Platform>(shifts, (s) => s.platform)

/** Net per calendar day for a week, all seven days, zero where nothing was logged. */
export const byDay = (ledger: Ledger, weekStart: string) => {
  const fixedPerDay = perDayFixed(ledger.monthly)
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const shifts = ledger.shifts.filter((s) => s.date === date)
    const gross = shifts.reduce((a, s) => a + s.gross, 0)
    const fuel = shifts.reduce((a, s) => a + s.fuel, 0)
    return { date, gross, net: shifts.length ? gross - fuel - fixedPerDay : 0, worked: shifts.length > 0 }
  })
}

/** Median of what the rider kept per day they worked, across the whole record. */
export const typicalNetPerDay = (ledger: Ledger) => {
  const perDay = new Map<string, number>()
  for (const s of ledger.shifts) perDay.set(s.date, (perDay.get(s.date) ?? 0) + s.gross - s.fuel)
  const xs = [...perDay.values()].sort((a, b) => a - b)
  if (!xs.length) return 0
  const mid = Math.floor(xs.length / 2)
  const med = xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2
  return med - perDayFixed(ledger.monthly)
}

export interface GoalPlan {
  daysLeft: number
  remaining: number
  needPerDay: number
  typicalPerDay: number
  shareOfDay: number // needPerDay / typicalPerDay
  hoursPerDay: number // at the best slot's rate
  bestSlot: Slot | null
  bestPerHour: number
  onTrack: boolean
  rdInterest: number // what a recurring deposit would add on top by the date
  progress: number // 0..1 saved so far
}

/**
 * The plan behind the goal card. Everything is the rider's own rate: the
 * typical day they keep, and their best slot's per-hour after petrol.
 * The recurring-deposit figure uses a bank RD at 6.5% a year, compounded
 * quarterly, on the monthly amount the goal needs — the lesson is that the
 * habit matters more than the rate, and the number shows it.
 */
export const planGoal = (goal: Goal, ledger: Ledger, today = isoDay()): GoalPlan => {
  const daysLeft = Math.max(0, daysBetween(today, goal.by))
  const remaining = Math.max(0, goal.amount - goal.saved)
  const needPerDay = daysLeft ? remaining / daysLeft : remaining
  const typicalPerDay = typicalNetPerDay(ledger)
  const slots = bySlot(ledger.shifts).filter((s) => s.hours > 0)
  const best = slots[0]
  const bestPerHour = best?.perHour ?? 0
  const months = daysLeft / 30.4
  const monthly = needPerDay * 30.4
  // RD: n monthly deposits, quarterly compounding, approximated as each
  // deposit earning simple-to-quarterly interest for its remaining months.
  let total = 0
  for (let k = 0; k < Math.floor(months); k++) {
    const yearsHeld = (months - k) / 12
    total += monthly * Math.pow(1 + 0.065 / 4, 4 * yearsHeld)
  }
  const rdInterest = Math.max(0, total - monthly * Math.floor(months))
  return {
    daysLeft,
    remaining,
    needPerDay,
    typicalPerDay,
    shareOfDay: typicalPerDay > 0 ? needPerDay / typicalPerDay : 1,
    hoursPerDay: bestPerHour > 0 ? needPerDay / bestPerHour : 0,
    bestSlot: best?.key ?? null,
    bestPerHour,
    onTrack: typicalPerDay > 0 && needPerDay <= typicalPerDay * 0.35,
    rdInterest,
    progress: goal.amount > 0 ? Math.min(1, goal.saved / goal.amount) : 0,
  }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * Plain-language explanation computed from the rider's own numbers.
 * This is the deterministic placeholder; the AI layer replaces it
 * with a generated lesson over the same inputs.
 */
export const explain = (ledger: Ledger, shifts: Shift[]): string[] => {
  const w = summarize(ledger, shifts)
  if (!shifts.length) return ['Add a shift and the explanation appears here.']
  const days = plural(w.days, 'day', 'days')
  const lines: string[] = []

  if (w.net < 0) {
    lines.push(
      `You earned ${inr(w.gross)} this week, but ${inr(w.fuel)} went to petrol and ${inr(w.fixed)} was your share of EMI, recharge and upkeep for the ${days} you worked. Together that is ${inr(w.fuel + w.fixed)} — more than you brought in, so the week is ${inr(-w.net)} short. Gross is what the app showed you; net is what is left, and this week it went below zero.`,
    )
  } else {
    lines.push(
      `You earned ${inr(w.gross)} this week, but ${inr(w.fuel)} went to petrol and ${inr(w.fixed)} was your share of EMI, recharge and upkeep for the ${days} you worked. What you actually kept is ${inr(w.net)}: ${Math.round(w.goneShare * 100)}% was gone before you saw it. The first number is gross, the last is net.`,
    )
  }

  const slots = bySlot(shifts).filter((s) => s.hours > 0)
  const best = slots[0]
  const worst = slots[slots.length - 1]
  // Only worth teaching when two different slots both actually paid something.
  if (best && worst && best.key !== worst.key && worst.perHour > 0) {
    const gain = Math.round(((best.perHour - worst.perHour) / worst.perHour) * 100)
    lines.push(
      `${best.key} shifts paid you ${inr(best.perHour)} an hour after petrol; ${worst.key} shifts paid ${inr(worst.perHour)}. That is ${gain}% more for the same hour. Platforms pay more when orders outnumber riders, which is called surge pricing. Your own week shows when it happens.`,
    )
  } else if (best && best.hours > 0) {
    const perDay = perDayFixed(ledger.monthly)
    lines.push(
      `Your ${best.key.toLowerCase()} shifts paid ${inr(best.perHour)} an hour after petrol. Your fixed costs run ${inr(perDay)} every working day, spread over ${plural(workingDays(ledger.monthly), 'day', 'days')} a month — so roughly the first ${(perDay / Math.max(1, best.perHour)).toFixed(1)} hours of a shift go to costs you owe whether you ride or not. Log a different time of day and the app can compare them for you.`,
    )
  }
  return lines
}
