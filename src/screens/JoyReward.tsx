/* The reward: the adventure's badge, handed over.
 *
 * The whole screen goes to it — the brand's plum, the badge springing in on a
 * burst of confetti — and above it the thing the badge is for: the My
 * Adventures progress bar moving on by one, 0 of 5 to 1 of 5, the count
 * ticking with it. Under it, what is next, as the one button there is.
 *
 * It covers the phone's screen rather than sitting in the page, because a
 * reward is an occasion and not a section.
 */

import icFinancialJoy from '../assets/adventures/financial-joy.svg'
import icConfidence from '../assets/adventures/confidence.svg'
import icOutlook from '../assets/adventures/outlook.svg'
import icFutureYou from '../assets/adventures/future-you.svg'
import icGoals from '../assets/adventures/goals.svg'
import icLifeEvents from '../assets/adventures/life-events.svg'
import { useEffect, useState } from 'react'
import './joyReward.css'

/* Confetti, laid out once: a seeded scatter so the burst is the same every
   time it is shown — a demo does not reshuffle between rooms. */
const COLOURS = ['#affc41', '#6bd6c4', '#ff9525', '#f25a7a', '#c77dff', '#ffe066', '#8ec5ff']
function seeded(n: number) {
  let s = 7
  const r = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  return Array.from({ length: n }, (_, i) => {
    const angle = r() * Math.PI * 2
    const dist = 90 + r() * 170
    return {
      i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.9 - 30,
      fall: 120 + r() * 220,
      spin: (r() - 0.5) * 900,
      delay: r() * 0.25,
      dur: 1.6 + r() * 1.4,
      w: 4 + r() * 5,
      h: r() > 0.55 ? 4 + r() * 4 : 10 + r() * 10,
      round: r() > 0.7,
      colour: COLOURS[Math.floor(r() * COLOURS.length)],
    }
  })
}
const PIECES = seeded(90)

/* The next adventure's own mark, on the button that goes to it — the same
   drawing its row wears on My Adventures. */
const NEXT_ICON: Record<string, string> = {
  'Financial Joy': icFinancialJoy,
  Confidence: icConfidence,
  Outlook: icOutlook,
  'Future You': icFutureYou,
  Goals: icGoals,
  'Life Events': icLifeEvents,
}

export default function JoyReward({
  badge,
  name = 'Financial Joy',
  from,
  done,
  total,
  next,
  onNext,
  arcTitle,
}: {
  /** Lettering for the badge's top arc, for a badge drawn without its own —
      the advisor's Practice Joy wears the Financial Joy art under its own
      name. Set in the page's type, so it matches the arc underneath. */
  arcTitle?: string
  badge: string
  /** The adventure the badge is for. */
  name?: string
  /** Adventures complete before this one — the same as `done` when it was
      being taken again, and the bar has nothing to move. */
  from: number
  /** Adventures complete, this one included. */
  done: number
  total: number
  /** The adventure that is next. */
  next: string
  onNext: () => void
}) {
  /* The bar starts where it was, one behind, and moves on once the screen is
     up — the change is the point, so it has to be seen happening. */
  const [moved, setMoved] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setMoved(true), 450)
    return () => window.clearTimeout(t)
  }, [])
  const shown = moved ? done : from
  const pct = Math.round((shown / total) * 100)

  return (
    <div className="jw" role="dialog" aria-label="Adventure complete">
      <div className="jw-progress">
        <div className="jw-progress-line">
          <span>Progress</span>
          <span>
            <b key={shown} className="jw-count">
              {shown}
            </b>
            /{total} Adventures Completed
          </span>
        </div>
        {/* The same five segments as My Adventures: the ones done before
            are there already, and this one fills in once the screen is up. */}
        <div className="jw-progress-bar">
          <span className="jw-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={shown}>
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`jw-seg${i < from ? ' is-on' : ''}${i >= from && i < shown ? ' is-on is-new' : ''}`}
                style={{ ['--i' as string]: i }}
              >
                <i />
              </span>
            ))}
          </span>
          <span className="jw-pct">{pct}%</span>
        </div>
      </div>

      <div className="jw-stage">
        {/* The burst: every piece flies out from behind the badge, tumbles,
            and falls away. */}
        <div className="jw-confetti" aria-hidden>
          {PIECES.map((p) => (
            <i
              key={p.i}
              style={
                {
                  '--x': `${p.x}px`,
                  '--y': `${p.y}px`,
                  '--fall': `${p.fall}px`,
                  '--spin': `${p.spin}deg`,
                  '--d': `${p.delay}s`,
                  '--t': `${p.dur}s`,
                  width: p.w,
                  height: p.h,
                  background: p.colour,
                  borderRadius: p.round ? '50%' : 2,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <span className="jw-halo" aria-hidden />
        {arcTitle ? (
          /* The lettering rides inside the badge's own box, so it spins in and
             floats with the art rather than beside it. */
          <div className="jw-badge jw-badge-titled" role="img" aria-label={`${name} — adventure complete`}>
            <img src={badge} alt="" />
            <svg viewBox="0 0 1000 1000" aria-hidden>
              <path id="jw-arc" d="M 150 520 A 350 350 0 0 1 850 520" fill="none" />
              <text className="jw-arc-text">
                <textPath href="#jw-arc" startOffset="50%" textAnchor="middle">
                  {arcTitle.toUpperCase()}
                </textPath>
              </text>
            </svg>
          </div>
        ) : (
          <img className="jw-badge" src={badge} alt={`${name} — adventure complete`} />
        )}
      </div>

      <div className="jw-next">
        <p>Next adventure:</p>
        <button className="jw-next-btn" type="button" onClick={onNext}>
          {NEXT_ICON[next] && <img className="jw-next-ic" src={NEXT_ICON[next]} alt="" />}
          {next}
        </button>
      </div>
    </div>
  )
}
