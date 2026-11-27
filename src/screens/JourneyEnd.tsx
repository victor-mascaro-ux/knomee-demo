/* The end of the journey: every adventure done.
 *
 * Shown once the last adventure's celebration is left — Goals on the client's
 * phone, The Move on the advisor's. On the brand's plum, top to bottom:
 *
 *   - the five adventures' marks, each with its check, and what they add up to;
 *   - in the middle, Share: a link for somebody else to start their own;
 *   - at the foot, a card over each of the bottom bar's three buttons saying
 *     what it is for from here on — the ID, the Knomee button, Adventures.
 *     The cards point down at the buttons, and a tap on one does what its
 *     button does.
 *
 * The bar itself is the phone's own, the same as on every other screen (the
 * host draws it).
 */

import { useEffect, useState } from 'react'
import FeedbackButton from '../components/FeedbackButton'
import { CloseIcon } from '../components/icons'
import './journeyEnd.css'

/** One of the bottom bar's three buttons. */
export type EndButton = 'id' | 'knomee' | 'adventures'

/** Where a link to start Knomee points: the app's own address with the given
    route. Inside the review overlay the app runs at app/app.html, and the link
    is the overlay's — the page somebody would be sent. */
export function startLink(route: string) {
  const page = window.location.href.split('#')[0].replace(/(app\/)?app\.html$|index\.html$/, '')
  return `${page}#/${route}`
}

export default function JourneyEnd({
  marks,
  idName,
  sub,
  hints,
  share,
  onPick,
}: {
  /** The five adventures' marks, in the order they were taken. */
  marks: string[]
  /** "Financial ID" or "Business ID". */
  idName: string
  /** What the ID now does for them, under the title. */
  sub: string
  /** A line for each button's card. */
  hints: Record<EndButton, string>
  share: {
    /** Who to send it to, as the card and the modal put it. */
    who: string
    /** The message the link goes out with. */
    text: string
    link: string
  }
  onPick: (b: EndButton) => void
}) {
  const [sharing, setSharing] = useState(false)
  const tips: { id: EndButton; title: string }[] = [
    { id: 'id', title: idName },
    { id: 'knomee', title: 'Knomee' },
    { id: 'adventures', title: 'Adventures' },
  ]
  return (
    <div className="je">
      <div className="je-hero">
        <span className="je-glow" aria-hidden />
        <ul className="je-marks" aria-label={`All ${marks.length} adventures complete`}>
          {marks.map((src, i) => (
            <li key={i} className="je-mark" style={{ ['--i' as string]: i }}>
              <img src={src} alt="" />
              <span className="je-check" aria-hidden>
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 8.4 6.6 11.4 12.5 5" />
                </svg>
              </span>
            </li>
          ))}
        </ul>
        <h2 className="je-title">You’re clear on what you want</h2>
        <p className="je-sub">{sub}</p>
      </div>

      <section className="je-share" aria-labelledby="je-share-h">
        <div className="je-share-text">
          <h3 id="je-share-h">Know {share.who} who’d enjoy this?</h3>
          <p>Send them a link to start their own adventures.</p>
        </div>
        <button className="je-share-btn" type="button" onClick={() => setSharing(true)}>
          <ShareGlyph />
          Share
        </button>
      </section>

      <nav className="je-tips" aria-label="Where to next">
        {tips.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`je-tip is-${t.id}`}
            onClick={() => onPick(t.id)}
          >
            <b>{t.title}</b>
            <span>{hints[t.id]}</span>
          </button>
        ))}
      </nav>

      {sharing && <ShareModal {...share} onClose={() => setSharing(false)} />}
    </div>
  )
}

/* Share Knomee: the design system's modal — the plum bar with its title and
   close, then the four ways to send it and the link itself, shown (not a
   field) with Copy Link at its end. */
