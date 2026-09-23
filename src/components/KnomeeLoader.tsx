/* The knomee mark turning and pulsing — the wait the Goals adventure shows
   while it draws up her goals — for any screen waiting on its data. */

import '../screens/goalsFlow.css'
import { MARK_PARTS } from '../screens/ClientExperienceScreen'

export default function KnomeeLoader({ title, note }: { title?: string; note?: string }) {
  return (
    <div className="gl-loading knomee-loader" role="status">
      <svg className="gl-mark" viewBox="0 0 288 288" width="104" height="104" aria-hidden>
        {MARK_PARTS.map((d, i) => (
          <g key={i} className={`gl-mark-spin gl-mark-${i}`}>
            <path d={d} />
          </g>
        ))}
      </svg>
      {title && <h2 className="gl-hold">{title}</h2>}
      {note && <p>{note}</p>}
    </div>
  )
}
