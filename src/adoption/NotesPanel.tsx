/* The steps beside the demo: Alex's three weeks, one line each (the day, then
   what happens), and under the current one what is going on and what to
   click. Picking a step goes to it. */

import { useLayoutEffect, useRef } from 'react'
import { Rich, TapIcon } from './icons'
import { STEPS } from './steps'

export default function NotesPanel({ idx, onGoto }: { idx: number; onGoto: (i: number) => void }) {
  const list = useRef<HTMLOListElement>(null)

  /* The rail fills down to the current step, which scrolls into view. */
  useLayoutEffect(() => {
    const ol = list.current
    const cur = ol?.querySelector<HTMLElement>('.tl-item.current')
    if (!ol || !cur) return
    ol.style.setProperty('--prog', `${Math.max(0, cur.offsetTop + 3)}px`)
    cur.scrollIntoView?.({ block: 'nearest' })
  }, [idx])

  return (
    <aside className="ad-notes" aria-label="The steps of the demo">
      <h2>Alex’s first 3 weeks</h2>
      <ol className="tl" ref={list}>
        {STEPS.map((s, i) => {
          const cls = ['tl-item', i === idx ? 'current' : i < idx && !s.branch ? 'past' : '', s.branch ? 'branch' : '']
            .filter(Boolean)
            .join(' ')
          return (
            <li key={s.id} className={cls}>
              <span className="tl-dot" aria-hidden />
              <button
                className="tl-btn"
                type="button"
                onClick={() => onGoto(i)}
                aria-current={i === idx ? 'step' : undefined}
              >
                <span className="day-pill">{s.day}</span>
                <span className="tl-title">{s.title}</span>
              </button>
              {i === idx && (
                <div className="tl-detail">
                  <p className="what">{s.what}</p>
                  <div className="try">
                    <TapIcon />
                    <span>
                      <Rich text={s.tryIt} />
                    </span>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <p className="foot-note">Yellow tags on screen mark Intercom messages. Names and numbers are examples.</p>
    </aside>
  )
}
