/* The five adventures, as a list you can open one of.
 *
 * Three screens draw this now — the walkthrough, the flow you answer yourself,
 * and the Business ID on its own — and they disagree about where the states
 * come from: the walkthrough carries fixed ones, the answered flow derives them
 * from the sheet, and the Business ID reads a finished set. So the rows arrive
 * already decided and this only says what a row looks like. Writing the loop a
 * third time inside a third screen is how the three would drift.
 */

import type { ArtKey } from '../data/experience'
import type { AdventureId } from '../data/advisorFlow'
import { ActionRow, CompletedRow, LockedRow, ProgressMeter } from './ClientExperienceScreen'

export interface AdventureRow {
  id: AdventureId
  title: string
  art: ArtKey
  blurb: string
  minutes: number
  state: 'done' | 'open' | 'locked'
  /** Where the screen knows it: an adventure part-answered says so rather than
      inviting you to start something you are three questions into. */
  count?: { done: number; total: number }
}

export default function AdventureList({
  rows,
  done,
  required,
  completedOn,
  onOpen,
  title = 'My Adventures',
  foot,
  lockedOpens = true,
}: {
  /** Whether a locked row opens its adventure. The journey page closes them,
      as the client's phone does; the plain flow's rows all open. */
  lockedOpens?: boolean
  rows: AdventureRow[]
  done: number
  required: number
  /** The date a finished row wears. */
  completedOn: string
  onOpen: (id: AdventureId) => void
  title?: string
  /** Anything that belongs under the list — the way back into the flow, where
      a screen has one. */
  foot?: React.ReactNode
}) {
  return (
    <>
      <ProgressMeter done={done} required={required} />
      <h2 className="cx-screen-title">{title}</h2>
      <div className="cx-adv-list">
        {rows.map((row) => {
          // Every row opens its adventure — the state a row wears is a look,
          // not a gate, on all three of these screens.
          const open = () => onOpen(row.id)
          if (row.state === 'done') {
            return (
              <CompletedRow
                key={row.id}
                title={row.title}
                artKey={row.art}
                on={completedOn}
                onRow={open}
              />
            )
          }
          if (row.state === 'open') {
            return (
              <ActionRow
                key={row.id}
                a={{
                  title: row.title,
                  art: row.art,
                  blurb: row.count?.done
                    ? `${row.count.done} of ${row.count.total} questions answered`
                    : row.blurb,
                  minutes: row.minutes,
                  label: row.count?.done ? 'Continue' : 'Start',
                }}
                onAct={open}
                onRow={open}
              />
            )
          }
          return (
            <LockedRow key={row.id} title={row.title} artKey={row.art} onRow={lockedOpens ? open : undefined} />
          )
        })}
      </div>
      {foot}
    </>
  )
}
