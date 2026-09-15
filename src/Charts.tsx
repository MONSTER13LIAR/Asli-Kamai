import { inr, isoDay, weekdayOf } from './model'
import type { RateStat } from './insights'

// Two small, honest charts drawn by hand. One series each, so the accent
// colour carries the value and text stays in ink; a loss is the warning
// colour and labelled, never colour alone.

interface Day {
  date: string
  net: number
  worked: boolean
}

/** Seven columns for one week: what each day kept after petrol and the day's share of costs. */
export function DayBars({ days }: { days: Day[] }) {
  const W = 320
  const H = 120
  const pad = { top: 18, bottom: 22 }
  const max = Math.max(1, ...days.map((d) => Math.abs(d.net)))
  const hasLoss = days.some((d) => d.net < 0)
  const plotH = H - pad.top - pad.bottom
  const zero = pad.top + (hasLoss ? plotH * 0.72 : plotH)
  const scale = (hasLoss ? plotH * 0.72 : plotH) / max
  const colW = W / 7
  const barW = Math.min(30, colW - 10)
  const today = isoDay()
  const best = days.reduce((a, d) => (d.net > a.net ? d : a), days[0])

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="What each day of the week kept">
      <line x1="0" x2={W} y1={zero} y2={zero} className="axis" />
      {days.map((d, i) => {
        const x = i * colW + (colW - barW) / 2
        const h = Math.abs(d.net) * scale
        const y = d.net >= 0 ? zero - h : zero
        const label = weekdayOf(d.date).slice(0, 2)
        return (
          <g key={d.date} className={d.date === today ? 'is-today' : ''}>
            <title>
              {weekdayOf(d.date)}: {d.worked ? inr(d.net) : 'not logged'}
            </title>
            {d.worked ? (
              <rect x={x} y={y} width={barW} height={Math.max(2, h)} rx="3" className={d.net < 0 ? 'loss' : 'gain'} />
            ) : (
              <rect x={x} y={zero - 2} width={barW} height="2" rx="1" className="empty" />
            )}
            {d.worked && d === best && d.net > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="val">
                {inr(d.net)}
              </text>
            )}
            {d.worked && d.net < 0 && (
              <text x={x + barW / 2} y={zero + h + 12} textAnchor="middle" className="val loss-text">
                −{inr(-d.net)}
              </text>
            )}
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" className="lbl">
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Horizontal bars: per-hour after petrol for each slot or app, best first. */
export function RateBars<K extends string>({ stats, suffix }: { stats: RateStat<K>[]; suffix: string }) {
  const rows = stats.filter((s) => s.hours > 0).slice(0, 4)
  if (!rows.length) return null
  const max = Math.max(1, ...rows.map((r) => r.perHour))
  return (
    <div className="rates" role="img" aria-label={`Per hour ${suffix}`}>
      {rows.map((r) => (
        <div className="rate" key={r.key}>
          <span className="rate-key">{r.key}</span>
          <span className="rate-track">
            <span className={'rate-fill' + (r.perHour < 0 ? ' loss' : '')} style={{ width: Math.max(2, (Math.max(0, r.perHour) / max) * 100) + '%' }} />
          </span>
          <span className="rate-val">
            {inr(r.perHour)}
            <small>/h · {r.hours}h</small>
          </span>
        </div>
      ))}
    </div>
  )
}
