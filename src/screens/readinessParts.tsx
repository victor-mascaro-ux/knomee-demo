/* The Readiness and Playbook tabs, built once and used by both profiles.
 *
 * The prospect page (Sarah) and the candidate page (Marcus) render these same
 * components from the same interfaces in `readiness.ts`, so the two products
 * cannot drift: a card added here shows up on both, and the four behavioural
 * tags wear the same `--tag-*` pairs wherever they land.
 *
 * Motion follows the profile pages: cards rise in on mount with a stagger,
 * white tiles lift and outline on hover, bars and rings draw over --dur-bar,
 * and everything is off under prefers-reduced-motion.
 */

import { useEffect, useRef, useState } from 'react'
import './readiness.css'
import type {
  AskedQuestion,
  Driver,
  PlaybookTab,
  ReadinessTab,
  Snapshot,
  Starter,
  TagName,
  Velocity,
  Word as WordT,
} from '../data/readiness'
import { CheckIcon } from '../components/icons'
import icScore from '../assets/cards/readiness-score.svg'
import icVelocity from '../assets/cards/velocity.svg'
import icMotivators from '../assets/cards/motivators.svg'
import icApprehensions from '../assets/cards/apprehensions.svg'
import icStarters from '../assets/cards/starters.svg'
import icCommunication from '../assets/cards/communication.svg'
import icTopAction from '../assets/cards/top-action.svg'
import icQuestions from '../assets/adventures/questions.svg'

/* ── shared bits ────────────────────────────────────────────────────────── */

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** Counts a score up on mount, the way the analytics bars draw themselves.
    A hidden tab does not run animation frames, so the number would otherwise
    sit frozen part-way up until someone looked at it: when the page is not
    visible it simply arrives at its value. */
function useCountUp(target: number, ms = 700) {
  const [n, setN] = useState(() => (reduceMotion() ? target : 0))
  const raf = useRef<number>()
  useEffect(() => {
    if (reduceMotion() || (typeof document !== 'undefined' && document.hidden)) {
      setN(target)
      return
    }
    const started = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - started) / ms)
      // Same ease-out shape as --ease-standard, so the number and the ring
      // that carries it settle together.
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [target, ms])
  return n
}

/** True once the element has been on screen, so bars draw when they arrive. */
function useSeen<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (reduceMotion() || !('IntersectionObserver' in window)) {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSeen(true)),
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen])
  return { ref, seen }
}

const TAG_CLASS: Record<TagName, string> = {
  'Positive Talk': 'rd-tag-positive',
  'Demonstrate Curiosity': 'rd-tag-curiosity',
  'Self-Reinforcement': 'rd-tag-self',
  'Acknowledge and Validate': 'rd-tag-validate',
}

function Tag({ name }: { name: TagName }) {
  return <span className={`rd-tag ${TAG_CLASS[name]}`}>{name}</span>
}

/** The card head every panel shares — the Financial ID's head exactly: the
    card's own symbol on a 22px white disc, then the title. Each symbol is
    colour-coded to what the card is about, so the card is findable before it
    is read. */
function Head({
  icon,
  title,
  children,
}: {
  icon: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="pp-card-head">
      <span className="pp-card-title">
        <img className="pp-card-ic" src={icon} alt="" />
        {title}
      </span>
      {children}
    </div>
  )
}

/* The one glyph still drawn in code: the small bubble that marks each starter
   and each question row. The card symbols are artwork, in ../assets/cards. */
