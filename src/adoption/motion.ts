/* Motion helpers. Everything that moves is skipped when the viewer prefers
   reduced motion: the CSS keeps its animations behind
   prefers-reduced-motion: no-preference, and these timers run their action
   straight away instead. */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Closes play a short exit: `leave(fn)` marks the piece as leaving, then runs
    `fn` (which takes it away) once the exit has played. */
export function useLeave(ms = 190): [boolean, (fn: () => void) => void] {
  const [leaving, setLeaving] = useState(false)
  const busy = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const leave = useCallback(
    (fn: () => void) => {
      if (reducedMotion()) {
        fn()
        return
      }
      if (busy.current) return
      busy.current = true
      setLeaving(true)
      timer.current = window.setTimeout(() => {
        busy.current = false
        setLeaving(false)
        fn()
      }, ms)
    },
    [ms],
  )
  return [leaving, leave]
}

/** A send's timing, as the prototype has it: a spinner, then the check, then
    what the send does. */
export const BUSY_MS = 560
export const OK_MS = 340


/* A press ripple on the buttons that do something: drawn from where the
   pointer went down, inside the button, then gone. */
const RIPPLED =
  '.ic-btn, .ad-nudge-btn, button.mail-cta, .ask-opt, .ic-opt, .notif, .ad-cal-btn, .ad-ask .btn'

export function useRipples(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const box = root.current
    if (!box) return
    const down = (e: PointerEvent) => {
      if (reducedMotion()) return
      const b = (e.target as Element | null)?.closest<HTMLElement>(RIPPLED)
      if (!b || !box.contains(b) || (b as HTMLButtonElement).disabled) return
      const r = b.getBoundingClientRect()
      /* In case the page is zoomed: the button's own pixels, not the screen's. */
      const z = b.offsetWidth ? r.width / b.offsetWidth : 1
      const d = (Math.max(r.width, r.height) * 2.2) / z
      const s = document.createElement('span')
      s.className = 'ad-ripple'
      s.style.width = s.style.height = `${d}px`
      s.style.left = `${(e.clientX - r.left) / z - d / 2}px`
      s.style.top = `${(e.clientY - r.top) / z - d / 2}px`
      b.appendChild(s)
      window.setTimeout(() => s.remove(), 650)
    }
    box.addEventListener('pointerdown', down, true)
    return () => box.removeEventListener('pointerdown', down, true)
  }, [root])
}
