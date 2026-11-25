/* A button that sends: a spinner, then a check with what happened ("Sent"),
   then the result. With reduced motion it acts at once. */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckIcon } from './icons'
import { BUSY_MS, OK_MS, reducedMotion } from './motion'

export default function BusyButton({
  className,
  done = 'Sent',
  onDone,
  children,
}: {
  className: string
  /** What the check says once it has worked. */
  done?: string
  onDone: () => void
  children: ReactNode
}) {
  const [phase, setPhase] = useState<'idle' | 'busy' | 'ok'>('idle')
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const width = useRef<number | undefined>(undefined)
  const ref = useRef<HTMLButtonElement>(null)
  const go = () => {
    if (phase !== 'idle') return
    if (reducedMotion()) {
      onDone()
      return
    }
    /* Holds its width while the label goes, so the row doesn't shift. */
    width.current = ref.current?.offsetWidth
    setPhase('busy')
    timers.current.push(
      window.setTimeout(() => {
        setPhase('ok')
        timers.current.push(window.setTimeout(onDone, OK_MS))
      }, BUSY_MS),
    )
  }
  return (
    <button
      ref={ref}
      className={`${className}${phase === 'busy' ? ' ad-busy' : phase === 'ok' ? ' ad-ok' : ''}`}
      type="button"
      aria-busy={phase === 'busy' || undefined}
      style={phase === 'idle' ? undefined : { minWidth: width.current }}
      onClick={go}
    >
      {phase === 'ok' ? (
        <>
          <CheckIcon />
          <span>{done}</span>
        </>
      ) : (
        <span>{children}</span>
      )}
    </button>
  )
}