const ChatGlyph = () => (
  <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden>
    <path
      d="M2.4 8.2c0-2.9 2.9-5.2 6.6-5.2s6.6 2.3 6.6 5.2-2.9 5.2-6.6 5.2c-.8 0-1.6-.1-2.3-.3l-3.2 1.7.8-2.7C3.3 11.1 2.4 9.7 2.4 8.2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

/* ── the KQ ring ────────────────────────────────────────────────────────── */

function KqRing({ value }: { value: number }) {
  const { ref, seen } = useSeen<HTMLDivElement>()
  const shown = useCountUp(seen ? value : 0)
  // A 270°-gap-free dial: the track is the full circle, the fill is the score,
  // drawn from the top clockwise with round caps.
  const r = 84
  const c = 2 * Math.PI * r
  return (
    <div className="rd-ring" ref={ref}>
      <svg viewBox="0 0 200 200" width="200" height="200" aria-hidden>
        <defs>
          <linearGradient id="rd-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop className="rd-ring-stop-a" offset="0%" />
            <stop className="rd-ring-stop-b" offset="100%" />
          </linearGradient>
        </defs>
        <circle className="rd-ring-track" cx="100" cy="100" r={r} />
        <circle
          className="rd-ring-fill"
          cx="100"
          cy="100"
          r={r}
          strokeDasharray={`${((seen ? value : 0) / 100) * c} ${c}`}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <span className="rd-ring-num" aria-label={`Knomee Quotient ${value}`}>
        {shown}
      </span>
    </div>
  )
}

function DimensionCard({ d, i }: { d: Snapshot['dimensions'][number]; i: number }) {
  const { ref, seen } = useSeen<HTMLDivElement>()
  const shown = useCountUp(seen ? d.score : 0)
  return (
    <div
      className={`rd-dim${d.evidence?.length ? ' tt tt-up' : ''}`}
      data-tip={d.evidence?.join(' · ')}
      ref={ref}
      style={{ animationDelay: `${0.06 + i * 0.06}s` }}
    >
      <span className="rd-dim-key">{d.key}</span>
      <span className="rd-dim-q">{d.question}</span>
      <span className="rd-dim-score">{shown}</span>
      <span className="rd-dim-caption">{d.caption}</span>
    </div>
  )
}

export function ReadinessSnapshot({ s }: { s: Snapshot }) {
  return (
    <section className="pp-card rd-card rd-snapshot">
      <Head icon={icScore} title="Conversion Readiness Snapshot" />
      <div className="rd-snapshot-body">
        <div className="rd-kq">
          <span className="rd-kq-title">Knomee Quotient (KQ)</span>
          <span className="rd-kq-q">{s.question}</span>
          <KqRing value={s.kq} />
        </div>
        <div className="rd-breakdown">
          <span className="rd-breakdown-label">KQ Breakdown:</span>
          <div className="rd-dims">
            {s.dimensions.map((d, i) => (
              <DimensionCard d={d} i={i} key={d.key} />
            ))}
          </div>
          <div className={`rd-tier rd-tier-${s.tier.n}`}>
            <span className="rd-tier-swatch" aria-hidden />
            <span className="rd-tier-name">
              Tier {s.tier.n} – {s.tier.name.toUpperCase()}
            </span>
            <p className="rd-tier-body">{s.tier.body}</p>
            {s.tier.note && <p className="rd-tier-note">{s.tier.note}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── the three columns ──────────────────────────────────────────────────── */

/** The one line that says what the reader does next. Firm side only. */
function Action({ children }: { children: string }) {
  return (
    <p className="rd-action">
      <span className="rd-action-tag">Do</span>
      {children}
    </p>
  )
}

export function VelocityCard({ v }: { v: Velocity }) {
  return (
    <section className="pp-card rd-card rd-col">
      <Head icon={icVelocity} title={v.title} />
      <div className="rd-velocity">
        <span className="rd-verdict">{v.verdict}</span>
        <ul className="rd-points">
          {v.points.map((p, i) => (
            <li key={p} style={{ animationDelay: `${i * 0.05}s` }}>
              {p}
            </li>
          ))}
        </ul>
      </div>
      {v.action && <Action>{v.action}</Action>}
    </section>
  )
}

function DriverList({ items, kind }: { items: Driver[]; kind: 'motivator' | 'concern' }) {
  return (
    <div className="rd-drivers">
      {items.map((d, i) => (
        <div
          className={`rd-driver rd-driver-${kind}`}
          key={d.title}
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <span className="rd-driver-title">{d.title}</span>
          <p className="rd-driver-body">{d.body}</p>
        </div>
      ))}
    </div>
  )
}

export function MotivatorsCard({ items, action }: { items: Driver[]; action?: string }) {
  return (
    <section className="pp-card rd-card rd-col">
      <Head icon={icMotivators} title="Motivators" />
      <DriverList items={items} kind="motivator" />
      {action && <Action>{action}</Action>}
    </section>
  )
}

export function ApprehensionsCard({ items, action }: { items: Driver[]; action?: string }) {
  return (
    <section className="pp-card rd-card rd-col">
      <Head icon={icApprehensions} title="Apprehensions" />
      <DriverList items={items} kind="concern" />
      {action && <Action>{action}</Action>}
    </section>
  )
}

export function ReadinessTabView({ d, extras }: { d: ReadinessTab; extras?: React.ReactNode }) {
  return (
    <div className="rd">
      <ReadinessSnapshot s={d.snapshot} />
      <div className="rd-cols">
        <VelocityCard v={d.velocity} />
        <MotivatorsCard items={d.motivators} action={d.motivatorsAction} />
        <ApprehensionsCard items={d.apprehensions} action={d.apprehensionsAction} />
      </div>
      {extras}
    </div>
  )
}

/* ── the playbook ───────────────────────────────────────────────────────── */

/** Copies a line to the clipboard — the rep's actual next move with it. */
function CopyLine({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setDone(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 1600)
  }
  return (
    <button
      type="button"
      className={`rd-copy ${done ? 'is-done' : ''}`}
      onClick={copy}
      aria-label={`Copy ${label}`}
    >
      {done ? (
        <>
          <CheckIcon /> Copied
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
            <rect
              x="5.2"
              y="5.2"
              width="8"
              height="9"
              rx="1.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M10.6 3.2V2.6a1.6 1.6 0 0 0-1.6-1.6H4.2a1.6 1.6 0 0 0-1.6 1.6v6.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

function StarterRow({ s, i }: { s: Starter; i: number }) {
  return (
    <div className="rd-starter" style={{ animationDelay: `${i * 0.05}s` }}>
      <span className="rd-starter-ic" aria-hidden>
        <ChatGlyph />
      </span>
      <div className="rd-starter-body">
        <p className="rd-starter-quote">“{s.quote}”</p>
        <p className="rd-starter-why">{s.why}</p>
        <div className="rd-starter-tags">
          {s.tags.map((t) => (
            <Tag name={t} key={t} />
          ))}
        </div>
      </div>
      <CopyLine text={s.quote} label="this conversation starter" />
    </div>
  )
}

export function StartersCard({
  starters,
  keyRows,
}: {
  starters: Starter[]
  keyRows: { tag: TagName; meaning: string }[]
}) {
  return (
    <section className="pp-card rd-card">
      <Head icon={icStarters} title="Conversation Starters" />
      <div className="rd-starters">
        {starters.map((s, i) => (
          <StarterRow s={s} i={i} key={s.quote} />
        ))}
      </div>

      <h4 className="rd-sub-head">Strategic Recommendations Key</h4>
      <div className="rd-key">
        {keyRows.map((k) => (
          <div className={`rd-key-row ${TAG_CLASS[k.tag]}`} key={k.tag}>
            <span className="rd-key-tag">{k.tag}</span>
            <p className="rd-key-meaning">{k.meaning}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function QuestionRow({ q, i }: { q: AskedQuestion; i: number }) {
  return (
    <div className="rd-ask" style={{ animationDelay: `${i * 0.05}s` }}>
      <span className="rd-ask-ic" aria-hidden>
        <ChatGlyph />
      </span>
      <div className="rd-ask-body">
        <p className="rd-ask-q">“{q.quote}”</p>
        <p className="rd-ask-guidance">{q.guidance}</p>
        <div className="rd-ask-points">
          {q.points.map((p) => (
            <span className="rd-ask-point" key={p}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function QuestionsCard({
  questions,
  note,
}: {
  questions: AskedQuestion[]
  note?: string
}) {
  return (
    <section className="pp-card rd-card">
      <Head icon={icQuestions} title="Questions They May Ask">
        {note && <span className="rd-head-note">{note}</span>}
      </Head>
      <div className="rd-asks">
        {questions.map((q, i) => (
          <QuestionRow q={q} i={i} key={q.quote} />
        ))}
      </div>
    </section>
  )
}

/* A word pill. Where the data says why the word is on the list — the firm side
   does — it carries the dashboard's own hover tooltip. */
function Word({ w, i }: { w: WordT; i: number }) {
  return (
    <span
      className={`rd-word${w.hint ? ' tt tt-up' : ''}`}
      data-tip={w.hint}
      style={{ animationDelay: `${i * 0.03}s` }}
    >
      {w.word}
    </span>
  )
}

export function CommunicationRail({ d }: { d: PlaybookTab }) {
  return (
    <section className="pp-card rd-card rd-comm">
      <Head icon={icCommunication} title="Communication" />

      <h4 className="rd-comm-label">Words to Use</h4>
      <div className="rd-words rd-words-use">
        {d.words.use.map((w, i) => (
          <Word w={w} i={i} key={w.word} />
        ))}
      </div>

      <h4 className="rd-comm-label">Words to Avoid</h4>
      <div className="rd-words rd-words-avoid">
        {d.words.avoid.map((w, i) => (
          <Word w={w} i={i} key={w.word} />
        ))}
      </div>

      <div className="rd-comm-box">
        <span className="rd-comm-k">Engagement Level</span>
        <p className="rd-comm-v">{d.engagement}</p>
        <span className="rd-comm-k">{d.takeawayLabel}</span>
        <p className="rd-comm-v">{d.takeaway}</p>
      </div>
    </section>
  )
}

export function PlaybookTabView({ d, extras }: { d: PlaybookTab; extras?: React.ReactNode }) {
  return (
    <div className="rd">
      <div className="rd-top-action">
        <img className="pp-card-ic rd-top-ic" src={icTopAction} alt="" />
        <b>Top Action</b>
        <span className="rd-top-text">{d.topAction}</span>
      </div>

      <div className="rd-play-cols">
        <div className="rd-play-main">
          <StartersCard starters={d.starters} keyRows={d.key} />
          <QuestionsCard questions={d.questions} note={d.questionsNote} />
          {extras}
        </div>
        <div className="rd-play-rail">
          <CommunicationRail d={d} />
        </div>
      </div>
    </div>
  )
}
