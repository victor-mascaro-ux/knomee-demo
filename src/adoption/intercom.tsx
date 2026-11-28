/* What Intercom puts on Alex's dashboard, as Alex would see it, in knomee's
   design system: Poppins, the DS's buttons, option chips, field and modal.
   Only the chat button in the corner keeps Intercom's own look. The sender is the firm,
   Acme Advisors, as Intercom is set up for the pilot. */

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { CloseIcon } from '../components/icons'
import BusyButton from './BusyButton'
import { ChatIcon, CheckIcon, XIcon } from './icons'
import { ASK, ASK_QUESTION, SURVEY, SURVEY_QUESTION } from './steps'

/** The firm's letter, in its colour: who an Intercom message is from. */
export function FirmAvatar() {
  return (
    <span className="ic-av firm" aria-hidden>
      A
    </span>
  )
}

/** Who a message is from, at its head. */
function Sender() {
  return (
    <div className="ic-sender">
      <FirmAvatar />
      <div>
        <b>Acme Advisors</b>
      </div>
    </div>
  )
}

/** A banner across the top of the page, under the tabs, in knomee's own
    design system: its button is the DS primary button, with the DS shine. */
export function Banner({
  title,
  children,
  action,
  onAction,
  onDismiss,
  leaving,
}: {
  title: string
  children: ReactNode
  action: string
  onAction: () => void
  onDismiss: () => void
  leaving: boolean
}) {
  return (
    <div className={`ic-banner${leaving ? ' leaving' : ''}`} data-ad-live>
      <div className="ic-banner-msg">
        <FirmAvatar />
        <p>
          <b>{title}</b> {children}
        </p>
      </div>
      <button className="btn btn-primary" type="button" onClick={onAction}>
        <span>{action}</span>
      </button>
      <button className="ic-close" type="button" aria-label="Dismiss" onClick={onDismiss}>
        <XIcon />
      </button>
    </div>
  )
}

/** The box a piece is placed in: the demo's app, or, on the product's own
    page (no app box), the whole document. */
type Frame = Pick<DOMRect, 'top' | 'left' | 'bottom'>
const documentFrame = (): Frame => ({ top: -window.scrollY, left: -window.scrollX, bottom: Infinity })

/** Keeps a piece of the Intercom layer next to something on the page: placed
    when drawn, and again as the page scrolls, resizes and settles. `place`
    gets the piece, the thing's box and the frame's. */
function useFollow(
  ref: RefObject<HTMLElement | null>,
  anchor: () => HTMLElement | null,
  device: RefObject<HTMLElement | null> | null,
  scroller: RefObject<HTMLElement | null> | null,
  place: (el: HTMLElement, b: DOMRect, d: Frame) => void,
) {
  const find = useRef(anchor)
  find.current = anchor
  const put = useRef(place)
  put.current = place
  useLayoutEffect(() => {
    const go = () => {
      const el = ref.current
      const dev = device ? device.current : null
      const at = find.current()
      if (!el) return
      if ((device && !dev) || !at) {
        el.style.visibility = 'hidden'
        return
      }
      put.current(el, at.getBoundingClientRect(), dev ? dev.getBoundingClientRect() : documentFrame())
    }
    go()
    const sc: HTMLElement | Document | null = scroller ? scroller.current : document
    sc?.addEventListener('scroll', go, { passive: true })
    /* The page lays in as it opens: once its pieces have settled, look again. */
    sc?.addEventListener('animationend', go)
    window.addEventListener('resize', go)
    /* The page settles after fonts and pictures load; a few more looks catch it. */
    void document.fonts?.ready.then(go)
    const t = [120, 400, 900, 1500].map((ms) => window.setTimeout(go, ms))
    return () => {
      sc?.removeEventListener('scroll', go)
      sc?.removeEventListener('animationend', go)
      window.removeEventListener('resize', go)
      t.forEach((x) => window.clearTimeout(x))
    }
  }, [ref, device, scroller])
}

