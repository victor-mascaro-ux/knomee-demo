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
import { JOY_AREA_CARDS, JOY_PICKS } from '../data/joyFlow'
import type { JoyAnswers } from './JoyFlow'
import './joyResults.css'

/* A section that animates in the first time it is scrolled into view. */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
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

/* Their words, written onto the card a few letters at a time. */
function Typed({ text }: { text: string }) {
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

export default function JoyResults({
  answers,
  cta,
  onClaim,
}: {
  answers: JoyAnswers
  cta: string
  onClaim: () => void
}) {
  const memory = answers.notes.find((n) => n.trim())?.trim() || FALLBACK.memory
  const tools = answers.tools.length ? answers.tools : FALLBACK.tools
  const picks = tools
    .map((t) => JOY_PICKS.find((p) => p.label === t))
    .filter((p): p is (typeof JOY_PICKS)[number] => !!p)
  const other = answers.other.trim()

  /* Anything unanswered sits with "the same": not moved is not moving. */
  const wayOf = (label: string) => answers.attention[label] ?? 0
  const piles = PILES.map((p) => ({
    ...p,
    cards: JOY_AREA_CARDS.filter((c) => wayOf(c.label) === p.way),
  }))
  const more = piles[0].cards.map((c) => c.label.toLowerCase())
  const less = piles[1].cards.map((c) => c.label.toLowerCase())

  /* What it adds up to, in one line. */
  const reading =
    more.length && less.length
      ? `You want your time to move toward ${list(more)}, and away from ${list(less)}. That is where your advisor will start.`
      : more.length
        ? `You want more of your time for ${list(more)}. That is where your advisor will start.`
        : less.length
          ? `You want less of your time going to ${list(less)}. That is where your advisor will start.`
          : 'You are happy with where your time goes today. Your advisor will help you keep it there.'

  return (
    <div className="jr">
      <Reveal className="jr-found">
        <h2 className="jr-title">You found joy</h2>
        <p className="jr-sub">This was the last time you truly experienced joy:</p>
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
          <figcaption className="jr-tag">Your memory</figcaption>
        </figure>
      </Reveal>

      <Reveal>
        <h3 className="jr-h">Money is a tool</h3>
        <p className="jr-sub">You want money to help you with:</p>
        <div className="jr-tools">
          {picks.map((p, i) => (
            <figure className="jr-tool" key={p.label} style={{ ['--i' as string]: i }}>
              <span className="jr-tool-photo">
                <img src={p.src} alt="" draggable={false} />
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

      <Reveal>
        <h3 className="jr-h">Preferences</h3>
        <p className="jr-sub">This is how you prefer to allocate your time today.</p>
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
                        <img src={c.src} alt="" draggable={false} />
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
