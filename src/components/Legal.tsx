/* The legal layer every phone carries: Terms of Use, the Privacy Notice, and a
 * plain-language page on how the answers are used.
 *
 * PLACEHOLDER TEXT. None of this has been written or reviewed by counsel; it
 * is here so the demo shows where compliance copy lives and roughly what it
 * covers. Every document says so at its head. Replace the copy below — the
 * structure (consent line, point-of-collection line, menu entry) can stay.
 *
 * Opened from anywhere with `openLegal(doc)` rather than a prop: the links sit
 * inside shared step components several layers down, and a window event lets
 * each phone host the sheet once without threading a callback through them.
 */

import { useEffect, useState, type ReactNode } from 'react'
import './legal.css'

export type LegalDoc = 'terms' | 'privacy' | 'data'

const EVENT = 'knomee-legal'

export function openLegal(doc: LegalDoc) {
  window.dispatchEvent(new CustomEvent<LegalDoc>(EVENT, { detail: doc }))
}

/** A link that opens one of the documents. Stops the tap there, so it never
    also counts as a tap on whatever card or row it sits in. */
export function LegalLink({ doc, children }: { doc: LegalDoc; children: ReactNode }) {
  return (
    <button
      type="button"
      className="lg-link"
      onClick={(e) => {
        e.stopPropagation()
        openLegal(doc)
      }}
    >
      {children}
    </button>
  )
}

const UPDATED = '[Effective date]'

const DOCS: Record<LegalDoc, { title: string; body: ReactNode }> = {
  terms: {
    title: 'Terms of Use',
    body: (
      <>
        <p>
          These Terms of Use govern your use of this service, provided by knomee, Inc. (“knomee”, “we”)
          on behalf of the firm that invited you (the “Firm”). By continuing, you agree to them.
        </p>
        <h3>1. What this service is</h3>
        <p>
          A set of guided reflection exercises. Your answers produce a summary (your “Business ID”) and
          suggested questions for your own use.
        </p>
        <h3>2. Not advice</h3>
        <p>
          Nothing in this service is investment, legal, tax, employment or regulatory advice, or an
          offer of employment or affiliation. Speak to your own advisers before making decisions.
        </p>
        <h3>3. What you should not enter</h3>
        <p>
          Do not enter client names, client account information or any confidential or proprietary
          information belonging to your current firm. You are responsible for complying with any
          obligations you owe your current firm.
        </p>
        <h3>4. Your content</h3>
        <p>
          You keep ownership of what you write. You grant knomee and the Firm a licence to use it to
          provide this service, as described in the Privacy Notice.
        </p>
        <h3>5. Acceptable use</h3>
        <p>Use the service lawfully and only for yourself. Do not attempt to access other people’s answers.</p>
        <h3>6. Disclaimers and liability</h3>
        <p>
          The service is provided “as is”. To the extent permitted by law, knomee is not liable for
          decisions made using it. [Limitation of liability, governing law and dispute terms.]
        </p>
        <h3>7. Changes</h3>
        <p>We may update these terms and will show the effective date above.</p>
        <h3>8. Contact</h3>
        <p>[Legal contact address and email]</p>
      </>
    ),
  },
  privacy: {
    title: 'Privacy Notice',
    body: (
      <>
        <p>This notice explains what we collect when you use this service and what happens to it.</p>
        <h3>What we collect</h3>
        <p>
          What you tell us — your name, the assets you advise on, your firm, and your answers — plus
          basic technical data such as device type and when you used the service.
        </p>
        <h3>How we use it</h3>
        <p>To build your Business ID and questions, to share them with the Firm, and to run and improve the service.</p>
        <h3>Who we share it with</h3>
        <p>
          The Firm that invited you, and service providers who host and operate the service for us
          under contract. We do not sell your personal information.
        </p>
        <h3>How long we keep it</h3>
        <p>[Retention period], or until you ask us to delete it.</p>
        <h3>Your choices and rights</h3>
        <p>
          You can ask to see, correct or delete your information at any time. Depending on where you
          live you may have further rights. [State-specific disclosures, e.g. CCPA.]
        </p>
        <h3>Security</h3>
        <p>[Summary of safeguards.]</p>
        <h3>Contact</h3>
        <p>[Privacy contact address and email]</p>
      </>
    ),
  },
  data: {
    title: 'How your answers are used',
    body: (
      <>
        <p>The short version, in plain words.</p>
        <h3>Who sees them</h3>
        <p>
          You, and the firm that invited you. They see your answers, your Business ID and your three
          questions.
        </p>
        <h3>What they are for</h3>
        <p>To help you get clear on what you want, and to make your next conversation with the firm a better one.</p>
        <h3>What we don’t do</h3>
        <p>We don’t sell your answers, and we don’t share them with other firms.</p>
        <h3>Please leave out</h3>
        <p>Client names, account details and anything confidential to your current firm.</p>
        <h3>Changing your mind</h3>
        <p>You can ask for your answers to be deleted at any time: [contact].</p>
      </>
    ),
  },
}

const ORDER: LegalDoc[] = ['terms', 'privacy', 'data']

/** Mount once inside a phone's screen: it listens for openLegal and shows the
    document over the whole screen, with the other two a tap away. */
export function LegalHost() {
  const [doc, setDoc] = useState<LegalDoc | null>(null)
  useEffect(() => {
    const on = (e: Event) => setDoc((e as CustomEvent<LegalDoc>).detail)
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [])
  if (!doc) return null
  const d = DOCS[doc]
  return (
    <div className="lg-sheet" role="dialog" aria-modal="true" aria-label={d.title}>
      <div className="lg-head">
        <h2 className="lg-title">{d.title}</h2>
        <button type="button" className="lg-close" aria-label="Close" onClick={() => setDoc(null)}>
          <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5.5 5.5l11 11M16.5 5.5l-11 11" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <nav className="lg-tabs" aria-label="Legal documents">
        {ORDER.map((k) => (
          <button
            key={k}
            type="button"
            className={`lg-tab${k === doc ? ' is-on' : ''}`}
            aria-current={k === doc}
            onClick={() => setDoc(k)}
          >
            {DOCS[k].title}
          </button>
        ))}
      </nav>
      <div className="lg-body">
        <p className="lg-placeholder">
          Placeholder text for the demo — to be replaced by legal and compliance before launch.
        </p>
        <p className="lg-updated">Effective {UPDATED}</p>
        {d.body}
      </div>
    </div>
  )
}