/** A tooltip that points at something on the page: under it, its arrow at the
    thing's right end ('right'), or at its start ('left'). It hides once the
    thing is out of view. */
export function AnchoredTip({
  anchor,
  device,
  scroller,
  side = 'right',
  leaving,
  onClose,
  children,
}: {
  anchor: () => HTMLElement | null
  /** The demo's app box and its scroller; null on the product's own page. */
  device: RefObject<HTMLElement | null> | null
  scroller: RefObject<HTMLElement | null> | null
  side?: 'left' | 'right'
  leaving: boolean
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useFollow(ref, anchor, device, scroller, (tip, b, d) => {
    if (side === 'right') {
      tip.style.top = `${b.bottom - d.top + 14}px`
      tip.style.left = `${Math.max(12, b.right - d.left - tip.offsetWidth + 18)}px`
      tip.style.visibility = b.bottom > d.top + 64 && b.bottom < d.bottom - 150 ? 'visible' : 'hidden'
    } else {
      tip.style.top = `${b.bottom - d.top + 34}px`
      tip.style.left = `${Math.max(12, b.left - d.left - 14)}px`
      tip.style.visibility = b.bottom > d.top + 64 && b.bottom < d.bottom - 130 ? 'visible' : 'hidden'
    }
  })
  return (
    <div
      ref={ref}
      className={`ic ic-card ic-tip${side === 'left' ? ' left' : ''}${leaving ? ' leaving' : ''}`}
    >
      <button className="ic-close" type="button" aria-label="Close" onClick={onClose}>
        <XIcon />
      </button>
      <p>{children}</p>
    </div>
  )
}

/** A pulsing dot at the end of what a tip points at. */
export function Beacon({
  anchor,
  device,
  scroller,
}: {
  anchor: () => HTMLElement | null
  device: RefObject<HTMLElement | null>
  scroller: RefObject<HTMLElement | null>
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useFollow(ref, anchor, device, scroller, (dot, b, d) => {
    dot.style.top = `${b.top - d.top + b.height / 2 - 5}px`
    dot.style.left = `${b.right - d.left + 8}px`
    dot.style.visibility = b.bottom > d.top + 64 && b.bottom < d.bottom ? 'visible' : 'hidden'
  })
  return <span ref={ref} className="ic ic-beacon" aria-hidden />
}

/** Day 4, if Alex has invited no one: one question, in the corner, as
    Intercom's survey (the meeting's "How did it go?" is the other). Seeing
    the email opens the invite; talking it through reaches the team; the
    other two answer in the card. */
export function Ask({
  answer,
  text,
  sent,
  leaving,
  onAnswer,
  onText,
  onSend,
  onClose,
}: {
  answer: number
  text: string
  sent: boolean
  leaving: boolean
  onAnswer: (i: number) => void
  onText: (t: string) => void
  onSend: () => void
  onClose: () => void
}) {
  const box = useRef<HTMLTextAreaElement>(null)
  /* The box grows with what is typed, and takes the cursor when it opens. */
  const fit = () => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  useEffect(() => {
    if (answer !== 3 || sent) return
    fit()
    box.current?.focus({ preventScroll: true })
  }, [answer, sent])
  return (
    <div className={`ic ic-card ic-survey${leaving ? ' leaving' : ''}`} role="dialog" aria-labelledby="ad-ask-q">
      <button className="ic-close" type="button" aria-label="Close" onClick={onClose}>
        <XIcon />
      </button>
      <Sender />
      <h4 id="ad-ask-q">{ASK_QUESTION}</h4>
      <div className="ask-opts">
        {ASK.map((o, i) => (
          <button
            key={o}
            className={`ask-opt${i === answer ? ' sel' : ''}`}
            type="button"
            aria-pressed={i === answer}
            style={{ '--i': i } as CSSProperties}
            onClick={() => onAnswer(i)}
          >
            <span>{o}</span>
            {i === answer && <CheckIcon />}
          </button>
        ))}
      </div>
      {answer === 2 && <div className="ic-reply">Got it. We’ll check in next week.</div>}
      {answer === 3 &&
        (sent ? (
          <div className="ic-reply">Thanks. Someone from Knomee will reach out.</div>
        ) : (
          <>
            <textarea
              ref={box}
              className="ad-grow ic-follow"
              placeholder="Tell us more"
              aria-label="Tell us more"
              rows={1}
              value={text}
              onChange={(e) => {
                onText(e.target.value)
                fit()
              }}
            />
            <BusyButton className="btn btn-primary ic-wide" onDone={onSend}>
              Send
            </BusyButton>
          </>
        ))}
    </div>
  )
}

/** Day 4: one question about how the meeting went, then who's next. */
export function Survey({
  answer,
  details,
  sent,
  leaving,
  onAnswer,
  onDetails,
  onSend,
  onClose,
  onInvite,
}: {
  answer: number
  details: string
  sent: boolean
  leaving: boolean
  onAnswer: (i: number) => void
  onDetails: (t: string) => void
  onSend: () => void
  onClose: () => void
  onInvite: () => void
}) {
  const box = useRef<HTMLTextAreaElement>(null)
  const fit = () => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  useEffect(() => {
    if (answer < 0 || sent) return
    fit()
    box.current?.focus({ preventScroll: true })
  }, [answer, sent])
  const answered = answer >= 0
  return (
    <div className={`ic ic-card ic-survey${leaving ? ' leaving' : ''}`}>
      <button className="ic-close" type="button" aria-label="Close" onClick={onClose}>
        <XIcon />
      </button>
      <Sender />
      <h4>{SURVEY_QUESTION}</h4>
      <div className="ask-opts">
        {SURVEY.map((o, i) => (
          <button
            key={o}
            className={`ask-opt${i === answer ? ' sel' : ''}`}
            type="button"
            aria-pressed={i === answer}
            style={{ '--i': i } as CSSProperties}
            onClick={() => onAnswer(i)}
          >
            <span>{o}</span>
            {i === answer && <CheckIcon />}
          </button>
        ))}
      </div>
      {answered && !sent && (
        <>
          <textarea
            ref={box}
            className="ad-grow ic-follow"
            placeholder="Tell us more"
            aria-label="Tell us more"
            rows={1}
            value={details}
            onChange={(e) => {
              onDetails(e.target.value)
              fit()
            }}
          />
          <BusyButton key={answer} className="btn btn-primary ic-wide" onDone={onSend}>
            Send
          </BusyButton>
        </>
      )}
      {answered && sent && (
        <>
          {answer === 2 && <div className="ic-reply">We’ll check in with you.</div>}
          <h4 className="ic-follow ic-next">Who’s next?</h4>
          <button className="btn btn-primary ic-wide" type="button" onClick={onInvite}>
            Invite Another Prospect
          </button>
        </>
      )}
    </div>
  )
}

/** Week 3: a post in the middle of the page, asking Alex to connect his
    calendar so a check-in is ready for every new meeting. It is the DS
    modal: the plum bar with its title and close, the body, and a foot of
    pill buttons with the main one filled. */
export function Post({
  leaving,
  onConnect,
  onLater,
}: {
  leaving: boolean
  onConnect: () => void
  onLater: () => void
}) {
  return (
    <div
      className={`modal-backdrop${leaving ? ' ad-leaving' : ''}`}
      onClick={onLater}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-post-h"
    >
      <div className={`modal ad-post${leaving ? ' ad-leaving' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="ad-post-h">
            Never forget a check-in
          </h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onLater}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body ad-post-body">
          <Sender />
          <p>Connect your calendar. When you book a meeting with someone new, their check-in is ready to send.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" type="button" onClick={onLater}>
            Later
          </button>
          <BusyButton className="btn btn-primary" done="Connected" onDone={onConnect}>
            Connect Calendar
          </BusyButton>
        </div>
      </div>
    </div>
  )
}

/** Intercom's chat button, in the corner. Not part of the story: it does nothing. */
export function Launcher() {
  return (
    <span className="ic ic-launcher" aria-hidden>
      <ChatIcon />
    </span>
  )
}
