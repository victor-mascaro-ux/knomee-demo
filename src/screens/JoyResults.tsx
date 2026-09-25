/* Financial Joy, handed back.
 *
 * The design put an AI-made picture of their memory at the top. There is no
 * such picture to be had, so the memory is the picture: their own words set
 * large on a warm, slowly moving light, typed in as if written there. Under it,
 * what they said money is for — the photographs they chose — and where they
 * want their attention to go, the seven cards sorted into the three piles they
 * threw them onto, each card arriving from the side it was thrown.
 *
 * And the one line that makes it worth reading: what it adds up to, in a
 * sentence an advisor could open a conversation with.
 *
 * Each part arrives when it is scrolled to, not all at once on load, so the
 * page is read in the order it is written.
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { JOY_AREA_CARDS, JOY_PICKS, type JoyPick } from '../data/joyFlow'
import type { JoyAnswers } from './JoyFlow'
import './joyResults.css'

/** The ending's words, for an adventure that is this one in another voice —
    the advisor's Practice Joy. The client's are the defaults below. */
export interface JoyResultsCopy {
  title: string
  memoryLead: string
  memoryTag: string
  toolsTitle: string
  toolsLead: string
  prefLead: string
  /** What the piles add up to, in one line. */
  reading: (more: string, less: string) => string
  /** The overlay that opens on arrival: a share, and why it matters. */
  about: { title: string; share: number; want: string; why: string[] }
}

/* A section that animates in the first time it is scrolled into view. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) return setSeen(true)
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <section ref={ref} className={`jr-sec${seen ? ' is-in' : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </section>
  )
}

/* An ending's overlay, and the ending behind it. The overlay opens as the
   ending arrives; until it is first closed the page is held at its first frame
   (`held`), and when it closes the page starts over (`run`, as a key) — so the
   reveals, the count-ups and the typing all play in view, not behind it. */
export function useEndingOverlay(active = true) {
  const [about, setAbout] = useState(false)
  const [held, setHeld] = useState(true)
  const [run, setRun] = useState(0)
  useEffect(() => {
    if (active) setAbout(true)
  }, [active])
  const close = () => {
    setAbout(false)
    if (held) {
      setHeld(false)
      setRun((r) => r + 1)
    }
  }
  return { about, open: () => setAbout(true), close, held: active && held, run }
}

/* Their words, written onto the card a few letters at a time. */
export function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setN(text.length)
    setN(0)
    let i = 0
    const t = window.setInterval(() => {
      i = Math.min(text.length, i + 2)
      setN(i)
      if (i >= text.length) window.clearInterval(t)
    }, 22)
    return () => window.clearInterval(t)
  }, [text])
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && <span className="jr-caret" aria-hidden />}
    </>
  )
}

const PILES = [
  { way: 1, key: 'more', label: 'More', glyph: 'M16 7v18M7 16h18' },
  { way: -1, key: 'less', label: 'Less', glyph: 'M7 16h18' },
  { way: 0, key: 'same', label: 'The same', glyph: 'M7 11.5h18M7 20.5h18' },
] as const

/* Names in a sentence: "a", "a and b", "a, b and c" — and past three, the
   first two and how many more, so the line stays a line. */
