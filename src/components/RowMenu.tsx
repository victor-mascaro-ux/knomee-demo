/* A row's overflow menu. Shared, because the advisor's table and the firm's
   are the same table with different data, and the second one should not grow
   its own copy of this. */

import { useEffect, useRef, useState } from 'react'
import { DotsIcon } from './icons'
import { useDropdown } from './useDropdown'
import './feedbackButton.css'

export interface MenuItem {
  label: string
  onClick?: () => void
  disabled?: boolean
  /** The one that takes something away. It reads in the warning colour, so a
      menu of four actions does not hide the one that cannot be undone. */
  danger?: boolean
  /** In-button feedback ("Copied ✓"): the item says it for a moment and the
      menu stays open while it does, then folds away on its own. */
  done?: string
}

/* Long enough to read two words, short enough not to feel stuck open. */
const DONE_MS = 1200

export default function RowMenu({ items }: { items: MenuItem[] }) {
  const { open, shown, closing, setOpen } = useDropdown()
  /* Opens upward when there is no room below — the last rows of a table sit
     against its clipped, rounded frame, which cut the menu off. */
  const [up, setUp] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [doneLabel, setDoneLabel] = useState<string | null>(null)
  const doneTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(doneTimer.current), [])
  /* Cleared once the menu has folded away, not as it starts to, so the
     confirmation does not flip back mid-fold. */
  useEffect(() => {
    if (!shown) {
      window.clearTimeout(doneTimer.current)
      setDoneLabel(null)
    }
  }, [shown])
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [open])
  return (
    <div className="row-menu" ref={ref}>
      <button
        className="dots-btn"
        type="button"
        aria-label="Row actions"
        onClick={(e) => {
          e.stopPropagation()
          const r = ref.current?.getBoundingClientRect()
          const frame = ref.current?.closest('.table-wrap')?.getBoundingClientRect()
          const floor = Math.min(frame?.bottom ?? window.innerHeight, window.innerHeight)
          if (!open) setUp(!!r && floor - r.bottom < 40 * items.length + 24)
          setOpen((v) => !v)
        }}
      >
        <DotsIcon />
      </button>
      {shown && (
        <div className={`row-menu-pop drop-anim${up ? ' is-up' : ''}${closing ? ' is-closing' : ''}`}>
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              className={`row-menu-item${it.danger ? ' is-danger' : ''}${doneLabel === it.label ? ' is-done' : ''}`}
              disabled={it.disabled}
              onClick={(e) => {
                e.stopPropagation()
                it.onClick?.()
                if (it.done) {
                  setDoneLabel(it.label)
                  window.clearTimeout(doneTimer.current)
                  doneTimer.current = window.setTimeout(() => setOpen(false), DONE_MS)
                } else {
                  setOpen(false)
                }
              }}
            >
              {it.done ? (
                <span className="fb-stack">
                  <span data-off={doneLabel === it.label || undefined}>{it.label}</span>
                  <span data-off={doneLabel !== it.label || undefined} aria-live="polite">
                    {it.done}
                  </span>
                </span>
              ) : (
                it.label
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
