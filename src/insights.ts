import { type Ledger, type Shift, type Slot, perDayFixed } from './model'

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

/**
 * Plain-language explanation computed from the rider's own numbers.
 * This is the deterministic placeholder; the AI layer replaces it
 * with a generated lesson over the same inputs.
 */
export const explain = (ledger: Ledger): string[] => {
  const w = summarize(ledger)
  if (!ledger.shifts.length) return ['Add a shift and the explanation appears here.']
  const pct = Math.round(w.goneShare * 100)
  const lines = [
    `You earned ${fmt(w.gross)} this week, but ${fmt(w.fuel)} went to petrol and ${fmt(w.fixed)} was your share of EMI, recharge and upkeep for the ${w.days} days you worked. What you actually kept is ${fmt(w.net)}: ${pct}% was gone before you saw it. The first number is gross, the last is net.`,
  ]
  const slots = bySlot(ledger)
  if (slots.length > 1) {
    const best = slots[0]
    const worst = slots[slots.length - 1]
    const gain = worst.perHour ? Math.round(((best.perHour - worst.perHour) / worst.perHour) * 100) : 0
    lines.push(
      `${best.slot} shifts paid you ${fmt(best.perHour)} an hour after petrol; ${worst.slot} shifts paid ${fmt(worst.perHour)}. That is ${gain}% more for the same hour. Platforms pay more when orders outnumber riders, which is called surge pricing. Your own week shows when it happens.`,
    )
  }
  return lines
}

const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
