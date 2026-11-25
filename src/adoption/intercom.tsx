/* What Intercom puts on Alex's dashboard, each with a yellow "Intercom · …"
   tag so the room can tell them from the product. The sender is the firm,
   Acme Advisors, as Intercom is set up for the pilot. */

import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { ChatIcon, XIcon } from './icons'

export function Tag({ label }: { label: string }) {
  return <span className="ic-tag">Intercom · {label}</span>
}

/** The firm's letter, in its colour: who an Intercom message is from. */
export function FirmAvatar() {
  return (
    <span className="ic-av firm" aria-hidden>
      A
    </span>
  )
}

/** A banner across the top of the page, under the tabs. */
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
    <div className={`ic-banner ic-outline${leaving ? ' leaving' : ''}`} data-ad-live>
      <Tag label="Banner" />
      <FirmAvatar />
      <p>
        <b>{title}</b> {children}
      </p>
      <button className="ic-btn" type="button" onClick={onAction}>
        {action}
      </button>
      <button className="ic-close" type="button" aria-label="Dismiss" onClick={onDismiss}>
        <XIcon />
      </button>
    </div>
  )
}

/** A tooltip that points at something on the page: under it, its arrow at the
    thing's right end ('right'), or at its start ('left'). It follows the page
    as it scrolls and hides once the thing is out of view. */
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
  device: RefObject<HTMLElement | null>
  scroller: RefObject<HTMLElement | null>
  side?: 'left' | 'right'
  leaving: boolean
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const find = useRef(anchor)
  find.current = anchor
  useLayoutEffect(() => {
    const place = () => {
      const tip = ref.current
      const dev = device.current
      const at = find.current()
      if (!tip || !dev || !at) {
        if (tip) tip.style.visibility = 'hidden'
        return
      }
      const d = dev.getBoundingClientRect()
      const b = at.getBoundingClientRect()
      if (side === 'right') {
        tip.style.top = `${b.bottom - d.top + 14}px`
        tip.style.left = `${Math.max(12, b.right - d.left - tip.offsetWidth + 18)}px`
        tip.style.visibility = b.bottom > d.top + 64 && b.bottom < d.bottom - 150 ? 'visible' : 'hidden'
      } else {
        tip.style.top = `${b.bottom - d.top + 34}px`
        tip.style.left = `${Math.max(12, b.left - d.left - 14)}px`
        tip.style.visibility = b.bottom > d.top + 64 && b.bottom < d.bottom - 130 ? 'visible' : 'hidden'
      }
    }
    place()
    const sc = scroller.current
    sc?.addEventListener('scroll', place, { passive: true })
    window.addEventListener('resize', place)
    /* The page settles after fonts and pictures load; a few more looks catch it. */
    void document.fonts?.ready.then(place)
    const t = [120, 400, 900].map((ms) => window.setTimeout(place, ms))
    return () => {
      sc?.removeEventListener('scroll', place)
      window.removeEventListener('resize', place)
      t.forEach((x) => window.clearTimeout(x))
    }
  }, [device, scroller, side])
  return (
    <div
      ref={ref}
      className={`ic ic-card ic-tip ic-outline${side === 'left' ? ' left' : ''}${leaving ? ' leaving' : ''}`}
    >
      <Tag label="Tooltip" />
      <button className="ic-close" type="button" aria-label="Close" onClick={onClose}>
        <XIcon />
      </button>
      <p>{children}</p>
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
