/* Family Playbook — the advisor's kit for a household. (The file keeps its
 * old name; the tab is the Family Playbook, and Family Insights is now each
 * member's Client Insights side by side — HouseholdInsightsTab.)
 *
 * The client's Insights and Toolkit answer "how is this relationship, and what
 * do I say to her". This answers the question a pair raises instead: where do
 * these two agree, where do they not, and what does that mean for the
 * conversation you have with them together.
 *
 * So the top of the page is the toolkit the other tabs already own — the top
 * action, the starters and their key, the words to use and avoid, the
 * adventures — rendered by the very same components, with the household's own
 * four techniques. What follows is what only a pair can have: the statements
 * they answered the same, the ones they did not, and the topics to tread
 * carefully around.
 */

import './familyInsights.css'
import { CommunicationRail, StartersCard, TopAction } from './readinessParts'
import { AdventuresCard } from './ClientInsightsTab'
import { Who } from './familyParts'
import { familyInsights } from '../data/familyInsights'
import type { SharedStatement } from '../data/familyInsights'
import type { HouseholdMember } from '../data/clientProfile'
import icMotivators from '../assets/cards/motivators.svg'
import icApprehensions from '../assets/cards/apprehensions.svg'

/* One statement, and where each of them landed on it. The track is the
   confidence card's own (.pp-conf-*), carrying a mark per member instead of
   one — which is the whole difference between a person's answer and a
   household's. */
function Statement({ s, members }: { s: SharedStatement; members: HouseholdMember[] }) {
  /* Answered identically: one mark, and one chip naming both of them, rather
     than two marks stacked on the same pixel. */
  const together = s.marks.every((m) => m === s.marks[0])
  return (
    <div className="fin-statement">
      <p className="pp-conf-statement">{s.statement}</p>
      <div
        className="pp-conf-track"
        role="img"
        aria-label={members
          .map((m, i) => `${m.name}: ${s.marks[i]} out of 100`)
          .join(', ')
          .concat(`, between "${s.low}" and "${s.high}"`)}
      >
        {(together ? [s.marks[0]] : s.marks).map((v, i) => (
          <span
            className={`pp-conf-dot fin-dot fin-dot-${i}`}
            style={{ '--v': v } as React.CSSProperties}
            key={i}
          />
        ))}
      </div>
      <div className="pp-conf-ends">
        <span>{s.low}</span>
        <span>{s.high}</span>
      </div>
      <div className="fin-marks">
        {together ? (
          <span className="fin-chip fin-chip-0">{members.map((m) => m.name).join(' & ')}</span>
        ) : (
          members.map((m, i) => (
            <span className={`fin-chip fin-chip-${i}`} key={m.name}>
              {m.name}
            </span>
          ))
        )}
      </div>
    </div>
  )
}

/* Statements on the left, what they add up to on the right. The reading is the
   point; the sliders are the working. */
function CompareCard({
  icon,
  title,
  statements,
  points,
  members,
}: {
  icon: string
  title: string
  statements: SharedStatement[]
  points: string[]
  members: HouseholdMember[]
}) {
  return (
    <section className="pp-card">
      <div className="pp-card-head">
        <span className="pp-card-title">
          <img className="pp-card-ic" src={icon} alt="" />
          {title}
        </span>
      </div>
      <div className="fin-compare">
        <div className="fin-statements">
          {statements.map((s) => (
            <Statement s={s} members={members} key={s.statement + s.marks.join()} />
          ))}
        </div>
        <div className="fin-points">
          {points.map((p) => (
            <p className="fin-point" key={p}>
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function FamilyInsightsTab({ members }: { members: HouseholdMember[] }) {
  const { toolkit, similarities, differences, sensitiveTopics } = familyInsights

  return (
    <div className="rd fin">
      <TopAction d={toolkit} />

      <div className="rd-kit-cols">
        <div className="rd-kit-main">
          <StartersCard starters={toolkit.starters} keyRows={toolkit.key} />
        </div>
        <div className="rd-kit-rail">
          <CommunicationRail d={toolkit} />
          <AdventuresCard />
        </div>
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

      {/* What to tread carefully around: the topic, why it is delicate, and
          what to do about it — three columns, because the third is the only one
          that changes what the advisor does. */}
      <section className="pp-card">
        <div className="pp-card-head">
          <span className="pp-card-title">
            <img className="pp-card-ic" src={icApprehensions} alt="" />
            Sensitive Topics
          </span>
        </div>
        <div className="fin-topics">
          <div className="fin-topic fin-topic-head">
            <span>Topic</span>
            <span>Why it’s sensitive</span>
            <span>How to handle it</span>
          </div>
          {sensitiveTopics.map((t) => (
            <div className="fin-topic" key={t.topic}>
              <span className="fin-topic-name">{t.topic}</span>
              <span className="fin-topic-why">{t.why}</span>
              <span className="fin-topic-how">{t.how}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* Re-exported so the household page can head the two member columns the same
   way this tab does. */
export { Who }
