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
 *
 * The mechanism is shared: the advisor's Practice Joy is this same flow handed
 * different `content` — its own questions, photographs, results copy and badge
 * — so the two cannot drift apart. The client's is the default.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import './joyFlow.css'
import { JOY_AREA_CARDS, JOY_PICKS, joySteps, type JoyPick, type JoyStep } from '../data/joyFlow'
import JoySwipe from './JoySwipe'
import JoyResults, { type JoyResultsCopy } from './JoyResults'
import JoyReward from './JoyReward'
/* The badge as the reward shows it: the same art with its lettering in white,
   for the plum it sits on there. */
import bgFinancialJoy from '../assets/badges/financial-joy-on-plum.svg'

export interface JoyAnswers {
  tools: string[]
  /** Per area: −1 less, +1 more, 0 unasked. */
  attention: Record<string, number>
  notes: string[]
  /** Their own word for what money is for, if none of the nine is it. */
  other: string
}

/** Everything that makes this Financial Joy rather than another adventure of
    the same shape. */
export interface JoyContent {
  steps: JoyStep[]
  /** Every photograph a pick can be, so the results can show the chosen ones. */
  picks: JoyPick[]
  /** The deck's cards, in order. */
  areas: JoyPick[]
  /** The answers OK records for a question left blank, for a demo clicked
      straight through. Leave it out and a blank question is skipped instead —
      the honest behaviour for somebody actually answering. */
  sample?: { tools: string[]; ways: Record<string, number> }
  /** The badge the reward screen hands over. Left out, there is no reward
      screen: the ending's button is Continue and finishes the adventure. */
  badge?: string
  badgeName?: string
  /** Lettering for the badge's top arc, when the badge art has none of its own. */
  badgeArcTitle?: string
  /** The line over the deck. */
  splitAsk?: ReactNode
  /** The ending's words. Left out, it reads as the client's. */
  results?: JoyResultsCopy
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

export const CLIENT_JOY: JoyContent = {
  steps: joySteps,
  picks: JOY_PICKS,
  areas: JOY_AREA_CARDS,
  sample: { tools: SAMPLE_TOOLS, ways: SAMPLE_WAYS },
  badge: bgFinancialJoy,
  badgeName: 'Financial Joy',
}

/* Financial Joy answered entirely with the samples — what clicking OK through
   every screen records, and what the adventures list's shortcut records. */
export const sampleJoyAnswers = (): JoyAnswers => ({
  tools: SAMPLE_TOOLS,
  attention: { ...SAMPLE_WAYS },
  notes: joySteps.filter((s) => s.kind === 'reflect').map((s) => (s.kind === 'reflect' ? s.example : '')),
  other: '',
})

const emptyAnswers = (steps: JoyStep[]): JoyAnswers => ({
  tools: [],
  attention: {},
  notes: steps.filter((s) => s.kind === 'reflect').map(() => ''),
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

const CLIENT_SPLIT_ASK = (
  <>
    Would you like to direct <b className="is-more">more</b>, <b className="is-same">the same</b>, or{' '}
    <b className="is-less">less</b> of your attention to…
  </>
)

type Reward = { before: number; after: number; total: number; next: string }

export default function JoyFlow({
  onComplete,
  reward: rewardFor = { before: 0, after: 1, total: 5, next: 'Confidence' },
  review,
  content = CLIENT_JOY,
  reflectSlot,
}: {
  /** Her answers, to open straight on the ending with — reopened from her
      Financial ID rather than taken. */
  review?: JoyAnswers
  /** Leaving is the bar's cross, which the shell owns; kept for the caller. */
  onClose?: () => void
  /** Where her journey stands, for the reward: the count before and after
      this adventure (the same when it is being taken again), and what is
      next. */
  reward?: Reward | ((a: JoyAnswers) => Reward)
  /** Their answers, on the way to the Financial ID. */
  onComplete: (a: JoyAnswers) => void
  content?: JoyContent
  /** What a caller adds around a free-text question — the advisor's privacy
      switch above the box, and the microphone below it. */
  reflectSlot?: (
    step: Extract<JoyStep, { kind: 'reflect' }>,
    value: string,
    set: (v: string) => void,
  ) => { above?: ReactNode; below?: ReactNode }
}) {
  const steps = content.steps
  const areas = content.areas
  const sample = content.sample
  const [at, setAt] = useState(() => (review ? steps.findIndex((s) => s.kind === 'done') : 0))
  /* Which of the seven areas the attention screen is on. It is one step in the
     flow and seven screens inside it, so Back walks the areas before it walks
     out of the question. */
  const [area, setArea] = useState(0)
  /* Always opened empty, the client's way: taking an adventure again is
     answering it again, not editing what the device remembers. */
  const [a, setA] = useState<JoyAnswers>(() => review ?? emptyAnswers(steps))
  const step = steps[at]
  /* The reward can depend on what was answered: an advisor's adventure only
     counts as complete once every question in it is. */
  const reward = typeof rewardFor === 'function' ? rewardFor(a) : rewardFor

  const next = () => {
    window.clearInterval(typing.current)
    setAt((n) => Math.min(n + 1, steps.length - 1))
  }
  /* One question back. Inside the deck that is the card before this one, put
     back on top to be sorted again; out of it, the screen before — and a deck
     come back to opens on its last card, the one answered last. */
  const previous = () => {
    if (step.kind === 'split' && area > 0) return setArea(area - 1)
    const to = Math.max(0, at - 1)
    if (steps[to]?.kind === 'split') setArea(areas.length - 1)
    setAt(to)
  }

  const toggleTool = (o: string) =>
    setA((prev) => ({
      ...prev,
      tools: prev.tools.includes(o) ? prev.tools.filter((t) => t !== o) : [...prev.tools, o],
    }))

  const noteIndex = steps.slice(0, at).filter((s) => s.kind === 'reflect').length
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

  /* Nothing given on this screen yet. Without samples to fall back on, the
     button says what pressing it does: skips the question. */
  const blank =
    (step.kind === 'pick' && a.tools.length === 0 && !a.other.trim()) ||
    (step.kind === 'reflect' && !(a.notes[noteIndex] ?? '').trim())

  /* The footer is the flow's own: the one thing to press, and where you are.
     The last screen hands the answers over and leaves. */
  const cta =
    step.kind === 'intro' || step.kind === 'done' || step.kind === 'badge' || step.kind === 'pause'
      ? step.cta
      : blank && !sample
        ? 'Skip this question'
        : 'OK'

  /* OK on a question left unanswered records a sample answer and moves on —
     so a demo can be clicked straight through and still arrive at a results
     screen with something true-looking on it. What was answered is kept. */
  const onCta = () => {
    if (step.kind === 'badge') return onComplete(a)
    window.clearInterval(typing.current)
    if (sample) {
      if (step.kind === 'pick' && a.tools.length === 0 && !a.other.trim())
        setA((prev) => ({ ...prev, tools: sample.tools }))
      if (step.kind === 'split')
        setA((prev) => {
          const attention = { ...prev.attention }
          for (const c of areas) if (!(c.label in attention)) attention[c.label] = sample.ways[c.label] ?? 0
          return { ...prev, attention }
        })
      if (step.kind === 'reflect' && !(a.notes[noteIndex] ?? '').trim()) setNote(step.example)
    }
    next()
  }

  /* Every screen of the adventure starts at its top — the ending most of all,
     which is long and was opening wherever the last screen had been scrolled. */
  useEffect(() => {
    document.querySelector('.cx-viewport')?.scrollTo({ top: 0 })
  }, [at])

  const slot = step.kind === 'reflect' ? reflectSlot?.(step, a.notes[noteIndex] ?? '', setNote) : undefined

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

      {step.kind === 'pause' && (
        <div className="af-reflect">
          <h2 className="af-h2">{step.title}</h2>
          <p className="af-body">{step.body}</p>
        </div>
      )}

      {step.kind === 'split' && (
        <div className="jf-split">
          <div className="jf-count">
            {Math.min(area + 1, areas.length)} / {areas.length}
          </div>
          <p className="jf-split-ask">{content.splitAsk ?? CLIENT_SPLIT_ASK}</p>
          <JoySwipe
            areas={areas}
            at={area}
            onAnswer={(name, way) => {
              setA((prev) => ({ ...prev, attention: { ...prev.attention, [name]: way } }))
              /* The last card thrown is the question answered. */
              if (area + 1 >= areas.length) next()
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
          {slot?.above}
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
          {slot?.below}
          {step.hints && (
            <div className="af-hints">
              <div className="af-hints-title">Tap a prompt to start your answer</div>
              {step.hints.map((h) => (
                <button
                  key={h}
                  type="button"
                  className="af-hint"
                  onClick={() => {
                    const seed = h.replace(/^[“"]|[”"]$/g, '')
                    const had = a.notes[noteIndex] ?? ''
                    setNote(had ? `${had} ${seed}` : seed)
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step.kind === 'done' && (
        <JoyResults
          answers={a}
          cta={step.cta}
          onClaim={content.badge ? next : () => onComplete(a)}
          rewardLine={content.badge ? undefined : null}
          picks={content.picks}
          areas={areas}
          copy={content.results}
        />
      )}

      {step.kind === 'badge' && content.badge && (
        <JoyReward
          badge={content.badge}
          name={content.badgeName}
          arcTitle={content.badgeArcTitle}
          from={reward.before}
          done={reward.after}
          total={reward.total}
          next={reward.next}
          onNext={onCta}
        />
      )}

      {/* The advisor flow's segmented progress, one bar per screen, and the
          one thing to press beside it. There is no Back — the
          bar's cross is the way out, and a question is changed by answering it
          again. The intro carries its own Get Started, so it has no foot. */}
      {step.kind !== 'intro' && step.kind !== 'done' && step.kind !== 'badge' && (
        <>
          {/* Where you are, at the top under the bar — the foot is only
              Back and the one thing to press. */}
          <div className="jf-top">
            <div className="af-progress" aria-hidden>
              {steps.slice(1).map((_, i) => (
                <i key={i} className={i < at ? 'is-on' : ''} />
              ))}
            </div>
          </div>
        <div className="jf-foot">
          {/* Where you are, and under it the way one question back; then the
              one thing to press. */}
          <div className="jf-where">
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
          <button className={`cx-start jf-ok${cta === 'Skip this question' ? ' is-skip' : ''}`} type="button" onClick={onCta}>
            {cta}
          </button>
        </div>
        </>
      )}
    </div>
  )
}
