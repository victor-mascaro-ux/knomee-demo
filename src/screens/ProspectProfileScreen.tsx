import { useEffect, useState } from 'react'
import './prospectProfile.css'
import { financialId } from '../data/financialId'
import { COLLAPSED_GOALS, COLLAPSED_ROWS, DateSelect, ShowToggle, orderGoals, useCollapsed, HighlightIcon, BadgeMedallion, Gauge, ReadinessLevel } from './profileParts'
import type { Prospect } from '../data/prospects'
import { DownloadIcon } from '../components/icons'
import {
  CalendarIcon,
  CaretIcon,
  CheckIcon,
  RowChevron,
  MailIcon,
} from '../components/profileIcons'
import addIcon from '../assets/adventures/add.svg'
import icKeyHighlights from '../assets/adventures/key-highlights.svg'
import icFinancialJoy from '../assets/adventures/financial-joy.svg'
import icConfidence from '../assets/adventures/confidence.svg'
import icOutlook from '../assets/adventures/outlook.svg'
import icFutureYou from '../assets/adventures/future-you.svg'
import icGoals from '../assets/adventures/goals.svg'
import icQuestions from '../assets/adventures/questions.svg'
import icBadges from '../assets/badges/badges-icon.svg'
import icLifeEvents from '../assets/adventures/life-events.svg'

const ADVENTURE_ICON: Record<string, string> = {
  'Financial Joy': icFinancialJoy,
  Confidence: icConfidence,
  Outlook: icOutlook,
  'Future You': icFutureYou,
  Goals: icGoals,
}

type ProfileTab = 'id' | 'readiness' | 'playbook'

