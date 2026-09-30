/* The Move, on the client's Goals mechanism.
 *
 * The client's fifth adventure writes a goal down, celebrates it, assesses its
 * readiness and lands on a stage of change. The advisor's writes their move
 * down the same way, out of the same parts: the "Hold tight" mark while the
 * moves are lined up, the moves offered as suggested goals with a way to write
 * one's own, the Future You road for when, the readiness panel's tap-to-answer
 * pills for the single choices, the goal panel's pros and cons lists, the
 * confetti and summary when it is added, the readiness questions one tap at a
 * time, and the stage on its sky at the end.
 *
 * It asks more than a client's goal does — why, whether they want support,
 * how they feel about their brand, who else has a say, what is holding the
 * decision — so those are screens of their own between the move and its
 * summary, each with the foot every adventure has.
 *
 * Wording, options and Marcus's samples are read out of `advisorFlow.ts`, and
 * the stage is the Business ID's own rule, so the stage this ending names is
 * the stage the Business ID shows.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import './joyFlow.css'
import './joyResults.css'
import './goalsFlow.css'
import './addGoalModal.css'
import './readinessModal.css'
import './futureYouFlow.css'
import './moveFlow.css'
import { steps as flowSteps } from '../data/advisorFlow'
import { emptyAnswers, STAGES, STAGE_BODY, stageOf, type Answers } from '../data/advisorAnswers'
import type { Goal } from '../data/financialId'
import { ArrowGo, Sparkle } from './AddGoalModal'
import { Road } from './FutureYouFlow'
import { MARK_PARTS } from './ClientExperienceScreen'
import { GoalDetail, TTM_ART } from './profileParts'
import { Reveal } from './JoyResults'
import MemoryAsk from './MemoryAsk'
import JoyReward from './JoyReward'
import bgMove from '../assets/badges/goals-on-plum-untitled.svg'
import { PhotoCheck } from './PhotoOther'
import { afterPrompt } from './OutlookFlow'
import { AdventureBadge, AdventureClose, AdventureMark } from './AdventureMark'
import { useCcNav } from '../ccNav'
import { StepBar, morph, useFinishFill } from './StepBar'

/* The sparkle on the move card's disc. The Goals one leans up and to the left
   — drawn to sit beside text, not inside a circle — so this pair is balanced
   on the centre of its box: the big star low left, the small one high right. */
const DiscSparkle = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path d="M8.5 5.5Q9.3 10.7 14.5 11.5 9.3 12.3 8.5 17.5 7.7 12.3 2.5 11.5 7.7 10.7 8.5 5.5Z" />
    <path d="M15.5 1.9Q15.9 4.1 18.1 4.5 15.9 4.9 15.5 7.1 15.1 4.9 12.9 4.5 15.1 4.1 15.5 1.9Z" />
  </svg>
)

/* The two questions The Move asks in their own words, on the memory screen:
   openings that type themselves into the empty box, and beginnings to tap. */
const WHY_GHOSTS = [
  'I want what I build to finally belong to me…',
  'My clients deserve more than my firm lets me give them…',
  'I’ve outgrown the platform I’m on…',
]
const WHY_STARTERS = ['What pulls me is…', 'What pushes me is…', 'I’m tired of…', 'I want to own…']
const BLOCKER_GHOSTS = [
  'I need to know my clients will come with me…',
  'I can’t decide until I understand the deal…',
  'My team has to be taken care of first…',
]
const BLOCKER_STARTERS = ['I need to know…', 'I’m worried about…', 'Before I decide…']
const PRO_GHOSTS = [
  'My clients would finally get the service I want to give them…',
  'I’d keep more of what I build…',
  'I could choose my own platform and tools…',
]
const PRO_STARTERS = ['I’d finally be able to…', 'My clients would…', 'I’d keep…', 'It would free me to…']
const CON_GHOSTS = [
  'Some clients might not come with me…',
  'A year of lower income while it settles…',
  'Rebuilding the back office from nothing…',
]
const CON_STARTERS = ['I could lose…', 'It would cost me…', 'I’m not sure about…', 'My team might…']

/* ── the balloon ──────────────────────────────────────────────────────────
   Pros and cons as a hot-air balloon: the move is the balloon and its
   basket, every reason it is worth it is a balloon tied on — lift — and every
   obstacle a sandbag hung under the basket — weight. The whole thing rises
   and sinks with the balance of the two, so the answer is the picture, the
   way Outlook's sky is. Positions are in % across and px down, from a scene
   256px tall; the lift moves them all together, strings and all. */
const PRO_SPOTS = [
  { x: 16, y: 30 },
  { x: 84, y: 30 },
  { x: 24, y: 84 },
  { x: 76, y: 84 },
]
/* Past four the balloons keep coming, only unnamed, closer in. */
const PRO_EXTRA = [
  { x: 38, y: 16 },
  { x: 62, y: 16 },
  { x: 33, y: 50 },
  { x: 67, y: 50 },
]
/* Sandbags hang under the basket, their words out to the side they hang on. */
const CON_SPOTS = [
  { x: 42, y: 172 },
  { x: 58, y: 172 },
  { x: 36, y: 210 },
  { x: 64, y: 210 },
]
const CON_EXTRA = [{ x: 50, y: 194 }]
const BALLOON_HUES = ['#bff65b', '#f25a7a', '#ffb547', '#6bd6c4', '#c77dff', '#ff9525', '#ffe066', '#8fb8ff']
/* Where the basket's ropes meet: its top for the strings, its foot for the
   sandbags. */
const BASKET_TOP = 138
const BASKET_FOOT = 152

/* A reason or an obstacle in a few words, for its pill: what comes after the
   prompt it was started with, as Outlook's sky labels do. */
const brief = (s: string, prompts?: string[]) => {
  const t = afterPrompt(s, prompts).replace(/[.…?!]+$/, '')
  const words = t.split(/\s+/)
  return words.length > 4 ? `${words.slice(0, 4).join(' ')}…` : t
}

