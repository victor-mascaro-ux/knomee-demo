/* An email as it lands: the inbox's window, who sent it from which address,
   the subject, and the message with its one button. Alex's emails carry his
   firm's logo and button colour; Knomee's carry Knomee's. */

import { useEffect, useRef, type CSSProperties } from 'react'
import type { ClientBrand } from '../components/clientBrands'
import { Mark, MailIcon, XIcon } from './icons'
import type { DemoEmail } from './steps'

export default function MailWindow({
  email: e,
  brand,
  inDevice,
  leaving,
  onClose,
  onCta,
}: {
  email: DemoEmail
  brand: ClientBrand
  /** Shown inside the app (Alex reading it) rather than over the whole demo. */
  inDevice?: boolean
  leaving: boolean
  onClose: () => void
  /** Its button does something here (Alex's own inbox); elsewhere it is shown. */
  onCta?: () => void
}) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    close.current?.focus({ preventScroll: true })
  }, [])
  const i = (n: number) => ({ '--i': n }) as CSSProperties
  return (
    <div
      className={`mail-win${inDevice ? ' in-device' : ''}${leaving ? ' leaving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-mail-subj"
    >
      <div className="mail-bar">
        <span className="mail-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="mail-title">
          <MailIcon />
          {e.head}
        </span>
        <button ref={close} className="mail-x" type="button" aria-label="Close" onClick={onClose}>
          <XIcon />
        </button>
      </div>
      <div className="mail-head">
        <div className="mail-from">
          {e.by === 'alex' ? (
            <span className="mail-av person" aria-hidden>
              AA
            </span>
          ) : (
            <span className="mail-av knomee" aria-hidden>
              <Mark />
            </span>
          )}
          <span>
            <b>{e.from}</b> <span className="org">{e.org}</span>
          </span>
          <time>{e.time}</time>
        </div>
        <div className="mail-to">
          <span>To</span>
          {e.to} &lt;{e.toEmail}&gt;
        </div>
        <h2 className="mail-subj" id="ad-mail-subj">
          {e.subj}
        </h2>
      </div>
      <div className={`mail-body${e.by === 'alex' ? ' by-firm' : ' by-knomee'}`}>
        {e.by === 'alex' ? (
          <span className="mail-brand" style={i(0)}>
            {brand.logo}
          </span>
        ) : (
          <span className="mail-brand knomee" style={i(0)}>
            <Mark />
            knomee
          </span>
        )}
        <div className="mail-msg" style={i(1)}>
          {e.full}
        </div>
        {onCta ? (
          <button className="mail-cta" type="button" style={i(2)} onClick={onCta}>
            {e.cta}
          </button>
        ) : (
          <span className="mail-cta" style={i(2)}>
            {e.cta}
          </span>
        )}
        <div className="mail-sign" style={i(3)}>
          {e.sign}
        </div>
      </div>
    </div>
  )
}