function ShareModal({ who, text, link, onClose }: { who: string; text: string; link: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const msg = `${text} ${link}`
  /* The clipboard can be refused inside the review overlay's frame; the
     button still says Copied, which is the demo's real feedback. */
  const copy = () => {
    try {
      void navigator.clipboard?.writeText(link).catch(() => {})
    } catch {
      /* the button confirms regardless */
    }
  }
  const shown = link.replace(/^https?:\/\//, '')
  return (
    <div className="modal-backdrop je-share-back" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="je-share-title">
      <div className="modal je-share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="je-share-title">
            Share Knomee
          </h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <p className="je-share-lead">Send {who} a link to start their own adventures.</p>
          <div className="je-channels">
            <a
              className="je-ch is-whatsapp"
              href={`https://wa.me/?text=${encodeURIComponent(msg)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="je-ch-ic" aria-hidden>
                <WhatsAppGlyph />
              </span>
              <span className="je-ch-lbl">WhatsApp</span>
            </a>
            {/* Instagram has no link to send through: the phone's own share
                sheet where there is one, the link copied where there is not. */}
            <FeedbackButton
              className="je-ch is-instagram"
              tint={false}
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({ title: 'Knomee', text, url: link })
                  } catch {
                    /* closed without sending */
                  }
                  return false
                }
                copy()
              }}
              done={
                <>
                  <span className="je-ch-ic" aria-hidden>
                    <DoneGlyph />
                  </span>
                  <span className="je-ch-lbl">Link Copied</span>
                </>
              }
              announce="Link copied"
            >
              <span className="je-ch-ic" aria-hidden>
                <InstagramGlyph />
              </span>
              <span className="je-ch-lbl">Instagram</span>
            </FeedbackButton>
            <a
              className="je-ch is-email"
              href={`mailto:?subject=${encodeURIComponent('Try Knomee')}&body=${encodeURIComponent(msg)}`}
            >
              <span className="je-ch-ic" aria-hidden>
                <EmailGlyph />
              </span>
              <span className="je-ch-lbl">Email</span>
            </a>
            <a className="je-ch is-messages" href={`sms:?&body=${encodeURIComponent(msg)}`}>
              <span className="je-ch-ic" aria-hidden>
                <MessagesGlyph />
              </span>
              <span className="je-ch-lbl">Messages</span>
            </a>
          </div>
          <div className="invite-link-box je-link">
            <LinkGlyph />
            <span className="invite-link-text">{shown}</span>
            <FeedbackButton
              className="invite-pill"
              onClick={copy}
              done={
                <>
                  <DoneGlyph /> Copied
                </>
              }
              announce="Link copied"
            >
              <CopyGlyph /> Copy Link
            </FeedbackButton>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── glyphs: line icons on one 24 grid, each its own silhouette ── */

const line = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function ShareGlyph() {
  return (
    <svg {...line} width="22" height="22" strokeWidth={2}>
      <circle cx="17.5" cy="5.5" r="2.6" />
      <circle cx="6.5" cy="12" r="2.6" />
      <circle cx="17.5" cy="18.5" r="2.6" />
      <path d="M8.8 10.7 15.2 6.8M8.8 13.3l6.4 3.9" />
    </svg>
  )
}

function WhatsAppGlyph() {
  return (
    <svg {...line} width="26" height="26">
      <path d="M4.2 19.8 5.3 16A8.2 8.2 0 1 1 8.2 18.8Z" />
      <path d="M9.3 8.4c-.3.9 0 2.4 1.5 4s3 2.2 4 2c.5-.1.9-.6 1-1.1l-1.6-.9-.8.8c-.9-.3-1.9-1.2-2.4-2.2l.7-.8-.8-1.7c-.6 0-1.4.4-1.6 1Z" strokeWidth={1.4} />
    </svg>
  )
}

function InstagramGlyph() {
  return (
    <svg {...line} width="26" height="26">
      <rect x="4" y="4" width="16" height="16" rx="4.6" />
      <circle cx="12" cy="12" r="3.7" />
      <circle cx="16.9" cy="7.1" r="0.4" fill="currentColor" />
    </svg>
  )
}

function EmailGlyph() {
  return (
    <svg {...line} width="26" height="26">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function MessagesGlyph() {
  return (
    <svg {...line} width="26" height="26">
      <path d="M4.5 5.5h15v10.5h-9l-4.5 3.5V16h-1.5z" />
      <path d="M9 10.8h.01M12 10.8h.01M15 10.8h.01" strokeWidth={2.4} />
    </svg>
  )
}

function LinkGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8.6 11.4a3.2 3.2 0 0 0 4.5 0l2.6-2.6a3.2 3.2 0 0 0-4.5-4.5l-1 1" />
      <path d="M11.4 8.6a3.2 3.2 0 0 0-4.5 0l-2.6 2.6a3.2 3.2 0 0 0 4.5 4.5l1-1" />
    </svg>
  )
}

function CopyGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

function DoneGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4.5 10.5 8.3 14 15.5 6.5" />
    </svg>
  )
}
