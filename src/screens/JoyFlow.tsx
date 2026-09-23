/* Financial Joy, taken on the phone.
 *
 * The client's first adventure, in the shape the advisor's flow already uses:
 * an intro that says why it is worth three minutes, the questions, and a
 * finish that hands back what they said rather than a score. It renders inside
 * the phone's own viewport, so the app bar above it and the footer below it
 * are the shell's — this is only the screens.
 *
 * Three kinds of question, because Financial Joy asks three kinds: what money
 * is for, where they want their attention, and a memory in their own words.
 * The middle one walks the seven areas of a life one at a time — less of it or
 * more of it — because asking for seven answers on one screen gets four.
 *
 * Nothing here is scored. What comes out is what they said, and where it goes
 * is their Financial ID.
 */

import { useState } from 'react'
import './joyFlow.css'
import { JOY_AREAS, joySteps } from '../data/joyFlow'
import icFinancialJoy from '../assets/adventures/financial-joy.svg'
import bgFinancialJoy from '../assets/badges/financial-joy.svg'

export interface JoyAnswers {
  tools: string[]
  /** Per area: −1 less, +1 more, 0 unasked. */
  attention: Record<string, number>
  notes: string[]
}

const emptyAnswers = (): JoyAnswers => ({ tools: [], attention: {}, notes: ['', '', ''] })

const ClockIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.4" />
    <path d="M8 4.6V8l2.4 1.6" strokeLinecap="round" />
  </svg>
)

