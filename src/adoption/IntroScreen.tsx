/* Between days: a dark screen over the app with the three weeks as two lanes
   (the main path, and under it, dashed, what happens if Alex invites no one),
   the day's name, and what happens in it. Continue opens the day. */

import { useEffect, useRef, type CSSProperties } from 'react'
import { ArrowIcon, Mark } from './icons'
import { COLS, DAYS } from './steps'

const Y = { main: 12, side: 96 }
const pct = (c: number) => ((c + 0.5) / COLS.length) * 100

function Lanes({ cur }: { cur: number }) {
  const day = DAYS[cur]
  const at = (c: number) => `${pct(c).toFixed(3)}%`
  const upTo = (c: number) => `${(100 - pct(c)).toFixed(3)}%`
  return (
    <div className={`tl2${day.lane === 'side' ? ' side-on' : ''}`} aria-hidden>
      <span className="ln main" style={{ left: at(0), right: upTo(5), top: Y.main - 1 }} />
      <span className="vln" style={{ left: at(0), top: Y.main, height: Y.side - Y.main }} />
      <span className="ln side" style={{ left: at(0), right: upTo(4), top: Y.side - 1 }} />
      {day.col > 0 && (
        <span
          className={`ln prog${day.lane === 'side' ? ' sideprog' : ''}`}
          style={{ left: at(0), right: upTo(day.col), top: Y[day.lane] - 1 }}
        />
      )}
      <span className="cap" style={{ left: at(5), top: Y.side }}>
        If Alex invites no one
      </span>
      {DAYS.map((d, k) => {
        const cls = [k === cur ? 'on' : k < cur ? 'past' : '', d.lane === 'side' ? 'side' : '']
          .filter(Boolean)
          .join(' ')
        const i = { '--i': k } as CSSProperties
        return [
          <span key={`n${k}`} className={`nd ${cls}`} style={{ ...i, left: at(d.col), top: Y[d.lane] }} />,
          <span key={`l${k}`} className={`lb ${cls}`} style={{ ...i, left: at(d.col), top: Y[d.lane] + 16 }}>
            <b>{COLS[d.col][0]}</b>
            <span>{COLS[d.col][1]}</span>
          </span>,
        ]
      })}
    </div>
  )
}

export default function IntroScreen({
  day,
  leaving,
  onContinue,
}: {
  day: number
  leaving: boolean
  onContinue: () => void
}) {
  const d = DAYS[day]
  const go = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    go.current?.focus({ preventScroll: true })
  }, [day])
  return (
    <section
      className={`intro${d.lane === 'side' ? ' branch' : ''}${leaving ? ' leaving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-intro-h"
    >
      <div className="intro-inner">
        <Lanes cur={day} />
        <span className="intro-pill">{d.pill}</span>
        <h2 id="ad-intro-h">{d.head}</h2>
        <ol className="moments">
          {d.items.map(([when, what], k) => (
            <li key={when + k} style={{ '--i': k } as CSSProperties}>
              <span>{when}</span>
              <p>{what}</p>
            </li>
          ))}
        </ol>
        <button ref={go} className="intro-go" type="button" onClick={onContinue}>
          Continue <ArrowIcon />
        </button>
      </div>
      <div className="intro-mark">
        <Mark />
        knomee
      </div>
    </section>
  )
}