export default function ProspectProfileScreen({
  prospect,
  onBack,
  onConvert,
}: {
  prospect: Prospect
  onBack: () => void
  onConvert: (p: Prospect) => void
}) {
  const [tab, setTab] = useState<ProfileTab>('id')
  const initial = prospect.name.charAt(0).toUpperCase()
  const fi = financialId
  // Goals run earliest stage first with the completed ones last; each card
  // opens showing a few rows and grows on demand.
  const goals = useCollapsed(orderGoals(fi.goals), COLLAPSED_GOALS)
  const events = useCollapsed(fi.lifeEvents, COLLAPSED_ROWS)
  const questions = useCollapsed(fi.questions, COLLAPSED_ROWS)

  // Open the profile scrolled to the top, regardless of where the prospect's
  // row sat in the table when it was clicked. On the live site the app runs in
  // a full-height iframe and the PARENT page scrolls, so reset that too — and
  // re-assert after the parent resizes the iframe to the (shorter) profile.
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
  }, [prospect.name])

  return (
    <div className="pp">
      <div className="pp-layout">
        {/* Left profile sidebar — a full-height static strip */}
        <aside className="pp-side">
          <div className="pp-side-inner">
            <div className="pp-avatar">
              {prospect.avatar ? <img src={prospect.avatar} alt="" /> : <span>{initial}</span>}
            </div>
            <h2 className="pp-name">{prospect.name}</h2>
            <div className="pp-meta">
              <span className="pp-meta-row">
                <CalendarIcon /> Joined {fi.joined}
              </span>
              <span className="pp-meta-row">
                <MailIcon /> {prospect.email}
              </span>
            </div>
            <button className="pp-convert" type="button" onClick={() => onConvert(prospect)}>
              Convert to Client
            </button>
          </div>
        </aside>

        {/* Main column */}
        <main className="pp-main">
          <nav className="pp-crumb">
            <button type="button" className="pp-crumb-link" onClick={onBack}>
              My Prospects
            </button>
            <span className="pp-crumb-sep">›</span>
            <span className="pp-crumb-cur">{prospect.name}</span>
          </nav>
          <div className="pp-tabs">
            {(
              [
                ['id', 'Financial ID'],
                ['readiness', 'Prospect Readiness'],
                ['playbook', 'Prospect Playbook'],
              ] as [ProfileTab, string][]
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
            <h1 className="pp-title">{prospect.name}’s Financial ID</h1>
            <button className="btn btn-download active" type="button">
              <DownloadIcon /> Download PDF
            </button>
          </div>

          {tab !== 'id' ? (
            <div className="pp-placeholder">
              {tab === 'readiness' ? 'Prospect Readiness' : 'Prospect Playbook'} — coming soon.
            </div>
          ) : (
            <>
              {/* Key Highlights */}
              <section className="pp-card">
                <div className="pp-card-head">
                  <span className="pp-card-title">
                    <img className="pp-card-ic" src={icKeyHighlights} alt="" />
                    Key Highlights
                  </span>
                </div>
                <div className="pp-highlights">
                  {fi.keyHighlights.map((h) => (
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
                {/* Left content column */}
                <div className="pp-col-main">
                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icGoals} alt="" />Goals</span>
                      <img className="pp-add" src={addIcon} alt="Add" />
                    </div>
                    <div className="pp-goals">
                      {goals.shown.map((g, i) => (
                        <div
                          className={`pp-goal ${g.completed ? 'is-done' : ''} ${goals.entering(i) ?? ''}`}
                          style={goals.delay(i)}
                          key={g.title}
                        >
                          <div className="pp-goal-main">
                            <span className="pp-goal-title">{g.title}</span>
                            {g.completed && (
                              <span className="pp-goal-done"><CheckIcon /> Completed: {g.completed}</span>
                            )}
                          </div>
                          <ReadinessLevel level={g.readiness} />
                          <span className="pp-goal-caret">
                            <RowChevron />
                          </span>
                        </div>
                      ))}
                    </div>
                    {goals.overflows && <ShowToggle open={goals.open} onToggle={goals.toggle} />}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icFinancialJoy} alt="" />Financial Joy</span>
                      <DateSelect />
                    </div>
                    <p className="pp-prompt">{fi.financialJoy.prompt}</p>
                    <div className="pp-chips">
                      {fi.financialJoy.chips.map((c) => (
                        <span className="pp-chip" key={c}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icFutureYou} alt="" />Future You</span>
                      <DateSelect />
                    </div>
                    {(
                      [
                        ['Where', fi.futureYou.where],
                        ['What', fi.futureYou.what],
                        ['Who', fi.futureYou.who],
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
                      <span className="pp-card-title"><img className="pp-card-ic" src={icOutlook} alt="" />Outlook</span>
                      <DateSelect />
                    </div>
                    <span className="pp-fy-label">Concerns</span>
                    {fi.outlook.concerns.map((c) => (
                      <p className="pp-quote" key={c}>
                        “{c}”
                      </p>
                    ))}
                    <span className="pp-fy-label pp-hope">Hopes</span>
                    {fi.outlook.hopes.map((h) => (
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
                    </div>
                    <div className="pp-badges">
                      {fi.badges.map((label) => (
                        <div className="pp-badge" key={label}>
                          <BadgeMedallion label={label} icon={ADVENTURE_ICON[label]} />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right rail */}
                <div className="pp-rail">
                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icConfidence} alt="" />Confidence</span>
                      <DateSelect />
                    </div>
                    <div className="pp-confidence">
                      <span className="pp-confidence-label">{fi.confidence}</span>
                      <Gauge label={fi.confidence} />
                    </div>
                    <button className="pp-show" type="button">
                      Show results <CaretIcon />
                    </button>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icLifeEvents} alt="" />Life Events</span>
                      <img className="pp-add" src={addIcon} alt="Add" />
                    </div>
                    <div className="pp-events">
                      {events.shown.map((e, i) => (
                        <div className={`pp-event ${events.entering(i) ?? ''}`} style={events.delay(i)} key={i}>
                          <span className="pp-event-tag">{e.tag}</span>
                          <span className="pp-event-kind">{e.kind}</span>
                          <span className="pp-event-text">{e.text}</span>
                          <span className="pp-event-date">{e.date}</span>
                        </div>
                      ))}
                    </div>
                    {events.overflows && <ShowToggle open={events.open} onToggle={events.toggle} />}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icQuestions} alt="" />Questions</span>
                      <img className="pp-add" src={addIcon} alt="Add" />
                    </div>
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
                    {questions.overflows && (
                      <ShowToggle open={questions.open} onToggle={questions.toggle} />
                    )}
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
