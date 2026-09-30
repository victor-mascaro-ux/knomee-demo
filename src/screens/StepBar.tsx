/* An adventure's step bar: one segment per question, filled for each one
 * already answered — so the first question shows none, and the bar fills as
 * you go. Each segment fills with a quick sweep (advisor-flow.css).
 *
 * `useFinishFill` is the last beat: answering the final question fills the
 * bar to the end, and only then does the flow move on to its results.
 */

import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

export function StepBar({ count, done }: { count: number; done: number }) {
  return (
    <div className="af-progress" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <i key={i} className={i < done ? 'is-on' : ''} />
      ))}
    </div>
  )
}

const FILL_MS = 420

export function useFinishFill() {
  const [full, setFull] = useState(false)
  const timer = useRef(0)
  /** Fill the bar, then `go` once it has visibly filled. */
  const finish = (go: () => void) => {
    setFull(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setFull(false)
      go()
    }, FILL_MS)
  }
  return { full, finish, setFull }
}

/** Run a step change as a view transition: the intro's title — icon, name,
    bar — moves up and becomes the timeline at the top of the first screen
    (the matching view-transition-names are in advisor-flow.css). Where the
    browser has no view transitions, or motion is reduced, it just changes. */
export function morph(change: () => void) {
  const d = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!d.startViewTransition || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return change()
  d.startViewTransition(() => flushSync(change))
}
