/* A question that asks for a memory, in their own words.
 *
 * It used to be a blank box under a question — the least inviting thing on
 * the whole journey. Now the box is a card on the same warm, slowly moving
 * sky the ending shows the memory on, and the sky warms as they write, so the
 * ending pays off something they watched happen. While it is empty, a few
 * real-sounding openings type themselves in and away as a ghost, showing the
 * kind of answer wanted without putting words in anyone's mouth. A row of
 * starters drops a beginning into the box with one tap, the microphone sits
 * big under it, and once there is a real answer a quiet line says so.
 *
 * Shared by the client's Financial Joy and the advisor's Practice Joy.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import './memoryAsk.css'

/* The ghost's rhythm: letters in, a pause to read, letters out. */
const TYPE_MS = 45
const ERASE_MS = 18
const HOLD_MS = 1800

function useGhost(lines: string[], active: boolean) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    if (!active || !lines.length) {
      setShown('')
      return
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(lines[0])
      return
    }
    let line = 0
    let n = 0
    let dir: 1 | -1 = 1
    let t = 0
    const tick = () => {
      const full = lines[line]
      n += dir
      setShown(full.slice(0, n))
      if (dir === 1 && n >= full.length) {
        dir = -1
        t = window.setTimeout(tick, HOLD_MS)
        return
      }
      if (dir === -1 && n <= 0) {
        dir = 1
        line = (line + 1) % lines.length
        t = window.setTimeout(tick, 500)
        return
      }
      t = window.setTimeout(tick, dir === 1 ? TYPE_MS : ERASE_MS)
    }
    t = window.setTimeout(tick, 600)
    return () => window.clearTimeout(t)
  }, [lines, active])
  return shown
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

export default function MemoryAsk({
  value,
  onChange,
  placeholder,
  ghosts = [],
  starters = [],
  cheer = 'That’s a good one ✦',
  onDemoFill,
  onEnter,
  below,
  disabled,
}: {
  /** Nothing more can go in: the box is shut and says why, in its own words. */
  disabled?: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  /** Openings the empty box types to itself. */
  ghosts?: string[]
  /** Beginnings to tap into the box. */
  starters?: string[]
  /** Said once there is a real answer. */
  cheer?: string
  /** For a demo: a double-click on the empty box writes the sample in. */
  onDemoFill?: () => void
  /** Enter (without Shift) hands the answer on — Outlook adds it to its list. */
  onEnter?: () => void
  /** Under the card — the microphone. */
  below?: ReactNode
}) {
  const box = useRef<HTMLTextAreaElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const empty = !value.trim()
  const ghost = useGhost(ghosts, empty && !focused && !disabled)
  /* How warm the sky is: nothing yet is dusk, a few lines is full light. */
  const warm = Math.min(1, value.trim().length / 160)

  /* The card grows with the answer rather than scrolling inside itself. */
  useEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(132, el.scrollHeight)}px`
  }, [value])

  const start = (s: string) => {
    const seed = s.replace(/^[“"]|[”"]$/g, '').replace(/\s*(…|\.\.\.)$/, '')
    const had = value.trimEnd()
    const next = had ? `${had} ${seed} ` : `${seed} `
    onChange(next)
    const el = box.current
    if (el) {
      /* Straight to the box with the words in it: the page glides down to
         it (the focus itself does not scroll, which would jump), and the
         cursor waits at the end. */
      el.focus({ preventScroll: true })
      requestAnimationFrame(() => {
        el.setSelectionRange(next.length, next.length)
        card.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
  }

  return (
    <div className="mem">
      {starters.length > 0 && (
        <div className="mem-starters" role="group" aria-label="Start with">
          {starters.map((s, i) => (
            <button
              key={s}
              type="button"
              className="mem-starter"
              style={{ ['--i' as string]: i }}
              disabled={!!disabled}
              onClick={() => start(s)}
            >
              {s.replace(/^[“"]|[”"]$/g, '')}
            </button>
          ))}
        </div>
      )}

      <div
        ref={card}
        className={`mem-card${focused ? ' is-focused' : ''}${disabled ? ' is-disabled' : ''}`}
        style={{ ['--warm' as string]: warm }}
      >
        <span className="mem-sky" aria-hidden>
          <i className="mem-sun" />
          <i className="mem-glow mem-glow-a" />
          <i className="mem-glow mem-glow-b" />
        </span>
        {!disabled && empty && !focused && ghost && (
          <span className="mem-ghost" aria-hidden>
            {ghost}
            <i className="mem-caret" />
          </span>
        )}
        <textarea
          ref={box}
          className="mem-field"
          value={disabled ? '' : value}
          disabled={!!disabled}
          aria-label={disabled ?? placeholder}
          placeholder={disabled ?? (empty && !focused && ghost ? '' : placeholder)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          onDoubleClick={(e) => {
            if (!e.currentTarget.value.trim()) onDemoFill?.()
          }}
          onKeyDown={(e) => {
            if (onEnter && e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onEnter()
            }
          }}
        />
      </div>

      {below}

      <p className={`mem-cheer${words(value) >= 10 ? ' is-on' : ''}`} aria-live="polite">
        {words(value) >= 10 ? cheer : ''}
      </p>
    </div>
  )
}
