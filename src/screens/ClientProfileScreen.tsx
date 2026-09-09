import { useEffect, useState } from 'react'
import './prospectProfile.css'
import './clientProfile.css'
import { avatarFor, clientProfile } from '../data/clientProfile'
import { AddButton, EMPTY_ART, EmptyState, LifeEventIcon, COLLAPSED_GOALS, COLLAPSED_ROWS, DateSelect, ConfidenceResults, ShowToggle, orderGoals, useCollapsed, HighlightIcon, BadgeMedallion, Gauge, ReadinessLevel } from './profileParts'
import type { BoardTile, ClientGoal, VisionBoard } from '../data/clientProfile'
import type { Client } from '../data/clients'
import { DownloadIcon } from '../components/icons'
import {
  CalendarIcon,
  CaretIcon,
  CheckIcon,
  MailIcon,
  RowChevron,
} from '../components/profileIcons'
import icKeyHighlights from '../assets/adventures/key-highlights.svg'
import icFinancialJoy from '../assets/adventures/financial-joy.svg'
import icConfidence from '../assets/adventures/confidence.svg'
import icOutlook from '../assets/adventures/outlook.svg'
import icFutureYou from '../assets/adventures/future-you.svg'
import icGoals from '../assets/adventures/goals.svg'
import icQuestions from '../assets/adventures/questions.svg'
import icBadges from '../assets/badges/badges-icon.svg'
import icLifeEvents from '../assets/adventures/life-events.svg'
import icVision from '../assets/adventures/vision.png'
import moodGood from '../assets/moods/good.svg'
import moodGreat from '../assets/moods/great.svg'
import moodNeutral from '../assets/moods/neutral.svg'
import moodUnsure from '../assets/moods/unsure.svg'
import moodWorried from '../assets/moods/worried.svg'

const ADVENTURE_ICON: Record<string, string> = {
  'Financial Joy': icFinancialJoy,
  Confidence: icConfidence,
  Outlook: icOutlook,
  'Future You': icFutureYou,
  Goals: icGoals,
}

// The mobile app's own mood ramp, reused so the check-in the client tapped on
// their phone is the very same face the advisor sees here.
const MOOD_FACE = [moodWorried, moodUnsure, moodNeutral, moodGood, moodGreat]

/* A person's portrait, or their initial while there is no file for them. */
function Portrait({ name, size }: { name: string; size: 'lg' | 'sm' }) {
  const [failed, setFailed] = useState(false)
  const initial = name.charAt(0).toUpperCase()
  const cls = size === 'lg' ? 'pp-avatar' : 'cp-person-av'
  if (failed) {
    return (
      <span className={cls}>
        {size === 'lg' ? <span className="pp-avatar-initial">{initial}</span> : initial}
      </span>
    )
  }
  return (
    <span className={cls}>
      <img src={avatarFor(name)} alt="" onError={() => setFailed(true)} />
    </span>
  )
}

/* A vision-board tile. Photographs live in public/vision/ and are dropped in by
   hand, so a missing file falls back to a labelled tint rather than a broken
   image — the board keeps its shape whatever is or isn't there yet. */
function BoardPhoto({ src, alt, tall }: { src: string; alt: string; tall?: boolean }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`cp-tile cp-tile-photo ${tall ? 'is-tall' : ''} ${failed ? 'is-missing' : ''}`}>
      {failed ? <span className="cp-tile-alt">{alt}</span> : <img src={src} alt={alt} onError={() => setFailed(true)} />}
    </div>
  )
}

