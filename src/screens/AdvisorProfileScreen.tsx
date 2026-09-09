/* The candidate profile on the FIRM side — what a Dynasty rep reads about one
   advisor. Modelled on ProspectProfileScreen so the two products share a
   vocabulary of cards, tabs and rails, but the content is a different
   decision: this person is being recruited, not sold to.

   All three tabs are the prospect page's own tabs: the Financial ID card for
   card, and Prospect Readiness / Prospect Playbook rendered from the shared
   components in `readinessParts.tsx`. Only the content is the advisor's, and
   only four cards are new — route, second seat, book profile and the comp
   clock, which the client version has no slot for. */

import { useEffect, useState } from 'react'
import './prospectProfile.css'
import './advisorProfile.css'
import { advisor, independenceId } from '../data/advisorFlow'
import {
  bookProfile,
  bookProfileRead,
  compClock,
  confidenceAnswers,
  kq,
  playbookTab,
  readinessTab,
  route,
  secondSeat,
  tier,
} from '../data/advisorProfile'
import { PlaybookTabView, ReadinessTabView } from './readinessParts'
import {
  AddButton,
  BadgeMedallion,
  COLLAPSED_ROWS,
  ConfidenceResults,
  DateSelect,
  Gauge,
  HighlightIcon,
  ReadinessLevel,
  ShowToggle,
  TTM_STAGES,
  useCollapsed,
} from './profileParts'
import { DownloadIcon } from '../components/icons'
import { CalendarIcon, CaretIcon, RowChevron } from '../components/profileIcons'
import icKeyHighlights from '../assets/adventures/key-highlights.svg'
import icPracticeJoy from '../assets/adventures/financial-joy.svg'
import icConfidence from '../assets/adventures/confidence.svg'
import icOutlook from '../assets/adventures/outlook.svg'
import icFutureYou from '../assets/adventures/future-you.svg'
import icTheMove from '../assets/adventures/goals.svg'
import icQuestions from '../assets/adventures/questions.svg'
import icBadges from '../assets/badges/badges-icon.svg'
import icLifeEvents from '../assets/adventures/life-events.svg'

type ProfileTab = 'id' | 'readiness' | 'playbook'

const TAB_LABEL: Record<ProfileTab, string> = {
  id: 'Independence ID',
  readiness: 'Advisor Readiness',
  playbook: 'Recruiting Playbook',
}

function CardHead({ icon, title, right }: { icon: string; title: string; right?: string }) {
  return (
    <div className="pp-card-head">
      <span className="pp-card-title">
        <img className="pp-card-ic" src={icon} alt="" />
        {title}
      </span>
      {right && <span className="ap-card-note">{right}</span>}
    </div>
  )
}

/** Every card that states something has to say what the rep does about it. */
function Action({ children }: { children: string }) {
  return (
    <p className="ap-action">
      <span className="ap-action-tag">Do</span>
      {children}
    </p>
  )
}

export default function AdvisorProfileScreen({
  onBack,
  onAdd,
}: {
  onBack: () => void
  onAdd?: () => void
}) {
  const [tab, setTab] = useState<ProfileTab>('id')
  const d = independenceId
  const stageLevel = TTM_STAGES.indexOf(d.readiness.stage) + 1

  // Open scrolled to the top however far down the table the row sat. On the
  // live site the app runs in an iframe and the PARENT page scrolls, so reset
  // that too, and re-assert after the parent resizes the frame.
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
  }, [])

  return (
    <div className="pp ap">
      <div className="pp-layout">
        {/* Left profile sidebar */}
        <aside className="pp-side">
          <div className="pp-side-inner">
            <div className="pp-avatar">
              <span>{advisor.initial}</span>
            </div>
            <h2 className="pp-name">{advisor.name}</h2>
            <div className="pp-meta">
              <span className="pp-meta-row">{advisor.role}</span>
              <span className="pp-meta-row">
                {advisor.book} · {advisor.firm}
              </span>
              <span className="pp-meta-row">
                <CalendarIcon /> Completed {d.header.completed}
              </span>
            </div>
            <button className="pp-convert" type="button" onClick={() => onAdd?.()}>
              Add to Network
            </button>
            <div className="ap-side-stat">
              <span className="ap-side-stat-k">Knomee Quotient</span>
              <span className="ap-side-stat-v">
                {kq}
                <i>
                  Tier {tier.tier} · {tier.name}
                </i>
              </span>
            </div>
            <div className="ap-side-stat">
              <span className="ap-side-stat-k">Route</span>
              <span className="ap-side-stat-v ap-side-stat-text">{route.pick}</span>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <main className="pp-main">
          <nav className="pp-crumb">
            <button type="button" className="pp-crumb-link" onClick={onBack}>
              My Candidates
            </button>
            <span className="pp-crumb-sep">›</span>
            <span className="pp-crumb-cur">{advisor.name}</span>
          </nav>
          <div className="pp-tabs">
            {(Object.keys(TAB_LABEL) as ProfileTab[]).map((id) => (
              <button
                key={id}
                type="button"
                className={`pp-tab ${tab === id ? 'is-active' : ''}`}
                onClick={() => setTab(id)}
              >
                {TAB_LABEL[id]}
              </button>
            ))}
          </div>

          <div className="pp-title-row">
            <h1 className="pp-title">
              {tab === 'id' ? `${advisor.name}’s Independence ID` : TAB_LABEL[tab]}
            </h1>
            <button className="btn btn-download active" type="button">
              <DownloadIcon /> Download PDF
            </button>
          </div>

          {tab === 'id' && <IndependenceIdTab stageLevel={stageLevel} />}
          {tab === 'readiness' && (
            <ReadinessTabView d={readinessTab} extras={<EnterpriseCards />} />
          )}
          {tab === 'playbook' && <PlaybookTabView d={playbookTab} />}
        </main>
      </div>
    </div>
  )
}

