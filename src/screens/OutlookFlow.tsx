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
 *
 * The mechanism is shared: the advisor's Outlook is this same flow handed
 * different `content` — its own questions, prompts and words — and without
 * samples, so a screen with nothing added is skipped. The client's is the
 * default.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import './joyFlow.css'
import './joyResults.css'
import './outlookFlow.css'
import { financialId } from '../data/financialId'
import JoyReward from './JoyReward'
import MemoryAsk from './MemoryAsk'
import { AboutOverlay, useEndingOverlay, CountUp, Reveal, Typed } from './JoyResults'
import bgOutlook from '../assets/badges/outlook-on-plum.svg'
import { AdventureBadge, AdventureClose, AdventureMark } from './AdventureMark'
import { useCcNav } from '../ccNav'
import { StepBar, morph, useFinishFill, useSettling } from './StepBar'

export interface OutlookAnswers {
  concerns: string[]
  hopes: string[]
}

type Kind = 'concern' | 'hope'

/* The design's prompts: the start of a sentence, to finish in their own
   words. Tapping one puts it in the box without its dots. */
const CONCERN_STARTS = [
  'I feel…',
  'I worry about…',
  'How will I…',
  'Can I afford to…',
  'What happens if…',
  'I’m struggling with…',
  'What if I face…',
  'When will I be able to…',
  'I want to…',
]
const HOPE_STARTS = [
  'I dream of…',
  'I hope to…',
  'I can’t wait to…',
  'Someday I’ll…',
  'I’d love to…',
  'My perfect day…',
  'I’m excited about…',
  'I want to…',
]

/* The samples a demo types in, and OK records: her authored answers. */
export const SAMPLE_OUTLOOK: OutlookAnswers = {
  concerns: financialId.outlook.concerns,
  hopes: financialId.outlook.hopes,
}

/** Everything that makes this the client's Outlook rather than another
    adventure of the same shape. */
export interface OutlookContent {
  intro: { image: string; title: string; body: string; lead: string; minutes: number }
  /** The question over a screen — which can change once one has been added,
      to ask for another. */
  question: (kind: Kind, added: number) => ReactNode
  note: string
  starts: Record<Kind, string[]>
  placeholder: Record<Kind, string>
  /** What a double-click on an empty box types in. */
  examples: OutlookAnswers
  /** Whether OK with nothing added records the examples (a demo) or skips
      the screen (somebody actually answering). */
  fill: boolean
  reading: (concerns: number, hopes: number) => string
  results: {
    title: string
    sub: string
    concernsSub: string
    hopesSub: string
    line: (firstConcern: string, firstHope: string) => string
    about: { title: string; share: number; first: ReactNode; second: ReactNode }
  }
  /** The badge the reward screen hands over. Left out, there is no reward
      screen: the ending's button is Continue and finishes the adventure. */
  badge?: string
  badgeName?: string
}