function BoardNote({ tile }: { tile: Extract<BoardTile, { kind: 'note' }> }) {
  return (
    <div className={`cp-tile cp-tile-note ${tile.tone ? `is-${tile.tone}` : ''}`}>
      {tile.title && <span className="cp-note-title">{tile.title}</span>}
      {tile.text && <p className="cp-note-text">{tile.text}</p>}
      {tile.items && (
        <ul className="cp-note-list">
          {tile.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Board({ board }: { board: VisionBoard }) {
  return (
    <div className="cp-board">
      <h4 className="cp-board-title">{board.title}</h4>
      <p className="cp-board-blurb">{board.blurb}</p>
      <div className="cp-board-grid">
        {board.tiles.map((t, i) =>
          t.kind === 'photo' ? (
            <BoardPhoto key={i} src={t.src} alt={t.alt} tall={t.tall} />
          ) : (
            <BoardNote key={i} tile={t} />
          ),
        )}
      </div>
    </div>
  )
}

function GoalRow({
  g,
  className,
  style,
}: {
  g: ClientGoal
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`pp-goal ${g.completed ? 'is-done' : ''} ${className ?? ''}`} style={style}>
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
        {g.completed && <span className="pp-goal-done"><CheckIcon /> Completed: {g.completed}</span>}
      </div>
      <ReadinessLevel level={g.readiness} />
      <span className="pp-goal-caret">
                            <RowChevron />
                          </span>
    </div>
  )
}

type ClientTab = 'id' | 'insights'

export default function ClientProfileScreen({
  client,
  onBack,
}: {
  client: Client
  onBack: () => void
}) {
  const [tab, setTab] = useState<ClientTab>('id')
  const cp = clientProfile

  // Open the profile scrolled to the top, regardless of where the client's row
  // sat in the table. On the live site the app runs in a full-height iframe and
  // the PARENT page scrolls, so reset that too — and re-assert after the parent
  // resizes the iframe to the (taller) profile.
  useEffect(() => {
    const toTop = () => {
      window.scrollTo(0, 0)
      const el = document.scrollingElement || document.documentElement
      if (el) el.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
      try {
        if (window.parent && window.parent !== window) window.parent.scrollTo(0, 0)
      } catch {
        /* cross-origin parent — ignore */
      }
    }
    toTop()
    const raf = requestAnimationFrame(toTop)
    const t = window.setTimeout(toTop, 150)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
  }, [client.name])

  // Ordered by stage, furthest along first, completed last — then cut to what
  // the card shows collapsed. The two columns are a grid, so the cards read
  // across the rows (1 2 / 3 4) rather than down the columns (1 5 / 2 6).
  const [confidence, setConfidence] = useState(false)
  const goals = useCollapsed(orderGoals(cp.goals), COLLAPSED_GOALS)
  const events = useCollapsed(cp.lifeEvents, COLLAPSED_ROWS)
  const questions = useCollapsed(cp.questions, COLLAPSED_ROWS)

  return (
    <div className="pp cp">
      <div className="pp-layout">
        <aside className="pp-side">
          <div className="pp-side-inner">
            <Portrait name={client.name} size="lg" />
            <h2 className="pp-name">{client.name}</h2>
            <div className="pp-meta">
              <span className="pp-meta-row">
                <CalendarIcon /> Joined {cp.joined}
              </span>
              <span className="pp-meta-row">
                <MailIcon /> {client.email}
              </span>
            </div>

            <div className="cp-side-block">
              <button className="cp-side-head" type="button">
                {cp.household}
                <span className="cp-side-count">{cp.members.length}</span>
                <RowChevron />
              </button>
              {cp.members.map((m) => (
                <button
                  className={`cp-person ${m.current ? 'is-current' : ''}`}
                  type="button"
                  key={m.name}
                >
                  <Portrait name={m.name} size="sm" />
                  <span className="cp-person-main">
                    <b>{m.name}</b>
                    <i>{m.role}</i>
                  </span>
                  <RowChevron />
                </button>
              ))}
            </div>

            <div className="cp-side-block">
              <span className="cp-side-head is-static">Advisory Team</span>
              {cp.team.map((m) => (
                <div className="cp-person is-static" key={m.name}>
                  <Portrait name={m.name} size="sm" />
                  <span className="cp-person-main">
                    <b>{m.name}</b>
                    <i>{m.role}</i>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="pp-main">
          <nav className="pp-crumb">
            <button type="button" className="pp-crumb-link" onClick={onBack}>
              My Clients
            </button>
            <span className="pp-crumb-sep">›</span>
            <button type="button" className="pp-crumb-link" onClick={onBack}>
              {cp.household}
            </button>
            <span className="pp-crumb-sep">›</span>
            <span className="pp-crumb-cur">{client.name}</span>
          </nav>

          {/* The check-in band: the mood the client last tapped on their phone. */}
          <div className="cp-checkin">
            <span className="cp-checkin-face">
              <img src={MOOD_FACE[cp.checkIn.level]} alt="" />
            </span>
            <span className="cp-checkin-main">
              <span className="cp-checkin-dots" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <i key={i} className={i <= cp.checkIn.level ? 'is-on' : ''} />
                ))}
              </span>
              <span className="cp-checkin-mood">{cp.checkIn.mood}</span>
            </span>
            <span className="cp-checkin-date">Last check-in: {cp.checkIn.date}</span>
          </div>

          <div className="pp-tabs">
            {(
              [
                ['id', 'Financial ID'],
                ['insights', 'Client Insights'],
              ] as [ClientTab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`pp-tab ${tab === id ? 'is-active' : ''}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="pp-title-row">
            <h1 className="pp-title">{client.name}’s Financial ID</h1>
            <button className="btn btn-download active" type="button">
              <DownloadIcon /> Download PDF
            </button>
          </div>

          {tab !== 'id' ? (
            <div className="pp-placeholder">
              Client Insights — engagement, sentiment and the next conversation to have. Not built
              in this prototype.
            </div>
          ) : (
            <>
              <section className="pp-card">
                <div className="pp-card-head">
                  <span className="pp-card-title">
                    <img className="pp-card-ic" src={icKeyHighlights} alt="" />
                    Key Highlights
                  </span>
                  <button className="cp-head-toggle" type="button">
                    Show less <CaretIcon up />
                  </button>
                </div>
                <div className="pp-highlights">
                  {cp.keyHighlights.map((h) => (
                    <div className="pp-highlight" key={h.title}>
                      <div className="pp-highlight-title">
                        <HighlightIcon source={h.icon} />
                        {h.title}
                      </div>
                      <p className="pp-highlight-text">{h.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="pp-cols">
                <div className="pp-col-main">
                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic" src={icGoals} alt="" />
                        Goals
                      </span>
                      <AddButton />
                    </div>
                    <div className="cp-goal-cols">
                      {goals.shown.map((g, i) => (
                        <GoalRow
                          g={g}
                          key={g.title}
                          className={goals.entering(i)}
                          style={goals.delay(i)}
                        />
                      ))}
                    </div>
                    {goals.overflows && <ShowToggle open={goals.open} onToggle={goals.toggle} />}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic" src={icFinancialJoy} alt="" />
                        Financial Joy
                      </span>
                      <DateSelect />
                    </div>
                    <p className="pp-prompt">{cp.financialJoy.prompt}</p>
                    <div className="pp-chips">
                      {cp.financialJoy.chips.map((c) => (
                        <span className="pp-chip" key={c}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic" src={icFutureYou} alt="" />
                        Future You
                      </span>
                      <DateSelect />
                    </div>
                    {(
                      [
                        ['Where', cp.futureYou.where],
                        ['What', cp.futureYou.what],
                        ['Who', cp.futureYou.who],
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
                    ))}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic" src={icOutlook} alt="" />
                        Outlook
                      </span>
                      <DateSelect />
                    </div>
                    <span className="pp-fy-label">Concerns</span>
                    {cp.outlook.concerns.map((c) => (
                      <p className="pp-quote" key={c}>
                        “{c}”
                      </p>
                    ))}
                    <span className="pp-fy-label pp-hope">Hopes</span>
                    {cp.outlook.hopes.map((h) => (
                      <p className="pp-quote" key={h}>
                        “{h}”
                      </p>
                    ))}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic" src={icBadges} alt="" />
                        Badges
                      </span>
                      <DateSelect />
                    </div>
                    <div className="pp-badges">
                      {cp.badges.map((label) => (
                        <div className="pp-badge" key={label}>
                          <BadgeMedallion label={label} icon={ADVENTURE_ICON[label]} />
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic" src={icVision} alt="" />
                        Future Vision Board
                      </span>
                    </div>
                    <div className="cp-boards">
                      {cp.boards.map((b) => (
                        <Board board={b} key={b.title} />
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right rail */}
                <div className="pp-rail">
                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic" src={icConfidence} alt="" />
                        Confidence
                      </span>
                      <DateSelect />
                    </div>
                    <div className="pp-confidence">
                      <span className="pp-confidence-label">{cp.confidence}</span>
                      <Gauge label={cp.confidence} />
                    </div>
                    <ConfidenceResults open={confidence} />
                    <button
                      className="pp-show"
                      type="button"
                      aria-expanded={confidence}
                      onClick={() => setConfidence((v) => !v)}
                    >
                      {confidence ? 'Hide results' : 'Show results'} <CaretIcon up={confidence} />
                    </button>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic" src={icLifeEvents} alt="" />
                        Life Events
                      </span>
                      <AddButton />
                    </div>
                    {events.shown.length === 0 ? (
                      <EmptyState art={EMPTY_ART.lifeEvents} label="Add a Life Event" cta />
                    ) : (
                    <div className="pp-events">
                      {events.shown.map((e, i) => (
                        <div className={`pp-event ${events.entering(i) ?? ''}`} style={events.delay(i)} key={i}>
                          <LifeEventIcon kind={e.kind} text={e.text} />
                          <span className="pp-event-body">
                            <span className="pp-event-head">
                              <span className="pp-event-kind">{e.kind}</span>
                            </span>
                            <span className="pp-event-text">{e.text}</span>
                            <span className="pp-event-meta">
                              <span className="pp-event-date">{e.date}</span>
                              {e.advisorAdded && (
                                <span className="pp-event-added">Advisor added</span>
                              )}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                    )}
                    
                    {events.overflows && <ShowToggle open={events.open} onToggle={events.toggle} />}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic" src={icQuestions} alt="" />
                        Questions
                      </span>
                      <AddButton muted={questions.shown.length === 0} />
                    </div>
                    {questions.shown.length === 0 ? (
                      <EmptyState art={EMPTY_ART.questions} label="No Questions Asked Yet" />
                    ) : (
                    <div className="pp-questions">
                      {questions.shown.map((q, i) => (
                        <div className={`pp-question ${q.resolved ? 'is-resolved' : ''} ${questions.entering(i) ?? ''}`} style={questions.delay(i)} key={i}>
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
                    )}
                    
                    {questions.overflows && <ShowToggle open={questions.open} onToggle={questions.toggle} />}
                  </section>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
