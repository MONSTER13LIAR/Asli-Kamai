import { useState } from 'react'
import { planGoal } from './insights'
import { useLang } from './lang'
import { type Goal as GoalT, type Ledger, addDays, formatDate, inr, isoDay } from './model'
import { clean, slotName } from './ShiftForm'

// The goal card. Everything on it is the rider's own rate: what a typical
// day keeps, what the best slot pays an hour, and the bank deposit line that
// makes compounding a number instead of a word.

export function Goal({ ledger, setGoal, onAsk }: { ledger: Ledger; setGoal: (g: GoalT | null) => void; onAsk: (q: string) => void }) {
  const { lang, t } = useLang()
  const [editing, setEditing] = useState(false)
  const goal = ledger.goal ?? null

  if (!goal || editing) {
    return (
      <section className="card" aria-label={t('yourGoal')}>
        <h2>{goal ? t('edit') : t('setGoal')}</h2>
        {!goal && <p className="muted">{t('goalIntro')}</p>}
        <GoalForm
          value={goal}
          onSave={(g) => {
            setGoal(g)
            setEditing(false)
          }}
          onCancel={goal ? () => setEditing(false) : undefined}
        />
      </section>
    )
  }

  const plan = planGoal(goal, ledger)
  const hasRate = plan.typicalPerDay > 0
  const question =
    lang === 'hi'
      ? `मेरा लक्ष्य "${goal.name}" ${inr(goal.amount)} है, ${formatDate(goal.by)} तक। मेरे अपने आँकड़ों से यह कैसे पूरा हो?`
      : `My goal is "${goal.name}", ${inr(goal.amount)} by ${formatDate(goal.by)}. From my own numbers, how do I get there?`

  return (
    <section className="card goal" aria-label={t('yourGoal')}>
      <div className="goal-head">
        <div>
          <span className="eyebrow">{t('yourGoal')}</span>
          <h2>{goal.name}</h2>
        </div>
        <div className="goal-amount">
          {inr(goal.amount)}
          <small>{formatDate(goal.by)}</small>
        </div>
      </div>

      <div className="progress" role="progressbar" aria-valuenow={Math.round(plan.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: plan.progress * 100 + '%' }} />
      </div>
      <p className="sub">
        <b>{inr(goal.saved)}</b> {t('goalSaved').toLowerCase()} · <b>{plan.daysLeft}</b> {t('daysLeft')}
      </p>

      <div className="plan">
        <div className="stat">
          <b>{inr(plan.needPerDay)}</b>
          <span>{t('needPerDay')}</span>
        </div>
        {hasRate && (
          <div className="stat">
            <b>{inr(plan.typicalPerDay)}</b>
            <span>{t('typicalDay')}</span>
          </div>
        )}
        {plan.bestSlot && plan.bestPerHour > 0 && (
          <div className="stat">
            <b>{plan.hoursPerDay.toFixed(1)}h</b>
            <span>
              {slotName(plan.bestSlot, lang)} ({inr(plan.bestPerHour)}/h) {t('hoursAtBest')}
            </span>
          </div>
        )}
      </div>

      <p className={'verdict ' + (plan.onTrack ? 'ok' : 'warn')}>{hasRate ? (plan.onTrack ? t('onTrack') : t('stretch')) : t('noShiftsWeek')}</p>

      {plan.rdInterest > 0 && (
        <p className="rd">
          <span className="tag">{lang === 'hi' ? 'चक्रवृद्धि' : 'Compounding'}</span>
          {t('rdLine')} <b>{inr(plan.rdInterest)}</b>.
        </p>
      )}

      <div className="actions">
        <button className="btn" onClick={() => onAsk(question)}>{t('askAboutGoal')}</button>
      </div>
      <div className="goal-foot">
        <button className="link" onClick={() => setEditing(true)}>{t('edit')}</button>
        <button className="link quiet" onClick={() => window.confirm(lang === 'hi' ? 'लक्ष्य हटाएँ?' : 'Remove this goal?') && setGoal(null)}>{t('remove')}</button>
      </div>
    </section>
  )
}

function GoalForm({ value, onSave, onCancel }: { value: GoalT | null; onSave: (g: GoalT) => void; onCancel?: () => void }) {
  const { lang, t } = useLang()
  const [name, setName] = useState(value?.name ?? '')
  const [amount, setAmount] = useState(value ? String(value.amount) : '')
  const [by, setBy] = useState(value?.by ?? addDays(isoDay(), 60))
  const [saved, setSaved] = useState(value ? String(value.saved) : '0')
  const valid = Number(amount) > 0 && by > isoDay() && name.trim().length > 0

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onSave({ name: name.trim().slice(0, 40), amount: Number(amount), by, saved: Math.min(Number(saved) || 0, Number(amount)) })
      }}
    >
      <div className="field full">
        <label htmlFor="gname">{t('goalName')}</label>
        <input id="gname" value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === 'hi' ? 'नया फ़ोन' : 'New phone'} maxLength={40} />
      </div>
      <div className="field">
        <label htmlFor="gamount">{t('goalAmount')}</label>
        <div className="unit"><input id="gamount" inputMode="numeric" placeholder="12000" value={amount} onChange={(e) => setAmount(clean(e.target.value))} /></div>
      </div>
      <div className="field">
        <label htmlFor="gby">{t('goalBy')}</label>
        <input id="gby" type="date" value={by} min={addDays(isoDay(), 1)} onChange={(e) => setBy(e.target.value)} />
      </div>
      <div className="field full">
        <label htmlFor="gsaved">{t('goalSaved')}</label>
        <div className="unit"><input id="gsaved" inputMode="numeric" placeholder="0" value={saved} onChange={(e) => setSaved(clean(e.target.value))} /></div>
      </div>
      <div className="actions full">
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>{t('cancel')}</button>}
        <button type="submit" className="btn" disabled={!valid}>{t('save')}</button>
      </div>
    </form>
  )
}
