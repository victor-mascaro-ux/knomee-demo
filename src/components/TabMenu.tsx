/* Several tabs folded under one button at the far end of a tab row — the
   dashboard's analytics pages, which read the work rather than being it. The
   button stands in for whichever of its tabs is open: it takes the active
   colour and the row's sliding underline (data-active, for useSlideIndicator).

   Its list is the product's inline dropdown, lined up with the button's right
   edge so it opens on the side its button is on. Portalled to <body>, because
   on a phone the tab row scrolls sideways and its overflow box would clip
   anything hanging out of it. */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CaretDown } from './icons'
import { useDropdown } from './useDropdown'

export default function TabMenu<T extends { id: string; label: string }>({
  label,
  icon,
  items,
  active,
  onPick,
}: {
  label: string
  icon: ReactNode
  items: T[]
  /** The row's open tab; the button is on when it is one of `items`. */
  active: string
  onPick: (item: T) => void
}) {
  const { open, shown, closing, setOpen } = useDropdown()
  const [place, setPlace] = useState<{ top: number; right: number } | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const on = items.some((it) => it.id === active)

  useLayoutEffect(() => {
    if (!open || !trigger.current) return
    const r = trigger.current.getBoundingClientRect()
    setPlace({ top: r.bottom + 8, right: document.documentElement.clientWidth - r.right })
  }, [open])

  /* Shut on a click elsewhere, on Escape, or when the page under it moves. */
  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      const t = e.target as Node
      if (!trigger.current?.contains(t) && !list.current?.contains(t)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const moved = () => setOpen(false)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', key)
    window.addEventListener('scroll', moved, true)
    window.addEventListener('resize', moved)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', key)
      window.removeEventListener('scroll', moved, true)
      window.removeEventListener('resize', moved)
    }
  }, [open])

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={`tab tab-menu${on ? ' tab-active' : ''}${open ? ' is-open' : ''}`}
        data-active={on}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {icon}
        {label}
        <span className="tab-menu-caret">
          <CaretDown />
        </span>
      </button>
      {shown &&
        place &&
        createPortal(
          <div
            ref={list}
            role="menu"
            className={`sm-pop sm-pop-inline tab-menu-pop${closing ? ' is-closing' : ''}`}
            style={{ top: place.top, right: place.right }}
          >
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                role="menuitem"
                className={`sm-item${it.id === active ? ' is-on' : ''}`}
                onClick={() => {
                  onPick(it)
                  setOpen(false)
                }}
              >
                <span className="sm-item-label">{it.label}</span>
                {it.id === active && (
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
