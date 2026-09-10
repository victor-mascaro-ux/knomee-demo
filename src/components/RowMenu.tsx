/* A row's overflow menu. Shared, because the advisor's table and the firm's
   are the same table with different data, and the second one should not grow
   its own copy of this. */

import { useEffect, useRef, useState } from 'react'
import { DotsIcon } from './icons'

export interface MenuItem {
  label: string
  onClick?: () => void
  disabled?: boolean
}

export default function RowMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
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
          setOpen((v) => !v)
        }}
      >
        <DotsIcon />
      </button>
      {open && (
        <div className="row-menu-pop">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              className="row-menu-item"
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
