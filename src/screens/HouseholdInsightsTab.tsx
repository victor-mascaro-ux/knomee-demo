/* Family Insights — each member's Client Insights, side by side.
 *
 * Nothing here is new reading: every column is exactly what that person's own
 * Insights tab shows — the top action, then the Relationship Snapshot with its
 * KR, breakdown and tier — rendered by the same components off the same
 * `snapshotFor`, so a member's column cannot disagree with their own page.
 * Under the two columns, what only a pair can have: the statements they
 * answered the same, the ones they did not, and the topics to tread carefully
 * around. The pair's toolkit — what to say to them together — is the Family
 * Playbook.
 */

import { ReadinessSnapshot, TopAction } from './readinessParts'
import './familyId.css'
import './householdInsights.css'
import { clientInsights } from '../data/clientInsights'
import { snapshotFor } from './ClientInsightsTab'
import { Who } from './familyParts'
import { CompareCard, SensitiveTopicsCard } from './FamilyInsightsTab'
import { familyInsights } from '../data/familyInsights'
import icMotivators from '../assets/cards/motivators.svg'
import icApprehensions from '../assets/cards/apprehensions.svg'
import type { HouseholdMember } from '../data/clientProfile'

export default function HouseholdInsightsTab({ members }: { members: HouseholdMember[] }) {
  const { toolkit } = clientInsights
  const { similarities, differences } = familyInsights
  return (
    <div className="rd ci fin">
      <div className="hin">
        {members.map((m) => (
          <div className="hin-col" key={m.name}>
            <Who name={m.name} />
            <TopAction d={toolkit} />
            <ReadinessSnapshot s={snapshotFor(m.name)} title="Relationship Snapshot" />
          </div>
        ))}
      </div>

      <CompareCard
        icon={icMotivators}
        title="Similarities"
        statements={[similarities.statement]}
        points={similarities.points}
        members={members}
      />

      <CompareCard
        icon={icApprehensions}
        title="Differences"
        statements={differences.statements}
        points={differences.points}
        members={members}
      />

      <SensitiveTopicsCard />
    </div>
  )
}
