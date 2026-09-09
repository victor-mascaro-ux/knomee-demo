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

/* The three confidence bands, light → deep purple. */
const GAUGE_BANDS = ['#dcc8f2', '#a878df', '#6f2dc4']
/* Where each label parks the needle. The demo data only ever says "Strong";
   anything unrecognised points at the top band rather than off the dial. */
const GAUGE_LEVEL: Record<string, number> = { Weak: 0, Moderate: 1, Strong: 2 }

export function Gauge({ label }: { label: string }) {
  // A 180° dial of three wedges with a stubby grey needle under a white cap.
  // The wedges are filled annular sectors — flat radial ends, white gaps
  // between them — not round-capped strokes, which is what made the old dial
  // read as one continuous gradient.
  const cx = 60
  const cy = 60
  const rOuter = 50
  const rInner = 27
  const gap = 2.4 // degrees of white between wedges
  const step = 180 / GAUGE_BANDS.length

  const pt = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy - r * Math.sin(a)).toFixed(2)}`
  }
  const wedges = GAUGE_BANDS.map((fill, i) => {
    const from = 180 - i * step - gap / 2
    const to = 180 - (i + 1) * step + gap / 2
    return (
      <path
        key={i}
        d={
          `M ${pt(from, rOuter)} A ${rOuter} ${rOuter} 0 0 1 ${pt(to, rOuter)}` +
          ` L ${pt(to, rInner)} A ${rInner} ${rInner} 0 0 0 ${pt(from, rInner)} Z`
        }
        fill={fill}
      />
    )
  })

  // The needle sits at the middle of its band. It is drawn pointing straight
  // up, so the rotation is measured off 90°.
  const level = GAUGE_LEVEL[label] ?? GAUGE_BANDS.length - 1
  const angle = 180 - (level + 0.5) * step

  return (
    <span className="pp-gauge" aria-label={`Confidence: ${label}`}>
      <svg viewBox="0 0 120 70" width="112" height="65">
        {wedges}
        {/* The original teardrop needle: a long taper off a round bulb, with a
            pale pivot dot. */}
        <g transform={`rotate(${(90 - angle).toFixed(1)} ${cx} ${cy})`}>
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
