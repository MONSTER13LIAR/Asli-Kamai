// One place that talks to the model. Every feature builds its own prompt,
// but the transport, the think-tag stripping and the JSON recovery are shared.

const API = 'https://api.featherless.ai/v1/chat/completions'
export const TEXT_MODEL = process.env.FEATHERLESS_MODEL || 'Qwen/Qwen3-30B-A3B-Instruct-2507'
export const VISION_MODEL = process.env.FEATHERLESS_VISION_MODEL || 'Qwen/Qwen3-VL-30B-A3B-Instruct'

export async function chat(messages, { model = TEXT_MODEL, maxTokens = 400, temperature = 0.2 } = {}) {
  const key = process.env.FEATHERLESS_API_KEY
  if (!key) throw new Error('FEATHERLESS_API_KEY is not set')
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, temperature, max_tokens: maxTokens, messages }),
  })
  if (!res.ok) throw new Error(`model ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? ''
  return raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

// The model is asked for JSON only, but a stray sentence before or after the
// object is common; take the outermost braces and parse those.
export const parseJson = (text) => {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('model returned no JSON')
  return JSON.parse(text.slice(start, end + 1))
}

export const parseJsonArray = (text) => {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start < 0 || end < start) throw new Error('model returned no JSON array')
  return JSON.parse(text.slice(start, end + 1))
}

// Riders read Hindi more comfortably than English. The UI stays bilingual;
// this is the rule handed to every prompt so the coach writes in the rider's
// language without changing anything else about what it says.
export const languageRule = (lang) =>
  lang === 'hi'
    ? 'LANGUAGE: Write in simple, everyday Hindi in Devanagari script, the respectful "आप" form, the way you would speak to a delivery rider in Delhi or Lucknow. Keep app names (Swiggy, Zomato, Rapido), the ₹ sign and all digits as they are. Short sentences.'
    : 'LANGUAGE: Write in plain English, short sentences, the way a rider would say it. At most one common Hindi word such as "hisaab" or "kharcha" is fine; never write a sentence in Hindi or Hinglish.'
