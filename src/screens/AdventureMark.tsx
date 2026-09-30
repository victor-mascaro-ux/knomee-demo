/* Which adventure this is, and which of the journey's: the adventure's own
 * icon in a raised circle and "2 of 5", at the head of the step timeline
 * under the bar. So the timeline says where you are in the whole as well as
 * in this one.
 *
 * The phone that opens the adventure knows which it is; the five flows that
 * draw a timeline do not. A context carries it from the one to the others
 * rather than a prop through each flow.
 */

import { createContext, useContext } from 'react'

export interface AdventureMarkValue {
  /** The adventure's icon. */
  art?: string
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
      <span className="jf-mark-at">
        {m.at} of {m.of}
      </span>
    </span>
  )
}
