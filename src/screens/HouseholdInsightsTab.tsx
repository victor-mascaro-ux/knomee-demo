/* Family Insights — each member's Client Insights, side by side.
 *
 * Nothing here is new reading: every column is exactly what that person's own
 * Insights tab shows — the top action, then the Relationship Snapshot with its
 * KR, breakdown and tier — rendered by the same components off the same
 * `snapshotFor`, so a member's column cannot disagree with their own page.
 * What the household format adds is only the comparison: the two KRs level
 * with each other, a breakdown read across as well as down.
 *
 * The pair's toolkit — what to say to them together — is the Family Playbook.
 */

import { ReadinessSnapshot, TopAction } from './readinessParts'
import './familyId.css'
import './householdInsights.css'
import { clientInsights } from '../data/clientInsights'
import { snapshotFor } from './ClientInsightsTab'
import { Who } from './familyParts'
import type { HouseholdMember } from '../data/clientProfile'

export default function HouseholdInsightsTab({ members }: { members: HouseholdMember[] }) {
  const { toolkit } = clientInsights
  return (
    <div className="rd ci hin">
      {members.map((m) => (
        <div className="hin-col" key={m.name}>
          <Who name={m.name} />
          <TopAction d={toolkit} />
          <ReadinessSnapshot s={snapshotFor(m.name)} title="Relationship Snapshot" />
        </div>
      ))}
    </div>
  )
}
