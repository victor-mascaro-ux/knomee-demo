/* In-button feedback: the standard confirmation for copy, create and send.
   The button itself says it worked ("Copied ✓", "Sent ✓") for a moment, then
   goes back to its label, and the app's toast names what happened ("Link
   copied") at the same moment: both, by the design system's rule. Both labels sit stacked in one grid cell, so the button is always as
   wide as the longer of the two and the layout never jumps when it swaps. */

import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { toast as raiseToast } from '../toast'
import './feedbackButton.css'

export const FLASH_MS = 1800

/** A short-lived "it worked" flag, optionally keyed for several buttons that
    share one owner (three copy buttons on one card, say). */
export function useFlash<K extends string | number | boolean = true>(ms = FLASH_MS) {
  const [flashed, setFlashed] = useState<K | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const flash = useCallback(
    (key: K = true as K) => {
      setFlashed(key)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setFlashed(null), ms)
    },
    [ms],
  )
  return { flashed, flash, is: (key: K = true as K) => flashed === key }
}

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  /** What the button says while confirming — "Copied ✓", or a check glyph. */
  done: ReactNode
  /** Return false (or resolve to false) when nothing happened, so the button
      does not claim it did. */
  onClick?: () => unknown
  /** Controlled: confirm when the owner says so instead of on click. */
  flashing?: boolean
  /** The default tint (lime wash, plum text). Off where the button already
      styles its own `is-done` state. */
  tint?: boolean
  /** What a screen reader hears while confirming, when `done` is not text. */
  announce?: string
  /** The toast's words ("Link copied"). Without it, `announce`, or `done`
      when it is text. false: the owner raises its own. */
  toast?: string | false
}

/** The toast's words for a confirmation: what it names, or what the button
    says without its check. */
export const toastWords = (said: string) => said.replace(/\s*✓\s*$/, '').trim()

export default function FeedbackButton({
  done,
  onClick,
  flashing,
  tint = true,
  announce,
  toast,
  className,
  children,
  type = 'button',
  ...rest
}: Props) {
  const own = useFlash()
  const on = flashing ?? own.is()
  /* The toast rises with the button's own confirmation, once per press. */
  const was = useRef(false)
  useEffect(() => {
    if (on && !was.current && toast !== false) {
      raiseToast(toastWords(toast ?? announce ?? (typeof done === 'string' ? done : '')))
    }
    was.current = on
  }, [on]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <button
      {...rest}
      type={type}
      className={`${className ?? ''} fb${on ? ' is-done' : ''}${on && tint ? ' fb-tint' : ''}`}
      onClick={async () => {
        const r = await onClick?.()
        if (r !== false && flashing === undefined) own.flash()
      }}
    >
      <span className="fb-stack">
        <span className="fb-label" data-off={on || undefined}>
          {children}
        </span>
        <span className="fb-done" data-off={!on || undefined} aria-hidden={!on}>
          {done}
        </span>
      </span>
      {/* Said for screen readers too. */}
      <span className="fb-sr" role="status" aria-live="polite">
        {on ? (announce ?? (typeof done === 'string' ? done : '')) : ''}
      </span>
    </button>
  )
}
