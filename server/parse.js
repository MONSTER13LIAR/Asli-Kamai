import { chat, parseJson, VISION_MODEL } from './ai.js'
import { isoDay } from './facts.js'

// Entry without typing: the rider says what happened ("Zomato shaam ko chaar
// ghante, gyarah sau kamaya, nabbe ka petrol") or shows the earnings screen of
// the platform app, and the model fills the form. The rider still confirms
// every field before it is saved; nothing is banked on the model's word.

const PLATFORMS = ['Swiggy', 'Zomato', 'Rapido', 'Porter', 'Uber', 'Other']
const SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night']

const SHAPE = `Return ONE JSON object and nothing else:
{"platform": one of Swiggy|Zomato|Rapido|Porter|Uber|Other or null,
 "slot": one of Morning|Afternoon|Evening|Night or null,
 "hours": number of hours worked or null,
 "gross": total earnings in rupees as a plain number or null,
 "fuel": petrol spent in rupees as a plain number or null,
 "date": "YYYY-MM-DD" or null,
 "note": one short sentence on anything unclear, or ""}
Use null for anything not present. Never guess a number that is not there.`

const TEXT_SYSTEM = `You turn a delivery rider's spoken or typed note (Hindi, English or Hinglish) into a shift entry.
Number words in Hindi are common: "gyarah sau" = 1100, "nabbe" = 90, "dedh" = 1.5, "dhai" = 2.5, "saade chaar" = 4.5, "chaar ghante" = 4 hours, "shaam" = Evening, "subah" = Morning, "dopahar" = Afternoon, "raat" = Night, "kal" = yesterday, "aaj" = today.
"Kamaya"/"earned"/"mila" is gross. "Petrol"/"tel" is fuel.
${SHAPE}`

const IMAGE_SYSTEM = `This is a screenshot of an Indian delivery or ride app's earnings screen (Swiggy, Zomato, Rapido, Porter, Uber or similar).
Read the platform from the branding, the total earnings for the day (not a single order), the login/online hours if shown, the date if shown, and the time of day if a slot or time range is shown (before 12 = Morning, 12-17 = Afternoon, 17-21 = Evening, after 21 = Night).
Petrol is never on these screens: fuel is null unless printed.
${SHAPE}`

const clampNum = (v, max) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/[^\d.]/g, '')) : NaN
  return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 10) / 10 : null
}

const clean = (raw, today) => {
  const platform = PLATFORMS.find((p) => p.toLowerCase() === String(raw.platform ?? '').toLowerCase()) ?? null
  const slot = SLOTS.find((s) => s.toLowerCase() === String(raw.slot ?? '').toLowerCase()) ?? null
  let date = typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : null
  if (date && date > today) date = null
  return {
    platform,
    slot,
    hours: clampNum(raw.hours, 24),
    gross: clampNum(raw.gross, 50000),
    fuel: clampNum(raw.fuel, 5000),
    date,
    note: typeof raw.note === 'string' ? raw.note.slice(0, 160) : '',
  }
}

export async function parseEntry({ text, image, today = isoDay(new Date()) }) {
  if (image) {
    if (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) throw new Error('bad image')
    if (image.length > 2_800_000) throw new Error('image too large')
    const out = await chat(
      [
        { role: 'system', content: IMAGE_SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Today is ${today}. Extract the shift.` },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      { model: VISION_MODEL, maxTokens: 220, temperature: 0 },
    )
    return { ...clean(parseJson(out), today), source: 'photo' }
  }
  if (typeof text !== 'string' || !text.trim()) throw new Error('nothing to read')
  const out = await chat(
    [
      { role: 'system', content: TEXT_SYSTEM },
      { role: 'user', content: `Today is ${today}.\nNOTE: ${text.trim().slice(0, 400)}` },
    ],
    { maxTokens: 220, temperature: 0 },
  )
  return { ...clean(parseJson(out), today), source: 'voice' }
}
