import type { Ledger } from '../src/model.ts'
import { bySlot, summarize } from '../src/insights.ts'

/**
 * Explain-my-pay. The rider's ledger comes in, the facts are computed here
 * (never by the model), and the model writes the explanation and one lesson
 * over exactly those facts. Runs as a Vercel function and inside `vite dev`.
 */

const API = 'https://api.featherless.ai/v1/chat/completions'
const DEFAULT_MODEL = 'Qwen/Qwen3-30B-A3B-Instruct-2507'

export interface Explanation {
  explanation: string
  lesson: string
  concept: string
  model: string
}

const SYSTEM = `You are a financial-literacy coach for delivery and ride workers in India (Swiggy, Zomato, Rapido, Porter, Uber riders).
You will receive the rider's own numbers for one week, already computed. Your job is to teach, using ONLY those numbers.

RULES:
- Every rupee figure you write must come from the FACTS. Never invent, estimate or round beyond what is given.
- Speak to the rider as "you". Simple everyday English a rider would use; short sentences. Common Hindi words like "hisaab", "kharcha", "bachat" are fine.
- Teach exactly one money concept in "lesson", named plainly in "concept" (e.g. "gross vs net", "surge pricing", "fixed cost per day", "cost per hour").
- The lesson must be built on a specific comparison from the FACTS and must quote at least two figures from them (for example two slots' per-hour pay, or the per-working-day cost against one shift's earnings). A lesson with no numbers is a failure.
- Never judge the platforms, never claim how they calculate pay, never say the rider is being cheated. The numbers are the rider's own record.
- No bullet points, no headings, no emoji.

OUTPUT: a single JSON object, nothing else:
{"explanation": "<2-3 sentences: what was earned, what went where, what was kept, with the figures>",
 "lesson": "<2-3 sentences teaching the concept from a pattern in these numbers, quoting the figures>",
 "concept": "<2-4 words>"}`

const inr = (n: number) => '₹' + Math.round(n)

export const buildFacts = (ledger: Ledger) => {
  const w = summarize(ledger)
  const m = ledger.monthly
  const slots = bySlot(ledger).map((s) => ({ slot: s.slot, hours: s.hours, perHourAfterPetrol: inr(s.perHour) }))
  const platforms = [...new Set(ledger.shifts.map((s) => s.platform))]
  return {
    week: {
      shifts: ledger.shifts.length,
      daysWorked: w.days,
      platforms,
      gross: inr(w.gross),
      petrol: inr(w.fuel),
      shareOfMonthlyCosts: inr(w.fixed),
      kept: inr(w.net),
      percentGone: Math.round(w.goneShare * 100),
    },
    monthlyCosts: {
      bikeEmi: inr(m.emi),
      recharge: inr(m.recharge),
      upkeep: inr(m.maintenance),
      workingDays: m.workingDays,
      perWorkingDay: inr((m.emi + m.recharge + m.maintenance) / Math.max(1, m.workingDays)),
    },
    bySlot: slots,
  }
}

const clean = (raw: string) => {
  const text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('model returned no JSON')
  return JSON.parse(text.slice(start, end + 1)) as Omit<Explanation, 'model'>
}

export async function explainLedger(ledger: Ledger, env: Record<string, string | undefined>): Promise<Explanation> {
  const key = env.FEATHERLESS_API_KEY
  if (!key) throw new Error('FEATHERLESS_API_KEY is not set')
  const model = env.FEATHERLESS_MODEL || DEFAULT_MODEL
  if (!ledger.shifts?.length) throw new Error('no shifts')

  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: 'FACTS:\n' + JSON.stringify(buildFacts(ledger), null, 1) },
      ],
    }),
  })
  if (!res.ok) throw new Error(`featherless ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = (await res.json()) as { choices: { message: { content: string } }[] }
  const out = clean(data.choices[0]?.message?.content ?? '')
  if (!out.explanation || !out.lesson) throw new Error('incomplete answer')
  return { explanation: out.explanation, lesson: out.lesson, concept: out.concept ?? '', model }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { ledger } = (await req.json()) as { ledger: Ledger }
    const out = await explainLedger(ledger, process.env)
    return Response.json(out)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
