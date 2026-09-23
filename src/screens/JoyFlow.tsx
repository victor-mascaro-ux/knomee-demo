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

import { useEffect, useRef, useState } from 'react'
import './joyFlow.css'
import { JOY_AREA_CARDS, joySteps } from '../data/joyFlow'
import JoySwipe from './JoySwipe'
import JoyResults from './JoyResults'
import bgFinancialJoy from '../assets/badges/financial-joy.svg'

export interface JoyAnswers {
  tools: string[]
  /** Per area: −1 less, +1 more, 0 unasked. */
  attention: Record<string, number>
  notes: string[]
  /** Their own word for what money is for, if none of the nine is it. */
  other: string
}

/* The answers OK records for a question left blank — the ones the design was
   drawn with. */
const SAMPLE_TOOLS = ['Comfort', 'Supporting my family']
const SAMPLE_WAYS: Record<string, number> = {
  'Work and career': 1,
  'Financial planning and management': 1,
  'Health and wellness': -1,
  'Family and relationships': -1,
  'Hobbies and interests': -1,
  'Travel and adventure': -1,
  'Home life': 0,
}

const emptyAnswers = (): JoyAnswers => ({
  tools: [],
  attention: {},
  notes: ['', '', ''],
  other: '',
})

/* A photograph that may not have been dropped into public/joy/ yet: until it
   is, the slot shows a tint of the same shape, so the screen keeps its layout
   and nobody sees a broken image. */
function JoyImage({ src, className, fallback }: { src: string; className?: string; fallback: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <span className={fallback} aria-hidden />
  return (
    <img className={className} src={src} alt="" draggable={false} onError={() => setMissing(true)} />
  )
}

const ClockIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.4" />
    <path d="M8 4.6V8l2.4 1.6" strokeLinecap="round" />
  </svg>
)

