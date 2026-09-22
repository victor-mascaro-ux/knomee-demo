/* Family Insights — the advisor's read on a household.
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
 * they answered the same, the ones they did not, what each of them brings, and
 * the topics to tread carefully around.
 */

import './familyInsights.css'
import { CommunicationRail, StartersCard } from './readinessParts'
import { AdventuresCard } from './ClientInsightsTab'
import { FamilyCard, Who } from './familyParts'
import { familyInsights } from '../data/familyInsights'
import type { SharedStatement } from '../data/familyInsights'
import type { HouseholdMember } from '../data/clientProfile'
import icTopAction from '../assets/cards/top-action.svg'
import icMotivators from '../assets/cards/motivators.svg'
import icApprehensions from '../assets/cards/apprehensions.svg'
import icOutlook from '../assets/adventures/outlook.svg'
import icFinancialJoy from '../assets/adventures/financial-joy.svg'
import icFutureYou from '../assets/adventures/future-you.svg'

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
  const { toolkit, similarities, differences, byMember, sensitiveTopics } = familyInsights
  /* A member the demo carries no reading for gets an empty column, exactly as
     they do on the Family ID. */
  const lists = (name: string) => byMember[name] ?? { concerns: [], joy: [], vision: [] }

  return (
    <div className="rd fin">
      <div className="rd-top-action">
        <img className="pp-card-ic rd-top-ic" src={icTopAction} alt="" />
        <b>Top Action</b>
        <span className="rd-top-text">{toolkit.topAction}</span>
      </div>

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

      <FamilyCard
        members={members}
        icon={icOutlook}
        title="Primary Concerns & Confidence"
        render={(m) => <Bullets items={lists(m.name).concerns} />}
      />

      <FamilyCard
        members={members}
        icon={icFinancialJoy}
        title="Sources of Joy"
        render={(m) => <Bullets items={lists(m.name).joy} />}
      />

      <FamilyCard
        members={members}
        icon={icFutureYou}
        title="Future Vision"
        render={(m) => <Bullets items={lists(m.name).vision} />}
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

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="fin-none">Nothing answered yet.</p>
  return (
    <ul className="fin-bullets">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  )
}

/* Re-exported so the household page can head the two member columns the same
   way this tab does. */
export { Who }
