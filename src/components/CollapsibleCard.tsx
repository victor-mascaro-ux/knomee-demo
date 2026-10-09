/* A card whose body folds away. Shared, because the advisor's My Prospects and
   the firm's My Candidates are the same screen part for part, and a rule that
   holds on one has to hold on the other — a dashboard that cannot get out of
   the way of the list underneath it is the same complaint on both.

   `hint` takes an already-rendered node rather than a string: the two screens
   carry their own HelpTip, and the card has no business knowing which. It
   sits beside the title it explains, so it opens rightward (side="right"). */

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
      {/* The whole header opens and shuts the card, not just its SHOW MORE —
          the button stays as the control the keyboard reaches and the words
          that say what a click does; its click bubbles up to the header. The
          help tip keeps its own hover and tap. */}
      <header className="card-head is-toggle" onClick={() => setOpen((v) => !v)}>
        <div className="card-title">
          {icon}
          <span>{title}</span>
          {hint && (
            <span className="card-hint" onClick={(e) => e.stopPropagation()}>
              {hint}
            </span>
          )}
        </div>
        <div className="card-head-right">
          <button
            className={`show-toggle ${open ? '' : 'collapsed'}`}
            type="button"
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