function Balloon({
  pros,
  cons,
  naming,
  onRemove,
  prompts,
}: {
  /** The prompts a reason or an obstacle may start with. */
  prompts?: string[]
  pros: string[]
  cons: string[]
  /** Which of the two carry their words right now. */
  naming: 'pros' | 'cons'
  onRemove: (kind: 'pros' | 'cons', i: number) => void
}) {
  const [open, setOpen] = useState<string | null>(null)
  useEffect(() => setOpen(null), [naming])
  /* Up for every reason, down for every obstacle, within the scene. */
  const lift = Math.max(-26, Math.min(6, cons.length * 7 - pros.length * 6))
  const proAt = (i: number) => (i < PRO_SPOTS.length ? PRO_SPOTS[i] : PRO_EXTRA[i - PRO_SPOTS.length])
  const conAt = (i: number) => (i < CON_SPOTS.length ? CON_SPOTS[i] : CON_EXTRA[i - CON_SPOTS.length])
  const shownPros = pros.slice(0, PRO_SPOTS.length + PRO_EXTRA.length)
  const shownCons = cons.slice(0, CON_SPOTS.length + CON_EXTRA.length)
  const full = open ? (open[0] === 'p' ? pros : cons)[Number(open.slice(1))] : null

  const Pill = ({ kind, i, text }: { kind: 'pros' | 'cons'; i: number; text: string }) => {
    const key = `${kind[0]}${i}`
    const toggle = () => setOpen((o) => (o === key ? null : key))
    return (
      <b
        className={`mv-tag${open === key ? ' is-open' : ''}`}
        role="button"
        tabIndex={0}
        aria-expanded={open === key}
        onClick={toggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
      >
        {brief(text, prompts)}
        <button
          type="button"
          className="ol-x mv-tag-x"
          aria-label={`Remove “${text}”`}
          onClick={(e) => {
            e.stopPropagation()
            setOpen(null)
            onRemove(kind, i)
          }}
        >
          <svg viewBox="0 0 16 16" width="8" height="8" fill="none" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      </b>
    )
  }

  return (
    <div className="mv-air">
      <i className="mv-wisp mv-wisp-a" aria-hidden />
      <i className="mv-wisp mv-wisp-b" aria-hidden />
      <div className="mv-rig" style={{ ['--lift' as string]: `${lift}px` }}>
        {/* Strings up to the balloons, ropes down to the sandbags. */}
        <svg className="mv-lines" viewBox="0 0 100 256" preserveAspectRatio="none" aria-hidden>
          {shownPros.map((p, i) => {
            const s = proAt(i)
            return (
              <line key={`p${i}:${p}`} className="mv-string" x1={s.x} y1={s.y + 28} x2={50} y2={BASKET_TOP} />
            )
          })}
          {shownCons.map((c, i) => {
            const s = conAt(i)
            return <line key={`c${i}:${c}`} className="mv-rope" x1={50} y1={BASKET_FOOT} x2={s.x} y2={s.y + 2} />
          })}
        </svg>

        {/* The move itself: the envelope and its basket. */}
        <svg className="mv-envelope" viewBox="0 0 64 96" aria-hidden>
          <defs>
            <clipPath id="mv-env-clip">
              <path d="M32 2C15 2 3 15 3 31c0 15 11 27 21 37l2 6h12l2-6c10-10 21-22 21-37C61 15 49 2 32 2Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#mv-env-clip)">
            <rect width="64" height="80" fill="#7639a1" />
            <ellipse cx="32" cy="36" rx="12" ry="40" fill="#240446" />
            <ellipse cx="32" cy="36" rx="4" ry="40" fill="#9a5cc6" />
            <rect y="44" width="64" height="7" fill="#bff65b" />
            <ellipse cx="20" cy="18" rx="6" ry="10" fill="#fff" opacity=".18" />
          </g>
          <path d="M26 74l-2 10M38 74l2 10" stroke="#5b3a1e" strokeWidth="1.2" />
          <rect x="22" y="84" width="20" height="11" rx="2.5" fill="#b0773f" />
          <path d="M22 88h20" stroke="#8a5a2b" strokeWidth="1.2" />
        </svg>

        {shownPros.map((p, i) => {
          const s = proAt(i)
          return (
            <span
              key={`p${i}:${p}`}
              className="mv-pro"
              style={{ left: `${s.x}%`, top: s.y, ['--hue' as string]: BALLOON_HUES[i % BALLOON_HUES.length], ['--i' as string]: i }}
            >
              <svg viewBox="0 0 24 30" aria-hidden>
                <path d="M12 1C6 1 1.5 5.6 1.5 11.6c0 6.4 5.4 11.4 9.2 13.6h2.6c3.8-2.2 9.2-7.2 9.2-13.6C22.5 5.6 18 1 12 1Z" fill="var(--hue)" />
                <path d="M10.4 25.2h3.2l-1.6 2.6Z" fill="var(--hue)" />
                <ellipse cx="8" cy="8" rx="2.6" ry="4" fill="#fff" opacity=".45" />
              </svg>
              {naming === 'pros' && i < PRO_SPOTS.length && <Pill kind="pros" i={i} text={p} />}
            </span>
          )
        })}

        {shownCons.map((c, i) => {
          const s = conAt(i)
          return (
            <span key={`c${i}:${c}`} className={`mv-con${s.x < 50 ? ' is-left' : ''}`} style={{ left: `${s.x}%`, top: s.y, ['--i' as string]: i }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M9 3h6l-1.2 3.2C18.6 7.6 21 11.4 21 15.4 21 19.6 17 22 12 22s-9-2.4-9-6.6c0-4 2.4-7.8 7.2-9.2Z" fill="#b98a5e" />
                <path d="M9.6 6.4h4.8" stroke="#6e4a28" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M7 14.5c1.6 1.2 3.2 1.6 5 1.6s3.4-.4 5-1.6" stroke="#8f6843" strokeWidth="1.1" fill="none" strokeLinecap="round" />
              </svg>
              {naming === 'cons' && i < CON_SPOTS.length && <Pill kind="cons" i={i} text={c} />}
            </span>
          )
        })}
      </div>
      {full && (
        <p className="ol-full mv-full" aria-live="polite">
          {full}
        </p>
      )}
    </div>
  )
}

const OTHER = 'Other'
const step = (id: string) => flowSteps.find((s) => s.id === id)
const opts = (id: string) => (step(id)?.options ?? []).filter((o) => o !== OTHER)
const title = (id: string) => step(id)?.title ?? ''
const body = (id: string) => step(id)?.body ?? ''

export interface MoveAnswers {
  move: string | null
  when: string | null
  why: string
  support: string | null
  brand: string | null
  pros: string[]
  cons: string[]
  who: string[]
  blocker: string
  thought: string | null
  knows: string | null
  acting: string | null
}

const EMPTY: MoveAnswers = {
  move: null,
  when: null,
  why: '',
  support: null,
  brand: null,
  pros: [],
  cons: [],
  who: [],
  blocker: '',
  thought: null,
  knows: null,
  acting: null,
}

/* ── the sheet ────────────────────────────────────────────────────────── */

/** The sheet with The Move's answers written onto it. */
export function sheetWithMove(a: Answers, m: MoveAnswers): Answers {
  const choice = { ...a.choice }
  const other = { ...a.other }
  const text = { ...a.text }
  const one = (id: string, v: string | null) => {
    if (!v) {
      delete choice[id]
      return
    }
    if (opts(id).includes(v)) {
      choice[id] = [v]
      other[`${id}:other`] = ''
    } else {
      choice[id] = [OTHER]
      other[`${id}:other`] = v
    }
  }
  const said = (id: string, v: string) => {
    if (v.trim()) text[id] = v.trim()
    else delete text[id]
  }
  one('mv-q1', m.move)
  one('mv-q2', m.when)
  said('mv-q3', m.why)
  one('mv-q4', m.support)
  one('mv-brand', m.brand)
  one('mv-q5', m.thought)
  one('mv-q6', m.knows)
  one('mv-q7', m.acting)
  said('mv-q8', m.pros.map((p) => p.trim()).filter(Boolean).join(', '))
  said('mv-q9', m.cons.map((p) => p.trim()).filter(Boolean).join(', '))
  if (m.who.length) choice['mv-q10'] = m.who
  else delete choice['mv-q10']
  said('mv-q10b', m.blocker)
  return { ...a, choice, other, text }
}

/* ── pieces ───────────────────────────────────────────────────────────── */

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

/* Icons for an answer card's disc, on a 24 grid in the line style of the
   flow's other icons. */
const icon = (...d: string[]) => (
  <svg className="mv-ic" viewBox="0 0 24 24" aria-hidden>
    {d.map((p) => (
      <path key={p} d={p} />
    ))}
  </svg>
)
/* The brand question, answer by answer: letting it go is a paper plane
   taking off, the terms a balance weighing them, not sure a signpost at a
   fork, and keeping it a flag planted in the ground. */
const BRAND_ICONS = [
  icon('M21 3 3 10.4l7.2 2.4L12.6 20 21 3Z', 'M10.2 12.8 15 8'),
  icon('M12 4v16', 'M8 20h8', 'M5 7.5h14', 'M5 7.5 2.6 13a2.4 2.4 0 0 0 4.8 0L5 7.5Z', 'M19 7.5 16.6 13a2.4 2.4 0 0 0 4.8 0L19 7.5Z'),
  icon('M12 21V3', 'M12 5h6l2 2.25L18 9.5h-6', 'M12 12.5H6l-2 2.25L6 17h6'),
  icon('M5.5 21V3.5', 'M5.5 4h11.5l-2.2 4 2.2 4H5.5', 'M3 21h5'),
]

/* ── your circle ──────────────────────────────────────────────────────────
   Who has a say, as the people around you: you in the middle, the others on
   a ring, and each one chosen lights up with a line drawn in to you. "Nobody
   but me" is not somebody on the ring — it sits under it, and choosing it
   clears the ring and leaves you glowing on your own. */
const ALONE = 'Nobody but me'
/* Each of them as a photograph in a round frame: the team together, a
   partner's fist bump, the family on the sofa, a client across the table. */
const PERSON_PHOTOS: Record<string, string> = {
  'My team': './advisor/future-you/my-current-team.jpg',
  'A business partner': './future-you/business-partners.png',
  'My spouse or family': './future-you/family.png',
  'My clients': './advisor/future-you/clients-i-chose.jpg',
}
/* Around the ring from the top, clockwise: x and y in % of the stage. */
const SEATS = [
  { x: 50, y: 13 },
  { x: 87, y: 50 },
  { x: 50, y: 87 },
  { x: 13, y: 50 },
]

function Circle({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const people = options.filter((o) => o !== ALONE)
  const alone = value.includes(ALONE)
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value.filter((x) => x !== ALONE), o])
  const count = value.filter((v) => v !== ALONE).length
  return (
    <div className="mv-circle">
      <div className={`mv-ring${alone ? ' is-alone' : ''}`}>
        <svg className="mv-ring-lines" viewBox="0 0 100 100" aria-hidden>
          <circle className="mv-ring-orbit" cx="50" cy="50" r="37" />
          {people.map((o, i) => {
            const s = SEATS[i % SEATS.length]
            return (
              <line
                key={o}
                className={`mv-ring-line${value.includes(o) ? ' is-on' : ''}`}
                x1="50"
                y1="50"
                x2={s.x}
                y2={s.y}
              />
            )
          })}
        </svg>
        <span className="mv-you" aria-hidden>
          <b>You</b>
          <small>{alone ? 'on your own' : count ? `+ ${count}` : ''}</small>
        </span>
        {people.map((o, i) => {
          const s = SEATS[i % SEATS.length]
          const on = value.includes(o)
          return (
            <button
              key={o}
              type="button"
              className={`mv-seat${on ? ' is-on' : ''}`}
              style={{ left: `${s.x}%`, top: `${s.y}%`, ['--i' as string]: i }}
              aria-pressed={on}
              onClick={() => toggle(o)}
            >
              <span className="mv-seat-disc">
                <Photo src={PERSON_PHOTOS[o] ?? ''} fallback="mv-seat-fallback" />
                <PhotoCheck />
              </span>
              <span className="mv-seat-label">{o}</span>
            </button>
          )
        })}
      </div>
      {options.includes(ALONE) && (
        <button
          type="button"
          className={`mv-alone${alone ? ' is-on' : ''}`}
          aria-pressed={alone}
          onClick={() => onChange(alone ? [] : [ALONE])}
        >
          <span className="mv-disc" aria-hidden>
            <svg className="mv-tick" viewBox="0 0 16 16">
              <path d="M3.5 8.5 6.6 11.5 12.5 4.8" />
            </svg>
          </span>
          Nobody but me — it’s my call
        </button>
      )}
    </div>
  )
}

/* Confetti for the move written down: the Goals flow's burst. */
const BITS = Array.from({ length: 36 }, (_, i) => ({
  i,
  x: Math.cos((i / 36) * Math.PI * 2) * (70 + ((i * 37) % 90)),
  y: Math.sin((i / 36) * Math.PI * 2) * (50 + ((i * 53) % 70)) - 20,
  c: ['#affc41', '#6bd6c4', '#ff9525', '#f25a7a', '#c77dff', '#ffe066'][i % 6],
  r: (i * 47) % 360,
}))

/* One answer from a list, tapped once. Each answer is a card with a disc at
   its first line; the tapped one fills lime, a ripple spreads from the finger,
   the disc turns plum and draws its check, and the others step back — held a
   beat before the next screen comes in, so the choice is seen being made. */
function Pills({
  options,
  value,
  onPick,
  icons,
}: {
  options: string[]
  value: string | null
  onPick: (v: string) => void
  /** An icon for each answer's disc, in the order of `options`; the check
      takes its place when the answer is tapped. */
  icons?: ReactNode[]
}) {
  const [tapped, setTapped] = useState<string | null>(null)
  const [ripple, setRipple] = useState<{ x: number; y: number; k: number } | null>(null)
  const picked = tapped ?? value
  return (
    <ul className={`mv-choices${tapped ? ' is-chosen' : ''}`}>
      {options.map((o, i) => (
        <li key={o} style={{ ['--i' as string]: i }}>
          <button
            className={`mv-choice${picked === o ? ' is-on' : ''}`}
            type="button"
            aria-pressed={picked === o}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setRipple({ x: e.clientX - r.left, y: e.clientY - r.top, k: Date.now() })
              setTapped(o)
              onPick(o)
            }}
          >
            {tapped === o && ripple && (
              <i
                key={ripple.k}
                className="mv-ripple"
                style={{ left: ripple.x, top: ripple.y }}
                aria-hidden
              />
            )}
            <span className={`mv-disc${icons?.[i] ? ' has-icon' : ''}`} aria-hidden>
              {icons?.[i]}
              <svg className="mv-tick" viewBox="0 0 16 16">
                <path d="M3.5 8.5 6.6 11.5 12.5 4.8" />
              </svg>
            </span>
            <span className="mv-choice-text">{o}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/* A two-answer question as two photographs side by side, Practice Joy's
   cells: the picture says the answer before the words do. The tapped one
   takes the lime ring and a check, the other steps back, and the page turns
   after the same beat the answer cards hold. `pictures` follows the order of
   `options`; `labels` shortens an answer for under its picture, and the answer
   kept is still the option's own words. */
function PhotoPair({
  options,
  pictures,
  labels,
  value,
  onPick,
}: {
  options: string[]
  pictures: string[]
  labels?: Record<string, string>
  value: string | null
  onPick: (v: string) => void
}) {
  const [tapped, setTapped] = useState<string | null>(null)
  const picked = tapped ?? value
  return (
    <div className={`jf-photos mv-photos${tapped ? ' is-chosen' : ''}`}>
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          className={`jf-photo mv-photo${picked === o ? ' is-on' : ''}`}
          style={{ ['--i' as string]: i }}
          aria-pressed={picked === o}
          onClick={() => {
            setTapped(o)
            onPick(o)
          }}
        >
          <span className="jf-photo-frame">
            <Photo src={pictures[i]} fallback="jf-photo-fallback" />
            <PhotoCheck />
          </span>
          <span className="jf-photo-label">{labels?.[o] ?? o}</span>
        </button>
      ))}
    </div>
  )
}

/* The support question's two answers, pictured: the advisor on their own,
   and a table they would have beside them. */
const SUPPORT_PICTURES = ['./advisor/move/on-my-own.png', './advisor/move/platform-partner.png']
const SUPPORT_LABELS: Record<string, string> = {
  'I want to do it on my own.': 'On my own',
  'I want help from a platform partner.': 'With a platform partner',
}

/* How far through the three readiness questions: three stops on a track,
   the ones answered filled, the current one glowing. */
function Track({ at, of }: { at: number; of: number }) {
  return (
    <div className="mv-track" role="img" aria-label={`Question ${at + 1} of ${of}`}>
      <span className="mv-track-line" aria-hidden>
        <i style={{ width: `${(at / (of - 1)) * 100}%` }} />
      </span>
      {Array.from({ length: of }, (_, i) => (
        <span
          key={i}
          className={`mv-stop${i < at ? ' is-done' : i === at ? ' is-now' : ''}`}
          style={{ left: `${(i / (of - 1)) * 100}%` }}
          aria-hidden
        >
          {i < at ? '✓' : i + 1}
        </span>
      ))}
    </div>
  )
}

type Step =
  | 'intro'
  | 'loading'
  | 'pick'
  | 'when'
  | 'why'
  | 'support'
  | 'brand'
  | 'pros'
  | 'cons'
  | 'who'
  | 'blocker'
  | 'added'
  | 'thought'
  | 'knows'
  | 'acting'
  | 'results'
  | 'badge'

/* The readiness questions: one tap each, on their own rule, as the client's
   readiness panel asks them. */
const READY: Step[] = ['thought', 'knows', 'acting']

type MoveReward = { before: number; after: number; total: number; next?: string; card?: ReactNode; idName?: string }

/* ── what the flow says ───────────────────────────────────────────────────
   The Move and the client's Goals are one flow: a thing to work toward, when,
   why, how, what lifts it and what weighs it down, then how ready. The
   advisor's words come from the advisor flow; the client's are the Goals
   adventure's. Questions a side does not ask are left out of `questions`. */
type Ask = { title: string; sub?: string }
type Written = Ask & { ghosts: string[]; starters: string[]; placeholder?: string; cheer?: string }
export interface MoveContent {
  /** What the thing is called in a label: "move", "goal". */
  word: string
  intro: { title: string; body: string; minutes: number }
  loading: string
  pick: Ask & { options: string[]; ownPlaceholder: string }
  when: Ask & { stops: string[] }
  why: Written
  support: Ask & { options: string[]; pictures: string[]; labels: Record<string, string> }
  brand?: Ask & { options: string[] }
  pros: Written
  cons: Written
  who?: Ask & { options: string[] }
  blocker?: Written
  questions: Step[]
  /** At most this many pros, and as many cons. Unlimited when left out. */
  listMax?: number
  added: string
  ready: Record<'thought' | 'knows' | 'acting', Ask & { options: string[] }>
  /** Where the answers put them: the stage, 1-5, its name and its line. */
  reading: (m: MoveAnswers) => { level: number; name: string; line: string }
  results: { title: string; kicker: string }
  badge: { art: string; name: string; arcTitle?: string }
  /** The last adventure: its celebration ends on the Business ID and the
      questions rather than on a next adventure. */
  last?: boolean
}

export const ADVISOR_MOVE: MoveContent = {
  word: 'move',
  intro: { title: title('mv-intro'), body: body('mv-intro'), minutes: 3 },
  loading: 'Lining up the moves that fit what you’ve told us…',
  pick: { title: title('mv-q1'), sub: body('mv-q1'), options: opts('mv-q1'), ownPlaceholder: 'Open a second office' },
  when: { title: title('mv-q2'), sub: 'Pick the stretch of road it sits on.', stops: opts('mv-q2') },
  why: {
    title: title('mv-q3'),
    sub: body('mv-q3'),
    ghosts: WHY_GHOSTS,
    starters: WHY_STARTERS,
    cheer: 'That’s the heart of it ✦',
  },
  support: {
    /* Asked as a how rather than a yes or no, so it is answered by the two
       pictures under it. Here only: the invite flow keeps its own wording. */
    title: 'How do you want to make your move?',
    options: opts('mv-q4'),
    pictures: SUPPORT_PICTURES,
    labels: SUPPORT_LABELS,
  },
  pros: {
    title: title('mv-q8'),
    sub: 'Every reason is a balloon — add them and watch your move lift.',
    placeholder: 'A reason it’s worth it…',
    ghosts: PRO_GHOSTS,
    starters: PRO_STARTERS,
  },
  cons: {
    title: title('mv-q9'),
    sub: 'Every obstacle is a sandbag. Name them — that’s how you drop them later.',
    placeholder: 'Something that could get in the way…',
    ghosts: CON_GHOSTS,
    starters: CON_STARTERS,
  },
  who: { title: title('mv-q10'), sub: body('mv-q10'), options: opts('mv-q10') },
  blocker: {
    title: title('mv-q10b'),
    sub: body('mv-q10b'),
    ghosts: BLOCKER_GHOSTS,
    starters: BLOCKER_STARTERS,
    cheer: 'Now it can be worked on ✦',
  },
  questions: ['pick', 'when', 'why', 'support', 'pros', 'cons', 'who', 'blocker'],
  added: 'Your move is written down!',
  ready: {
    thought: { title: title('mv-q5'), options: opts('mv-q5') },
    knows: { title: title('mv-q6'), options: opts('mv-q6') },
    acting: { title: title('mv-q7'), options: opts('mv-q7') },
  },
  reading: (m) => {
    const stage = stageOf(sheetWithMove(emptyAnswers(), m))
    return { level: STAGES.indexOf(stage) + 1, name: stage, line: STAGE_BODY[stage] }
  },
  results: { title: 'Your readiness', kicker: 'My readiness stage for my move is' },
  badge: { art: bgMove, name: 'The Move', arcTitle: 'The Move' },
  last: true,
}

/* Where the last adventure's celebration can send you. */
export type MoveEnd = 'id' | 'questions'

export default function MoveFlow({
  onComplete,
  privateNote,
  mic,
  reward,
  content = ADVISOR_MOVE,
}: {
  /** The words it asks in: the advisor's move, or the client's goal. */
  content?: MoveContent
  /** The Move taken to its end; `to` is the card chosen on the celebration,
      when there is one. */
  onComplete: (m: MoveAnswers, to?: MoveEnd) => void
  /** The celebration, as the other adventures end on it. The Move is the
      last of them, so it ends not on a next adventure but on two cards: the
      Business ID it has completed, and the questions it has written. */
  reward?: MoveReward | ((m: MoveAnswers) => MoveReward)
  /** The advisor's privacy switch, for a private question's screen. */
  privateNote?: (stepId: string) => ReactNode
  /** The microphone, under a free-text box. */
  mic?: (value: string, set: (v: string) => void) => ReactNode
}) {
  const [at, setAt] = useState<Step>('intro')
  useCcNav('mv.at', at, setAt, ['intro', 'pick', 'when', 'why', 'support', 'pros', 'cons', 'who', 'blocker', 'thought', 'knows', 'acting', 'results'])
  const [m, setM] = useState<MoveAnswers>(EMPTY)
  const [own, setOwn] = useState('')
  /* What is in the box on the pros or cons screen, not yet added. */
  const [draft, setDraft] = useState('')
  const set = <K extends keyof MoveAnswers>(k: K, v: MoveAnswers[K]) => setM((p) => ({ ...p, [k]: v }))
  /* A double-click on an empty box types a sample in, a few letters at a
     time, the way Outlook's does: one of the openings the box was already
     showing, finished as a sentence. For a list, the next one not yet added. */
  const typing = useRef(0)
  useEffect(() => () => window.clearInterval(typing.current), [])
  const typeIn = (pool: string[], onType: (v: string) => void, skip: string[] = []) => {
    const pick = pool.find((g) => !skip.includes(g.replace(/[.…\s]+$/, ''))) ?? pool[0]
    if (!pick) return
    const full = pick.replace(/[.…\s]+$/, '')
    window.clearInterval(typing.current)
    let n = 0
    typing.current = window.setInterval(() => {
      n = Math.min(full.length, n + 3)
      onType(full.slice(0, n))
      if (n >= full.length) window.clearInterval(typing.current)
    }, 16)
  }
  const addTo = (k: 'pros' | 'cons', v: string) => {
    const t = v.trim()
    if (!t) return
    setM((p) => {
      const list = p[k].filter((x) => x.trim())
      if (content.listMax && list.length >= content.listMax) return p
      /* The same reason twice is one reason. */
      if (list.some((x) => x.trim().toLowerCase() === t.toLowerCase())) return p
      return { ...p, [k]: [...list, t] }
    })
  }

  useEffect(() => {
    setDraft('')
    document.querySelector('.cx-viewport')?.scrollTo({ top: 0 })
    if (at === 'loading') {
      const t = window.setTimeout(() => setAt('pick'), 2600)
      return () => window.clearTimeout(t)
    }
  }, [at])

  const c = content
  /* This list has as many as it may hold. */
  const full =
    (at === 'pros' || at === 'cons') && !!c.listMax && m[at].filter((x) => x.trim()).length >= c.listMax
  /* The screens that ask something, in order, with the foot and the meter. */
  const QUESTIONS = c.questions
  const qi = QUESTIONS.indexOf(at)
  const ri = READY.indexOf(at)
  const go = (s: Step) => setAt(s)
  const fill = useFinishFill()
  const next = () => {
    if (qi >= 0) return qi + 1 < QUESTIONS.length ? go(QUESTIONS[qi + 1]) : fill.finish(() => go('added'))
    if (ri >= 0) return go(ri + 1 < READY.length ? READY[ri + 1] : 'results')
  }
  const previous = () => {
    if (qi > 0) return go(QUESTIONS[qi - 1])
    if (qi === 0) return go('intro')
    if (ri > 0) return go(READY[ri - 1])
    if (ri === 0) return go('added')
  }
  /* A pill tapped: it holds its colour for a beat, then the next screen. */
  const pickAndGo = <K extends keyof MoveAnswers>(k: K, v: MoveAnswers[K]) => {
    set(k, v)
    // Long enough for the answer card's check to draw before the page turns.
    window.setTimeout(next, 560)
  }

  const blank =
    (at === 'pick' && !m.move && !own.trim()) ||
    (at === 'when' && !m.when) ||
    (at === 'why' && !m.why.trim()) ||
    (at === 'support' && !m.support) ||
    (at === 'brand' && !m.brand) ||
    (at === 'pros' && !m.pros.some((p) => p.trim()) && !draft.trim()) ||
    (at === 'cons' && !m.cons.some((p) => p.trim()) && !draft.trim()) ||
    (at === 'who' && !m.who.length) ||
    (at === 'blocker' && !m.blocker.trim()) ||
    (ri >= 0 && !m[at as 'thought' | 'knows' | 'acting'])

  const onOk = () => {
    /* A move typed but never sent with its arrow is still the move. */
    if (at === 'pick' && !m.move && own.trim()) set('move', own.trim())
    /* And a reason or an obstacle typed but never added is still one. */
    if (at === 'pros' || at === 'cons') addTo(at, draft)
    next()
  }

  /* The move as the Goals flow's summary reads a goal. */
  const goal: Goal = {
    title: m.move ?? `My ${c.word}`,
    readiness: 0,
    timeline: m.when ?? undefined,
    pros: m.pros.map((p) => p.trim()).filter(Boolean),
    cons: m.cons.map((p) => p.trim()).filter(Boolean),
    note: m.why.trim() || undefined,
    extra: [
      ...(m.who.length ? [{ label: 'Who it involves', value: m.who.join(' · ') }] : []),
      ...(m.support ? [{ label: 'Support', value: m.support }] : []),
    ],
  }

  const rewardNow = typeof reward === 'function' ? reward(m) : reward
  const { level, name: stage, line: stageLine } = c.reading(m)

  return (
    <div className="jf gl mv">
      {at === 'intro' && (
        <div className="jf-intro">
          <AdventureBadge steps={QUESTIONS.length} />
          <div className="jf-hero">
            <Photo className="jf-hero-img" src="./goals/intro.png" fallback="gl-hero-fallback" />
          </div>
          <h2 className="jf-title">{c.intro.title}</h2>
          <p className="jf-body">{c.intro.body}</p>
          <div className="jf-start">
            <button className="jf-go" type="button" onClick={() => morph(() => go('loading'))}>
              Get Started
            </button>
            <span className="jf-min">
              <ClockIcon /> Takes {c.intro.minutes} min
            </span>
          </div>
        </div>
      )}

      {/* A moment while the moves are lined up from what they have said: the
          mark turning and pulsing, as the Goals flow has it. */}
      {at === 'loading' && (
        <div className="gl-loading" role="status">
          <svg className="gl-mark" viewBox="0 0 288 288" width="104" height="104" aria-hidden>
            {MARK_PARTS.map((d, i) => (
              <g key={i} className={`gl-mark-spin gl-mark-${i}`}>
                <path d={d} />
              </g>
            ))}
          </svg>
          <h2 className="gl-hold">Hold tight!</h2>
          <p>{c.loading}</p>
        </div>
      )}

      {/* The move they picked, held at the top of every question after it, so
          each one is plainly about that move. Outside the screens, so it
          arrives once and stays put while the questions change under it. */}
      {m.move && (qi > 0 || ri >= 0) && (
        <div className="mv-goal">
          <span className="mv-goal-spark" aria-hidden>
            <DiscSparkle />
          </span>
          <span className="mv-goal-text">
            <span className="mv-goal-label">Your {c.word}</span>
            <b>{m.move}</b>
          </span>
        </div>
      )}

      {at === 'pick' && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{c.pick.title}</h2>
          {c.pick.sub && <p className="fy-sub">{c.pick.sub}</p>}
          <ul className="ag-suggestions">
            {c.pick.options.map((o) => (
              <li key={o}>
                <button
                  className={`ag-suggestion${m.move === o ? ' is-on' : ''}`}
                  type="button"
                  aria-pressed={m.move === o}
                  onClick={() => {
                    setOwn('')
                    pickAndGo('move', o)
                  }}
                >
                  <span className="ag-spark" aria-hidden>
                    <Sparkle />
                  </span>
                  <span className="ag-suggestion-text">{o}</span>
                  <span className="ag-go" aria-hidden>
                    <ArrowGo />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <h3 className="ag-step-title ag-own-title">Or write your own</h3>
          <div className="ag-own">
            <input
              className="ag-input"
              value={own}
              placeholder={c.pick.ownPlaceholder}
              onChange={(e) => {
                setOwn(e.target.value)
                if (m.move && !c.pick.options.includes(m.move)) set('move', null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && own.trim()) pickAndGo('move', own.trim())
              }}
            />
            <button
              className="ag-go ag-go-btn"
              type="button"
              aria-label={`Use this ${c.word}`}
              disabled={!own.trim()}
              onClick={() => pickAndGo('move', own.trim())}
            >
              <ArrowGo />
            </button>
          </div>
        </div>
      )}

      {at === 'when' && (
        <Road
          value={m.when}
          stops={c.when.stops}
          title={c.when.title}
          sub={c.when.sub}
          onChange={(v) => set('when', v)}
          onSettle={() => window.setTimeout(next, 560)}
        />
      )}

      {at === 'why' && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{c.why.title}</h2>
          {c.why.sub && <p className="fy-sub">{c.why.sub}</p>}
          <MemoryAsk
            value={m.why}
            onChange={(v) => set('why', v)}
            placeholder={c.why.placeholder ?? 'Write it, or tap the mic and say it.'}
            ghosts={c.why.ghosts}
            starters={c.why.starters}
            cheer={c.why.cheer}
            onDemoFill={() => typeIn(c.why.ghosts, (v) => set('why', v))}
            below={mic?.(m.why, (v) => set('why', v))}
          />
        </div>
      )}

      {at === 'support' && (
        <div className="mv-q mv-q-pair">
          <h2 className="fy-h fy-h-sm">{c.support.title}</h2>
          <PhotoPair
            options={c.support.options}
            pictures={c.support.pictures}
            labels={c.support.labels}
            value={m.support}
            onPick={(v) => pickAndGo('support', v)}
          />
        </div>
      )}

      {at === 'brand' && c.brand && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{c.brand.title}</h2>
          {c.brand.sub && <p className="fy-sub">{c.brand.sub}</p>}
          {privateNote?.('mv-brand')}
          <Pills
            options={c.brand.options}
            icons={BRAND_ICONS}
            value={m.brand}
            onPick={(v) => pickAndGo('brand', v)}
          />
        </div>
      )}

      {(at === 'pros' || at === 'cons') && (
        <div className={`mv-q mv-lift${full ? ' is-full' : ''}`}>
          {/* The balloon over both screens: the pros are its balloons, the
              cons its sandbags, and each carries its words while it is the
              one being asked about. */}
          <Balloon
            pros={m.pros.filter((p) => p.trim())}
            cons={m.cons.filter((c) => c.trim())}
            naming={at}
            prompts={[...c.pros.starters, ...c.cons.starters]}
            onRemove={(k, i) => set(k, m[k].filter((x) => x.trim()).filter((_, j) => j !== i))}
          />
          <h2 className="fy-h fy-h-sm">{c[at].title}</h2>
          {c[at].sub && <p className="fy-sub">{c[at].sub}</p>}
          <MemoryAsk
            key={at}
            value={draft}
            onChange={setDraft}
            placeholder={c[at].placeholder ?? ''}
            disabled={full ? `That’s ${c.listMax}. Take one off the balloon to add another.` : undefined}
            ghosts={c[at].ghosts}
            starters={c[at].starters}
            onDemoFill={() => typeIn(c[at].ghosts, setDraft, m[at])}
            onEnter={() => {
              addTo(at, draft)
              setDraft('')
            }}
            below={
              <div className={`ol-add-row${mic ? ' has-mic' : ''}`}>
                <button
                  className="ol-add ol-add-pill"
                  type="button"
                  disabled={!draft.trim() || full}
                  onClick={() => {
                    addTo(at, draft)
                    setDraft('')
                  }}
                >
                  <span aria-hidden>+</span>
                  {at === 'pros' ? 'Add Pro' : 'Add Con'}
                </button>
                {!full && mic?.(draft, setDraft)}
              </div>
            }
          />
        </div>
      )}

      {at === 'who' && c.who && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{c.who.title}</h2>
          {c.who.sub && <p className="fy-sub">{c.who.sub}</p>}
          <Circle options={c.who.options} value={m.who} onChange={(v) => set('who', v)} />
        </div>
      )}

      {at === 'blocker' && c.blocker && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{c.blocker.title}</h2>
          {c.blocker.sub && <p className="fy-sub">{c.blocker.sub}</p>}
          {privateNote?.('mv-q10b')}
          <MemoryAsk
            value={m.blocker}
            onChange={(v) => set('blocker', v)}
            placeholder={c.blocker.placeholder ?? 'Write it, or tap the mic and say it.'}
            ghosts={c.blocker.ghosts}
            starters={c.blocker.starters}
            cheer={c.blocker.cheer}
            onDemoFill={() => typeIn(c.blocker!.ghosts, (v) => set('blocker', v))}
            below={mic?.(m.blocker, (v) => set('blocker', v))}
          />
        </div>
      )}

      {/* The move written down: the Goals flow's confetti and summary. */}
      {at === 'added' && (
        <div className="gl-added">
          <div className="gl-burst" aria-hidden>
            {BITS.map((b) => (
              <i
                key={b.i}
                style={{
                  ['--x' as string]: `${b.x}px`,
                  ['--y' as string]: `${b.y}px`,
                  ['--r' as string]: `${b.r}deg`,
                  background: b.c,
                  animationDelay: `${(b.i % 6) * 0.03}s`,
                }}
              />
            ))}
          </div>
          <span className="gl-check" aria-hidden>
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
              <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h2 className="gl-title">{c.added}</h2>
          <div className="gl-summary">
            <span className="gl-summary-head">Your {c.word}</span>
            <b className="gl-summary-title">{goal.title}</b>
            <GoalDetail g={goal} />
          </div>
          <div className="gl-acts">
            <button className="jf-go" type="button" onClick={() => go('thought')}>
              Assess My Readiness
            </button>
            <button className="gl-link" type="button" onClick={() => go(QUESTIONS[QUESTIONS.length - 1])}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* The readiness questions, the client's panel in the page: one rule
          for how far through, the move's name, the question and its pills. */}
      {ri >= 0 && (
        <div className="mv-ready" key={at}>
          <Track at={ri} of={READY.length} />
          <p className="mv-ready-count">Question {ri + 1} of {READY.length}</p>
          <h2 className="fy-h fy-h-sm">{c.ready[at as 'thought' | 'knows' | 'acting'].title}</h2>
          <Pills
            options={c.ready[at as 'thought' | 'knows' | 'acting'].options}
            value={m[at as 'thought' | 'knows' | 'acting']}
            onPick={(v) => pickAndGo(at as 'thought' | 'knows' | 'acting', v)}
          />
        </div>
      )}

      {at === 'badge' && rewardNow && (
        <JoyReward
          badge={c.badge.art}
          arcTitle={c.badge.arcTitle}
          name={c.badge.name}
          from={rewardNow.before}
          done={rewardNow.after}
          total={rewardNow.total}
          card={rewardNow.card}
          idName={rewardNow.idName ?? 'Business ID'}
          next={rewardNow.next ?? ''}
          onNext={() => onComplete(m)}
          ending={c.last ? (
            <div className="mv-end">
              <h2 className="mv-end-title">Every adventure, done!</h2>
              <p className="mv-end-sub">Your Business ID is complete. Where to next?</p>
              <button className="mv-end-card" type="button" style={{ ['--i' as string]: 0 }} onClick={() => onComplete(m, 'id')}>
                <span className="mv-end-ic" aria-hidden>
                  {icon('M4 5.5h16v13H4z', 'M8 10a1.8 1.8 0 1 0 0-3.6A1.8 1.8 0 0 0 8 10Z', 'M5.6 14.4c.5-1.8 1.3-2.8 2.4-2.8s1.9 1 2.4 2.8', 'M13 9h4.5', 'M13 12.5h4.5')}
                </span>
                <span className="mv-end-text">
                  <b>My Business ID</b>
                  <span>Everything you told us, on one page.</span>
                </span>
                <span className="mv-end-go" aria-hidden>
                  <ArrowGo />
                </span>
              </button>
              <button className="mv-end-card" type="button" style={{ ['--i' as string]: 1 }} onClick={() => onComplete(m, 'questions')}>
                <span className="mv-end-ic" aria-hidden>
                  {icon('M5 5.5h14v10H10l-4 3.5v-3.5H5z', 'M10.2 9.2a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1', 'M12 14h.01')}
                </span>
                <span className="mv-end-text">
                  <b>My Three Questions</b>
                  <span>Put them to every firm you’re considering.</span>
                </span>
                <span className="mv-end-go" aria-hidden>
                  <ArrowGo />
                </span>
              </button>
            </div>
          ) : undefined}
        />
      )}

      {at === 'results' && (
        <div className="jr glr">
          <Reveal>
            <h2 className="jr-title">{c.results.title}</h2>
            <p className="jr-sub">{goal.title}</p>
            {/* The stage as the picture: the readiness art on a living sky, and
                the stage's name — the Goals flow's ending. */}
            <figure className="jr-memory glr-hero">
              <span className="jr-sky glr-sky" aria-hidden>
                <i className="jr-sun" />
                <i className="jr-glow jr-glow-a" />
                <i className="jr-glow jr-glow-b" />
                <i className="jr-glow jr-glow-c" />
              </span>
              <span className="glr-kicker">{c.results.kicker}</span>
              <div className="glr-stage">
                <img className="glr-ttm" src={TTM_ART[Math.max(1, level) - 1]} alt="" draggable={false} />
                <b>{stage.toUpperCase()}</b>
              </div>
              <p className="glr-line">{stageLine}</p>
            </figure>
          </Reveal>

          <Reveal>
            <h3 className="jr-h">Your {c.word}</h3>
            <div className="glr-summaries">
              <div className="gl-summary glr-summary">
                <b className="gl-summary-title">{goal.title}</b>
                <GoalDetail g={{ ...goal, readiness: level }} />
              </div>
            </div>
          </Reveal>

          <Reveal className="jr-reward">
            <button className="jr-claim" type="button" onClick={() => (reward ? go('badge') : onComplete(m))}>
              <span>Continue</span>
            </button>
          </Reveal>
        </div>
      )}

      {/* Where you are, at the top under the bar. The readiness questions
          carry their own three-stop track instead. */}
      {/* The screen between the intro and the first question already wears the
          timeline, so the intro's title has somewhere to move to. */}
      {at === 'loading' && (
        <div className="jf-top">
          <AdventureMark />
          <StepBar count={QUESTIONS.length} done={0} />
          <AdventureClose />
        </div>
      )}
      {qi >= 0 && (
        <div className="jf-top">
          <AdventureMark />
          <StepBar count={QUESTIONS.length} done={fill.full ? QUESTIONS.length : Math.max(0, qi)} />
          <AdventureClose />
        </div>
      )}
      {/* The foot, on every question — the readiness ones too: Back, and the
          one thing to press. */}
      {(qi >= 0 || ri >= 0) && (
        <>
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
            <button className={`cx-start jf-ok${blank ? ' is-skip' : ''}`} type="button" onClick={onOk}>
              {blank ? 'Skip this question' : 'OK'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
