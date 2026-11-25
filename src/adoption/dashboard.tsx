/* The demo's two additions to the product's own prospects screen, set into it
   through its optional slots: the Nudge on Sarah's row when she stops halfway
   (Top Action) and, once Alex connects his calendar, the meetings it brings
   (a card under Top Line Metrics). Both are marked data-ad-live: they are
   part of the story in an app that is otherwise inert. */

import type { CSSProperties } from 'react'
import BusyButton from './BusyButton'
import { BellIcon, CalendarIcon, CheckIcon } from './icons'
import { CAL_MEETS } from './steps'

/** Sarah's Top Action while she is halfway: how far she got, and Nudge. */
export function NudgeCell({ text, sent, onNudge }: { text: string; sent: boolean; onNudge: () => void }) {
  if (sent)
    return (
      <span className="ad-nudged">
        <CheckIcon />
        Nudged today
      </span>
    )
  return (
    <span className="ad-nudge-cell" data-ad-live>
      <span>{text}</span>
      <button className="ad-nudge-btn" type="button" onClick={onNudge}>
        <BellIcon />
        Nudge
      </button>
    </span>
  )
}

/** Week 3: the meetings in Alex's calendar with someone new, each with a
    check-in ready to send. Drawn as the dashboard's own cards are. */
export function ComingUp({ sent, onSend }: { sent: Record<number, boolean>; onSend: (i: number) => void }) {
  return (
    <section className="card ad-cal-card" data-ad-live>
      <header className="card-head">
        <div className="card-title">
          <CalendarIcon />
          <span>Coming up</span>
        </div>
        <div className="card-head-right">
          <span className="show-toggle ad-cal-src">From your calendar</span>
        </div>
      </header>
      <ul className="ad-cal-list">
        {CAL_MEETS.map((m, i) => (
          <li key={m.email} style={{ '--i': i } as CSSProperties}>
            <span className="avatar avatar-initial">{m.name.charAt(0)}</span>
            <div className="ad-cal-who">
              <b>{m.name}</b>
              <small>{m.email}</small>
            </div>
            <span className="ad-cal-when">
              <CalendarIcon />
              {m.when}
            </span>
            {sent[i] ? (
              <span className="ad-nudged">
                <CheckIcon />
                Check-in sent
              </span>
            ) : (
              <BusyButton className="btn btn-primary ad-cal-btn" onDone={() => onSend(i)}>
                Send Check-In
              </BusyButton>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
