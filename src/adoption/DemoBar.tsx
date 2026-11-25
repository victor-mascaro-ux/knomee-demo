/* The dark bar over the demo: which step this is, the presenter's two
   switches, and the way through and out. */

import { useEffect, useRef } from 'react'
import { Mark } from './icons'
import { STEPS } from './steps'

export default function DemoBar({
  idx,
  introsOn,
  onIntros,
  labelsOn,
  onLabels,
  pulse,
  onRestart,
  onBack,
  onNext,
  onExit,
}: {
  idx: number
  introsOn: boolean
  onIntros: (on: boolean) => void
  labelsOn: boolean
  onLabels: (on: boolean) => void
  /** The step's story has played out: Next asks to be pressed. */
  pulse: boolean
  onRestart: () => void
  onBack: () => void
  onNext: () => void
  onExit: () => void
}) {
  const step = STEPS[idx]
  /* The label slides in when the step changes, not on the first draw. */
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
  }, [])
  const goes = mounted.current
  return (
    <header className="ad-bar">
      <div className="ad-bar-brand">
        <Mark />
        <b>Adoption demo</b>
      </div>
      <div className="ad-bar-now" aria-live="polite">
        <span key={idx} className={`ad-now-in${goes ? ' go' : ''}`}>
          <b>
            {idx + 1}/{STEPS.length}
          </b>{' '}
          · {step.title}
        </span>
      </div>
      <span className="ad-bar-prog" style={{ width: `${((idx + 1) / STEPS.length) * 100}%` }} aria-hidden />
      <div className="ad-bar-ctrls">
        <label className="ad-switch">
          <input type="checkbox" checked={introsOn} onChange={(e) => onIntros(e.target.checked)} />
          <span className="ad-track" aria-hidden />
          Intro screens
        </label>
        <label className="ad-switch">
          <input type="checkbox" checked={labelsOn} onChange={(e) => onLabels(e.target.checked)} />
          <span className="ad-track" aria-hidden />
          Intercom labels
        </label>
        <button className="ad-db-btn" type="button" onClick={onRestart}>
          Restart
        </button>
        <button className="ad-db-btn" type="button" onClick={onBack} disabled={idx === 0}>
          Back
        </button>
        <button
          className={`ad-db-btn primary${pulse ? ' pulse' : ''}`}
          type="button"
          onClick={onNext}
          disabled={idx === STEPS.length - 1}
        >
          Next
        </button>
        <span className="ad-bar-sep" aria-hidden />
        <button className="ad-db-btn" type="button" onClick={onExit}>
          Exit Demo
        </button>
      </div>
    </header>
  )
}
