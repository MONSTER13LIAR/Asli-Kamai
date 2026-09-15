import { useState } from 'react'
import { type Quiz, api } from './api'
import { CONCEPTS } from './concepts'
import { useLang } from './lang'
import { type Ledger, type Progress, formatDate, progressOf } from './model'

// The Learn tab: what the coach has taught so far, and a two-question quiz
// on this week's own numbers. The answers are computed on the server; the
// rider has to do the arithmetic before tapping.

export function Learn({ ledger, weekStart, updateProgress }: { ledger: Ledger; weekStart: string; updateProgress: (fn: (p: Progress) => Progress) => void }) {
  const { lang, t } = useLang()
  const progress = progressOf(ledger)
  const done = progress.quizzes.find((q) => q.week === weekStart)
  const hasShifts = ledger.shifts.length > 0

  return (
    <div className="learn">
      <section className="card" aria-label={t('conceptsLearned')}>
        <h2>{t('conceptsLearned')}</h2>
        <p className="muted">{t('conceptsIntro')}</p>
        <ul className="concepts">
          {CONCEPTS.map((c) => {
            const on = progress.concepts.includes(c.id)
            return (
              <li key={c.id} className={on ? 'is-on' : ''}>
                <span className="dot" aria-hidden="true">{on ? '✓' : ''}</span>
                <div>
                  <b>{c.name[lang]}</b>
                  <p>{on ? c.line[lang] : t('locked')}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card quiz" aria-label={t('weeklyQuiz')}>
        <h2>
          {t('weeklyQuiz')} <small>{t('weekOf')} {formatDate(weekStart)}</small>
        </h2>
        {hasShifts ? (
          <QuizFlow key={weekStart + lang} ledger={ledger} weekStart={weekStart} done={done} onDone={(score, total) => updateProgress((p) => ({ ...p, quizzes: [...p.quizzes.filter((q) => q.week !== weekStart), { week: weekStart, score, total }] }))} />
        ) : (
          <p className="muted">{t('noShiftsWeek')}</p>
        )}
      </section>
    </div>
  )
}

function QuizFlow({ ledger, weekStart, done, onDone }: { ledger: Ledger; weekStart: string; done?: { score: number; total: number }; onDone: (score: number, total: number) => void }) {
  const { lang, t } = useLang()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)

  const start = async () => {
    setLoading(true)
    setError(false)
    try {
      setQuiz(await api.quiz(ledger, { weekStart, lang }))
      setI(0)
      setPicked(null)
      setChecked(false)
      setScore(0)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (!quiz) {
    return (
      <>
        <p className="muted">{t('quizIntro')}</p>
        {done && (
          <p className="score">
            {done.score}/{done.total}
          </p>
        )}
        <button className="btn" onClick={start} disabled={loading}>
          {loading ? t('loadingQuiz') : done ? t('again') : t('startQuiz')}
        </button>
        {error && <p className="muted err">{t('coachOffline')}</p>}
      </>
    )
  }

  const q = quiz.questions[i]
  const finished = i >= quiz.questions.length
  if (finished) {
    return (
      <>
        <p className="score">
          {score}/{quiz.questions.length}
        </p>
        <p className="muted">{t('quizDone')}</p>
        <button className="btn ghost" onClick={() => setQuiz(null)}>{t('again')}</button>
      </>
    )
  }

  const check = () => {
    if (picked == null) return
    setChecked(true)
    if (picked === q.answer) setScore((s) => s + 1)
  }
  const next = () => {
    const last = i + 1 >= quiz.questions.length
    if (last) onDone(score, quiz.questions.length)
    setI(i + 1)
    setPicked(null)
    setChecked(false)
  }

  return (
    <div className="q">
      <span className="tag">
        {i + 1}/{quiz.questions.length} · {q.concept}
      </span>
      <p className="q-text">{q.question}</p>
      <div className="options" role="radiogroup">
        {q.options.map((o, k) => {
          const cls = ['option']
          if (picked === k) cls.push('is-picked')
          if (checked && k === q.answer) cls.push('is-right')
          if (checked && picked === k && k !== q.answer) cls.push('is-wrong')
          return (
            <button key={o} className={cls.join(' ')} role="radio" aria-checked={picked === k} onClick={() => !checked && setPicked(k)} disabled={checked}>
              {o}
            </button>
          )
        })}
      </div>
      {checked && (
        <p className="why">
          <b>{picked === q.answer ? t('correct') : t('wrong')}</b> {q.why}
        </p>
      )}
      <div className="actions">
        {checked ? (
          <button className="btn" onClick={next}>{t('next')}</button>
        ) : (
          <button className="btn" onClick={check} disabled={picked == null}>{t('check')}</button>
        )}
      </div>
    </div>
  )
}
