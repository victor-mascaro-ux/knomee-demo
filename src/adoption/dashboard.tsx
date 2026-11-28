/* The demo's additions to the product's own prospects screen, set into it
   through its optional slots: the Nudge on Sarah's row when she stops halfway
   (Top Action), Actionable Insights open on it that day, and, once Alex
   connects his calendar, the meetings it brings (a card under Top Line
   Metrics). Their controls are marked data-ad-live: they are part of the
   story in an app that is otherwise inert. */

import type { CSSProperties } from 'react'
import CollapsibleCard from '../components/CollapsibleCard'
import { BoltIcon, KnomeeMark } from '../components/icons'
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

/** Day 2: Actionable Insights, open, with the one thing that needs Alex:
    Sarah stopped halfway. The card is the product's own; its banner is the
    design system's one banner style, its button the row's Nudge. */
export function NudgeInsights({ sent, onNudge }: { sent: boolean; onNudge: () => void }) {
  return (
    <CollapsibleCard
      className="insights-card gi-card"
      icon={<BoltIcon color="#7639a1" />}
      title="Actionable Insights"
      bodyClassName="cmd-body gi-body"
      defaultOpen
    >
      <p className="gi-callout ad-nudge-banner" data-ad-live>
        <KnomeeMark size={18} color="var(--k-grape)" />
        {sent ? (
          <span>
            <b>Sarah nudged today.</b> You’ll see when she finishes.
          </span>
        ) : (
          <>
            <span>
              <b>Sarah stopped halfway.</b> Nudge her to finish before Friday.
            </span>
            <button className="ad-nudge-btn" type="button" onClick={onNudge}>
              <BellIcon />
              Nudge
            </button>
          </>
        )}
      </p>
    </CollapsibleCard>
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
