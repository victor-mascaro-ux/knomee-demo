/* Who they most enjoy working with, on the first form of the advisor flow.

   Twenty-two options on the first screen of a flow read as a test, so they
   arrive shut: the generalist on its own, then five one-line kinds that open
   one at a time, each saying how many of its options are picked. At most
   three, said nowhere — at the cap the oldest pick makes room, as Practice
   Joy's cap does. Picking the generalist clears the rest, and the rest clear
   it. Styles in advisor-flow.css. */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { CLIENT_GROUPS, GENERALIST, SERVES_MAX, type ServesIcon } from '../data/advisorFlow'

/* Each kind's mark, in the profile icons' idiom: a square box, currentColor,
   round caps. Time for life stage, a signpost for a turn in the road, the
   briefcase for work, a cut stone for complex assets, a heart for community
   and values — and two people for "everyone". */
const MARKS: Record<ServesIcon | 'everyone', ReactNode> = {
  hourglass: (
    <>
      <path d="M5 22h14M5 2h14" />
      <path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22" />
      <path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2" />
    </>
  ),
  signpost: (
    <>
      <path d="M12 13v8M12 3v3" />
      <path d="M4 6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h13a2 2 0 0 0 1.2-.4l3.4-2.3a1 1 0 0 0 0-1.6L18.2 6.4A2 2 0 0 0 17 6z" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2.5" y="6.5" width="19" height="14" rx="2" />
      <path d="M16 20.5V4.5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  gem: (
    <>
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M11 3 8 9l4 13 4-13-3-6M2 9h20" />
    </>
  ),
  heart: (
    <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
  ),
  everyone: (
    <>
      <circle cx="9" cy="7.5" r="3.5" />
      <path d="M2.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5" />
      <path d="M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.6 3.5 5.2" />
    </>
  ),
}
const Mark = ({ k, size = 15 }: { k: ServesIcon | 'everyone'; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {MARKS[k]}
  </svg>
)

const Check = () => (
  <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden>
    <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function ServesPicker({ picks, onChange }: { picks: string[]; onChange: (next: string[]) => void }) {
  /* Coming back to the field opens the kind that holds their first pick. */
  const [open, setOpen] = useState<string | null>(
    () => CLIENT_GROUPS.find((g) => g.options.some((o) => picks.includes(o)))?.label ?? null,
  )
  const toggle = (v: string) => {
    if (picks.includes(v)) return onChange(picks.filter((p) => p !== v))
    if (v === GENERALIST) return onChange([v])
    const rest = picks.filter((p) => p !== GENERALIST)
    onChange(rest.length >= SERVES_MAX ? [...rest.slice(1), v] : [...rest, v])
  }
  const chip = (o: string, mark?: ReactNode) => {
    const on = picks.includes(o)
    return (
      <button key={o} type="button" className={`af-serve${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggle(o)}>
        {on ? <Check /> : mark}
        {o}
      </button>
    )
  }
  return (
    <div className="af-serves">
      <div className="af-serves-lead">{chip(GENERALIST, <Mark k="everyone" size={14} />)}</div>
      <p className="af-serves-or">or the people you specialize in</p>
      <div className="af-serves-groups">
        {CLIENT_GROUPS.map((g, gi) => {
          const isOpen = open === g.label
          const n = g.options.filter((o) => picks.includes(o)).length
          return (
            <div key={g.label} className={`af-serves-group${isOpen ? ' is-open' : ''}`} data-tone={gi}>
              <button
                type="button"
                className="af-serves-row"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : g.label)}
              >
                <span className="af-serves-ic">
                  <Mark k={g.icon} />
                </span>
                <span className="af-serves-name">{g.label}</span>
                {n > 0 && <span className="af-serves-n">{n}</span>}
                <svg className="af-serves-caret" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 3.5 10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isOpen && <div className="af-serves-chips">{g.options.map((o) => chip(o))}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
