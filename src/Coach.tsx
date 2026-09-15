import { useEffect, useRef, useState } from 'react'
import { type ChatMessage, type Lang, api } from './api'
import { useLang } from './lang'
import type { Ledger } from './model'

// A conversation with the coach. The model only ever sees the computed facts
// for the ledger, so every answer is grounded in the rider's own record; the
// history lives in sessionStorage so a reload does not lose the thread.

const KEY = 'aslikamai.coach.v1'

const load = (): ChatMessage[] => {
  try {
    const m = JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as ChatMessage[]
    return Array.isArray(m) ? m : []
  } catch {
    return []
  }
}

const SUGGEST: Record<Lang, { withGoal: string[]; base: string[] }> = {
  en: {
    withGoal: ['Am I on track for my goal?'],
    base: ['Which app pays me best per hour?', 'Can I afford a ₹4,500 EMI on a new bike?', 'Was this week better than last week?', 'How many hours should I ride tomorrow to keep ₹800?'],
  },
  hi: {
    withGoal: ['क्या मैं अपने लक्ष्य की तरफ़ सही चल रहा हूँ?'],
    base: ['कौन सा ऐप हर घंटे सबसे ज़्यादा देता है?', 'क्या मैं नई बाइक की ₹4,500 EMI उठा सकता हूँ?', 'यह हफ्ता पिछले से बेहतर था?', 'कल ₹800 बचाने के लिए कितने घंटे चलाऊँ?'],
  },
}

export function Coach({ ledger, weekStart, seed, onSeedUsed }: { ledger: Ledger; weekStart: string; seed: string | null; onSeedUsed: () => void }) {
  const { lang, t } = useLang()
  const [messages, setMessages] = useState<ChatMessage[]>(load)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-30)))
    } catch {
      /* fine */
    }
    end.current?.scrollIntoView({ block: 'end' })
  }, [messages, busy])

  const ask = async (q: string) => {
    const question = q.trim()
    if (!question || busy) return
    const next = [...messages, { role: 'user' as const, content: question }]
    setMessages(next)
    setDraft('')
    setBusy(true)
    setError(null)
    try {
      const { reply } = await api.coach(ledger, next.slice(-8), { weekStart, lang })
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed')
      setMessages(messages)
      setDraft(question)
    } finally {
      setBusy(false)
    }
  }

  // The goal card hands over a question; ask it once, then forget it.
  useEffect(() => {
    if (!seed) return
    onSeedUsed()
    ask(seed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  const suggestions = [...(ledger.goal ? SUGGEST[lang].withGoal : []), ...SUGGEST[lang].base].slice(0, 4)

  return (
    <section className="coach" aria-label={t('coach')}>
      <div className="thread">
        <div className="msg bot intro">{t('coachIntro')}</div>
        {messages.map((m, i) => (
          <div key={i} className={'msg ' + (m.role === 'user' ? 'me' : 'bot')}>
            {m.content}
          </div>
        ))}
        {busy && <div className="msg bot thinking">{t('thinking')}</div>}
        {error && <p className="muted err">{t('coachOffline')}</p>}
        <div ref={end} />
      </div>

      {!messages.length && (
        <div className="chips" aria-label="Suggested questions">
          {suggestions.map((s) => (
            <button key={s} className="chip" onClick={() => ask(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="ask"
        onSubmit={(e) => {
          e.preventDefault()
          ask(draft)
        }}
      >
        <input ref={input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t('askPlaceholder')} aria-label={t('askPlaceholder')} disabled={busy} />
        <button className="btn send" type="submit" disabled={busy || !draft.trim()} aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </section>
  )
}
