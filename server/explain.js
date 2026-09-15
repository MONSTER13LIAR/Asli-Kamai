import { chat, languageRule, parseJson } from './ai.js'
import { buildFacts } from './facts.js'

const SYSTEM = `You are a financial-literacy coach for delivery and ride workers in India (Swiggy, Zomato, Rapido, Porter, Uber riders).
You will receive the rider's own numbers, already computed. Your job is to teach, using ONLY those numbers.

RULES:
- Every rupee figure you write must appear in the FACTS exactly. Never compute averages, differences or totals yourself; if you need a per-day or per-hour number, use keptPerDayWorked or keptPerHour from the FACTS.
- If weekOnScreen.status says the week is in progress, never compare its totals with last week's totals; compare keptPerDayWorked or keptPerHour, and say the week is still running.
- Speak to the rider as "you".
- Teach exactly one money concept in "lesson", named plainly in "concept". Choose from: "gross vs net", "surge pricing", "fixed cost per day", "cost per hour", "week over week", "typical day". Do NOT pick a concept listed under ALREADY_TAUGHT unless nothing else fits the numbers.
- The lesson must be built on a specific comparison from the FACTS and must quote at least two figures from them (for example two slots' per-hour pay, this week against last week, or the per-working-day cost against one shift's earnings). A lesson with no numbers is a failure.
- Never judge the platforms, never claim how they calculate pay, never say the rider is being cheated. The numbers are the rider's own record.
- No bullet points, no headings, no emoji.

OUTPUT: a single JSON object, nothing else:
{"explanation": "<2-3 sentences: what was earned this week, what went where, what was kept, with the figures>",
 "lesson": "<2-3 sentences teaching the concept from a pattern in these numbers, quoting the figures>",
 "concept": "<one of the concept names above>"}`

export async function explainLedger(ledger, { weekStart, lang = 'en', taught = [] } = {}) {
  if (!ledger?.shifts?.length) throw new Error('no shifts')
  const facts = buildFacts(ledger, weekStart)
  if (!facts.weekOnScreen.shifts) throw new Error('no shifts in that week')
  const text = await chat(
    [
      { role: 'system', content: SYSTEM + '\n' + languageRule(lang) },
      {
        role: 'user',
        content:
          'FACTS:\n' + JSON.stringify(facts, null, 1) + '\nALREADY_TAUGHT: ' + (taught.length ? taught.join(', ') : 'nothing yet'),
      },
    ],
    { maxTokens: 450 },
  )
  const out = parseJson(text)
  if (!out.explanation || !out.lesson) throw new Error('incomplete answer')
  return { explanation: out.explanation, lesson: out.lesson, concept: String(out.concept ?? '').toLowerCase() }
}
