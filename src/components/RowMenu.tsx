/* A row's overflow menu. Shared, because the advisor's table and the firm's
   are the same table with different data, and the second one should not grow
   its own copy of this. */

import { useEffect, useRef, useState } from 'react'
import { DotsIcon } from './icons'
import { useDropdown } from './useDropdown'

export interface MenuItem {
  label: string
  onClick?: () => void
  disabled?: boolean
  /** The one that takes something away. It reads in the warning colour, so a
      menu of four actions does not hide the one that cannot be undone. */
  danger?: boolean
}

export default function RowMenu({ items }: { items: MenuItem[] }) {
  const { open, shown, closing, setOpen } = useDropdown()
  /* Opens upward when there is no room below — the last rows of a table sit
     against its clipped, rounded frame, which cut the menu off. */
  const [up, setUp] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
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
              className={`row-menu-item${it.danger ? ' is-danger' : ''}`}
              disabled={it.disabled}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                it.onClick?.()
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
