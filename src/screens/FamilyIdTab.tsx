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
import './familyId.css'
import { familyId } from '../data/familyId'
import type { FamilyMemberId } from '../data/familyId'
import {
  AddButton,
  BadgeMedallion,
  ConfidenceResults,
  DateSelect,
  EMPTY_ART,
  EmptyState,
  Gauge,
  HighlightIcon,
  LifeEventIcon,
  ReadinessLevel,
  ShowToggle,
  orderGoals,
  useCollapsed,
} from './profileParts'
import { Portrait } from './ClientProfileScreen'
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
import moodGood from '../assets/moods/good.svg'
import moodGreat from '../assets/moods/great.svg'
import moodNeutral from '../assets/moods/neutral.svg'
import moodUnsure from '../assets/moods/unsure.svg'
import moodWorried from '../assets/moods/worried.svg'

const MOOD_FACE = [moodWorried, moodUnsure, moodNeutral, moodGood, moodGreat]

const members = familyId.members

/* Whose column this is. Every column in every card is headed by it, so a row
   read halfway down a long card still belongs to somebody. */
function Who({ m }: { m: FamilyMemberId }) {
  return (
    <span className="fid-who">
      <Portrait name={m.name} size="sm" />
      <b>{m.name}</b>
    </span>
  )
}

/* The card the whole page is made of: the Financial ID's card and head, with a
   column per member under it. */
function FamilyCard({
  icon,
  title,
  head,
  foot,
  bodyRef,
  render,
}: {
  icon: string
  title: string
  head?: React.ReactNode
  foot?: React.ReactNode
  bodyRef?: React.RefObject<HTMLDivElement>
  render: (m: FamilyMemberId) => React.ReactNode
}) {
  return (
    <section className="pp-card">
      <div className="pp-card-head">
        <span className="pp-card-title">
          <img className="pp-card-ic" src={icon} alt="" />
          {title}
        </span>
        {head}
      </div>
      <div className="fid-split" ref={bodyRef}>
        {members.map((m) => (
          <div className="fid-cell" key={m.name}>
            <Who m={m} />
            {render(m)}
          </div>
        ))}
      </div>
      {foot}
    </section>
  )
}

/* One collapse for a card, shared by both columns: the two lists are two
   answers to one question and should not fold independently. The longer column
   decides whether the control is there at all. */
function useSharedCollapse(lists: unknown[][], max: number) {
  const longest = lists.reduce((n, l) => Math.max(n, l.length), 0)
  const c = useCollapsed(new Array(longest).fill(0), max)
  return {
    ...c,
    cut: <T,>(items: T[]) => (c.open ? items : items.slice(0, max)),
  }
}

export default function FamilyIdTab() {
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

  return (
    <div className="fid">
      {/* How each of them last said they felt, side by side — the household's
          temperature before any of its answers. */}
      <div className="fid-checkins">
        {members.map((m) => (
          <div className="cp-checkin fid-checkin" key={m.name}>
            <span className="cp-checkin-face">
              <img src={MOOD_FACE[m.checkIn.level]} alt="" />
            </span>
            <span className="cp-checkin-main">
              <span className="cp-checkin-dots" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <i key={i} className={i <= m.checkIn.level ? 'is-on' : ''} />
                ))}
              </span>
              <span className="cp-checkin-mood">{m.checkIn.mood}</span>
            </span>
            <span className="fid-checkin-who">{m.name}</span>
            <span className="cp-checkin-date">Last check-in: {m.checkIn.date}</span>
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
        </div>
        <div className="pp-highlights">
          {familyId.highlights.map((h) => (
            <div className="pp-highlight" key={h.title}>
              <div className="pp-highlight-title">
                <HighlightIcon source={h.icon} />
                {h.title}
              </div>
              <div className="fid-split fid-split-tight">
                {members.map((m) => (
                  <div className="fid-cell" key={m.name}>
                    <Who m={m} />
                    <p className="pp-highlight-text">{m.highlights[h.title] ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <FamilyCard
        icon={icGoals}
        title="Goals"
        head={<AddButton />}
        bodyRef={goals.box}
        foot={goals.overflows && <ShowToggle open={goals.open} onToggle={goals.toggle} />}
        render={(m) => (
          <div className="fid-goals">
            {goals.cut(orderGoals(m.goals)).map((g) => (
              <div className={`pp-goal ${g.completed ? 'is-done' : ''}`} key={g.title}>
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
              </div>
            ))}
          </div>
        )}
      />

      <FamilyCard
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
                <div className="pp-event" key={i}>
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
        icon={icQuestions}
        title="Questions"
        head={<AddButton muted />}
        bodyRef={questions.box}
        foot={questions.overflows && <ShowToggle open={questions.open} onToggle={questions.toggle} />}
        render={(m) =>
          m.questions.length === 0 ? (
            <EmptyState art={EMPTY_ART.questions} label="No Questions Asked Yet" />
          ) : (
            <div className="pp-questions">
              {questions.cut(m.questions).map((q, i) => (
                <div className={`pp-question ${q.resolved ? 'is-resolved' : ''}`} key={i}>
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
    </div>
  )
}
