import { buildFacts } from './facts.js'

const API = 'https://api.featherless.ai/v1/chat/completions'
const DEFAULT_MODEL = 'Qwen/Qwen3-30B-A3B-Instruct-2507'

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

const parse = (raw) => {
  const text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('model returned no JSON')
  return JSON.parse(text.slice(start, end + 1))
}

export async function explainLedger(ledger) {
  const key = process.env.FEATHERLESS_API_KEY
  if (!key) throw new Error('FEATHERLESS_API_KEY is not set')
  if (!ledger?.shifts?.length) throw new Error('no shifts')
  const model = process.env.FEATHERLESS_MODEL || DEFAULT_MODEL

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
  const data = await res.json()
  const out = parse(data.choices[0]?.message?.content ?? '')
  if (!out.explanation || !out.lesson) throw new Error('incomplete answer')
  return { explanation: out.explanation, lesson: out.lesson, concept: out.concept ?? '', model }
}
