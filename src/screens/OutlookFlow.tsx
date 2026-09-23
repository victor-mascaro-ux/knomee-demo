/* Outlook, taken on the phone — and taken on a sky.
 *
 * What worries them, and what they hope for, in their own words. The design
 * asks it as two screens of the same shape: a question, a few suggestions to
 * start from, a box, and a list that grows as each one is added. Here the
 * list is also weather. Every concern added drifts in as a cloud over a dusk
 * sky at the top of the screen; on the hopes screen the clouds thin, a sun
 * comes up behind them, and every hope added rises as a light. The ending is
 * the whole sky at once — the clouds low, the lights above them.
 *
 * The house rules hold: a double-click on the empty box types a sample in,
 * and OK with nothing added records the samples, so a demo can be clicked
 * straight through.
 */

import { useEffect, useRef, useState } from 'react'
import './joyFlow.css'
import './joyResults.css'
import './outlookFlow.css'
import { financialId } from '../data/financialId'
import JoyReward from './JoyReward'
import { Reveal, Typed } from './JoyResults'
import bgOutlook from '../assets/badges/outlook-on-plum.svg'

export interface OutlookAnswers {
  concerns: string[]
  hopes: string[]
}

/* Things people say, to start from: tapping one puts it in the box to finish
   in their own words. */
const CONCERN_STARTS = [
  'Health',
  'Paying for college',
  'Losing my job',
  'Caring for my parents',
  'The market',
  'Not saving enough',
  'Debt',
  'What if I get sick?',
  'Retiring on time',
]
const HOPE_STARTS = [
  'Retire early',
  'Travel more',
  'A home by the water',
  'My kids thriving',
  'Giving back',
  'More time with family',
  'Start a business',
  'Peace of mind',
]

/* The samples a demo types in, and OK records: her authored answers. */
export const SAMPLE_OUTLOOK: OutlookAnswers = {
  concerns: financialId.outlook.concerns,
  hopes: financialId.outlook.hopes,
}

const ClockIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.4" />
    <path d="M8 4.6V8l2.4 1.6" strokeLinecap="round" />
  </svg>
)

