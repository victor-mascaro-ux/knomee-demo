/* The product's dropdown, in place of the browser's own <select>. The native
   list is drawn by the operating system — its blue highlight, its font, its
   square corners — and cannot be styled or animated, so inside a Knomee panel
   it looked like somebody else's control. This one keeps the field it replaces
   (the trigger wears that field's class) and opens its list on the page's own
   card as one piece with the field: joined along its edge, unrolling out of
   it and rolling back in when it closes.

   The list is portalled to <body> and placed against the trigger: inside a
   modal it would otherwise be clipped by the body's scroll box. It opens
   upward when there is no room beneath. */

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import './selectMenu.css'

export interface SelectOption {
  value: string
  label: string
}

const CLOSE_MS = 140

export default function SelectMenu({
  value,
  options,
  onChange,
  className = '',
  placeholder,
  disabled,
  id,
  variant = 'field',
}: {
  value: string
  options: (SelectOption | string)[]
  onChange: (value: string) => void
  /** The field class of the <select> this replaces, so it looks the same shut. */
  className?: string
  /** Shown while nothing is picked. */
  placeholder?: string
  disabled?: boolean
  id?: string
  /** 'field': the list joins a form field's edge and matches its width.
      'inline': a small text control (a card head's date) — the list drops
      just under it, lined up with its right edge, as wide as its options. */
  variant?: 'field' | 'inline'
}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  const picked = opts.find((o) => o.value === value)
  /* 'closing' keeps the list on screen for its fold-away. */
  const [state, setState] = useState<'shut' | 'open' | 'closing'>('shut')
  const [place, setPlace] = useState<{
    left?: number
    right?: number
    width?: number
    top?: number
    bottom?: number
    up: boolean
  } | null>(null)
  const [active, setActive] = useState(-1)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)

  const open = () => {
    if (disabled) return
    window.clearTimeout(closeTimer.current)
    setActive(Math.max(0, opts.findIndex((o) => o.value === value)))
    setState('open')
  }
  const close = () => {
    if (state !== 'open') return
    setState('closing')
    closeTimer.current = window.setTimeout(() => setState('shut'), CLOSE_MS)
  }
  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  /* Placed against the trigger each time it opens, below it or, without the
     room, above it. */
  useLayoutEffect(() => {
    if (state !== 'open' || !trigger.current) return
    const r = trigger.current.getBoundingClientRect()
    const want = opts.length * 40 + 12
    const below = window.innerHeight - r.bottom
    const up = below < want + 12 && r.top > below
    if (variant === 'inline') {
      const right = document.documentElement.clientWidth - r.right
      setPlace(
        up
          ? { right, bottom: window.innerHeight - r.top + 6, up }
          : { right, top: r.bottom + 6, up },
      )
      return
    }
    setPlace(
      up
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top - 1, up }
        : { left: r.left, width: r.width, top: r.bottom - 1, up },
    )
  }, [state, opts.length, variant])

  /* Shut on a click elsewhere, on Escape, or when the page under it moves. */
  useEffect(() => {
    if (state !== 'open') return
    const away = (e: MouseEvent) => {
      const t = e.target as Node
      if (!trigger.current?.contains(t) && !list.current?.contains(t)) close()
    }
    const moved = (e: Event) => {
      if (!list.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', away)
    window.addEventListener('scroll', moved, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', away)
      window.removeEventListener('scroll', moved, true)
      window.removeEventListener('resize', close)
    }
  })

  const choose = (v: string) => {
    onChange(v)
    close()
    trigger.current?.focus()
  }

  const onKey = (e: KeyboardEvent) => {
    if (state !== 'open') {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        open()
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(opts.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if ((e.key === 'Enter' || e.key === ' ') && active >= 0) {
      e.preventDefault()
      choose(opts[active].value)
    } else if (e.key === 'Tab') {
      close()
    }
  }

  const shown = state !== 'shut' && place

  return (
    <>
      <button
        id={id}
        ref={trigger}
        type="button"
        className={`${className} sm-trigger sm-${variant}${state !== 'shut' ? ' is-open' : ''}${state === 'closing' ? ' is-closing' : ''}${place?.up ? ' is-up' : ''}${picked ? '' : ' is-empty'}`}
        aria-haspopup="listbox"
        aria-expanded={state === 'open'}
        disabled={disabled}
        onClick={() => (state === 'open' ? close() : open())}
        onKeyDown={onKey}
      >
        <span className="sm-value">{picked ? picked.label : placeholder}</span>
        <svg className="sm-caret" viewBox="0 0 12 12" width="12" height="12" aria-hidden>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {shown &&
        createPortal(
          <div
            ref={list}
            className={`sm-pop sm-pop-${variant}${place.up ? ' is-up' : ''}${state === 'closing' ? ' is-closing' : ''}`}
            role="listbox"
            style={{
              left: place.left,
              right: place.right,
              width: place.width,
              top: place.top,
              bottom: place.bottom,
            }}
          >
            {opts.map((o, i) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={`sm-item${o.value === value ? ' is-on' : ''}${i === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o.value)}
              >
                <span className="sm-item-label">{o.label}</span>
                {o.value === value && (
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                    <path d="M2.5 6.2 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
