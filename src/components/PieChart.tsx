/* The design system's pie (README, "Pie charts are one style"): the pie at
   168px with its legend beside it, each row its swatch (or the thing's own
   picture), its label, and its share at the right edge. Pointing at a slice
   or its row pops that slice out from the centre, with a drop shadow, over
   its neighbours, and lights the row. A picked slice (a filter) stays out
   and the rest dim. The Clients dashboard's confidence pie and My Prospects'
   Actionable Insights are both this; a new pie is too. */

import { useState, type ReactNode } from 'react'

export interface PieSlice {
  label: string
  value: number
  color: string
  /** Drawn in the legend in place of the swatch (a mood's face, say). */
  icon?: ReactNode
}

/* A 100 box: the pie's radius leaves room for the slice to pop out. */
const C = 50
const R = 46
const POP = 4

/** A slice from angle a0 to a1, radians clockwise from twelve o'clock. */
function arc(a0: number, a1: number) {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    return `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C} ${C + R} A ${R} ${R} 0 1 1 ${C} ${C - R} Z`
  }
  const x = (a: number) => (C + R * Math.sin(a)).toFixed(2)
  const y = (a: number) => (C - R * Math.cos(a)).toFixed(2)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${C} ${C} L ${x(a0)} ${y(a0)} A ${R} ${R} 0 ${large} 1 ${x(a1)} ${y(a1)} Z`
}

export default function PieChart({
  slices,
  label,
  picked = null,
  onPick,
  className,
}: {
  slices: PieSlice[]
  /** What the pie shows, said for screen readers. */
  label: string
  /** The slice a filter has picked: it stays out. */
  picked?: number | null
  /** Picking a slice or its row (a filter). Without it, pointing only shows. */
  onPick?: (i: number) => void
  className?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const total = slices.reduce((a, s) => a + s.value, 0) || 1
  const out = hover ?? picked
  let acc = 0
  const geo = slices.map((s) => {
    const a0 = (acc / total) * Math.PI * 2
    acc += s.value
    const a1 = (acc / total) * Math.PI * 2
    const mid = (a0 + a1) / 2
    return { d: arc(a0, a1), dx: POP * Math.sin(mid), dy: -POP * Math.cos(mid) }
  })
  const pct = (v: number) => Math.round((v / total) * 100)
  const point = (i: number) => ({
    onMouseEnter: () => setHover(i),
    onMouseLeave: () => setHover((h) => (h === i ? null : h)),
    onClick: onPick ? () => onPick(i) : undefined,
  })
  const lifted = out !== null && slices[out] && slices[out].value > 0 ? out : null
  return (
    <div className={`pie-chart${onPick ? ' is-pickable' : ''}${className ? ` ${className}` : ''}`}>
      <svg className="pie" viewBox="0 0 100 100" role="img" aria-label={label}>
        {slices.map((s, i) =>
          s.value > 0 ? (
            <path
              key={s.label}
              d={geo[i].d}
              fill={s.color}
              className={`pie-slice${lifted === i ? ' is-under' : ''}${picked !== null && picked !== i ? ' dim' : ''}`}
              {...point(i)}
            />
          ) : null,
        )}
        {/* The slice that is out, drawn again last so it sits over its
            neighbours, its shadow on them. */}
        {lifted !== null && (
          <path
            key={`out-${lifted}`}
            className="pie-slice-out"
            d={geo[lifted].d}
            fill={slices[lifted].color}
            style={{ transform: `translate(${geo[lifted].dx.toFixed(2)}px, ${geo[lifted].dy.toFixed(2)}px)` }}
            aria-hidden
          />
        )}
      </svg>
      <ul className="pie-legend">
        {slices.map((s, i) => (
          <li key={s.label} className={`${out === i ? 'on' : ''}${picked === i ? ' is-sel' : ''}`} {...point(i)}>
            {s.icon ?? <span className="pie-swatch" style={{ background: s.color }} aria-hidden />}
            <span className="pie-label">{s.label}</span>
            <span className="pie-pct">{pct(s.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
