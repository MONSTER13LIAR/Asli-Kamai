import { chat, languageRule, parseJsonArray } from './ai.js'
import { buildFacts } from './facts.js'

// The quiz is the one place the rider has to do the arithmetic themselves.
// Every answer is computed here; the model only writes the question and the
// one-line explanation shown afterwards, so a quiz can never mark a right
// answer wrong.

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
const num = (s) => Number(String(s).replace(/[^\d.-]/g, ''))

const distinct = (xs) => [...new Set(xs)]

// Deterministic shuffle so the same week always shows the same order.
const order = (n, seed) => {
  const idx = [...Array(n).keys()]
  let x = seed || 1
  for (let i = n - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280
    const j = x % (i + 1)
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
}

const moneyOptions = (correct) => {
  const step = correct >= 1000 ? 100 : correct >= 200 ? 50 : 10
  const round = (v) => Math.max(step, Math.round(v / step) * step)
  const lo = round(correct * 0.6)
  const hi = round(correct * 1.5)
  const c = Math.round(correct)
  return distinct([c, lo === c ? c - step : lo, hi === c ? c + step : hi]).map(inr)
}

function seeds(facts) {
  const out = []
  const m = facts.monthlyCosts
  const perDay = num(m.perWorkingDay)
  if (perDay > 0) {
    out.push({
      id: 'fixed-per-day',
      concept: 'fixed cost per day',
      given: `Bike EMI ${m.bikeEmi}, recharge ${m.recharge}, upkeep ${m.upkeep} a month; ${m.workingDays} working days.`,
      ask: 'How much of every working day goes to these costs before the first order?',
      options: moneyOptions(perDay),
      answer: inr(perDay),
    })
  }
  const w = facts.weekOnScreen
  if (w.shifts > 0 && num(w.gross) > 0) {
    out.push({
      id: 'kept-this-week',
      concept: 'gross vs net',
      given: `This week you earned ${w.gross}, petrol was ${w.petrol}, and your share of monthly costs was ${w.shareOfMonthlyCosts}.`,
      ask: 'What did you actually keep?',
      options: moneyOptions(Math.max(1, num(w.kept))),
      answer: inr(num(w.kept)),
    })
  }
  const slots = facts.allTime.bySlot.filter((s) => s.hours > 0)
  if (slots.length >= 2 && slots[0].perHourAfterPetrol !== slots[1].perHourAfterPetrol) {
    out.push({
      id: 'best-slot',
      concept: 'surge pricing',
      given: slots.map((s) => `${s.slot}: ${s.perHourAfterPetrol} an hour after petrol`).join('; ') + '.',
      ask: 'Which time of day has paid you the most per hour?',
      options: slots.slice(0, 3).map((s) => s.slot),
      answer: slots[0].slot,
    })
  }
  if (facts.lastWeek && num(facts.lastWeek.gross) > 0) {
    const diff = num(w.kept) - num(facts.lastWeek.kept)
    out.push({
      id: 'week-over-week',
      concept: 'week over week',
      given: `Last week you kept ${facts.lastWeek.kept}; this week ${w.kept}.`,
      ask: 'How much more or less did you keep this week?',
      options: distinct([Math.round(diff), Math.round(diff) + 200, Math.round(diff) - 200]).map((n) => (n < 0 ? '−' : '+') + inr(Math.abs(n))),
      answer: (diff < 0 ? '−' : '+') + inr(Math.abs(diff)),
    })
  }
  return out
}

const SYSTEM = `You write one-line quiz questions for a delivery rider's own money. You are given, for each question, the GIVEN facts, what to ASK, and the ANSWER. Rewrite ASK as one clear question that includes every figure from GIVEN (the rider must be able to work it out from the question alone), and write WHY: one sentence explaining the answer with the working. Do not change any figure. No bullet points, no emoji.

OUTPUT: a JSON array only, one object per question, in the same order: [{"question": "...", "why": "..."}]`

export async function buildQuiz(ledger, { weekStart, lang = 'en' } = {}) {
  if (!ledger?.shifts?.length) throw new Error('no shifts')
  const facts = buildFacts(ledger, weekStart)
  const all = seeds(facts)
  if (!all.length) throw new Error('not enough data for a quiz')
  // Two questions a week: the fixed-cost one is always first, then the most
  // interesting of the rest.
  const picked = [all[0], ...all.slice(1).sort((a, b) => (a.id === 'best-slot' ? -1 : b.id === 'best-slot' ? 1 : 0))].slice(0, 2)

  let written = []
  try {
    const text = await chat(
      [
        { role: 'system', content: SYSTEM + '\n' + languageRule(lang) },
        {
          role: 'user',
          content: JSON.stringify(picked.map((q) => ({ GIVEN: q.given, ASK: q.ask, ANSWER: q.answer })), null, 1),
        },
      ],
      { maxTokens: 500 },
    )
    written = parseJsonArray(text)
  } catch {
    written = []
  }

  const seed = Number(facts.weekOnScreen.from.replace(/-/g, '')) || 1
  return {
    week: facts.weekOnScreen.from,
    questions: picked.map((q, i) => {
      const w = written[i] && typeof written[i].question === 'string' ? written[i] : null
      const idx = order(q.options.length, seed + i)
      const options = idx.map((j) => q.options[j])
      return {
        id: q.id,
        concept: q.concept,
        question: w?.question || `${q.given} ${q.ask}`,
        options,
        answer: options.indexOf(q.answer),
        why: w?.why || `The answer is ${q.answer}.`,
      }
    }),
  }
}
