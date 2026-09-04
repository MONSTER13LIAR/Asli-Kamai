import { type Ledger, type Shift, type Slot, inr, perDayFixed, workingDays } from './model'

export interface WeekSummary {
  gross: number
  fuel: number
  fixed: number // prorated EMI + recharge + maintenance for the days worked
  net: number
  goneShare: number // 0..1
  days: number
}

const uniqueDays = (shifts: Shift[]) => new Set(shifts.map((s) => s.date)).size

export const summarize = (ledger: Ledger): WeekSummary => {
  const gross = ledger.shifts.reduce((a, s) => a + s.gross, 0)
  const fuel = ledger.shifts.reduce((a, s) => a + s.fuel, 0)
  const days = uniqueDays(ledger.shifts)
  const fixed = perDayFixed(ledger.monthly) * days
  const net = gross - fuel - fixed
  return { gross, fuel, fixed, net, goneShare: gross ? (gross - net) / gross : 0, days }
}

export const netForShift = (s: Shift, ledger: Ledger) => {
  // Fixed costs are shared across the shifts worked that day.
  const sameDay = ledger.shifts.filter((x) => x.date === s.date).length
  return s.gross - s.fuel - perDayFixed(ledger.monthly) / Math.max(1, sameDay)
}

export interface SlotStat {
  slot: Slot
  perHour: number
  hours: number
}

export const bySlot = (ledger: Ledger): SlotStat[] => {
  const acc = new Map<Slot, { gross: number; hours: number }>()
  for (const s of ledger.shifts) {
    const cur = acc.get(s.slot) ?? { gross: 0, hours: 0 }
    acc.set(s.slot, { gross: cur.gross + s.gross - s.fuel, hours: cur.hours + s.hours })
  }
  return [...acc.entries()]
    .map(([slot, v]) => ({ slot, perHour: v.hours ? v.gross / v.hours : 0, hours: v.hours }))
    .sort((a, b) => b.perHour - a.perHour)
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * Plain-language explanation computed from the rider's own numbers.
 * This is the deterministic placeholder; the AI layer replaces it
 * with a generated lesson over the same inputs.
 */
export const explain = (ledger: Ledger): string[] => {
  const w = summarize(ledger)
  if (!ledger.shifts.length) return ['Add a shift and the explanation appears here.']
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

  const slots = bySlot(ledger).filter((s) => s.hours > 0)
  const best = slots[0]
  const worst = slots[slots.length - 1]
  // Only worth teaching when two different slots both actually paid something.
  if (best && worst && best.slot !== worst.slot && worst.perHour > 0) {
    const gain = Math.round(((best.perHour - worst.perHour) / worst.perHour) * 100)
    lines.push(
      `${best.slot} shifts paid you ${inr(best.perHour)} an hour after petrol; ${worst.slot} shifts paid ${inr(worst.perHour)}. That is ${gain}% more for the same hour. Platforms pay more when orders outnumber riders, which is called surge pricing. Your own week shows when it happens.`,
    )
  } else if (best && best.hours > 0) {
    const perDay = perDayFixed(ledger.monthly)
    lines.push(
      `Your ${best.slot.toLowerCase()} shifts paid ${inr(best.perHour)} an hour after petrol. Your fixed costs run ${inr(perDay)} every working day, spread over ${plural(workingDays(ledger.monthly), 'day', 'days')} a month — so roughly the first ${(perDay / Math.max(1, best.perHour)).toFixed(1)} hours of a shift go to costs you owe whether you ride or not. Log a different time of day and the app can compare them for you.`,
    )
  }
  return lines
}
