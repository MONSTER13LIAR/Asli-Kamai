import type { Lang } from './api'

// The money ideas the app teaches. A concept is "learned" the first time the
// coach builds a lesson on it from the rider's own numbers, or, for
// compounding, the first time the goal card shows what a deposit adds.
export interface Concept {
  id: string
  name: Record<Lang, string>
  line: Record<Lang, string>
}

export const CONCEPTS: Concept[] = [
  {
    id: 'gross vs net',
    name: { en: 'Gross vs net', hi: 'कमाई बनाम बचत' },
    line: { en: 'The number on the app is what you earned. What you keep after petrol and your EMI share is a different, smaller number.', hi: 'ऐप का नंबर आपकी कमाई है। पेट्रोल और EMI का हिस्सा निकालने के बाद जो बचे, वह अलग और छोटा नंबर है।' },
  },
  {
    id: 'fixed cost per day',
    name: { en: 'Fixed cost per day', hi: 'हर दिन का तय खर्च' },
    line: { en: 'EMI, recharge and upkeep are owed whether you ride or not. Spread over your working days, they are a bill every morning starts with.', hi: 'EMI, रिचार्ज और मरम्मत देनी ही है, चाहे आप चलें या नहीं। काम के दिनों में बाँटें तो हर सुबह एक बिल से शुरू होती है।' },
  },
  {
    id: 'surge pricing',
    name: { en: 'Surge pricing', hi: 'सर्ज प्राइसिंग' },
    line: { en: 'When orders outnumber riders, the same hour pays more. Your own slots show when that happens for you.', hi: 'जब ऑर्डर राइडरों से ज़्यादा हों, वही घंटा ज़्यादा देता है। आपके अपने स्लॉट बताते हैं कि यह कब होता है।' },
  },
  {
    id: 'cost per hour',
    name: { en: 'Cost per hour', hi: 'हर घंटे की कीमत' },
    line: { en: 'Divide what a shift kept by its hours and shifts become comparable, whatever the app or the day.', hi: 'शिफ्ट की बचत को घंटों से भाग दें, तो हर शिफ्ट की तुलना हो सकती है, चाहे ऐप या दिन कोई भी हो।' },
  },
  {
    id: 'week over week',
    name: { en: 'Week over week', hi: 'हफ्ते-दर-हफ्ते' },
    line: { en: 'One week is weather. Two weeks side by side is a trend you can act on.', hi: 'एक हफ्ता मौसम है। दो हफ्ते साथ रखें तो रुझान दिखता है जिस पर काम हो सके।' },
  },
  {
    id: 'typical day',
    name: { en: 'A typical day', hi: 'एक आम दिन' },
    line: { en: 'Not your best day, not your worst: the middle one. Plans built on it hold.', hi: 'न सबसे अच्छा दिन, न सबसे बुरा: बीच वाला। उस पर बनी योजना टिकती है।' },
  },
  {
    id: 'compounding',
    name: { en: 'Compounding', hi: 'चक्रवृद्धि ब्याज' },
    line: { en: 'Money set aside earns a little, and next month that little earns too. The habit matters more than the rate.', hi: 'अलग रखा पैसा थोड़ा कमाता है, और अगले महीने वह थोड़ा भी कमाता है। दर से ज़्यादा आदत मायने रखती है।' },
  },
]

/** Map whatever the model called the concept onto one of ours, or null. */
export const normalizeConcept = (raw: string): string | null => {
  const s = raw.toLowerCase()
  if (/gross|net/.test(s)) return 'gross vs net'
  if (/fixed|per day|daily cost/.test(s)) return 'fixed cost per day'
  if (/surge|demand|time of day|evening/.test(s)) return 'surge pricing'
  if (/per hour|hourly/.test(s)) return 'cost per hour'
  if (/week/.test(s)) return 'week over week'
  if (/typical|median|average/.test(s)) return 'typical day'
  if (/compound|interest|deposit/.test(s)) return 'compounding'
  return null
}