export default function JoyFlow({
  onComplete,
}: {
  /** Leaving is the bar's cross, which the shell owns; kept for the caller. */
  onClose?: () => void
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

  const next = () => {
    window.clearInterval(typing.current)
    setAt((n) => Math.min(n + 1, joySteps.length - 1))
  }
  /* One question back. Inside the deck that is the card before this one, put
     back on top to be sorted again; out of it, the screen before — and a deck
     come back to opens on its last card, the one answered last. */
  const previous = () => {
    if (step.kind === 'split' && area > 0) return setArea(area - 1)
    const to = Math.max(0, at - 1)
    if (joySteps[to]?.kind === 'split') setArea(JOY_AREA_CARDS.length - 1)
    setAt(to)
  }

  const toggleTool = (o: string) =>
    setA((prev) => ({
      ...prev,
      tools: prev.tools.includes(o) ? prev.tools.filter((t) => t !== o) : [...prev.tools, o],
    }))

  const noteIndex = joySteps.slice(0, at).filter((s) => s.kind === 'reflect').length
  const setNote = (v: string) =>
    setA((prev) => ({ ...prev, notes: prev.notes.map((n, i) => (i === noteIndex ? v : n)) }))

  /* Types an example into this question's box a few letters at a time. Stops
     if the screen changes under it, so it never writes into the next box. */
  const typing = useRef(0)
  useEffect(() => () => window.clearInterval(typing.current), [])
  const typeIn = (text: string) => {
    window.clearInterval(typing.current)
    const into = noteIndex
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let n = reduce ? text.length : 0
    const put = (v: string) =>
      setA((prev) => ({ ...prev, notes: prev.notes.map((x, i) => (i === into ? v : x)) }))
    if (reduce) return put(text)
    typing.current = window.setInterval(() => {
      n = Math.min(text.length, n + 3)
      put(text.slice(0, n))
      if (n >= text.length) window.clearInterval(typing.current)
    }, 16)
  }

  /* The footer is the flow's own: the one thing to press, and where you are.
     The last screen hands the answers over and leaves. */
  const cta =
    step.kind === 'intro'
      ? step.cta
      : step.kind === 'done'
        ? step.cta
        : step.kind === 'badge'
          ? step.cta
          : 'OK'

  /* OK on a question left unanswered records a sample answer and moves on —
     so a demo can be clicked straight through and still arrive at a results
     screen with something true-looking on it. What was answered is kept. */
  const onCta = () => {
    if (step.kind === 'badge') return onComplete(a)
    window.clearInterval(typing.current)
    if (step.kind === 'pick' && a.tools.length === 0 && !a.other.trim())
      setA((prev) => ({ ...prev, tools: SAMPLE_TOOLS }))
    if (step.kind === 'split')
      setA((prev) => {
        const attention = { ...prev.attention }
        for (const c of JOY_AREA_CARDS) if (!(c.label in attention)) attention[c.label] = SAMPLE_WAYS[c.label] ?? 0
        return { ...prev, attention }
      })
    if (step.kind === 'reflect' && !(a.notes[noteIndex] ?? '').trim()) setNote(step.example)
    next()
  }

  return (
    <div className="jf">
      {step.kind === 'intro' && (
        <div className="jf-intro">
          {/* The portrait on its teal disc, and beside it the line the
              adventure is built on — who said it, underneath. */}
          <div className="jf-hero">
            <JoyImage className="jf-hero-img" src={step.image} fallback="jf-hero-fallback" />
            <figure className="jf-quote">
              <blockquote>{step.quote}</blockquote>
              <figcaption>{step.source}</figcaption>
            </figure>
          </div>
          <h2 className="jf-title">{step.title}</h2>
          <p className="jf-body">{step.body}</p>
          <p className="jf-lead">{step.lead}</p>
          <div className="jf-start">
            <button className="jf-go" type="button" onClick={next}>
              {step.cta}
            </button>
            <span className="jf-min">
              <ClockIcon /> Takes {step.minutes} min
            </span>
          </div>
        </div>
      )}

      {step.kind === 'pick' && (
        <div className="jf-pick">
          <h2 className="jf-pick-title">{step.eyebrow}</h2>
          <p className="jf-pick-sub">{step.title}</p>
          <p className="jf-pick-note">{step.body}</p>
          {/* Photographs, two to a row, each with its word under it. A chosen
              one wears the lime ring and its word goes bold; once three are
              chosen the rest wait, and say so by fading. */}
          <div className="jf-photos">
            {step.options.map((o) => {
              const on = a.tools.includes(o.label)
              const full = !on && a.tools.length >= step.max
              return (
                <button
                  key={o.label}
                  type="button"
                  className={`jf-photo${on ? ' is-on' : ''}${full ? ' is-full' : ''}`}
                  aria-pressed={on}
                  aria-disabled={full}
                  onClick={() => !full && toggleTool(o.label)}
                >
                  <span className="jf-photo-frame">
                    <JoyImage src={o.src} fallback="jf-photo-fallback" />
                  </span>
                  <span className="jf-photo-label">{o.label}</span>
                </button>
              )
            })}
          </div>
          <label className="jf-other-label" htmlFor="jf-other">
            {step.other.label}
          </label>
          <span className="jf-other-hint">{step.other.hint}</span>
          <input
            id="jf-other"
            className="jf-other"
            value={a.other}
            placeholder={step.other.placeholder}
            onChange={(e) => setA((prev) => ({ ...prev, other: e.target.value }))}
          />
        </div>
      )}

      {step.kind === 'split' && (
        <div className="jf-split">
          <div className="jf-count">
            {Math.min(area + 1, JOY_AREA_CARDS.length)} / {JOY_AREA_CARDS.length}
          </div>
          <p className="jf-split-ask">
            Would you like to direct <b className="is-more">more</b>,{' '}
            <b className="is-same">the same</b>, or <b className="is-less">less</b> of your
            attention to…
          </p>
          <JoySwipe
            areas={JOY_AREA_CARDS}
            at={area}
            onAnswer={(name, way) => {
              setA((prev) => ({ ...prev, attention: { ...prev.attention, [name]: way } }))
              /* The last card thrown is the question answered. */
              if (area + 1 >= JOY_AREA_CARDS.length) next()
              else setArea(area + 1)
            }}
          />
        </div>
      )}

      {step.kind === 'reflect' && (
        <div className="af-q">
          <div className="af-eyebrow">{step.eyebrow}</div>
          <h2 className="af-h2">{step.title}</h2>
          <p className="af-body">{step.body}</p>
          {/* For a demo, and invisible to the room: a single click is the box
              as any box — she writes what she likes. A double-click on the
              empty box types in the sample answer, as if she were writing it.
              With words already there a double-click does what it always
              does, and selects one. */}
          <textarea
            className="jf-note"
            rows={5}
            value={a.notes[noteIndex] ?? ''}
            placeholder={step.placeholder}
            onChange={(e) => setNote(e.target.value)}
            onDoubleClick={(e) => {
              if (e.currentTarget.value.trim()) return
              typeIn(step.example)
            }}
          />
        </div>
      )}

      {step.kind === 'done' && (
        <JoyResults answers={a} cta={step.cta} onClaim={next} />
      )}

      {step.kind === 'badge' && (
        <div className="jf-badge">
          <img className="jf-badge-art" src={bgFinancialJoy} alt="" />
          <h2 className="af-h1">{step.title}</h2>
          <p className="af-body">{step.body}</p>
        </div>
      )}

      {/* The advisor flow's segmented progress, one bar per screen, and the
          one thing to press beside it. There is no Back — the
          bar's cross is the way out, and a question is changed by answering it
          again. The intro carries its own Get Started, so it has no foot. */}
      {step.kind !== 'intro' && step.kind !== 'done' && (
        <div className="jf-foot">
          {/* Where you are, and under it the way one question back; then the
              one thing to press. */}
          <div className="jf-where">
            <div className="af-progress" aria-hidden>
              {joySteps.slice(1).map((_, i) => (
                <i key={i} className={i < at ? 'is-on' : ''} />
              ))}
            </div>
            <button className="jf-prev" type="button" onClick={previous}>
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden>
                <path
                  d="M10 3.5 5.5 8 10 12.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Previous question
            </button>
          </div>
          <button className="cx-start jf-ok" type="button" onClick={onCta}>
            {cta}
          </button>
        </div>
      )}
    </div>
  )
}
