/* The steps beside the demo: the advisor's three weeks, one line each (the day, then
   what happens), and under the current one what is going on. Picking a step goes to it. The list is a drawer on the right edge,
   over the app, so the dashboard keeps the product's full width; its tab on
   that edge opens and closes it. It starts closed. */

import { useLayoutEffect, useRef, useState } from 'react'
import { ChevronRight } from '../components/icons'
import { STEPS } from './steps'

export default function NotesPanel({ idx, onGoto }: { idx: number; onGoto: (i: number) => void }) {
  const [open, setOpen] = useState(false)
  const body = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)

  /* The rail fills down to the current step, and the list scrolls to it. The
     list scrolls itself: scrollIntoView would also scroll the stage to bring
     a closed drawer into view. */
  useLayoutEffect(() => {
    const box = body.current
    const ol = list.current
    const cur = ol?.querySelector<HTMLElement>('.tl-item.current')
    if (!box || !ol || !cur) return
    ol.style.setProperty('--prog', `${Math.max(0, cur.offsetTop + 3)}px`)
    const b = box.getBoundingClientRect()
    const c = cur.getBoundingClientRect()
    if (c.top < b.top) box.scrollTop += c.top - b.top - 12
    else if (c.bottom > b.bottom) box.scrollTop += c.bottom - b.bottom + 12
  }, [idx, open])

  return (
    <aside className={`ad-notes${open ? ' open' : ''}`} aria-label="The steps of the demo">
      <button
        className="ad-notes-tab"
        type="button"
        aria-expanded={open}
        aria-controls="ad-steps"
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronRight />
        <span>Steps</span>
      </button>
      <div className="ad-notes-body" id="ad-steps" ref={body}>
        <h2>The advisor’s first 3 weeks</h2>
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
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <p className="foot-note">Names and numbers are examples.</p>
      </div>
    </aside>
  )
}