export default function JoyFlow({
  onClose,
  onComplete,
}: {
  onClose: () => void
  /** Their answers, on the way to the Financial ID. */
  onComplete: (a: JoyAnswers) => void
}) {
  const [at, setAt] = useState(0)
  /* Which of the seven areas the attention screen is on. It is one step in the
     flow and seven screens inside it, so Back walks the areas before it walks
     out of the question. */
  const [area, setArea] = useState(0)
  const [a, setA] = useState<JoyAnswers>(emptyAnswers)
  const step = joySteps[at]

  const next = () => setAt((n) => Math.min(n + 1, joySteps.length - 1))
  const back = () => setAt((n) => Math.max(n - 1, 0))

  const toggleTool = (o: string) =>
    setA((prev) => ({
      ...prev,
      tools: prev.tools.includes(o) ? prev.tools.filter((t) => t !== o) : [...prev.tools, o],
    }))

  const setAttention = (name: string, v: number) =>
    setA((prev) => ({
      ...prev,
      attention: { ...prev.attention, [name]: prev.attention[name] === v ? 0 : v },
    }))

  const noteIndex = joySteps.slice(0, at).filter((s) => s.kind === 'reflect').length
  const setNote = (v: string) =>
    setA((prev) => ({ ...prev, notes: prev.notes.map((n, i) => (i === noteIndex ? v : n)) }))

  /* The footer is the flow's own: where you are, the way back, and the one
     thing to press. The last screen hands the answers over and leaves. */
  const cta =
    step.kind === 'intro'
      ? step.cta
      : step.kind === 'done'
        ? step.cta
        : step.kind === 'badge'
          ? step.cta
          : 'OK'

  const onCta = () => {
    if (step.kind === 'badge') return onComplete(a)
    next()
  }

  return (
    <div className="jf">
      {step.kind === 'intro' && (
        <div className="jf-intro">
          <span className="jf-art">
            <img src={icFinancialJoy} alt="" />
          </span>
          <h2 className="af-h1">{step.title}</h2>
          <p className="af-body">{step.body}</p>
          <span className="jf-min">
            <ClockIcon /> about {step.minutes} min
          </span>
        </div>
      )}

      {step.kind === 'pick' && (
        <div className="af-q">
          <div className="af-eyebrow">{step.eyebrow}</div>
          <h2 className="af-h2">{step.title}</h2>
          <p className="af-body">{step.body}</p>
          <div className="jf-tiles">
            {step.options.map((o) => {
              const on = a.tools.includes(o)
              return (
                <button
                  key={o}
                  type="button"
                  className={`jf-tile ${on ? 'is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => toggleTool(o)}
                >
                  {o}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step.kind === 'split' && (
        <div className="af-q jf-split">
          <div className="af-eyebrow">{step.eyebrow}</div>
          <div className="jf-count">
            {area + 1}/{JOY_AREAS.length}
          </div>
          <h2 className="af-h2">{JOY_AREAS[area]}</h2>
          <p className="af-body">Would you like this to take less of you, or more?</p>
          {/* Less and more, as the two things they are: the same size, either
              side of the area they are about. */}
          <div className="jf-split-controls">
            <button
              type="button"
              className={`jf-way jf-less ${a.attention[JOY_AREAS[area]] === -1 ? 'is-on' : ''}`}
              aria-pressed={a.attention[JOY_AREAS[area]] === -1}
              onClick={() => setAttention(JOY_AREAS[area], -1)}
            >
              <span aria-hidden>−</span>
              Less
            </button>
            <button
              type="button"
              className={`jf-way jf-more ${a.attention[JOY_AREAS[area]] === 1 ? 'is-on' : ''}`}
              aria-pressed={a.attention[JOY_AREAS[area]] === 1}
              onClick={() => setAttention(JOY_AREAS[area], 1)}
            >
              <span aria-hidden>+</span>
              More
            </button>
          </div>
          <div className="jf-areas">
            <button
              type="button"
              className="jf-arrow"
              aria-label="The area before this one"
              disabled={area === 0}
              onClick={() => setArea((n) => Math.max(0, n - 1))}
            >
              ‹
            </button>
            <span className="jf-dots" aria-hidden>
              {JOY_AREAS.map((name, i) => (
                <i key={name} className={i === area ? 'is-on' : a.attention[name] ? 'is-done' : ''} />
              ))}
            </span>
            <button
              type="button"
              className="jf-arrow"
              aria-label="The next area"
              disabled={area === JOY_AREAS.length - 1}
              onClick={() => setArea((n) => Math.min(JOY_AREAS.length - 1, n + 1))}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {step.kind === 'reflect' && (
        <div className="af-q">
          <div className="af-eyebrow">{step.eyebrow}</div>
          <h2 className="af-h2">{step.title}</h2>
          <p className="af-body">{step.body}</p>
          <textarea
            className="jf-note"
            rows={5}
            value={a.notes[noteIndex] ?? ''}
            placeholder={step.placeholder}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      {step.kind === 'done' && (
        <div className="jf-done">
          <h2 className="af-h1">{step.title}</h2>
          <p className="af-body">{step.body}</p>
          <div className="jf-recap">
            <span className="jf-recap-head">Money is a tool for</span>
            <div className="jf-chips">
              {a.tools.length ? (
                a.tools.map((t) => (
                  <span className="jf-chip" key={t}>
                    {t}
                  </span>
                ))
              ) : (
                <span className="jf-none">Nothing chosen — you can come back to it.</span>
              )}
            </div>
            <span className="jf-recap-head">More attention</span>
            <div className="jf-chips">
              {JOY_AREAS.filter((n) => a.attention[n] === 1).map((n) => (
                <span className="jf-chip is-more" key={n}>
                  {n}
                </span>
              )) || null}
              {!JOY_AREAS.some((n) => a.attention[n] === 1) && (
                <span className="jf-none">Nothing marked.</span>
              )}
            </div>
            <span className="jf-recap-head">Less attention</span>
            <div className="jf-chips">
              {JOY_AREAS.filter((n) => a.attention[n] === -1).map((n) => (
                <span className="jf-chip is-less" key={n}>
                  {n}
                </span>
              ))}
              {!JOY_AREAS.some((n) => a.attention[n] === -1) && (
                <span className="jf-none">Nothing marked.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {step.kind === 'badge' && (
        <div className="jf-badge">
          <img className="jf-badge-art" src={bgFinancialJoy} alt="" />
          <h2 className="af-h1">{step.title}</h2>
          <p className="af-body">{step.body}</p>
        </div>
      )}

      <div className="jf-foot">
        <button
          className="jf-back"
          type="button"
          onClick={at === 0 ? onClose : back}
          aria-label={at === 0 ? 'Leave this adventure' : 'The screen before this one'}
        >
          {at === 0 ? 'Not now' : 'Back'}
        </button>
        <span className="jf-progress" aria-hidden>
          {joySteps.map((_, i) => (
            <i key={i} className={i <= at ? 'is-on' : ''} />
          ))}
        </span>
        <button className="jf-ok" type="button" onClick={onCta}>
          {cta}
        </button>
      </div>
    </div>
  )
}
