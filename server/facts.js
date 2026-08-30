// Mirrors src/insights.ts so the model only ever sees numbers computed here.
const perDayFixed = (m) => (m.emi + m.recharge + m.maintenance) / Math.max(1, m.workingDays)
const inr = (n) => '₹' + Math.round(n)

export function buildFacts(ledger) {
  const shifts = ledger.shifts
  const m = ledger.monthly
  const gross = shifts.reduce((a, s) => a + s.gross, 0)
  const fuel = shifts.reduce((a, s) => a + s.fuel, 0)
  const days = new Set(shifts.map((s) => s.date)).size
  const fixed = perDayFixed(m) * days
  const net = gross - fuel - fixed

  const slots = new Map()
  for (const s of shifts) {
    const cur = slots.get(s.slot) ?? { gross: 0, hours: 0 }
    slots.set(s.slot, { gross: cur.gross + s.gross - s.fuel, hours: cur.hours + s.hours })
  }
  const bySlot = [...slots.entries()]
    .map(([slot, v]) => ({ slot, hours: v.hours, perHourAfterPetrol: inr(v.hours ? v.gross / v.hours : 0) }))
    .sort((a, b) => parseInt(b.perHourAfterPetrol.slice(1)) - parseInt(a.perHourAfterPetrol.slice(1)))

  return {
    week: {
      shifts: shifts.length,
      daysWorked: days,
      platforms: [...new Set(shifts.map((s) => s.platform))],
      gross: inr(gross),
      petrol: inr(fuel),
      shareOfMonthlyCosts: inr(fixed),
      kept: inr(net),
      percentGone: gross ? Math.round(((gross - net) / gross) * 100) : 0,
    },
    monthlyCosts: {
      bikeEmi: inr(m.emi),
      recharge: inr(m.recharge),
      upkeep: inr(m.maintenance),
      workingDays: m.workingDays,
      perWorkingDay: inr(perDayFixed(m)),
    },
    bySlot,
  }
}
