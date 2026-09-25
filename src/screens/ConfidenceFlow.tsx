/* Confidence, taken on the phone.
 *
 * The second adventure, in Financial Joy's shape: an intro with the line it is
 * built on, then six statements, each one a slider from one end of a feeling
 * to the other, then what they add up to, then the badge. The slider's handle
 * is the adventure's own sun, and it turns and brightens as it is moved.
 *
 * The foot is the flow's own, the same as Financial Joy's: the progress, the
 * way one question back, and OK — which, on a statement left where it
 * started, records a sample answer so a demo can be clicked straight through.
 */

import { useEffect, useRef, useState } from 'react'
import './joyFlow.css'
import './joyResults.css'
import './confidenceFlow.css'
import { confidenceAnswers } from '../data/financialId'
import { Gauge } from './profileParts'
import { AboutOverlay, useEndingOverlay, CountUp, Reveal, Typed } from './JoyResults'
import JoyReward from './JoyReward'
import icConfidence from '../assets/adventures/confidence.svg'
import bgConfidence from '../assets/badges/confidence-on-plum.svg'

export interface ConfidenceStatement {
  statement: string
  low: string
  high: string
  /** Where the demo's sample answer leaves the slider. */
  sample: number
}

/* The six, in the design's order. The last is new to the adventure: whether
   working with an advisor is itself a source of confidence. */
export const CONFIDENCE_STATEMENTS: ConfidenceStatement[] = [
  ...confidenceAnswers.map((a) => ({
    statement: a.statement.replace('my financial decisions', 'financial decisions'),
    low: a.low,
    high: a.high,
    sample: a.value,
  })),
  {
    statement: 'I believe that working with a financial advisor/planner improves my confidence.',
    low: 'no, I don’t',
    high: 'yes, I do',
    sample: 84,
  },
]

export interface ConfidenceAnswers {
  /** Per statement, 0–100; null while it has not been moved. */
  values: (number | null)[]
}

/* The dial's reading, from where the six were left. */
export const confidenceReading = (values: number[]) => {
  const mean = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length)
  return mean < 40 ? 'Weak' : mean < 70 ? 'Moderate' : 'Strong'
}

/* A statement said inside a sentence: "I believe I can…" becomes "you
   believe you can…". */
const lower = (st: string) =>
  st
    .replace(/^I’m /, 'you’re ')
    .replace(/^I /, 'you ')
    .replace(/\bmy\b/g, 'your')
    .replace(/\bI\b/g, 'you')
    .replace(/\bme\b/g, 'you')

/* What the reading means, in a line. */
const MEANS: Record<string, string> = {
  Strong: 'You feel sure of where you stand, and of where you are going. That is a strength to build a plan on.',
  Moderate: 'You feel steady in some places and less so in others. Your advisor will start where it feels least sure.',
  Weak: 'Money feels uncertain right now. That is what a plan is for, and your advisor will start there with you.',
}

const ClockIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.4" />
    <path d="M8 4.6V8l2.4 1.6" strokeLinecap="round" />
  </svg>
)

