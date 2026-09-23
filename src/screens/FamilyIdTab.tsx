/* The Family ID — the household's Financial ID, a member to a column.
 *
 * Not one card in here is new. They are the Financial ID's own cards, drawn
 * from the same parts (HighlightIcon, ReadinessLevel, Gauge, LifeEventIcon,
 * BadgeMedallion, EmptyState, useCollapsed) and wearing the same classes, split
 * down the middle so the same question is read twice — once for each person.
 * That split is the whole point of the page: what a household agrees on and
 * what it does not is only visible when the two answers are side by side.
 *
 * Emily's column is her own Financial ID, read off `clientProfile` rather than
 * restated. Where a member has answered nothing, the card shows the empty state
 * it shows on their own page instead of borrowing their partner's answer.
 */

import { useState } from 'react'
import { MemberVisionBoards } from './VisionBoards'
import './familyId.css'
import { familyId } from '../data/familyId'
import type { FamilyMemberId } from '../data/familyId'
import type { HouseholdMember, ClientGoal } from '../data/clientProfile'
import {
  AddButton,
  COLLAPSED_ROWS,
  HeadToggle,
  BadgeMedallion,
  ConfidenceResults,
  DateSelect,
  EMPTY_ART,
  EmptyState,
  Gauge,
  HighlightIcon,
  LifeEventIcon,
  ReadinessLevel,
  GoalDetail,
  ShowToggle,
  orderGoals,
  useCollapsed,
  CheckInCard,
} from './profileParts'
import { FamilyCard, Who } from './familyParts'
import GoalModal from './GoalModal'
import { CaretIcon, CheckIcon, RowChevron } from '../components/profileIcons'
import icKeyHighlights from '../assets/adventures/key-highlights.svg'
import icGoals from '../assets/adventures/goals.svg'
import icConfidence from '../assets/adventures/confidence.svg'
import icLifeEvents from '../assets/adventures/life-events.svg'
import icQuestions from '../assets/adventures/questions.svg'
import icFinancialJoy from '../assets/adventures/financial-joy.svg'
import icFutureYou from '../assets/adventures/future-you.svg'
import icOutlook from '../assets/adventures/outlook.svg'
import icBadges from '../assets/badges/badges-icon.svg'
import icVision from '../assets/adventures/vision-board.svg'


/* A member who has been added but has not answered anything yet. The column is
   theirs and it is empty — which is the truth about an invitation nobody has
   opened, and what every card's empty state is for. */
const blank = (m: HouseholdMember): FamilyMemberId => ({
  name: m.name,
  role: m.role,
  checkIn: { mood: '', level: -1, date: '' },
  highlights: {},
  goals: [],
  confidence: '',
  lifeEvents: [],
  questions: [],
  joy: [],
  futureYou: { where: [], what: [], who: [] },
  outlook: { concerns: [], hopes: [] },
  badges: [],
  boards: [],
})

/* One collapse for a card, shared by both columns: the two lists are two
   answers to one question and should not fold independently. The longer column
   decides whether the control is there at all. */
function useSharedCollapse(lists: unknown[][], max: number) {
  const longest = lists.reduce((n, l) => Math.max(n, l.length), 0)
  const c = useCollapsed(new Array(longest).fill(0), max)
  /* Cut on what is MOUNTED, not on `open`. Closing keeps the extra rows on
     screen while they animate out and drops them at the end — cutting on `open`
     dropped them in the first frame and then folded the box 420ms later, on an
     empty space. */
  const extra = c.shown.length > max
  return {
    ...c,
    cut: <T,>(items: T[]) => (extra ? items : items.slice(0, max)),
  }
}

