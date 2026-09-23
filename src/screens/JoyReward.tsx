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

export default function JoyReward({
  badge,
  from,
  done,
  total,
  next,
  onNext,
}: {
  badge: string
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
        <div className="jw-progress-bar">
          <svg className={`jw-check${moved ? ' is-on' : ''}`} viewBox="0 0 16 16" width="15" height="15" aria-hidden>
            <circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 1.6" />
            <path d="M5 8.2 7 10.2 11 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="jw-track">
            <i style={{ width: `${pct}%` }} />
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
        <img className="jw-badge" src={badge} alt="Financial Joy — adventure complete" />
      </div>

      <div className="jw-next">
        <p>Next adventure:</p>
        <button className="jw-next-btn" type="button" onClick={onNext}>
          {next}
        </button>
      </div>
    </div>
  )
}
