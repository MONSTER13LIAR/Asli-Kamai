import { useCallback, useSyncExternalStore } from 'react'
import type { Lang } from './api'

// The rider picks Hindi or English once; the coach, the quiz and the main
// labels follow. Stored on the phone, next to the theme.
const KEY = 'aslikamai.lang'
const listeners = new Set<() => void>()

let current: Lang = (() => {
  try {
    return localStorage.getItem(KEY) === 'hi' ? 'hi' : 'en'
  } catch {
    return 'en'
  }
})()

const setLang = (l: Lang) => {
  current = l
  try {
    localStorage.setItem(KEY, l)
  } catch {
    /* fine */
  }
  document.documentElement.lang = l === 'hi' ? 'hi' : 'en'
  listeners.forEach((fn) => fn())
}

export function useLang() {
  const lang = useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => current,
    () => 'en' as Lang,
  )
  const toggle = useCallback(() => setLang(current === 'hi' ? 'en' : 'hi'), [])
  return { lang, toggle, t: (key: keyof typeof STRINGS) => STRINGS[key][lang] }
}

// UI copy in both languages. Numbers and app names are never translated.
export const STRINGS = {
  tagline: { en: 'your real take-home', hi: 'आपकी असली कमाई' },
  keptThisWeek: { en: 'Kept this week', hi: 'इस हफ्ते बचा' },
  shortThisWeek: { en: 'Short this week', hi: 'इस हफ्ते घाटा' },
  keptWeekOf: { en: 'Kept, week of', hi: 'बचा, हफ्ता' },
  shortWeekOf: { en: 'Short, week of', hi: 'घाटा, हफ्ता' },
  earned: { en: 'earned', hi: 'कमाए' },
  gone: { en: 'gone', hi: 'गए' },
  beforeYouSawIt: { en: 'before you saw it', hi: 'आपके देखने से पहले' },
  spentMoreThan: { en: 'you spent more than the', hi: 'खर्च कमाई से ज़्यादा:' },
  youEarned: { en: 'you earned', hi: 'कमाई' },
  costs: { en: 'costs', hi: 'खर्च' },
  petrol: { en: 'Petrol', hi: 'पेट्रोल' },
  emi: { en: 'EMI', hi: 'EMI' },
  rechargeUpkeep: { en: 'Recharge, upkeep', hi: 'रिचार्ज, मरम्मत' },
  kept: { en: 'Kept', hi: 'बचा' },
  short: { en: 'Short', hi: 'घाटा' },
  addShift: { en: 'Add a shift', hi: 'शिफ्ट जोड़ें' },
  sayIt: { en: 'Say it', hi: 'बोलकर' },
  photo: { en: 'Photo', hi: 'फ़ोटो' },
  shifts: { en: 'Shifts', hi: 'शिफ्ट' },
  monthlyCosts: { en: 'Monthly costs', hi: 'महीने के खर्च' },
  bikeEmi: { en: 'Bike EMI', hi: 'बाइक EMI' },
  recharge: { en: 'Recharge', hi: 'रिचार्ज' },
  upkeep: { en: 'Upkeep', hi: 'मरम्मत' },
  edit: { en: 'Edit', hi: 'बदलें' },
  fromYourNumbers: { en: 'From your own numbers', hi: 'आपके अपने आँकड़ों से' },
  writingLesson: { en: 'Writing your lesson…', hi: 'आपका सबक लिखा जा रहा है…' },
  coachOffline: { en: 'Coach is offline right now; the numbers above are still yours.', hi: 'कोच अभी उपलब्ध नहीं है; ऊपर के आँकड़े फिर भी आपके हैं।' },
  home: { en: 'Home', hi: 'होम' },
  coach: { en: 'Coach', hi: 'कोच' },
  learn: { en: 'Learn', hi: 'सीखें' },
  goal: { en: 'Goal', hi: 'लक्ष्य' },
  thisWeek: { en: 'This week', hi: 'इस हफ्ते' },
  lastWeek: { en: 'Last week', hi: 'पिछला हफ्ता' },
  weekOf: { en: 'Week of', hi: 'हफ्ता' },
  dayByDay: { en: 'Day by day', hi: 'दिन-ब-दिन' },
  perHourBySlot: { en: 'Per hour, by time of day', hi: 'हर घंटे, समय के हिसाब से' },
  afterPetrol: { en: 'after petrol', hi: 'पेट्रोल के बाद' },
  askCoach: { en: 'Ask the coach', hi: 'कोच से पूछें' },
  askPlaceholder: { en: 'Ask about your money…', hi: 'अपने पैसे के बारे में पूछें…' },
  coachIntro: { en: 'I only know your own numbers, and I answer from those. Ask me anything about them.', hi: 'मैं सिर्फ़ आपके अपने आँकड़े जानता हूँ और उन्हीं से जवाब देता हूँ। कुछ भी पूछिए।' },
  thinking: { en: 'Working it out…', hi: 'हिसाब लगा रहा हूँ…' },
  weeklyQuiz: { en: 'This week’s quiz', hi: 'इस हफ्ते का सवाल' },
  quizIntro: { en: 'Two questions, your own numbers. Work them out yourself before you tap.', hi: 'दो सवाल, आपके अपने आँकड़े। टैप करने से पहले खुद हिसाब लगाइए।' },
  startQuiz: { en: 'Start the quiz', hi: 'सवाल शुरू करें' },
  loadingQuiz: { en: 'Writing your questions…', hi: 'सवाल तैयार हो रहे हैं…' },
  check: { en: 'Check', hi: 'जाँचें' },
  next: { en: 'Next', hi: 'अगला' },
  correct: { en: 'Right.', hi: 'सही।' },
  wrong: { en: 'Not quite.', hi: 'नहीं।' },
  quizDone: { en: 'Quiz done', hi: 'सवाल पूरे' },
  again: { en: 'Try again', hi: 'फिर से' },
  conceptsLearned: { en: 'What you have learned', hi: 'जो आपने सीखा' },
  conceptsIntro: { en: 'Each idea unlocks the first time your own numbers make it real.', hi: 'हर बात तब खुलती है जब आपके अपने आँकड़े उसे सच बनाते हैं।' },
  locked: { en: 'Not yet', hi: 'अभी नहीं' },
  yourGoal: { en: 'Your goal', hi: 'आपका लक्ष्य' },
  setGoal: { en: 'Set a goal', hi: 'लक्ष्य तय करें' },
  goalIntro: { en: 'A phone, a helmet, Diwali at home. Put a number and a date on it and the app works out what it takes from your own rate.', hi: 'फ़ोन, हेलमेट, घर पर दिवाली। रकम और तारीख डालिए, ऐप आपकी अपनी कमाई से हिसाब लगाएगा।' },
  goalName: { en: 'What for', hi: 'किसलिए' },
  goalAmount: { en: 'Amount', hi: 'रकम' },
  goalBy: { en: 'By when', hi: 'कब तक' },
  goalSaved: { en: 'Saved so far', hi: 'अब तक बचाया' },
  save: { en: 'Save', hi: 'सेव करें' },
  cancel: { en: 'Cancel', hi: 'रद्द' },
  remove: { en: 'Remove', hi: 'हटाएँ' },
  daysLeft: { en: 'days left', hi: 'दिन बाकी' },
  needPerDay: { en: 'to set aside every day', hi: 'हर दिन अलग रखने हैं' },
  typicalDay: { en: 'you typically keep a day', hi: 'आप आम तौर पर एक दिन में बचाते हैं' },
  hoursAtBest: { en: 'of your best slot pays for it', hi: 'आपके सबसे अच्छे समय में इसकी कमाई हो जाती है' },
  onTrack: { en: 'Doable from your own numbers.', hi: 'आपके अपने आँकड़ों से यह हो सकता है।' },
  stretch: { en: 'A stretch at your current rate; the coach can help plan it.', hi: 'मौजूदा कमाई पर यह मुश्किल है; कोच इसकी योजना बनाने में मदद कर सकता है।' },
  rdLine: { en: 'Put the same amount in a bank recurring deposit each month and by the date it adds', hi: 'यही रकम हर महीने बैंक RD में रखें तो तारीख तक इतना और मिलेगा' },
  askAboutGoal: { en: 'Ask the coach about this goal', hi: 'कोच से इस लक्ष्य के बारे में पूछें' },
  sample: { en: 'Sample weeks.', hi: 'नमूना हफ्ते।' },
  sampleNote: { en: 'These are demo numbers, not yours.', hi: 'ये नमूने के आँकड़े हैं, आपके नहीं।' },
  clearIt: { en: 'Clear it', hi: 'हटाएँ' },
  startTitle: { en: 'What did you actually keep today?', hi: 'आज असल में कितना बचा?' },
  startBody: { en: 'Log what you earned and what petrol cost. Asli Kamai takes out your EMI, recharge and upkeep, shows the number that is really yours, and explains where the rest went.', hi: 'जो कमाया और जो पेट्रोल में गया, वह लिखिए। असली कमाई EMI, रिचार्ज और मरम्मत निकालकर बताती है कि सच में कितना आपका है, और बाकी कहाँ गया।' },
  startHere: { en: 'Start here', hi: 'यहाँ से शुरू करें' },
  loadSample: { en: 'Load two sample weeks', hi: 'नमूना हफ्ते लोड करें' },
  clearAll: { en: 'Clear everything', hi: 'सब हटाएँ' },
  savedPhone: { en: 'Saved on this phone only.', hi: 'सिर्फ़ इस फ़ोन पर सेव है।' },
  savedBacked: { en: 'Saved on this phone and backed up.', hi: 'इस फ़ोन पर सेव और बैकअप हो गया।' },
  backingUp: { en: 'Backing up…', hi: 'बैकअप हो रहा है…' },
  backupRetry: { en: 'Saved on this phone; backup will retry.', hi: 'फ़ोन पर सेव है; बैकअप फिर कोशिश करेगा।' },
  noShiftsWeek: { en: 'Nothing logged this week yet.', hi: 'इस हफ्ते अभी कुछ नहीं लिखा।' },
  vsLastWeek: { en: 'vs last week', hi: 'पिछले हफ्ते से' },
} as const