/* A photograph that may not be in public/confidence/ yet. */
function Photo({ src, className, fallback }: { src: string; className?: string; fallback: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <span className={fallback} aria-hidden />
  return <img className={className} src={src} alt="" draggable={false} onError={() => setMissing(true)} />
}

/* A statement's slider: the sun is the handle. Untouched it waits at the
   left; moved, it turns with the value and warms from pale to full. */
function SunSlider({
  value,
  low,
  high,
  label,
  onChange,
}: {
  value: number | null
  low: string
  high: string
  label: string
  onChange: (v: number) => void
}) {
  const v = value ?? 0
  const [held, setHeld] = useState(false)
  return (
    <div className={`cf-slider${value === null ? ' is-untouched' : ''}${held ? ' is-held' : ''}`}>
      <div className="cf-track" style={{ ['--v' as string]: v }}>
        <i className="cf-fill" />
        <span className="cf-sun" aria-hidden>
          <img src={icConfidence} alt="" draggable={false} />
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={v}
          aria-label={label}
          aria-valuetext={`${v} out of 100`}
          data-no-drag-scroll
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={() => setHeld(true)}
          onPointerUp={() => setHeld(false)}
          onPointerCancel={() => setHeld(false)}
          onBlur={() => setHeld(false)}
        />
      </div>
      <div className="cf-ends">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

type Step = 'intro' | number | 'results' | 'badge'

export default function ConfidenceFlow({
  reward,
  onComplete,
  review,
}: {
  /** Her answers, to open straight on the ending with. */
  review?: ConfidenceAnswers
  reward: { before: number; after: number; total: number; next: string }
  onComplete: (a: ConfidenceAnswers) => void
}) {
  const n = CONFIDENCE_STATEMENTS.length
  const [step, setStep] = useState<Step>(review ? 'results' : 'intro')
  /* The ending's overlay: said once a moment after it arrives, as Financial
     Joy's is, and again from "Learn more". */
  const ending = useEndingOverlay(step === 'results')
  const [values, setValues] = useState<(number | null)[]>(() =>
    review ? review.values : CONFIDENCE_STATEMENTS.map(() => null),
  )
  /* Which way the last move went, so a statement slides in from that side. */
  const dir = useRef<1 | -1>(1)

  const at = typeof step === 'number' ? step : step === 'results' ? n : step === 'badge' ? n + 1 : -1
  const go = (s: Step, d: 1 | -1 = 1) => {
    dir.current = d
    setStep(s)
  }

  const onOk = () => {
    if (typeof step === 'number') {
      /* Left where it started: the sample goes in, so the demo can be clicked
         through and still arrive at a reading. */
      if (values[step] === null)
        setValues((vs) => vs.map((x, i) => (i === step ? CONFIDENCE_STATEMENTS[i].sample : x)))
      return go(step + 1 < n ? step + 1 : 'results')
    }
    if (step === 'results') return go('badge')
  }
  const previous = () => {
    if (typeof step === 'number') return go(step > 0 ? step - 1 : 'intro', -1)
    if (step === 'results') return go(n - 1, -1)
  }

  const settled = values.map((x, i) => x ?? CONFIDENCE_STATEMENTS[i].sample)
  const reading = confidenceReading(settled)
  /* Her strongest and her softest, for the flags and the line under them. */
  const high = settled.indexOf(Math.max(...settled))
  const low = settled.indexOf(Math.min(...settled))

  /* Every screen of the adventure starts at its top — the ending most of all,
     which is long and was opening wherever the last screen had been scrolled. */
  useEffect(() => {
    document.querySelector('.cx-viewport')?.scrollTo({ top: 0 })
  }, [step])

  return (
    <div className="jf cf">
      {step === 'intro' && (
        <div className="jf-intro">
          <div className="jf-hero">
            <Photo className="jf-hero-img" src="./confidence/intro.png" fallback="cf-hero-fallback" />
            <figure className="jf-quote">
              <blockquote>
                Confidence in your abilities directly influences your performance, motivation, and
                behavior.
              </blockquote>
              <figcaption>Albert Bandura, psychologist and self-efficacy pioneer</figcaption>
            </figure>
          </div>
          <p className="jf-lead cf-lead">
            Let’s explore how you feel about your finances and what brings you peace of mind.
          </p>
          <div className="jf-start">
            <button className="jf-go" type="button" onClick={() => go(0)}>
              Get Started
            </button>
            <span className="jf-min">
              <ClockIcon /> Takes 1 min
            </span>
          </div>
        </div>
      )}

      {typeof step === 'number' && (
        <div className={`cf-q is-from-${dir.current === 1 ? 'right' : 'left'}`} key={step}>
          <div className="cf-card">
          <span className="cf-count">
            {step + 1} of {n}
          </span>
          <p className="cf-statement">{CONFIDENCE_STATEMENTS[step].statement}</p>
          <SunSlider
            value={values[step]}
            low={CONFIDENCE_STATEMENTS[step].low}
            high={CONFIDENCE_STATEMENTS[step].high}
            label={CONFIDENCE_STATEMENTS[step].statement}
            onChange={(v) => setValues((vs) => vs.map((x, i) => (i === step ? v : x)))}
          />
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className={`jr cfr${ending.held ? ' is-held' : ''}`} key={ending.run}>
          <button className="jr-learn" type="button" onClick={ending.open}>
            Learn more
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
              <circle cx="8" cy="8" r="7" fill="currentColor" />
              <path d="M8 7v4.2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="8" cy="4.7" r="1" fill="#fff" />
            </svg>
          </button>
          {ending.about && (
            <AboutOverlay
              title="Money confidence matters!"
              share={21}
              onClose={ending.close}
              first={
                <>
                  <b>
                    <CountUp to={21} />%
                  </b>{' '}
                  of US adults are <b>confident</b> in budgeting, saving, and investing.
                </>
              }
              second={
                <>
                  <p>
                    Pew Research says that only <b>27%</b> of Americans are <b>confident</b> in their
                    ability to create an investment plan to build wealth.
                  </p>
                  <p>
                    <b>Knowing your confidence</b> is a powerful insight.
                  </p>
                </>
              }
            />
          )}
          <Reveal>
            <h2 className="jr-title">You found your confidence</h2>
            <p className="jr-sub">This is how you feel about your money today:</p>
            {/* The reading as the picture: a warm sky that keeps moving, and on
                it the Financial ID's own confidence row — her word and the dial,
                its needle swinging round to where she landed. */}
            <figure className="jr-memory cfr-hero">
              <span className="jr-sky cfr-sky" aria-hidden>
                <i className="jr-sun" />
                <i className="jr-glow jr-glow-a" />
                <i className="jr-glow jr-glow-b" />
                <i className="jr-glow jr-glow-c" />
              </span>
              <div className="pp-confidence cfr-dial">
                <span className="pp-confidence-label">{reading}</span>
                <span className="cfr-gauge">
                  <Gauge label={reading} />
                </span>
              </div>
              <blockquote className="jr-words cfr-means">
                <Typed text={MEANS[reading]} />
              </blockquote>
              <figcaption className="jr-tag">Your confidence</figcaption>
            </figure>
          </Reveal>

          <Reveal>
            <h3 className="jr-h">What you said</h3>
            <p className="jr-sub">Where you left each one:</p>
            <div className="cfr-answers">
              {CONFIDENCE_STATEMENTS.map((st, i) => (
                <div
                  className={`cfr-answer${i === high ? ' is-high' : ''}${i === low ? ' is-low' : ''}`}
                  key={st.statement}
                  style={{ ['--i' as string]: i, ['--v' as string]: settled[i] }}
                >
                  {i === high && <span className="cfr-flag">Your strongest</span>}
                  {i === low && <span className="cfr-flag">Where to start</span>}
                  <p>{st.statement}</p>
                  <span className="cfr-track">
                    <i className="cfr-fill" />
                    <img className="cfr-sun" src={icConfidence} alt="" />
                  </span>
                  <span className="cfr-ends">
                    <span>{st.low}</span>
                    <span>{st.high}</span>
                  </span>
                </div>
              ))}
            </div>
            {/* What it adds up to: the line a conversation can open with. */}
            <p className="jr-reading">
              <span className="jr-reading-mark" aria-hidden>
                ✦
              </span>
              You feel most sure that {lower(CONFIDENCE_STATEMENTS[high].statement)} You feel least sure
              that {lower(CONFIDENCE_STATEMENTS[low].statement)} That is where your advisor will start.
            </p>
          </Reveal>

          <Reveal className="jr-reward">
            <p className="jr-reward-line">You got a reward!</p>
            <button className="jr-claim" type="button" onClick={() => go('badge')}>
              <span>Claim Badge</span>
            </button>
          </Reveal>
        </div>
      )}

      {step === 'badge' && (
        <JoyReward
          badge={bgConfidence}
          name="Confidence"
          from={reward.before}
          done={reward.after}
          total={reward.total}
          next={reward.next}
          onNext={() => onComplete({ values: settled })}
        />
      )}

      {typeof step === 'number' && (
        <>
          {/* Where you are, at the top under the bar — the foot is only
              Back and the one thing to press. */}
          <div className="jf-top">
            <div className="af-progress" aria-hidden>
              {CONFIDENCE_STATEMENTS.map((_, i) => (
                <i key={i} className={i <= at ? 'is-on' : ''} />
              ))}
            </div>
          </div>
        <div className="jf-foot">
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
          <button className="cx-start jf-ok" type="button" onClick={onOk}>
            OK
          </button>
        </div>
        </>
      )}
    </div>
  )
}
