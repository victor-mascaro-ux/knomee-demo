/* The notes beside the demo: Alex's effort so far, the whole three weeks as
   a timeline, and under the current step what happens, the emails and alerts
   it sends, and what to click. */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ClockIcon, ExpandIcon, HashIcon, MailIcon, Rich, TapIcon } from './icons'
import { reducedMotion, useCountUp } from './motion'
import { EXTRAS, STEPS, effortTo, emailContent, type ExtraKey, type SentEmail } from './steps'

function MiniEmail({
  k,
  sent,
  nudge,
  onOpen,
}: {
  k: ExtraKey
  sent: SentEmail | null
  nudge: { subject: string; body: string } | null
  onOpen: (k: ExtraKey, from: HTMLElement) => void
}) {
  const { e, subj, full } = emailContent(k, sent, nudge)
  /* The greeting is left off: the preview starts where the email does. */
  const preview = full
    .split('\n')
    .filter((l) => l.trim())
    .slice(1)
    .join(' ')
  return (
    <button
      className="mini mail"
      type="button"
      aria-label={`Open the full email: ${subj}`}
      onClick={(ev) => onOpen(k, ev.currentTarget)}
    >
      <span className="mini-head">
        <span className="mh">
          <MailIcon />
          {e.head}
        </span>
        <ExpandIcon />
      </span>
      <span className="mini-body">
        <span className="from">{e.from}</span>
        <span className="subj">{subj}</span>
        <span className="clamp">{preview}</span>
      </span>
    </button>
  )
}

function MiniAlert({ body }: { body: string }) {
  return (
    <div className="mini slack">
      <div className="mini-head">
        <span className="mh">
          <HashIcon />
          acme-pilot
        </span>
      </div>
      <div className="mini-body">{body}</div>
    </div>
  )
}

export default function NotesPanel({
  idx,
  nudged,
  nudge,
  sent,
  hint,
  onGoto,
  onOpenMail,
}: {
  idx: number
  /** Alex nudged Sarah himself, so Knomee's reminder is off. */
  nudged: boolean
  nudge: { subject: string; body: string } | null
  sent: SentEmail | null
  /** The next day, lit up when the presenter lingers at the end of one. */
  hint: number | null
  onGoto: (i: number) => void
  onOpenMail: (k: ExtraKey, from: HTMLElement) => void
}) {
  const step = STEPS[idx]
  const effort = effortTo(idx)
  const list = useRef<HTMLOListElement>(null)
  /* The effort counter counts to its new value and bumps once. */
  const clicks = step.branch ? 0 : effort.clicks
  const shownClicks = useCountUp(clicks)
  const [bump, setBump] = useState(false)
  const lastClicks = useRef(clicks)
  useEffect(() => {
    if (lastClicks.current === clicks) return
    lastClicks.current = clicks
    if (reducedMotion()) return
    setBump(false)
    const on = window.requestAnimationFrame(() => setBump(true))
    const off = window.setTimeout(() => setBump(false), 600)
    return () => {
      window.cancelAnimationFrame(on)
      window.clearTimeout(off)
    }
  }, [clicks])

  /* The timeline fills down to the current step, and the current step (or
     the hinted next day) scrolls into view. */
  useLayoutEffect(() => {
    const ol = list.current
    const cur = ol?.querySelector<HTMLElement>('.tl-item.current')
    if (!ol || !cur) return
    ol.style.setProperty('--prog', `${Math.max(0, cur.offsetTop + 3)}px`)
    cur.scrollIntoView?.({ block: 'nearest' })
  }, [idx])
  useLayoutEffect(() => {
    if (hint === null) return
    list.current
      ?.querySelector('.tl-item.hint')
      ?.scrollIntoView?.({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, [hint])

  return (
    <aside className="ad-notes" aria-label="What is happening and why">
      <h2>Alex’s first 3 weeks</h2>
      <p className="sub">
        Step through what a new advisor sees, and what Intercom and the Knomee team do at each moment.
      </p>
      {step.branch ? (
        <div className={`effort${bump ? ' bump' : ''}`}>
          <span className="lbl">Alex’s effort on this path</span>
          <span className="vals">
            <span className="big">
              <span className="n">{shownClicks}</span> clicks
            </span>
          </span>
        </div>
      ) : (
        <div className={`effort${bump ? ' bump' : ''}`}>
          <span className="lbl">Alex’s effort so far</span>
          <span className="vals">
            <span className="big">
              <span className="n">{shownClicks}</span> click{effort.clicks === 1 ? '' : 's'}
            </span>
            <span className="min">
              <ClockIcon />
              about {effort.mins} min
            </span>
          </span>
        </div>
      )}
      <ol className="tl" ref={list}>
        {STEPS.map((s, i) => {
          const cls = [
            'tl-item',
            i === idx ? 'current' : i < idx && !s.branch ? 'past' : '',
            hint === i ? 'hint' : '',
            s.branch ? 'branch' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <li key={s.id} className={cls}>
              <span className="tl-dot" aria-hidden />
              <span className="day-pill">
                {s.day}
                {s.branch ? ' · if no invite' : ''}
              </span>
              <button
                className="tl-btn"
                type="button"
                onClick={() => onGoto(i)}
                aria-current={i === idx ? 'step' : undefined}
              >
                <span>{s.title}</span>
              </button>
              {i === idx && (
                <div className="tl-detail">
                  <p className="what">{s.what}</p>
                  {s.extras(nudged).map((k) => {
                    const x = EXTRAS[k]
                    return x.kind === 'email' ? (
                      <MiniEmail key={k} k={k} sent={sent} nudge={nudge} onOpen={onOpenMail} />
                    ) : (
                      <MiniAlert key={k} body={x.body} />
                    )
                  })}
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