function Photo({ src, className, fallback }: { src: string; className?: string; fallback: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <span className={fallback} aria-hidden />
  return <img className={className} src={src} alt="" draggable={false} onError={() => setMissing(true)} />
}

/* Where each cloud and each light sits on the sky, so they spread out rather
   than stack: fixed spots, used in order. */
const CLOUD_SPOTS = [
  { x: 14, y: 30, s: 1 },
  { x: 58, y: 18, s: 0.85 },
  { x: 34, y: 56, s: 0.95 },
  { x: 76, y: 48, s: 0.8 },
  { x: 6, y: 64, s: 0.75 },
  { x: 48, y: 76, s: 0.7 },
]
const LIGHT_SPOTS = [
  { x: 22, y: 26 },
  { x: 68, y: 20 },
  { x: 44, y: 12 },
  { x: 84, y: 38 },
  { x: 10, y: 44 },
  { x: 56, y: 36 },
]

/* The sky at the top of the screens. `dawn` is the hopes screen and the
   ending: the clouds thin, the sun is up, and hopes are lights. */
function Sky({
  concerns,
  hopes,
  dawn,
  tall,
}: {
  concerns: string[]
  hopes: string[]
  dawn: boolean
  tall?: boolean
}) {
  return (
    <div className={`ol-sky${dawn ? ' is-dawn' : ''}${tall ? ' is-tall' : ''}`} aria-hidden>
      <i className="ol-sun" />
      <i className="ol-haze" />
      {concerns.slice(0, CLOUD_SPOTS.length).map((c, i) => {
        const p = CLOUD_SPOTS[i]
        return (
          <span
            className="ol-cloud"
            key={`c${i}:${c}`}
            style={{ left: `${p.x}%`, top: `${tall ? p.y * 0.6 + 34 : p.y}%`, ['--s' as string]: p.s, ['--i' as string]: i }}
          >
            {tall && <b>{short(c)}</b>}
          </span>
        )
      })}
      {hopes.slice(0, LIGHT_SPOTS.length).map((h, i) => {
        const p = LIGHT_SPOTS[i]
        return (
          <span
            className="ol-light"
            key={`h${i}:${h}`}
            style={{ left: `${p.x}%`, top: `${tall ? p.y * 0.8 : p.y}%`, ['--i' as string]: i }}
          >
            {tall && <b>{short(h)}</b>}
          </span>
        )
      })}
    </div>
  )
}

/* A worry or a hope in a few words, for a label on the sky. */
const short = (s: string) => {
  const t = s.replace(/^I (worry about|dream of|hope)\s+/i, '').replace(/[.?!]$/, '')
  const words = t.split(/\s+/)
  return words.length > 5 ? `${words.slice(0, 5).join(' ')}…` : t
}

/* One of the two questions: suggestions, a box, Add, and the list so far. */
function Ask({
  kind,
  items,
  onAdd,
  onRemove,
}: {
  kind: 'concern' | 'hope'
  items: string[]
  onAdd: (s: string) => void
  onRemove: (i: number) => void
}) {
  const [text, setText] = useState('')
  const box = useRef<HTMLTextAreaElement>(null)
  const typing = useRef(0)
  useEffect(() => () => window.clearInterval(typing.current), [])
  const concern = kind === 'concern'
  const starts = concern ? CONCERN_STARTS : HOPE_STARTS
  const samples = concern ? SAMPLE_OUTLOOK.concerns : SAMPLE_OUTLOOK.hopes

  /* The sample, typed in as if she were writing it: the next one not yet
     added. */
  const typeIn = () => {
    const next = samples.find((s) => !items.includes(s)) ?? samples[0]
    window.clearInterval(typing.current)
    let n = 0
    typing.current = window.setInterval(() => {
      n = Math.min(next.length, n + 3)
      setText(next.slice(0, n))
      if (n >= next.length) window.clearInterval(typing.current)
    }, 16)
  }
  const add = () => {
    const t = text.trim()
    if (!t) return
    onAdd(t)
    setText('')
    box.current?.focus()
  }

  return (
    <div className="ol-ask">
      <h2 className="ol-q">
        {concern ? (
          <>
            What’s the <b>biggest concern</b> on your mind right now?
          </>
        ) : (
          <>
            What are you <b>hopeful and dreaming</b> about right now?
          </>
        )}
      </h2>
      <p className="ol-note">
        {concern ? 'Start from one of these, or say it your way.' : 'Big or small — whatever you are looking forward to.'}
      </p>
      <div className="ol-chips">
        {starts.map((c, i) => (
          <button
            key={c}
            type="button"
            className={`ol-chip${text.startsWith(c) ? ' is-on' : ''}`}
            style={{ ['--i' as string]: i }}
            onClick={() => {
              setText(c.endsWith('?') ? c : `${c} `)
              box.current?.focus()
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <textarea
        ref={box}
        className="jf-note ol-box"
        rows={3}
        value={text}
        placeholder={concern ? 'What keeps you up at night?' : 'What are you looking forward to?'}
        onChange={(e) => setText(e.target.value)}
        onDoubleClick={(e) => {
          if (!e.currentTarget.value.trim()) typeIn()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            add()
          }
        }}
      />
      <div className="ol-add-row">
        <button className="ol-add" type="button" disabled={!text.trim()} onClick={add}>
          {concern ? 'Add Concern' : 'Add Hope'}
        </button>
      </div>
      {items.length > 0 && (
        <div className="ol-list">
          <span className="ol-list-head">{concern ? 'Concerns' : 'Hopes'}</span>
          <ul>
            {items.map((it, i) => (
              <li key={`${i}:${it}`} className={concern ? 'is-concern' : 'is-hope'}>
                <span>{it}</span>
                <button type="button" aria-label="Remove" onClick={() => onRemove(i)}>
                  <svg viewBox="0 0 16 16" width="10" height="10" fill="none" aria-hidden>
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

type Step = 'intro' | 'concerns' | 'hopes' | 'results' | 'badge'
const ORDER: Step[] = ['intro', 'concerns', 'hopes', 'results', 'badge']

export default function OutlookFlow({
  reward,
  onComplete,
  review,
}: {
  reward: { before: number; after: number; total: number; next: string }
  onComplete: (a: OutlookAnswers) => void
  review?: OutlookAnswers
}) {
  const [step, setStep] = useState<Step>(review ? 'results' : 'intro')
  const [a, setA] = useState<OutlookAnswers>(() => review ?? { concerns: [], hopes: [] })

  useEffect(() => {
    document.querySelector('.cx-viewport')?.scrollTo({ top: 0 })
  }, [step])

  const at = ORDER.indexOf(step)
  const onOk = () => {
    /* Nothing added: the samples go in, so a demo still arrives at a sky. */
    if (step === 'concerns') {
      if (!a.concerns.length) setA((p) => ({ ...p, concerns: SAMPLE_OUTLOOK.concerns }))
      return setStep('hopes')
    }
    if (step === 'hopes') {
      if (!a.hopes.length) setA((p) => ({ ...p, hopes: SAMPLE_OUTLOOK.hopes }))
      return setStep('results')
    }
  }
  const previous = () => {
    if (step === 'hopes') return setStep('concerns')
    if (step === 'concerns') return setStep('intro')
  }

  const reading =
    a.hopes.length > a.concerns.length
      ? 'There is more light than cloud in your sky. You are looking ahead with more hope than worry — that is ground to build on.'
      : a.hopes.length < a.concerns.length
        ? 'The clouds are heavy right now. Naming them is how they start to lift, and your advisor will start with the first one.'
        : 'Your worries and your hopes are in balance. A plan is how the hopes get the upper hand.'

  return (
    <div className="jf ol">
      {step === 'intro' && (
        <div className="jf-intro">
          <div className="jf-hero">
            <Photo className="jf-hero-img" src="./outlook/intro.png" fallback="ol-hero-fallback" />
          </div>
          <h2 className="jf-title">What’s on your mind?</h2>
          <p className="jf-body">What are your biggest concerns? Your hopes and dreams?</p>
          <p className="jf-lead">
            Sharing what’s on your mind helps your advisor provide support and guidance that aligns
            with your goals, values, and priorities.
          </p>
          <div className="jf-start">
            <button className="jf-go" type="button" onClick={() => setStep('concerns')}>
              Get Started
            </button>
            <span className="jf-min">
              <ClockIcon /> Takes 1 min
            </span>
          </div>
        </div>
      )}

      {(step === 'concerns' || step === 'hopes') && (
        <>
          <Sky concerns={a.concerns} hopes={step === 'hopes' ? a.hopes : []} dawn={step === 'hopes'} />
          <Ask
            key={step}
            kind={step === 'concerns' ? 'concern' : 'hope'}
            items={step === 'concerns' ? a.concerns : a.hopes}
            onAdd={(s) =>
              setA((p) =>
                step === 'concerns' ? { ...p, concerns: [...p.concerns, s] } : { ...p, hopes: [...p.hopes, s] },
              )
            }
            onRemove={(i) =>
              setA((p) =>
                step === 'concerns'
                  ? { ...p, concerns: p.concerns.filter((_, j) => j !== i) }
                  : { ...p, hopes: p.hopes.filter((_, j) => j !== i) },
              )
            }
          />
        </>
      )}

      {step === 'results' && (
        <div className="jr olr">
          <Reveal>
            <h2 className="jr-title">Your outlook</h2>
            <p className="jr-sub">This is what’s on your mind:</p>
            {/* The whole sky: her worries low as clouds, her hopes above them
                as lights, each named. */}
            <figure className="olr-hero">
              <Sky concerns={a.concerns} hopes={a.hopes} dawn tall />
              <blockquote className="olr-words">
                <Typed text={reading} />
              </blockquote>
            </figure>
          </Reveal>

          <Reveal>
            <h3 className="jr-h">Concerns</h3>
            <p className="jr-sub">What weighs on you:</p>
            <ul className="olr-list is-concern">
              {a.concerns.map((c, i) => (
                <li key={i} style={{ ['--i' as string]: i }}>
                  “{c}”
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal>
            <h3 className="jr-h">Hopes</h3>
            <p className="jr-sub">What you are reaching for:</p>
            <ul className="olr-list is-hope">
              {a.hopes.map((h, i) => (
                <li key={i} style={{ ['--i' as string]: i }}>
                  “{h}”
                </li>
              ))}
            </ul>
            <p className="jr-reading">
              <span className="jr-reading-mark" aria-hidden>
                ✦
              </span>
              Your advisor will start with “{short(a.concerns[0] ?? 'your first concern')}” — and plan
              toward “{short(a.hopes[0] ?? 'your first hope')}”.
            </p>
          </Reveal>

          <Reveal className="jr-reward">
            <p className="jr-reward-line">You got a reward!</p>
            <button className="jr-claim" type="button" onClick={() => setStep('badge')}>
              <span>Claim Badge</span>
            </button>
          </Reveal>
        </div>
      )}

      {step === 'badge' && (
        <JoyReward
          badge={bgOutlook}
          name="Outlook"
          from={reward.before}
          done={reward.after}
          total={reward.total}
          next={reward.next}
          onNext={() => onComplete(a)}
        />
      )}

      {(step === 'concerns' || step === 'hopes') && (
        <div className="jf-foot">
          <div className="jf-where">
            <div className="af-progress" aria-hidden>
              {['concerns', 'hopes'].map((s, i) => (
                <i key={s} className={i <= at - 1 ? 'is-on' : ''} />
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
          <button className="cx-start jf-ok" type="button" onClick={onOk}>
            OK
          </button>
        </div>
      )}
    </div>
  )
}
