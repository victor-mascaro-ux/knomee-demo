/* Motion helpers. Everything that moves is skipped when the viewer prefers
   reduced motion: the CSS keeps its animations behind
   prefers-reduced-motion: no-preference, and these timers run their action
   straight away instead. */

import { useCallback, useEffect, useRef, useState } from 'react'

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
