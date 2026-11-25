/* The product's compose window (InviteCompose, the one Resend Invite Link
   opens) in the design system's modal, addressed to the person Alex is
   writing to. Its From line is Alex. Send spins, checks, then sends. */

import { useEffect, useRef, useState } from 'react'
import { CloseIcon } from '../components/icons'
import type { ClientBrand } from '../components/clientBrands'
import { placeholdersIn, type InviteEmail } from '../data/inviteEmails'
import type { InviteDraft, ComposeProps } from './kit'
import { BUSY_MS, OK_MS, reducedMotion, useLeave } from './motion'
import type { ComponentType } from 'react'

export interface Sent {
  email: string
  subject: string
  body: string
}

export default function ComposeModal({
  Compose,
  title,
  sample,
  to: initialTo,
  known,
  brand,
  onSent,
  onClose,
}: {
  Compose: ComponentType<ComposeProps>
  title: string
  /** The email as Alex's draft starts. */
  sample: InviteEmail
  to: string
  /** The placeholders already filled: Alex, his firm, the person's name. */
  known: Record<string, string>
  brand: ClientBrand
  onSent: (sent: Sent) => void
  onClose: () => void
}) {
  const [edits, setEdits] = useState<InviteDraft | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState(false)
  const [to, setTo] = useState(initialTo)
  const [toBad, setToBad] = useState(false)
  const [sending, setSending] = useState(false)
  const [leaving, leave] = useLeave()
  const panel = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const draft = edits ?? sample
  const edited =
    draft.subject !== sample.subject ||
    draft.message !== sample.message ||
    draft.cta !== sample.cta ||
    draft.signoff !== sample.signoff
  const valueOf = (k: string) => fields[k] ?? known[k] ?? ''
  const missing = placeholdersIn([draft.subject, draft.message, draft.signoff].join('\n')).filter(
    (k) => !valueOf(k).trim(),
  )
  /** The words as they go out, every field filled in. */
  const filled = (t: string) => t.replace(/\{\{([^}]+)\}\}/g, (_, k: string) => valueOf(k.trim()))

  const close = () => leave(onClose)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy.current) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    panel.current?.querySelector<HTMLInputElement>('#invite-email')?.focus({ preventScroll: true })
  }, [])

  const send = () => {
    if (busy.current) return false
    /* Not without an address, nor with a field still empty: the window marks
       what's left and puts the cursor in it, as Resend does. */
    const noTo = !to.trim()
    if (noTo || missing.length) {
      setToBad(noTo)
      if (missing.length) setFlagged(true)
      window.setTimeout(
        () => panel.current?.querySelector<HTMLInputElement>(noTo ? '#invite-email' : '.invite-fill.is-bad')?.focus(),
        60,
      )
      return false
    }
    busy.current = true
    const done = () =>
      onSent({ email: to.trim(), subject: filled(draft.subject), body: filled(draft.message) })
    const btn = panel.current?.querySelector<HTMLElement>('.invite-mail-send')
    if (reducedMotion() || !btn) {
      done()
      return
    }
    /* The spinner is drawn on the window's own Send (adoption.css); the
       check that follows is the button's own. */
    btn.classList.add('ad-busy')
    timers.current.push(
      window.setTimeout(() => {
        btn.classList.remove('ad-busy')
        setSending(true)
        timers.current.push(window.setTimeout(done, OK_MS))
      }, BUSY_MS),
    )
  }

  return (
    <div
      className={`modal-backdrop${leaving ? ' ad-leaving' : ''}`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-compose-title"
    >
      <div className={`modal invite-modal${leaving ? ' ad-leaving' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="ad-compose-title">
            {title}
          </h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={close}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body invite-body">
          <div className="invite-panel" ref={panel}>
            <Compose
              sample={sample}
              draft={draft}
              edited={edited}
              onDraft={setEdits}
              onReset={() => setEdits(null)}
              missing={missing}
              brand={brand}
              link="knomee.com/kIIKLERH034847"
              kind="prospect"
              label="Prospect"
              to={to}
              onTo={setTo}
              toBad={toBad}
              onSend={send}
              sending={sending}
              known={known}
              fields={fields}
              onField={(k, v) => setFields((f) => ({ ...f, [k]: v }))}
              flagged={flagged}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