export const CLIENT_OUTLOOK: OutlookContent = {
  intro: {
    image: './outlook/intro.png',
    title: 'What’s on your mind?',
    body: 'What are your biggest concerns? Your hopes and dreams?',
    lead: 'Sharing what’s on your mind helps your advisor provide support and guidance that aligns with your goals, values, and priorities.',
    minutes: 1,
  },
  question: (kind) =>
    kind === 'concern' ? (
      <>
        What’s the <b>biggest concern</b> on your mind right now?
      </>
    ) : (
      <>
        What are you <b>hopeful and dreaming</b> about right now?
      </>
    ),
  note: 'Use the prompts to help you start.',
  starts: { concern: CONCERN_STARTS, hope: HOPE_STARTS },
  placeholder: { concern: 'Can I afford to retire in 10 years?', hope: 'I dream of a home by the water.' },
  examples: SAMPLE_OUTLOOK,
  /* The demo's people: a skipped question takes the sample (the button still
     says Skip). */
  fill: true,
  reading: (c, h) =>
    h > c
      ? 'There is more light than cloud in your sky. You are looking ahead with more hope than worry — that is ground to build on.'
      : h < c
        ? 'The clouds are heavy right now. Naming them is how they start to lift, and your advisor will start with the first one.'
        : 'Your worries and your hopes are in balance. A plan is how the hopes get the upper hand.',
  results: {
    title: 'Your outlook',
    sub: 'This is what’s on your mind:',
    concernsSub: 'What weighs on you:',
    hopesSub: 'What you are reaching for:',
    line: (c, h) => `Your advisor will start with “${c}” — and plan toward “${h}”.`,
    about: {
      title: 'You asked the big questions!',
      share: 70,
      first: (
        <>
          Most respondents share{' '}
          <b>
            <CountUp to={4} /> concerns
          </b>{' '}
          and{' '}
          <b>
            <CountUp to={3} /> hopes
          </b>
          !
        </>
      ),
      second: (
        <>
          <p>
            Great! Your <b>questions</b> matter.
          </p>
          <p>
            By sharing your questions, you’re giving your advisor the insight to tailor advice to
            your life. <b>More clarity means better support</b>—so you can move forward with
            confidence.
          </p>
        </>
      ),
    },
  },
  badge: bgOutlook,
  badgeName: 'Outlook',
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
/* On the ending the lights carry their words, so they take spots spread
   wide across the top, clear of each other and of the clouds below. */
const LIGHT_SPOTS_TALL = [
  { x: 20, y: 12 },
  { x: 76, y: 8 },
  { x: 48, y: 30 },
  { x: 84, y: 32 },
  { x: 14, y: 36 },
  { x: 56, y: 4 },
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
  label,
  onRemove,
  prompts,
}: {
  /** The prompts the answers may start with, taken off each label. */
  prompts?: string[]
  concerns: string[]
  hopes: string[]
  dawn: boolean
  tall?: boolean
  /** While answering: which of the two carry their words on the sky. */
  label?: { clouds?: boolean; lights?: boolean }
  /** Take one back off the sky. */
  onRemove?: (kind: Kind, i: number) => void
}) {
  const named = !!(label?.clouds && concerns.length) || !!(label?.lights && hopes.length)
  /* The label that has been tapped open to its whole sentence. */
  const [open, setOpen] = useState<string | null>(null)
  const toggle = (key: string) => setOpen((o) => (o === key ? null : key))
  /* A caption belongs to a label that can be read on this screen: moving on
     from the concerns to the hopes closes a cloud's, whose words are no
     longer on the sky. */
  const cloudsNamed = !tall && !!label?.clouds
  const lightsNamed = !tall && !!label?.lights
  useEffect(() => {
    setOpen(null)
  }, [cloudsNamed, lightsNamed])
  const shown = open && (open.startsWith('c') ? cloudsNamed : lightsNamed) ? open : null
  const X = ({ kind, i, text }: { kind: Kind; i: number; text: string }) =>
    onRemove ? (
      <button type="button" className="ol-x" aria-label={`Remove “${text}”`} onClick={(e) => {
          e.stopPropagation()
          setOpen(null)
          onRemove(kind, i)
        }}>
        <svg viewBox="0 0 16 16" width="8" height="8" fill="none" aria-hidden>
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>
    ) : null
  return (
    <div
      className={`ol-sky${dawn ? ' is-dawn' : ''}${tall ? ' is-tall' : ''}${named ? ' is-named' : ''}`}
      aria-hidden={!named}
    >
      <i className="ol-sun" />
      <i className="ol-haze" />
      {concerns.slice(0, CLOUD_SPOTS.length).map((c, i) => {
        const p = CLOUD_SPOTS[i]
        const words = tall || label?.clouds
        return (
          <span
            className={`ol-cloud${words ? ' has-words' : ''}`}
            key={`c${i}:${c}`}
            style={{
              left: `${p.x}%`,
              top: `${tall ? p.y * 0.4 + 30 : named ? 10 + p.y * 0.6 : p.y}%`,
              ['--s' as string]: p.s,
              ['--i' as string]: i,
            }}
          >
            {words && (
              <b
                /* Tappable while answering; on the ending the sky is only read. */
                {...(tall
                  ? {}
                  : {
                      className: open === `c${i}` ? 'is-open' : undefined,
                      role: 'button',
                      tabIndex: 0,
                      'aria-expanded': open === `c${i}`,
                      onClick: () => toggle(`c${i}`),
                      onKeyDown: (e: React.KeyboardEvent) =>
                        (e.key === 'Enter' || e.key === ' ') && toggle(`c${i}`),
                    })}
              >
                {short(c, prompts)}
                {!tall && label?.clouds && <X kind="concern" i={i} text={c} />}
              </b>
            )}
          </span>
        )
      })}
      {hopes.slice(0, LIGHT_SPOTS.length).map((h, i) => {
        const p = (tall || named ? LIGHT_SPOTS_TALL : LIGHT_SPOTS)[i]
        const words = tall || label?.lights
        return (
          <span
            className={`ol-light${words ? ' has-words' : ''}`}
            key={`h${i}:${h}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, ['--i' as string]: i }}
          >
            {words && (
              <b
                /* Tappable while answering; on the ending the sky is only read. */
                {...(tall
                  ? {}
                  : {
                      className: open === `h${i}` ? 'is-open' : undefined,
                      role: 'button',
                      tabIndex: 0,
                      'aria-expanded': open === `h${i}`,
                      onClick: () => toggle(`h${i}`),
                      onKeyDown: (e: React.KeyboardEvent) =>
                        (e.key === 'Enter' || e.key === ' ') && toggle(`h${i}`),
                    })}
              >
                {short(h, prompts)}
                {!tall && label?.lights && <X kind="hope" i={i} text={h} />}
              </b>
            )}
          </span>
        )
      })}
      {/* The tapped one, whole: the sentence across the foot of the sky. */}
      {shown && (
        <p className="ol-full" aria-live="polite">
          {shown.startsWith('c') ? concerns[Number(shown.slice(1))] : hopes[Number(shown.slice(1))]}
        </p>
      )}
    </div>
  )
}

/* A worry or a hope in a few words, for a label on the sky. The label is what
   comes after the prompt it was started with — "I worry about affording
   college" reads "affording college" — so every label starts on its own
   words rather than on the prompt they all share. */
export const afterPrompt = (s: string, prompts: string[] = []) => {
  const text = s.trim()
  const lower = text.toLowerCase()
  const stems = prompts
    .map((p) => p.replace(/[.…\s]+$/, '').trim())
    .filter(Boolean)
    .sort((x, y) => y.length - x.length)
  for (const stem of stems) {
    if (lower.startsWith(stem.toLowerCase())) {
      const rest = text.slice(stem.length).replace(/^[\s,:;—–-]+/, '')
      if (rest) return rest
    }
  }
  return text.replace(/^I (worry about|dream of|hope)\s+/i, '')
}
const short = (s: string, prompts?: string[]) => {
  const t = afterPrompt(s, prompts).replace(/[.?!]$/, '')
  const words = t.split(/\s+/)
  return words.length > 5 ? `${words.slice(0, 5).join(' ')}…` : t
}

/* One of the two questions: suggestions, a box, Add, and the list so far. The
   box's words are held by the flow, so OK can keep a line that was typed and
   never added. */
function Ask({
  kind,
  items,
  text,
  setText,
  content,
  onAdd,
  slot,
}: {
  kind: Kind
  items: string[]
  text: string
  setText: (t: string) => void
  content: OutlookContent
  onAdd: (s: string) => void
  slot?: { above?: ReactNode; below?: ReactNode }
}) {
  const box = useRef<HTMLTextAreaElement>(null)
  const typing = useRef(0)
  useEffect(() => () => window.clearInterval(typing.current), [])
  const concern = kind === 'concern'
  const starts = content.starts[kind]
  const samples = concern ? content.examples.concerns : content.examples.hopes

  /* The sample, typed in as if she were writing it: the next one not yet
     added. */
  const typeIn = () => {
    const next = samples.find((s) => !items.includes(s)) ?? samples[0]
    if (!next) return
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
      <h2 className="ol-q">{content.question(kind, items.length)}</h2>
      <p className="ol-note">{content.note}</p>
      {slot?.above}
      {/* The memory screen Practice Joy asks its long questions on: the box
          on its warming sky, ghost openings, starters to tap — and under it
          one action line, the microphone at its start and Add at its end. */}
      <MemoryAsk
        value={text}
        onChange={setText}
        placeholder={content.placeholder[kind]}
        ghosts={samples}
        starters={starts}
        onDemoFill={typeIn}
        onEnter={add}
        below={
          /* Add and the microphone as one matched pair of pills: Add at the
             start, the mic at the end — where it sits on every other screen. */
          <div className={`ol-add-row${slot?.below ? ' has-mic' : ''}`}>
            <button className="ol-add ol-add-pill" type="button" disabled={!text.trim()} onClick={add}>
              <span aria-hidden>+</span>
              {concern ? 'Add Concern' : 'Add Hope'}
            </button>
            {slot?.below}
          </div>
        }
      />
    </div>
  )
}

type Step = 'intro' | 'concerns' | 'hopes' | 'results' | 'badge'

type Reward = { before: number; after: number; total: number; next: string; card?: ReactNode; idName?: string }

export default function OutlookFlow({
  reward,
  onComplete,
  review,
  content = CLIENT_OUTLOOK,
  askSlot,
}: {
  reward: Reward | ((a: OutlookAnswers) => Reward)
  onComplete: (a: OutlookAnswers) => void
  review?: OutlookAnswers
  content?: OutlookContent
  /** What a caller adds around a screen's box — the advisor's privacy switch
      above it and the microphone below it. */
  askSlot?: (kind: Kind, text: string, setText: (t: string) => void) => { above?: ReactNode; below?: ReactNode }
}) {
  const [step, setStep] = useState<Step>(review ? 'results' : 'intro')
  useCcNav('ol.step', step, setStep, ['intro', 'concerns', 'hopes', 'results'])
  const [a, setA] = useState<OutlookAnswers>(() => review ?? { concerns: [], hopes: [] })
  /* What is in the box right now, per screen. */
  const [draft, setDraft] = useState<Record<Kind, string>>({ concern: '', hope: '' })
  /* The ending's overlay, as the other adventures have it: said once a moment
     after it arrives, and again from "Learn more". */
  const ending = useEndingOverlay(step === 'results')

  useEffect(() => {
    document.querySelector('.cx-viewport')?.scrollTo({ top: 0 })
  }, [step])

  const kind: Kind = step === 'hopes' ? 'hope' : 'concern'
  const list = kind === 'concern' ? a.concerns : a.hopes
  const pending = draft[kind].trim()
  const blank = (step === 'concerns' || step === 'hopes') && !list.length && !pending

  /* Leaving a screen: a line typed and never added is kept — for somebody
     answering. For a demo, nothing added records the samples, so it still
     arrives at a sky. */
  const settle = (k: Kind) => {
    const key = k === 'concern' ? 'concerns' : 'hopes'
    const typed = draft[k].trim()
    if (!content.fill && typed) {
      setA((p) => ({ ...p, [key]: [...p[key], typed] }))
      setDraft((d) => ({ ...d, [k]: '' }))
    } else if (content.fill && !a[key].length) {
      setA((p) => ({ ...p, [key]: content.examples[key] }))
    }
  }
  const fill = useFinishFill()
  const settling = useSettling(step)
  const onOk = () => {
    if (step === 'concerns') {
      settle('concern')
      return setStep('hopes')
    }
    if (step === 'hopes') {
      settle('hope')
      return fill.finish(() => setStep('results'))
    }
  }
  const previous = () => {
    if (step === 'hopes') return setStep('concerns')
    if (step === 'concerns') return setStep('intro')
  }

  const reading = content.reading(a.concerns.length, a.hopes.length)
  const rewardNow = typeof reward === 'function' ? reward(a) : reward
  const prompts = [...content.starts.concern, ...content.starts.hope]

  return (
    <div className="jf ol">
      {step === 'intro' && (
        <div className="jf-intro">
          <AdventureBadge steps={2} />
          <div className="jf-hero">
            <Photo className="jf-hero-img" src={content.intro.image} fallback="ol-hero-fallback" />
          </div>
          <h2 className="jf-title">{content.intro.title}</h2>
          <p className="jf-body">{content.intro.body}</p>
          <p className="jf-lead">{content.intro.lead}</p>
          <div className="jf-start">
            <button className="jf-go" type="button" onClick={() => morph(() => setStep('concerns'))}>
              Get Started
            </button>
            <span className="jf-min">
              <ClockIcon /> Takes {content.intro.minutes} min
            </span>
          </div>
        </div>
      )}

      {(step === 'concerns' || step === 'hopes') && (
        <>
          {/* What is added goes onto the sky with its words — concerns as
              clouds, hopes as lights — and comes off it with its ×. */}
          <Sky
            prompts={prompts}
            concerns={a.concerns}
            hopes={step === 'hopes' ? a.hopes : []}
            dawn={step === 'hopes'}
            label={step === 'hopes' ? { lights: true } : { clouds: true }}
            onRemove={(k, i) =>
              setA((p) =>
                k === 'concern'
                  ? { ...p, concerns: p.concerns.filter((_, j) => j !== i) }
                  : { ...p, hopes: p.hopes.filter((_, j) => j !== i) },
              )
            }
          />
          <Ask
            key={step}
            kind={kind}
            items={list}
            text={draft[kind]}
            setText={(t) => setDraft((d) => ({ ...d, [kind]: t }))}
            content={content}
            slot={askSlot?.(kind, draft[kind], (t) => setDraft((d) => ({ ...d, [kind]: t })))}
            onAdd={(s) =>
              setA((p) =>
                step === 'concerns' ? { ...p, concerns: [...p.concerns, s] } : { ...p, hopes: [...p.hopes, s] },
              )
            }
          />
        </>
      )}

      {step === 'results' && (
        <div className={`jr olr${ending.held ? ' is-held' : ''}`} key={ending.run}>
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
              title={content.results.about.title}
              share={content.results.about.share}
              onClose={ending.close}
              first={content.results.about.first}
              second={content.results.about.second}
            />
          )}
          <Reveal>
            <h2 className="jr-title">{content.results.title}</h2>
            <p className="jr-sub">{content.results.sub}</p>
            {/* The whole sky: her worries low as clouds, her hopes above them
                as lights, each named. */}
            <figure className="olr-hero">
              <Sky concerns={a.concerns} hopes={a.hopes} dawn tall prompts={prompts} />
              <blockquote className="olr-words">
                <Typed text={reading} />
              </blockquote>
            </figure>
          </Reveal>

          {a.concerns.length > 0 && (
            <Reveal>
              <h3 className="jr-h">Concerns</h3>
              <p className="jr-sub">{content.results.concernsSub}</p>
              <ul className="olr-list is-concern">
                {a.concerns.map((c, i) => (
                  <li key={i} style={{ ['--i' as string]: i }}>
                    “{c}”
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          <Reveal>
            {a.hopes.length > 0 && (
              <>
                <h3 className="jr-h">Hopes</h3>
                <p className="jr-sub">{content.results.hopesSub}</p>
                <ul className="olr-list is-hope">
                  {a.hopes.map((h, i) => (
                    <li key={i} style={{ ['--i' as string]: i }}>
                      “{h}”
                    </li>
                  ))}
                </ul>
              </>
            )}
            {(content.fill || (a.concerns.length > 0 && a.hopes.length > 0)) && (
              <p className="jr-reading">
                <span className="jr-reading-mark" aria-hidden>
                  ✦
                </span>
                {content.results.line(
                  short(a.concerns[0] ?? 'your first concern', prompts),
                  short(a.hopes[0] ?? 'your first hope', prompts),
                )}
              </p>
            )}
          </Reveal>

          <Reveal className="jr-reward">
            {content.badge && <p className="jr-reward-line">You got a reward!</p>}
            <button
              className="jr-claim"
              type="button"
              onClick={() => (content.badge ? setStep('badge') : onComplete(a))}
            >
              <span>{content.badge ? 'Claim Badge' : 'Continue'}</span>
            </button>
          </Reveal>
        </div>
      )}

      {step === 'badge' && content.badge && (
        <JoyReward
          badge={content.badge}
          name={content.badgeName}
          from={rewardNow.before}
          done={rewardNow.after}
          total={rewardNow.total}
          next={rewardNow.next}
          card={rewardNow.card}
          idName={rewardNow.idName}
          onNext={() => onComplete(a)}
        />
      )}

      {(step === 'concerns' || step === 'hopes') && (
        <>
          {/* Where you are, at the top under the bar — the foot is only
              Back and the one thing to press. */}
          <div className="jf-top">
            <AdventureMark />
            <StepBar count={2} done={fill.full ? 2 : step === 'hopes' ? 1 : 0} />
            <AdventureClose />
          </div>
        <div className={`jf-foot${settling ? ' is-settling' : ''}`}>
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
          <button
            className={`cx-start jf-ok${blank ? ' is-skip' : ''}`}
            type="button"
            onClick={onOk}
          >
            {blank ? 'Skip this question' : 'OK'}
          </button>
        </div>
        </>
      )}
    </div>
  )
}
