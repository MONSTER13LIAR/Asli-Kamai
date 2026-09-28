import { useEffect, useRef, useState } from 'react'
import { type ParsedEntry, api } from './api'
import { useLang } from './lang'
import { isoDay } from './model'
import Loader from './Loader'

// Entry without typing. The rider says the shift out loud or shows the
// earnings screen of the platform app; the model fills the form and the
// rider checks it before anything is saved.

export type Mode = 'voice' | 'photo'

interface Recognition extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}
type RecognitionCtor = new () => Recognition
const speechCtor = (): RecognitionCtor | null => {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

// Photos from a phone camera are 3-4 MB; the model needs nothing like that.
const shrink = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const max = 1280
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      const ctx = c.getContext('2d')
      if (!ctx) return reject(new Error('no canvas'))
      ctx.drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('could not read the photo'))
    }
    img.src = url
  })

const COPY = {
  voiceTitle: { en: 'Say the shift', hi: 'शिफ्ट बोलिए' },
  voiceHint: { en: 'Like: "Zomato evening, four hours, earned eleven hundred, petrol ninety."', hi: 'जैसे: "Zomato शाम को, चार घंटे, ग्यारह सौ कमाए, पेट्रोल नब्बे।"' },
  typeHint: { en: 'Or type it the way you would say it.', hi: 'या वैसे ही लिख दीजिए जैसे बोलते।' },
  listen: { en: 'Tap and speak', hi: 'दबाकर बोलिए' },
  listening: { en: 'Listening… tap to stop', hi: 'सुन रहा हूँ… रोकने के लिए दबाएँ' },
  noSpeech: { en: 'This browser cannot listen; type it instead.', hi: 'यह ब्राउज़र सुन नहीं सकता; लिख दीजिए।' },
  read: { en: 'Read it', hi: 'पढ़ो' },
  photoTitle: { en: 'Show the earnings screen', hi: 'कमाई की स्क्रीन दिखाइए' },
  photoHint: { en: 'A screenshot or a photo of today’s earnings in Swiggy, Zomato, Rapido, Porter or Uber. Petrol you add yourself.', hi: 'Swiggy, Zomato, Rapido, Porter या Uber में आज की कमाई का स्क्रीनशॉट या फ़ोटो। पेट्रोल आप खुद जोड़ेंगे।' },
  choose: { en: 'Choose a photo', hi: 'फ़ोटो चुनें' },
  reading: { en: 'Reading…', hi: 'पढ़ रहा हूँ…' },
  failed: { en: 'Could not read that. Try again, or add the shift by hand.', hi: 'पढ़ नहीं पाया। फिर कोशिश करें, या हाथ से जोड़ें।' },
  cancel: { en: 'Cancel', hi: 'रद्द' },
}

export function Capture({ mode, onParsed, onClose }: { mode: Mode; onParsed: (e: ParsedEntry) => void; onClose: () => void }) {
  const { lang } = useLang()
  const c = (k: keyof typeof COPY) => COPY[k][lang]
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const rec = useRef<Recognition | null>(null)
  const canListen = !!speechCtor()

  useEffect(() => () => rec.current?.stop(), [])

  const toggleListen = () => {
    if (listening) {
      rec.current?.stop()
      return
    }
    const Ctor = speechCtor()
    if (!Ctor) return
    const r = new Ctor()
    r.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    r.interimResults = true
    r.continuous = false
    r.onresult = (e) => {
      let s = ''
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript
      setText(s)
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    setError(null)
    setListening(true)
    r.start()
  }

  const submit = async (input: { text?: string; image?: string }) => {
    setBusy(true)
    setError(null)
    try {
      onParsed(await api.parse({ ...input, today: isoDay() }))
    } catch {
      setError(c('failed'))
    } finally {
      setBusy(false)
    }
  }

  const onFile = async (f: File | undefined) => {
    if (!f) return
    try {
      await submit({ image: await shrink(f) })
    } catch {
      setError(c('failed'))
    }
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="capture-title">
      <div className="sheet-card">
        <div className="sheet-head">
          <h2 id="capture-title">{mode === 'voice' ? c('voiceTitle') : c('photoTitle')}</h2>
          <button className="link" onClick={onClose}>{c('cancel')}</button>
        </div>

        {mode === 'voice' ? (
          <>
            <p className="muted">{c('voiceHint')}</p>
            {canListen ? (
              <button className={'btn mic' + (listening ? ' is-live' : '')} onClick={toggleListen} disabled={busy}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
                {listening ? c('listening') : c('listen')}
              </button>
            ) : (
              <p className="muted">{c('noSpeech')}</p>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={c('typeHint')}
              rows={3}
              aria-label={c('typeHint')}
            />
            <div className="actions">
              <button className="btn" onClick={() => submit({ text })} disabled={busy || !text.trim()}>
                {busy ? c('reading') : c('read')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">{c('photoHint')}</p>
            <label className={'btn' + (busy ? ' is-busy' : '')}>
              {busy ? c('reading') : c('choose')}
              <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </>
        )}
        {busy && <Loader kind="boy" label={c('reading')} />}
        {error && <p className="muted err">{error}</p>}
      </div>
    </div>
  )
}
