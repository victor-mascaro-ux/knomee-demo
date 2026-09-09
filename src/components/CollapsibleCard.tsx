/* A card whose body folds away. Shared, because the advisor's My Prospects and
   the firm's My Candidates are the same screen part for part, and a rule that
   holds on one has to hold on the other — a dashboard that cannot get out of
   the way of the list underneath it is the same complaint on both.

   `hint` takes an already-rendered node rather than a string: the two screens
   carry their own HelpTip, and the card has no business knowing which. */

import { useState, type ReactNode } from 'react'
import { ChevronUp } from './icons'

export default function CollapsibleCard({
  icon,
  title,
  hint,
  bodyClassName,
  className,
  defaultOpen = true,
  children,
}: {
  icon: ReactNode
  title: string
  hint?: ReactNode
  bodyClassName: string
  className?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={`card ${className ?? ''}`}>
      <header className="card-head">
        <div className="card-title">
          {icon}
          <span>{title}</span>
        </div>
        <div className="card-head-right">
          {hint}
          <button
            className={`show-toggle ${open ? '' : 'collapsed'}`}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? 'SHOW LESS' : 'SHOW MORE'} <ChevronUp />
          </button>
        </div>
      </header>

      <div className={`collapse ${open ? 'open' : ''}`}>
        <div className="collapse-inner">
          <div className={bodyClassName}>{children}</div>
        </div>
      </div>
    </section>
  )
}