export default function FamilyIdTab({ members: live }: { members: HouseholdMember[] }) {
  /* A column per member of the household as it stands. Someone whose answers
     the demo carries gets them; anyone else gets an empty column until they
     take the adventures themselves. */
  const members: FamilyMemberId[] = live.map(
    (m) => familyId.members.find((f) => f.name === m.name) ?? blank(m),
  )
  const highlights = useCollapsed(familyId.highlights, COLLAPSED_ROWS)
  const goals = useSharedCollapse(
    members.map((m) => m.goals),
    4,
  )
  const events = useSharedCollapse(
    members.map((m) => m.lifeEvents),
    3,
  )
  const questions = useSharedCollapse(
    members.map((m) => m.questions),
    3,
  )
  const [confidence, setConfidence] = useState(false)
  /* A goal opens here too, to read. Not to change: this page is two people's
     own pages laid side by side, and deleting somebody's goal from a view of
     their household is not a thing a household can do. */
  const [openGoal, setOpenGoal] = useState<ClientGoal | null>(null)

  return (
    <div className="fid">
      {/* How each of them last said they felt, side by side — the household's
          temperature before any of its answers. */}
      <div className="fid-checkins">
        {/* Each of them named the way every split card here names them, then
            the same check-in card their own page shows. */}
        {members.map((m) => (
          <div className="fid-checkin-col" key={m.name}>
            <Who name={m.name} />
            {m.checkIn.level < 0 ? (
              <div className="cp-checkin fid-checkin is-empty">
                <span className="cp-checkin-date">No check-in yet</span>
              </div>
            ) : (
              <CheckInCard checkIn={m.checkIn} />
            )}
          </div>
        ))}
      </div>

      {/* Key Highlights splits inside each tile rather than into two tiles: the
          question is asked once and the household answers it twice. */}
      <section className="pp-card">
        <div className="pp-card-head">
          <span className="pp-card-title">
            <img className="pp-card-ic" src={icKeyHighlights} alt="" />
            Key Highlights
          </span>
          {highlights.overflows && (
            <HeadToggle open={highlights.open} onToggle={highlights.toggle} />
          )}
        </div>
        <div className="pp-highlights" ref={highlights.box}>
          {highlights.shown.map((h, i) => (
            <div
              className={`pp-highlight ${highlights.entering(i) ?? ''}`}
              style={highlights.delay(i)}
              key={h.title}
            >
              <div className="pp-highlight-title">
                <HighlightIcon source={h.icon} />
                {h.title}
              </div>
              <div className="fid-split fid-split-tight">
                {members.map((m) => (
                  <div className="fid-cell" key={m.name}>
                    <Who name={m.name} />
                    <p className="pp-highlight-text">{m.highlights[h.title] ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <FamilyCard
        members={members}
        icon={icGoals}
        title="Goals"
        head={<AddButton />}
        bodyRef={goals.box}
        foot={goals.overflows && <ShowToggle open={goals.open} onToggle={goals.toggle} />}
        render={(m) => (
          <div className="fid-goals">
            {goals.cut(orderGoals(m.goals)).map((g, i) => (
              <div
                className={`pp-goal is-open-able ${g.completed ? 'is-done' : ''} ${
                  goals.entering(i) ?? ''
                }`}
                style={goals.delay(i)}
                key={g.title}
                role="button"
                tabIndex={0}
                onClick={() => setOpenGoal(g)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setOpenGoal(g)
                  }
                }}
              >
                <div className="pp-goal-main">
                  {g.tags && g.tags.length > 0 && (
                    <span className="cp-goal-tags">
                      {g.tags.map((t) => (
                        <span className={`cp-goal-tag is-${t.toLowerCase()}`} key={t}>
                          {t}
                        </span>
                      ))}
                    </span>
                  )}
                  <span className="pp-goal-title">{g.title}</span>
                  {g.completed && (
                    <span className="pp-goal-done">
                      <CheckIcon /> Completed: {g.completed}
                    </span>
                  )}
                </div>
                <ReadinessLevel level={g.readiness} />
                <span className="pp-goal-caret">
                  <RowChevron />
                </span>
                <GoalDetail g={g} />
              </div>
            ))}
          </div>
        )}
      />

      <FamilyCard
        members={members}
        icon={icConfidence}
        title="Confidence"
        head={<DateSelect />}
        foot={
          <button
            className="pp-show"
            type="button"
            aria-expanded={confidence}
            onClick={() => setConfidence((v) => !v)}
          >
            {confidence ? 'Hide results' : 'Show results'} <CaretIcon up={confidence} />
          </button>
        }
        render={(m) => (
          <>
            <div className="pp-confidence">
              <span className="pp-confidence-label">{m.confidence}</span>
              <Gauge label={m.confidence} />
            </div>
            <ConfidenceResults open={confidence} />
          </>
        )}
      />

      <FamilyCard
        members={members}
        icon={icLifeEvents}
        title="Life Events"
        head={<AddButton />}
        bodyRef={events.box}
        foot={events.overflows && <ShowToggle open={events.open} onToggle={events.toggle} />}
        render={(m) =>
          m.lifeEvents.length === 0 ? (
            <EmptyState art={EMPTY_ART.lifeEvents} label="Add a Life Event" cta />
          ) : (
            <div className="pp-events">
              {events.cut(m.lifeEvents).map((e, i) => (
                <div className={`pp-event ${events.entering(i) ?? ''}`} style={events.delay(i)} key={i}>
                  <LifeEventIcon kind={e.kind} text={e.text} />
                  <span className="pp-event-body">
                    <span className="pp-event-head">
                      <span className="pp-event-kind">{e.kind}</span>
                    </span>
                    <span className="pp-event-text">{e.text}</span>
                    <span className="pp-event-meta">
                      <span className="pp-event-date">{e.date}</span>
                      {e.advisorAdded && <span className="pp-event-added">Advisor added</span>}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )
        }
      />

      <FamilyCard
        members={members}
        icon={icQuestions}
        title="Questions"
        head={<AddButton muted />}
        bodyRef={questions.box}
        foot={questions.overflows && <ShowToggle open={questions.open} onToggle={questions.toggle} />}
        render={(m) =>
          m.questions.length === 0 ? (
            <EmptyState art={EMPTY_ART.questions} label="Ask a Question" cta />
          ) : (
            <div className="pp-questions">
              {questions.cut(m.questions).map((q, i) => (
                <div
                  className={`pp-question ${q.resolved ? 'is-resolved' : ''} ${
                    questions.entering(i) ?? ''
                  }`}
                  style={questions.delay(i)}
                  key={i}
                >
                  <span className="pp-q-text">{q.q}</span>
                  <span className="pp-q-date">
                    {q.resolved ? (
                      <>
                        <CheckIcon /> Resolved: {q.resolved}
                      </>
                    ) : (
                      q.date
                    )}
                  </span>
                  <span className="pp-goal-caret">
                    <RowChevron />
                  </span>
                </div>
              ))}
            </div>
          )
        }
      />

      <FamilyCard
        members={members}
        icon={icFinancialJoy}
        title="Financial Joy"
        head={<DateSelect />}
        render={(m) => (
          <>
            <p className="pp-prompt">I want money to help me with</p>
            <div className="pp-chips">
              {m.joy.map((c) => (
                <span className="pp-chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
          </>
        )}
      />

      <FamilyCard
        members={members}
        icon={icFutureYou}
        title="Future You"
        head={<DateSelect />}
        render={(m) =>
          (
            [
              ['Where', m.futureYou.where],
              ['What', m.futureYou.what],
              ['Who', m.futureYou.who],
            ] as [string, string[]][]
          ).map(([label, items]) => (
            <div className="pp-fy-group" key={label}>
              <span className="pp-fy-label">{label}</span>
              <div className="pp-chips">
                {items.map((it) => (
                  <span className="pp-chip" key={it}>
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))
        }
      />

      <FamilyCard
        members={members}
        icon={icOutlook}
        title="Outlook"
        head={<DateSelect />}
        render={(m) => (
          <>
            <span className="pp-fy-label">Concerns</span>
            {m.outlook.concerns.map((c) => (
              <p className="pp-quote" key={c}>
                “{c}”
              </p>
            ))}
            <span className="pp-fy-label pp-hope">Hopes</span>
            {m.outlook.hopes.map((h) => (
              <p className="pp-quote" key={h}>
                “{h}”
              </p>
            ))}
          </>
        )}
      />

      <FamilyCard
        members={members}
        icon={icBadges}
        title="Badges"
        head={<DateSelect />}
        render={(m) => (
          <div className="pp-badges">
            {m.badges.map((label) => (
              <div className="pp-badge" key={label}>
                <BadgeMedallion label={label} />
              </div>
            ))}
          </div>
        )}
      />

      {/* The board is the one card whose answer is a made thing rather than a
          list, so a member who has not made one gets the same tray Life Events
          and Questions use — the way in, not a notice that there is nothing. */}
      <FamilyCard
        members={members}
        icon={icVision}
        title="Future Vision Board"
        render={(m) => <MemberVisionBoards key={m.name} initial={m.boards} />}
      />
      {openGoal && <GoalModal goal={openGoal} onClose={() => setOpenGoal(null)} />}
    </div>
  )
}
