// Every rupee the model ever sees is computed here, on the server, from the
// rider's own ledger. The model writes; it never does the arithmetic. This file
// mirrors src/insights.ts so the app and the coach always agree on the figures.

const perDayFixed = (m) => (m.emi + m.recharge + m.maintenance) / Math.max(1, Math.min(31, Math.round(m.workingDays) || 1))
const inr = (n) => '₹' + Math.round(n)
const median = (xs) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

const asDate = (iso) => new Date(iso + 'T00:00:00')
export const isoDay = (d) => {
  const local = new Date(d)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().slice(0, 10)
}
// Weeks start on Monday, the way riders count them ("is hafte").
export const weekStartOf = (iso) => {
  const d = asDate(iso)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return isoDay(d)
}
export const addDays = (iso, n) => {
  const d = asDate(iso)
  d.setDate(d.getDate() + n)
  return isoDay(d)
}

export function summarize(shifts, monthly) {
  const gross = shifts.reduce((a, s) => a + s.gross, 0)
  const fuel = shifts.reduce((a, s) => a + s.fuel, 0)
  const days = new Set(shifts.map((s) => s.date)).size
  const fixed = perDayFixed(monthly) * days
  const net = gross - fuel - fixed
  const hours = shifts.reduce((a, s) => a + s.hours, 0)
  return { shifts: shifts.length, days, hours, gross, fuel, fixed, net, percentGone: gross ? Math.round(((gross - net) / gross) * 100) : 0 }
}

const groupBy = (shifts, key) => {
  const acc = new Map()
  for (const s of shifts) {
    const k = s[key]
    const cur = acc.get(k) ?? { afterPetrol: 0, hours: 0, shifts: 0 }
    acc.set(k, { afterPetrol: cur.afterPetrol + s.gross - s.fuel, hours: cur.hours + s.hours, shifts: cur.shifts + 1 })
  }
  return [...acc.entries()]
    .map(([name, v]) => ({ name, shifts: v.shifts, hours: v.hours, perHour: v.hours ? v.afterPetrol / v.hours : 0 }))
    .sort((a, b) => b.perHour - a.perHour)
}

const money = (w) => ({
  shifts: w.shifts,
  daysWorked: w.days,
  hoursWorked: Math.round(w.hours * 10) / 10,
  gross: inr(w.gross),
  petrol: inr(w.fuel),
  shareOfMonthlyCosts: inr(w.fixed),
  kept: inr(w.net),
  keptPerDayWorked: inr(w.days ? w.net / w.days : 0),
  keptPerHour: inr(w.hours ? w.net / w.hours : 0),
  percentGone: w.percentGone,
})

/**
 * Facts for one week (the one on screen) plus the context the coach needs to
 * compare and to plan: last week, all-time rates by slot and by app, the
 * rider's typical day, and the goal if one is set.
 */
export function buildFacts(ledger, weekStart) {
  const all = ledger.shifts
  const m = ledger.monthly
  const start = weekStart || weekStartOf(all.map((s) => s.date).sort().pop() || isoDay(new Date()))
  const end = addDays(start, 7)
  const inWeek = all.filter((s) => s.date >= start && s.date < end)
  const prevStart = addDays(start, -7)
  const inPrev = all.filter((s) => s.date >= prevStart && s.date < start)

  const week = summarize(inWeek, m)
  const prev = summarize(inPrev, m)

  // A typical day, from every day the rider has ever logged.
  const perDay = new Map()
  for (const s of all) perDay.set(s.date, (perDay.get(s.date) ?? 0) + s.gross - s.fuel)
  const typicalNetPerDay = perDay.size ? median([...perDay.values()]) - perDayFixed(m) : 0

  const bySlot = groupBy(all, 'slot').map((x) => ({ slot: x.name, shifts: x.shifts, hours: x.hours, perHourAfterPetrol: inr(x.perHour) }))
  const byApp = groupBy(all, 'platform').map((x) => ({ app: x.name, shifts: x.shifts, hours: x.hours, perHourAfterPetrol: inr(x.perHour) }))

  const today = isoDay(new Date())
  const inProgress = today >= start && today < end
  const facts = {
    today,
    weekOnScreen: {
      from: start,
      to: addDays(start, 6),
      status: inProgress ? `in progress: only ${week.days} day(s) logged so far, so totals are not comparable with a full week; compare keptPerDayWorked or keptPerHour instead` : 'complete',
      ...money(week),
    },
    lastWeek: inPrev.length ? { from: prevStart, to: addDays(prevStart, 6), ...money(prev) } : null,
    monthlyCosts: {
      bikeEmi: inr(m.emi),
      recharge: inr(m.recharge),
      upkeep: inr(m.maintenance),
      workingDays: Math.max(1, Math.min(31, Math.round(m.workingDays) || 1)),
      perWorkingDay: inr(perDayFixed(m)),
    },
    allTime: {
      shifts: all.length,
      daysWorked: perDay.size,
      typicalKeptPerDay: inr(typicalNetPerDay),
      comfortableDailySaving: inr(typicalNetPerDay / 3),
      bySlot,
      byApp,
    },
  }

  if (ledger.goal && ledger.goal.amount > 0 && ledger.goal.by) {
    const g = ledger.goal
    const daysLeft = Math.max(0, Math.round((asDate(g.by) - asDate(facts.today)) / 86400000))
    const remaining = Math.max(0, g.amount - (g.saved || 0))
    facts.goal = {
      name: g.name || 'goal',
      target: inr(g.amount),
      savedSoFar: inr(g.saved || 0),
      remaining: inr(remaining),
      by: g.by,
      daysLeft,
      neededPerDay: inr(daysLeft ? remaining / daysLeft : remaining),
      typicalKeptPerDay: inr(typicalNetPerDay),
      comfortableDailySaving: inr(typicalNetPerDay / 3),
      fitsComfortably: typicalNetPerDay > 0 && (daysLeft ? remaining / daysLeft : remaining) <= typicalNetPerDay / 3,
    }
  }
  return facts
}