/* ── Tab 1 — Independence ID ─────────────────────────────────────────────
   The Financial ID page itself, card for card and rail for rail, carrying the
   advisor's answers instead of the client's: the change he named where the
   goals go, Practice Joy where Financial Joy goes, his six Confidence
   statements behind the same dial, and the three questions the flow handed him
   where the client's questions sit. Nothing is added and nothing dropped — an
   advisor reading his own page and a client reading theirs are looking at the
   same instrument. */

function IndependenceIdTab({ stageLevel }: { stageLevel: number }) {
  const d = independenceId
  const [confidence, setConfidence] = useState(false)
  // The change he named, read as a goal at the stage the flow put him in.
  const goals = [{ title: d.move.change, readiness: stageLevel }]
  // He has taken the flow once, so every card's date picker offers that sitting.
  const dates = [d.header.completed]
  const questions = useCollapsed(
    d.questions.map((q) => ({ q, date: d.header.completed })),
    COLLAPSED_ROWS,
  )
  return (
    <>
      {/* Key Highlights */}
      <section className="pp-card">
        <CardHead icon={icKeyHighlights} title="Key Highlights" />
        <div className="pp-highlights">
          {d.highlights.map((h) => (
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
              <span className="pp-card-title">
                <img className="pp-card-ic" src={icTheMove} alt="" />
                Goals
              </span>
              <AddButton />
            </div>
            <div className="pp-goals">
              {goals.map((g) => (
                <div className="pp-goal" key={g.title}>
                  <div className="pp-goal-main">
                    <span className="pp-goal-title">{g.title}</span>
                  </div>
                  <ReadinessLevel level={g.readiness} />
                  <span className="pp-goal-caret">
                    <RowChevron />
                  </span>
                </div>
              ))}
            </div>
            <p className="ap-goal-when">Timeline: {d.move.when}</p>
          </section>

          <section className="pp-card">
            <div className="pp-card-head">
              <span className="pp-card-title">
                <img className="pp-card-ic" src={icPracticeJoy} alt="" />
                Practice Joy
              </span>
              <DateSelect dates={dates} />
            </div>
            <p className="pp-prompt">{d.practiceJoy.prompt}</p>
            <div className="pp-chips">
              {d.practiceJoy.chips.map((c) => (
                <span className="pp-chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
            {/* The second half of the same adventure: where he wants his days to
                go. It rides in this card rather than a new one, so the page
                keeps the client page's shape. */}
            <div className="ap-attention">
              <div>
                <span className="pp-fy-label">More attention</span>
                {d.attention.more.map((m) => (
                  <div className="ap-attn-row ap-attn-more" key={m}>
                    {m}
                  </div>
                ))}
              </div>
              <div>
                <span className="pp-fy-label">Less attention</span>
                {d.attention.less.map((m) => (
                  <div className="ap-attn-row ap-attn-less" key={m}>
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="pp-card">
            <div className="pp-card-head">
              <span className="pp-card-title">
                <img className="pp-card-ic" src={icFutureYou} alt="" />
                Future You
              </span>
              <DateSelect dates={dates} />
            </div>
            {(
              [
                ['Where', d.futureYou.where],
                ['What', d.futureYou.what],
                ['Who', d.futureYou.who],
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
              <DateSelect dates={dates} />
            </div>
            <span className="pp-fy-label">Concerns</span>
            {d.outlook.concerns.map((c) => (
              <p className="pp-quote" key={c}>
                “{c}”
              </p>
            ))}
            <span className="pp-fy-label pp-hope">Hopes</span>
            {d.outlook.hopes.map((h) => (
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
              {d.badges.map((label) => (
                <div className="pp-badge" key={label}>
                  <BadgeMedallion label={label} />
                </div>
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
              <DateSelect dates={dates} />
            </div>
            <div className="pp-confidence">
              <span className="pp-confidence-label">{d.readiness.confidence}</span>
              <Gauge label={d.readiness.confidence} />
            </div>
            <ConfidenceResults open={confidence} answers={confidenceAnswers} />
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
            {/* The advisor adventures do not ask for these yet, and inventing
                them would put words in his mouth. The card stays so the page is
                the page, and says why it is empty. */}
            <p className="ap-empty">
              Nothing recorded. The advisor adventures do not ask for life events yet — a rep can
              add one here.
            </p>
          </section>

          <section className="pp-card">
            <div className="pp-card-head">
              <span className="pp-card-title">
                <img className="pp-card-ic" src={icQuestions} alt="" />
                Questions
              </span>
              <AddButton />
            </div>
            <div className="pp-questions">
              {questions.shown.map((q, i) => (
                <div
                  className={`pp-question ${questions.entering(i) ?? ''}`}
                  style={questions.delay(i)}
                  key={q.q}
                >
                  <span className="pp-q-text">{q.q}</span>
                  <span className="pp-q-date">{q.date}</span>
                  <span className="pp-goal-caret">
                    <RowChevron />
                  </span>
                </div>
              ))}
            </div>
            {questions.overflows && <ShowToggle open={questions.open} onToggle={questions.toggle} />}
          </section>
        </div>
      </div>
    </>
  )
}

/* ── Tabs 2 and 3 ────────────────────────────────────────────────────────
   The prospect page's Readiness and Playbook, rendered from the shared
   components with Marcus's answers. The only thing this screen adds is the
   four enterprise-only cards the client version has no slot for — route,
   second seat, book profile and the comp clock — which ride under the three
   columns as `extras`. */

function EnterpriseCards() {
  return (
    <div className="ap-cols2">
      <section className="pp-card">
        <CardHead icon={icTheMove} title="Route" right="One entry point, three destinations" />
        <div className="ap-routes">
          {route.options.map((o) => (
            <div className={`ap-route ${o.matched ? 'is-on' : ''}`} key={o.key}>
              <span className="ap-route-head">
                <span className="ap-route-name">{o.name}</span>
                {o.matched && <span className="ap-route-pick">Recommended</span>}
              </span>
              <span className="ap-route-for">{o.forWhom}</span>
              <span className="ap-route-why">{o.why}</span>
            </div>
          ))}
        </div>
        <p className="ap-body">{route.why}</p>
        <Action>{route.action}</Action>
      </section>

      <section className="pp-card">
        <CardHead icon={icQuestions} title="Second seat" right="Who else must be convinced" />
        <div className="ap-seats">
          {secondSeat.seats.map((s) => (
            <div className="ap-seat" key={s.order}>
              <span className="ap-seat-n">{s.order}</span>
              <span className="ap-seat-body">
                <span className="ap-seat-who">{s.who}</span>
                <span className="ap-seat-why">{s.why}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="ap-body">{secondSeat.note}</p>
        <Action>{secondSeat.action}</Action>
      </section>

      <section className="pp-card">
        <CardHead icon={icKeyHighlights} title="Book profile" />
        <div className="ap-book">
          {bookProfile.map((b) => (
            <div className="ap-book-row" key={b.label}>
              <span className="ap-book-k">{b.label}</span>
              <span className="ap-book-v">{b.value}</span>
              <span className="ap-book-d">{b.detail}</span>
            </div>
          ))}
        </div>
        <Action>{bookProfileRead}</Action>
      </section>

      <section className="pp-card">
        <CardHead icon={icConfidence} title="The comp clock" right="A date, not a score" />
        <div className="ap-clock">
          {compClock.tranches.map((t) => (
            <div className="ap-tranche" key={t.vests}>
              <span className="ap-tranche-amt">${t.amount}K</span>
              <span className="ap-tranche-date">vests {t.vests}</span>
            </div>
          ))}
        </div>
        <p className="ap-clock-total">{compClock.label} unvested in total</p>
        <p className="ap-body">{compClock.reading}</p>
        <Action>{compClock.action}</Action>
      </section>
    </div>
  )
}