const list = (xs: string[]) =>
  xs.length > 3
    ? `${xs.slice(0, 2).join(', ')} and ${xs.length - 2} more`
    : xs.length <= 1
      ? (xs[0] ?? '')
      : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`

/* When the demo reaches this screen without having been answered, it still
   has something to show: the same answers the design was drawn with. */
const FALLBACK = {
  memory:
    'Finally booking a long-awaited family trip, knowing I’ve planned it without financial stress.',
  tools: ['Comfort', 'Supporting my family'],
}

/* The share of people who chose the same two things — a demo figure, stated
   the way the design states it. */
const SHARE = 55

/* A number that counts up to itself when it arrives. */
export function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setN(to)
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 900)
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to])
  return <>{n}</>
}

/* What this adventure means, said once when they arrive and again whenever
   they ask: how many others want money for what they do, and why looking at
   joy at all is worth their while. */
/* The overlay an adventure's ending opens with, and "Learn more" opens again:
   a share of people, drawn as a pie that sweeps round to it, and why the
   adventure is worth taking, under a book whose magnifier looks around the
   page. Shared, so every adventure's ending says it the same way. */
export function AboutOverlay({
  title,
  share,
  first,
  second,
  onClose,
}: {
  title: string
  /** The share the pie shows, 0-100. */
  share: number
  /** The line under the pie. */
  first: ReactNode
  /** The card under the book. */
  second: ReactNode
  onClose: () => void
}) {
  /* It closes on OK and nothing else: a tap beside the panel, or Escape, used
     to dismiss it before it had been read. */
  return (
    <div className="modal-backdrop jr-about-back" role="dialog" aria-modal="true" aria-labelledby="jr-about-title">
      <div className="modal jr-about" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header jr-about-head">
          <h2 className="modal-title" id="jr-about-title">
            {title}
          </h2>
        </div>
        <div className="modal-body jr-about-body">
          {/* A share, drawn: the slice sweeps round to its size. */}
          <svg className="jr-pie" viewBox="0 0 48 48" width="56" height="56" aria-hidden>
            {/* A pie the way pies are read: the slice sweeps clockwise from
                twelve o'clock to its share, with a dark edge at each side of
                it — the second edge travelling round with the sweep. */}
            <circle cx="24" cy="24" r="20" fill="#fff" />
            <circle
              className="jr-pie-slice"
              cx="24"
              cy="24"
              r="10"
              fill="none"
              stroke="var(--k-teal)"
              strokeWidth="20"
              pathLength="100"
              strokeDasharray={`${share} 100`}
              transform="rotate(-90 24 24)"
              style={{ ['--share' as string]: share }}
            />
            <path d="M24 24V4" stroke="var(--k-ocean)" strokeWidth="3" strokeLinecap="round" />
            <path
              className="jr-pie-edge"
              d="M24 24V4"
              stroke="var(--k-ocean)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ ['--turn' as string]: `${share * 3.6}deg` }}
            />
            <circle cx="24" cy="24" r="20" fill="none" stroke="var(--k-ocean)" strokeWidth="3.4" />
          </svg>
                    <p className="jr-about-card">{first}</p>
          <svg className="jr-book" viewBox="0 0 48 48" width="56" height="56" fill="none" aria-hidden>
            {/* An open book, and a magnifier over its lower right corner —
                ringed in white so it sits on top of the page rather than
                tangling with its lines. */}
            <path
              d="M21 12.2c-4.4-2.8-10-3-15.6-1v23.6c5.6-2 11.2-1.8 15.6 1 4.4-2.8 10-3 15.6-1V11.2c-5.6-2-11.2-1.8-15.6 1Z"
              stroke="var(--k-ocean)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M21 12.2v23.6" stroke="var(--k-ocean)" strokeWidth="3" />
            <g className="jr-lens">
              <circle cx="34" cy="32" r="10" fill="#fff" />
              <path d="m39.6 37.6 5.2 5.2" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
              <circle cx="34" cy="32" r="6.6" fill="var(--k-teal)" stroke="var(--k-ocean)" strokeWidth="3" />
              <path d="m39.2 37.2 5 5" stroke="var(--k-ocean)" strokeWidth="3.6" strokeLinecap="round" />
            </g>
          </svg>
          <div className="jr-about-card">{second}</div>
        </div>
        <div className="modal-footer jr-about-foot">
          <button className="btn btn-primary" type="button" autoFocus onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

/* Financial Joy's: the share who want money for what she chose. */
function AboutJoy({ tools, onClose }: { tools: string[]; onClose: () => void }) {
  const named = tools.slice(0, 2).map((t) => t.toLowerCase().replace(/^supporting my /, 'supporting '))
  return (
    <AboutOverlay
      title="You found Financial Joy!"
      share={SHARE}
      onClose={onClose}
      first={
        <>
          <b>
            <CountUp to={SHARE} />%
          </b>{' '}
          of respondents want money to help with{' '}
          {named.length === 2 ? (
            <>
              <b>{named[0]}</b> and <b>{named[1]}</b>
            </>
          ) : (
            <b>{named[0] ?? 'the same things you do'}</b>
          )}
          .
        </>
      }
      second={
        <>
          <p>
            Studies show that reflecting on <b>what sparks your joy</b> drives better outcomes.
          </p>
          <p>
            When you see saving as <b>progress</b> toward what truly matters, you set yourself up
            for a <b>brighter future</b>!
          </p>
        </>
      }
    />
  )
}

/* The same overlay in another adventure's words. */
function AboutCopy({ about, tools, onClose }: { about: JoyResultsCopy['about']; tools: string[]; onClose: () => void }) {
  const named = tools.slice(0, 2).map((t) => t.toLowerCase())
  return (
    <AboutOverlay
      title={about.title}
      share={about.share}
      onClose={onClose}
      first={
        <>
          <b>
            <CountUp to={about.share} />%
          </b>{' '}
          of respondents {about.want}{' '}
          {named.length === 2 ? (
            <>
              <b>{named[0]}</b> and <b>{named[1]}</b>
            </>
          ) : (
            <b>{named[0] ?? 'the same things you do'}</b>
          )}
          .
        </>
      }
      second={
        <>
          {about.why.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </>
      }
    />
  )
}

export default function JoyResults({
  answers,
  cta,
  onClaim,
  picks: allPicks = JOY_PICKS,
  areas = JOY_AREA_CARDS,
  copy,
}: {
  answers: JoyAnswers
  cta: string
  onClaim: () => void
  picks?: JoyPick[]
  areas?: JoyPick[]
  /** Another adventure's words. Without them the page is the client's, and
      an unanswered one is shown the design's sample answers; with them, an
      unanswered part of the page simply is not there. */
  copy?: JoyResultsCopy
}) {
  const memory = answers.notes.find((n) => n.trim())?.trim() || (copy ? '' : FALLBACK.memory)
  const tools = answers.tools.length ? answers.tools : copy ? [] : FALLBACK.tools
  const picks = tools
    .map((t) => allPicks.find((p) => p.label === t))
    .filter((p): p is JoyPick => !!p)
  const other = answers.other.trim()

  /* Anything unanswered sits with "the same": not moved is not moving. */
  const wayOf = (label: string) => answers.attention[label] ?? 0
  const piles = PILES.map((p) => ({
    ...p,
    cards: areas.filter((c) => wayOf(c.label) === p.way),
  }))
  const more = piles[0].cards.map((c) => c.label.toLowerCase())
  const less = piles[1].cards.map((c) => c.label.toLowerCase())

  /* What it adds up to, in one line. */
  /* Said once, a moment after they arrive — long enough to see the page it
     is about — and again from "Learn more". */
  const ending = useEndingOverlay()

  const reading = copy
    ? copy.reading(list(more), list(less))
    : more.length && less.length
      ? `You want your time to move toward ${list(more)}, and away from ${list(less)}. That is where your advisor will start.`
      : more.length
        ? `You want more of your time for ${list(more)}. That is where your advisor will start.`
        : less.length
          ? `You want less of your time going to ${list(less)}. That is where your advisor will start.`
          : 'You are happy with where your time goes today. Your advisor will help you keep it there.'

  return (
    <div className={`jr${ending.held ? ' is-held' : ''}`} key={ending.run}>
      <button className="jr-learn" type="button" onClick={ending.open}>
        Learn more
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="M8 7v4.2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="8" cy="4.7" r="1" fill="#fff" />
        </svg>
      </button>
      {ending.about &&
        (copy ? (
          <AboutCopy about={copy.about} tools={tools} onClose={ending.close} />
        ) : (
          <AboutJoy tools={tools} onClose={ending.close} />
        ))}
      <Reveal className="jr-found">
        <h2 className="jr-title">{copy?.title ?? 'You found joy'}</h2>
        {memory && (
          <>
        <p className="jr-sub">{copy?.memoryLead ?? 'This was the last time you truly experienced joy:'}</p>
        {/* The memory, as the picture: a warm light that moves, and the words
            written onto it. */}
        <figure className="jr-memory">
          <span className="jr-sky" aria-hidden>
            <i className="jr-sun" />
            <i className="jr-glow jr-glow-a" />
            <i className="jr-glow jr-glow-b" />
            <i className="jr-glow jr-glow-c" />
          </span>
          <span className="jr-quote-mark" aria-hidden>
            “
          </span>
          <blockquote className="jr-words">
            <Typed text={memory} />
          </blockquote>
          <figcaption className="jr-tag">{copy?.memoryTag ?? 'Your memory'}</figcaption>
        </figure>
          </>
        )}
      </Reveal>

      {(picks.length > 0 || other) && (
      <Reveal>
        <h3 className="jr-h">{copy?.toolsTitle ?? 'Money is a tool'}</h3>
        <p className="jr-sub">{copy?.toolsLead ?? 'You want money to help you with:'}</p>
        <div className="jr-tools">
          {picks.map((p, i) => (
            <figure className="jr-tool" key={p.label} style={{ ['--i' as string]: i }}>
              <span className="jr-tool-photo">
                <img src={p.src} alt="" draggable={false} onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
              </span>
              <figcaption className="jr-pill">{p.label}</figcaption>
            </figure>
          ))}
          {other && (
            <figure className="jr-tool is-own" style={{ ['--i' as string]: picks.length }}>
              <span className="jr-tool-photo jr-tool-word">“{other}”</span>
              <figcaption className="jr-pill">In your words</figcaption>
            </figure>
          )}
        </div>
      </Reveal>
      )}

      <Reveal>
        <h3 className="jr-h">Preferences</h3>
        <p className="jr-sub">{copy?.prefLead ?? 'This is how you prefer to allocate your time today.'}</p>
        <div className="jr-piles">
          {piles
            .filter((p) => p.cards.length)
            .map((p) => (
              <div className={`jr-pile is-${p.key}`} key={p.key}>
                <span className="jr-pile-mark" aria-label={p.label}>
                  <svg viewBox="0 0 32 32" width="20" height="20" fill="none" aria-hidden>
                    <path d={p.glyph} stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <b>{p.cards.length}</b>
                </span>
                <div className="jr-cards">
                  {p.cards.map((c, i) => (
                    <figure className="jr-card" key={c.label} style={{ ['--i' as string]: i }}>
                      <span className="jr-card-photo">
                        <img src={c.src} alt="" draggable={false} onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
                      </span>
                      <figcaption>{c.label}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ))}
        </div>
        {/* What it adds up to: the line a conversation can open with. */}
        <p className="jr-reading">
          <span className="jr-reading-mark" aria-hidden>
            ✦
          </span>
          {reading}
        </p>
      </Reveal>

      <Reveal className="jr-reward">
        <p className="jr-reward-line">You got a reward!</p>
        <button className="jr-claim" type="button" onClick={onClaim}>
          <span>{cta}</span>
        </button>
      </Reveal>
    </div>
  )
}
