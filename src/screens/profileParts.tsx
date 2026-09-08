/* The pieces the prospect and client profiles share.
   They were duplicated once, and the copies drifted — the client page ended up
   with a different confidence dial and a different badge entirely. Both screens
   now import these, so the two pages cannot diverge again. */

import bgConfidence from '../assets/badges/confidence.svg'
import bgFinancialJoy from '../assets/badges/financial-joy.svg'
import bgFutureYou from '../assets/badges/future-you.svg'
import bgGoals from '../assets/badges/goals.svg'
import bgOutlook from '../assets/badges/outlook.svg'

export function ReadinessBars({ level }: { level: number }) {
  return (
    <span className="pp-bars" aria-label={`Readiness ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`pp-bar ${i <= level ? 'on' : ''}`} style={{ height: 5 + i * 2.4 }} />
      ))}
    </span>
  )
}

export function Gauge({ label }: { label: string }) {
  // A segmented 180° dial (light → deep purple bands) with a grey teardrop
  // needle, matching the product's confidence gauge.
  const cx = 60
  const cy = 60
  const r = 42
  // Three confidence levels (Weak → Moderate → Strong), light → deep purple.
  const colors = ['#dcc8f2', '#a878df', '#6f2dc4']
  const pt = (deg: number) => {
    const a = (deg * Math.PI) / 180
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const
  }
  const step = 180 / colors.length
  const segs = colors.map((c, i) => {
    const start = 180 - i * step - 3
    const end = 180 - (i + 1) * step + 3
    const [x0, y0] = pt(start)
    const [x1, y1] = pt(end)
    return (
      <path
        key={i}
        d={`M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`}
        fill="none"
        stroke={c}
        strokeWidth="14"
        strokeLinecap="round"
      />
    )
  })
  return (
    <span className="pp-gauge" aria-label={`Confidence: ${label}`}>
      <svg viewBox="0 0 120 70" width="112" height="65">
        {segs}
        {/* Needle points into the "Strong" (rightmost) band. */}
        <g transform="rotate(48 60 60)">
          <path
            d="M60 27 C 55 42, 53 51, 53 57 A 7 7 0 1 0 67 57 C 67 51, 65 42, 60 27 Z"
            fill="#6f6a7c"
          />
          <circle cx="60" cy="57" r="2.6" fill="#cfc9d8" />
        </g>
      </svg>
    </span>
  )
}

/* The real badges, drawn by the brand: a star rosette carrying the adventure's
   own illustration, with its name and ADVENTURE COMPLETE already set on the
   curve. Nothing here is drawn in code — the artwork is the badge. */
const BADGE_ART: Record<string, string> = {
  'Financial Joy': bgFinancialJoy,
  Confidence: bgConfidence,
  Outlook: bgOutlook,
  'Future You': bgFutureYou,
  Goals: bgGoals,
}

export function BadgeMedallion({ label }: { label: string; icon?: string }) {
  const art = BADGE_ART[label]
  if (!art) return null
  return (
    <span className="pp-badge-disc">
      <img className="pp-badge-art" src={art} alt={`${label} — adventure complete`} />
    </span>
  )
}
