/* The pieces the prospect and client profiles share.
   They were duplicated once, and the copies drifted — the client page ended up
   with a different confidence dial and a different badge entirely. Both screens
   now import these, so the two pages cannot diverge again. */

import icFinancialJoy from '../assets/adventures/financial-joy.svg'
import icFutureYou from '../assets/adventures/future-you.svg'
import icOutlook from '../assets/adventures/outlook.svg'
import bgConfidence from '../assets/badges/confidence.svg'
import bgFinancialJoy from '../assets/badges/financial-joy.svg'
import bgFutureYou from '../assets/badges/future-you.svg'
import bgGoals from '../assets/badges/goals.svg'
import bgOutlook from '../assets/badges/outlook.svg'

/* The five stages of the transtheoretical model, in order. The client app names
   the stage outright — "My readiness stage to my goal is: PREPARATION" — so the
   advisor's table names it too, rather than leaving them to count bars and
   translate. */
const TTM_STAGES = ['Pre-Contemplation', 'Contemplation', 'Preparation', 'Action', 'Maintenance']
/* The bars climb in colour as well as height, deep plum through to violet, so
   the ramp reads as progress. Unfilled steps keep the pale wash. */
const BAR_RAMP = ['#240446', '#4c1d95', '#7038c8', '#9b51e0', '#b57ceb']
const BAR_W = 5
const BAR_GAP = 1.5

export function ReadinessLevel({ level }: { level: number }) {
  const stage = TTM_STAGES[level - 1]
  const label = stage ? `Readiness: ${stage}, stage ${level} of 5` : 'Readiness not set'
  return (
    <span className="pp-readiness" title={stage ?? undefined} aria-label={label}>
      <span className="pp-bars" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`pp-bar ${i <= level ? 'on' : ''}`}
            style={{
              width: BAR_W,
              height: 4 + i * 2.8,
              ...(i <= level ? { background: BAR_RAMP[i - 1] } : null),
            }}
          />
        ))}
        {/* Marks the stage actually reached, so its position on the scale is
            readable without counting. */}
        {level > 0 && (
          <span
            className="pp-bar-mark"
            style={{ left: (level - 1) * (BAR_W + BAR_GAP) + BAR_W / 2 }}
          />
        )}
      </span>
    </span>
  )
}

/* Where each label parks the needle. The demo data only ever says "Strong";
   anything unrecognised points at the top band rather than off the dial. */
const GAUGE_LEVEL: Record<string, number> = { Weak: 0, Moderate: 1, Strong: 2 }
/* The needle vector is drawn already pointing 27.3° above horizontal — inside
   the "Strong" band — so it is rotated by the difference for the other two. */
const NEEDLE_ART_ANGLE = 27.3
/* Where the bulb's centre sits inside the needle's own 17x12 box, so it can be
   moved onto the dial's centre. */
const NEEDLE_PIVOT = { x: 4.605, y: 6.894 }

export function Gauge({ label }: { label: string }) {
  // The brand's Confidence Gauge, drawn from its own vectors: a 72x36 dial of
  // three 60° wedges (light → deep purple, sharing edges — no gaps) and a
  // separate needle whose bulb carries a white hole rather than a pale dot.
  const cx = 36
  const cy = 36
  const level = GAUGE_LEVEL[label] ?? 2
  // Band middles, measured off the left of the dial: 150° / 90° / 30°.
  const angle = 150 - level * 60
  const needle =
    `rotate(${(NEEDLE_ART_ANGLE - angle).toFixed(1)} ${cx} ${cy})` +
    ` translate(${(cx - NEEDLE_PIVOT.x).toFixed(3)} ${(cy - NEEDLE_PIVOT.y).toFixed(3)})`

  return (
    <span className="pp-gauge" aria-label={`Confidence: ${label}`}>
      {/* Taller than the dial so the bulb can hang below the baseline. */}
      <svg viewBox="0 0 72 42" width="58" height="34">
        <path
          d="M72 35.9999C72 29.6806 70.3366 23.4726 67.1769 17.9999C64.0173 12.5272 59.4727 7.98266 54 4.823L45 20.4115C47.7363 21.9913 50.0086 24.2636 51.5885 26.9999C53.1683 29.7363 54 32.8403 54 35.9999H72Z"
          fill="#7639A1"
        />
        <path
          d="M54 4.823C48.5273 1.66334 42.3193 7.53571e-08 36 0C29.6807 -7.53571e-08 23.4727 1.66342 18 4.82308L27 20.4115C29.7363 18.8317 32.8403 18 36 18C39.1597 18 42.2637 18.8316 45 20.4115L54 4.823Z"
          fill="#B98DDC"
        />
        <path
          d="M18 4.82308C12.5273 7.98274 7.98275 12.5272 4.82309 17.9999C1.66343 23.4726 2.0591e-06 29.6806 0 35.9999L18 35.9999C18 32.8402 18.8317 29.7363 20.4115 26.9999C21.9914 24.2636 24.2637 21.9914 27 20.4115L18 4.82308Z"
          fill="#E9D9F4"
        />
        <g transform={needle}>
          <path
            d="M16.0757 0.961386C16.226 0.785021 16.2577 0.536341 16.1563 0.327944C16.0432 0.0956357 15.7907 -0.0345688 15.5359 0.00800544L4.04027 1.92858C0.717702 2.48369 -1.0318 6.18253 0.646823 9.10312C2.31222 12.0007 6.34562 12.3735 8.51395 9.83036L16.0757 0.961386Z"
            fill="#747378"
          />
          <path
            d="M4.29615 4.46698C2.9558 4.63811 2.00795 5.8634 2.17908 7.20375C2.3502 8.54411 3.5755 9.49196 4.91585 9.32083C6.2562 9.14971 7.20405 7.92441 7.03293 6.58406C6.8618 5.2437 5.63651 4.29586 4.29615 4.46698Z"
            fill="white"
          />
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

/* Every key highlight is distilled from one adventure, so it wears that
   adventure's artwork rather than a generic line glyph: values and joy come out
   of Financial Joy, concerns and hopes out of Outlook, lifestyle and vision out
   of Future You. Two highlights share an icon where they share a source. */
const HIGHLIGHT_ART: Record<string, string> = {
  'financial-joy': icFinancialJoy,
  outlook: icOutlook,
  'future-you': icFutureYou,
}

export function HighlightIcon({ source }: { source: string }) {
  const art = HIGHLIGHT_ART[source]
  return <span className="pp-hl-icon">{art ? <img src={art} alt="" /> : null}</span>
}
