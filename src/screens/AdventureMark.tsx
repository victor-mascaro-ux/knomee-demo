/* Which adventure this is: the adventure's own icon in a raised circle and
 * its name, at the head of the step timeline under the bar.
 *
 * The phone that opens the adventure knows which it is; the five flows that
 * draw a timeline do not. A context carries it from the one to the others
 * rather than a prop through each flow.
 */

import { createContext, useContext } from 'react'

export interface AdventureMarkValue {
  /** The adventure's icon, and its name beside it. */
  art?: string
  title?: string
  /** The way out of the adventure, drawn at the end of the bar. */
  onClose?: () => void
  /** 1-based place in the journey, and how many there are. */
  at: number
  of: number
}

export const AdventureMarkContext = createContext<AdventureMarkValue | null>(null)

export function AdventureMark() {
  const m = useContext(AdventureMarkContext)
  if (!m || m.at < 1) return null
  return (
    <span className="jf-mark">
      <span className="jf-mark-ic" aria-hidden>
        {m.art && <img src={m.art} alt="" />}
      </span>
      {m.title && <span className="jf-mark-title">{m.title}</span>}
      <span className="jf-mark-at">
        {m.at} of {m.of}
      </span>
    </span>
  )
}

/* The same, at the top of an adventure's intro, where there is no timeline
   yet: its icon and its name as the screen's title badge — the thing about
   to start, announced. */
export function AdventureBadge({ steps }: { steps?: number }) {
  const m = useContext(AdventureMarkContext)
  if (!m || !m.title) return null
  return (
    <div className="adv-badge">
      <span className="adv-badge-ic" aria-hidden>
        {m.art && <img src={m.art} alt="" />}
      </span>
      <span className="adv-badge-title">{m.title}</span>
      {/* The adventure's own step bar, not started: the same one that fills
          in once it begins, so the intro shows what is ahead. */}
      {!!steps && (
        <span className="af-progress adv-badge-bar" aria-hidden>
          {Array.from({ length: steps }, (_, n) => (
            <i key={n} />
          ))}
        </span>
      )}
      <AdventureClose />
    </div>
  )
}

/* The way out of the adventure, at the end of its bar — on the intro's title
   row and on every screen's timeline — where the app bar's burger now is the
   menu. */
export function AdventureClose() {
  const m = useContext(AdventureMarkContext)
  if (!m?.onClose) return null
  return (
    <button type="button" className="adv-close" aria-label="Close this adventure and go back to My Adventures" onClick={m.onClose}>
      <svg viewBox="0 0 22 22" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d="M5.5 5.5l11 11M16.5 5.5l-11 11" strokeLinecap="round" />
      </svg>
    </button>
  )
}
