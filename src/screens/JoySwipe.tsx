/* Where their attention goes, one area of a life at a time, as a deck.
 *
 * Each area is a card: its photograph and its name. They are sorted the way
 * cards are — thrown right for more of it, left for less, down for the same —
 * or with the three buttons under the deck, which throw the card the same way.
 * The card follows the finger while it is held, leaning into the way it is
 * going and wearing that answer's colour, and the button it is heading for
 * swells; let go short of the edge and it springs back.
 *
 * The drag is written straight onto the card's style every pointer move. A
 * render per pixel is what made the vision board's drag feel dragged through
 * mud, and a card that is thrown has to feel light.
 */

import { useRef, useState } from 'react'
import type { JoyPick } from '../data/joyFlow'

export type Way = -1 | 0 | 1

const WAYS: { way: Way; key: string; label: string }[] = [
  { way: -1, key: 'less', label: 'Less' },
  { way: 0, key: 'same', label: 'The same' },
  { way: 1, key: 'more', label: 'More' },
]

/* How far a card must travel before letting go throws it, in CSS pixels. */
const THROW = 90
const FLY_MS = 320

function Glyph({ way }: { way: Way }) {
  return (
    <svg viewBox="0 0 32 32" width="34" height="34" fill="none" aria-hidden>
      {way === -1 && <path d="M7 16h18" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />}
      {way === 0 && (
        <path d="M7 11.5h18M7 20.5h18" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />
      )}
      {way === 1 && (
        <path d="M16 7v18M7 16h18" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />
      )}
    </svg>
  )
}

/* A photograph that may not be in public/joy/areas/ yet. */
function AreaPhoto({ src }: { src: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <span className="js-photo-fallback" aria-hidden />
  return <img src={src} alt="" draggable={false} onError={() => setMissing(true)} />
}

export default function JoySwipe({
  areas,
  at,
  onAnswer,
}: {
  areas: JoyPick[]
  /** Which card is on top. */
  at: number
  /** An answer for the card on top; the deck has already thrown it. */
  onAnswer: (area: string, way: Way) => void
}) {
  const top = useRef<HTMLDivElement>(null)
  /* The answer the held card is leaning towards, for the tint and the button
     that swells. Set only when it changes, not every move. */
  const [lean, setLean] = useState<Way | null>(null)
  const [flying, setFlying] = useState(false)

  const reduce = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  /* Throw the top card off the edge its answer points at, then hand the
     answer over once it has gone. */
  const fling = (way: Way, from?: { x: number; y: number }) => {
    const el = top.current
    const area = areas[at]
    if (!el || !area || flying) return
    setFlying(true)
    setLean(way)
    const x = from?.x ?? 0
    const y = from?.y ?? 0
    const to =
      way === 0
        ? `translate(${x * 0.4}px, 720px) rotate(${x * 0.02}deg)`
        : `translate(${way * 560}px, ${y + 40}px) rotate(${way * 28}deg)`
    const done = () => {
      setFlying(false)
      setLean(null)
      onAnswer(area.label, way)
    }
    if (reduce()) return done()
    el.style.transition = `transform ${FLY_MS}ms cubic-bezier(0.4, 0, 0.7, 0.4), opacity ${FLY_MS}ms ease-in`
    el.style.transform = to
    el.style.opacity = '0'
    window.setTimeout(done, FLY_MS)
  }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = top.current
    if (!el || flying || e.button !== 0) return
    e.preventDefault()
    // The phone is drawn scaled; the pointer moves in screen pixels.
    const scale = el.getBoundingClientRect().width / el.offsetWidth || 1
    const x0 = e.clientX
    const y0 = e.clientY
    let x = 0
    let y = 0
    let leaning: Way | null = null
    el.style.transition = 'none'
    const move = (ev: PointerEvent) => {
      x = (ev.clientX - x0) / scale
      y = (ev.clientY - y0) / scale
      el.style.transform = `translate(${x}px, ${y}px) rotate(${x * 0.06}deg)`
      /* Down only counts once it is clearly more down than sideways. */
      const next: Way | null =
        y > 40 && y > Math.abs(x) ? 0 : x > 30 ? 1 : x < -30 ? -1 : null
      if (next !== leaning) {
        leaning = next
        setLean(next)
      }
      el.style.setProperty(
        '--lean',
        String(Math.min(1, Math.max(Math.abs(x), y > 0 ? y : 0) / THROW)),
      )
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      const way: Way | null =
        y > THROW && y > Math.abs(x) ? 0 : x > THROW ? 1 : x < -THROW ? -1 : null
      if (way !== null) return fling(way, { x, y })
      /* Short of the edge: back onto the deck. */
      el.style.transition = 'transform 0.34s cubic-bezier(0.2, 1.3, 0.4, 1)'
      el.style.transform = ''
      el.style.removeProperty('--lean')
      setLean(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  /* The top card and the two under it; the rest of the deck is the edges. */
  const shown = areas.slice(at, at + 3)
  const left = areas.length - at

  return (
    <div className="js">
      <div className={`js-deck${left > 3 ? ' has-more' : ''}`}>
        {shown
          .map((area, i) => (
            <div
              key={area.label}
              ref={i === 0 ? top : undefined}
              className={`js-card js-depth-${i}${i === 0 && lean !== null ? ` is-lean-${WAYS.find((w) => w.way === lean)!.key}` : ''}`}
              onPointerDown={i === 0 ? onDown : undefined}
              data-no-drag-scroll
              aria-hidden={i !== 0}
            >
              <span className="js-photo">
                <AreaPhoto src={area.src} />
              </span>
              <span className="js-name">{area.label}</span>
              {i === 0 && (
                <span className="js-stamp" aria-hidden>
                  {lean !== null ? WAYS.find((w) => w.way === lean)!.label : ''}
                </span>
              )}
            </div>
          ))
          /* Drawn back to front, so the top card is the last painted. */
          .reverse()}
      </div>

      <div className="js-ways">
        {WAYS.map((w) => (
          <button
            key={w.key}
            type="button"
            className={`js-way is-${w.key}${lean === w.way ? ' is-lean' : ''}`}
            aria-label={w.label}
            disabled={flying || left === 0}
            onClick={() => fling(w.way)}
          >
            <Glyph way={w.way} />
          </button>
        ))}
      </div>
    </div>
  )
}
