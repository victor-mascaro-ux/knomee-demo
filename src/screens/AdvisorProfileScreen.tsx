/* The candidate profile on the FIRM side — what a Dynasty rep reads about one
   advisor. Modelled on ProspectProfileScreen so the two products share a
   vocabulary of cards, tabs and rails, but the content is a different
   decision: this person is being recruited, not sold to.

   All three tabs are the prospect page's own tabs: the Financial ID card for
   card, and Prospect Readiness / Prospect Toolkit rendered from the shared
   components in `readinessParts.tsx`. Only the content is the advisor's, and
   only four cards are new — route, second seat, book profile and the comp
   clock, which the client version has no slot for. */

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import './prospectProfile.css'
import './advisorProfile.css'
import { marcusProfile, type AdvisorProfileData } from '../data/advisorProfile'
import { ToolkitTabView, ReadinessTabView } from './readinessParts'
import {
  AddButton,
  BadgeMedallion,
  ConfidenceResults,
  DateSelect,
  EMPTY_ART,
  EmptyState,
  Gauge,
  HighlightIcon,
  ReadinessLevel,
  TTM_STAGES,
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
import { scrollPageToTop } from '../reviewBridge'

type ProfileTab = 'id' | 'readiness' | 'toolkit'

const TAB_LABEL: Record<ProfileTab, string> = {
  id: 'Business ID',
  readiness: 'Advisor Readiness',
  toolkit: 'Recruiting Toolkit',
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

export default function AdvisorProfileScreen({
  onBack,
  onAdd,
  ownerMenu,
  mine,
  tabs,
  data = marcusProfile,
}: {
  onBack: () => void
  onAdd?: () => void
  /* Whose page this is. Marcus's is assembled in `advisorProfile.ts`; a page
     built from answers somebody just typed into the phone arrives from
     `advisorAnswers.ts`. Same bundle either way — the screen cannot tell. */
  data?: AdvisorProfileData
  /* The three tabs, on a page that is otherwise wearing `mine`. Reading your
     own readiness is not the same act as a rep reading it about you, but it is
     the same page — so it is a switch on this one rather than a copy. */
  tabs?: boolean
  /* Marcus reading his own Business ID in his own app, rather than a
     Dynasty rep reading it about him. Same page — it is the one thing the
     eight minutes produced — with the firm's furniture off it: no breadcrumb
     back to a candidate list, no Readiness or Toolkit tabs, and nothing in
     the rail that is the firm's read on him rather than his own answers. */
  mine?: boolean
  /* The phone frame hands in the control that opens the rail as a drawer — the
     same slot the client page has, in the same place. Nothing renders here on a
     desktop, where the rail is on screen already. */
  ownerMenu?: ReactNode
}) {
  const [tab, setTab] = useState<ProfileTab>('id')
  const [photoFailed, setPhotoFailed] = useState(false)
  const d = data.id
  const who = data.who
  const showTabs = !mine || tabs
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
    <div className={`pp ap ${mine ? 'ap-mine' : ''}`}>
      {!mine && (
        <nav className="pp-crumb">
          <button type="button" className="pp-crumb-link" onClick={onBack}>
            My Candidates
          </button>
          <span className="pp-crumb-sep">›</span>
          <span className="pp-crumb-cur">{who.name}</span>
        </nav>
      )}
      <div className="pp-layout">
        {/* Left profile sidebar */}
        <aside className="pp-side">
          <div className="pp-side-inner">
            <div className={`pp-avatar ap-portrait${photoFailed || !who.photo ? '' : ' has-photo'}`}>
              {photoFailed || !who.photo ? (
                <span>{who.initial}</span>
              ) : (
                <img src={who.photo} alt="" onError={() => setPhotoFailed(true)} />
              )}
            </div>
            <h2 className="pp-name">{who.name}</h2>
            <div className="pp-meta">
              <span className="pp-meta-row">
                <CalendarIcon /> Completed {d.header.completed}
              </span>
            </div>
            {/* The rail is the rail, on a desktop and in the drawer a phone
                lifts it into: same portrait, same two stats, same action. I had
                stripped the stats and the button in `mine` mode on the argument
                that they are the firm's read on him rather than his own
                answers — which left the drawer holding a name and a date and
                nothing to open it for. One page, one rail. */}
            <button className="pp-convert" type="button" onClick={() => onAdd?.()}>
              Add to Network
            </button>
            <div className="ap-side-stat">
              <span className="ap-side-stat-k">Enterprise Quotient</span>
              <span className="ap-side-stat-v">
                {data.kq}
                <i>
                  Tier {data.tier.tier} · {data.tier.name}
                </i>
              </span>
            </div>
            {/* Route is the firm's read on where a candidate should be sent,
                and the advisor's own flow has no such thing — there is no
                Dynasty on the other side of it deciding anything. It stays on
                a candidate's profile, where somebody is doing the routing. */}
            {!mine && (
              <div className="ap-side-stat">
                <span className="ap-side-stat-k">Route</span>
                <span className="ap-side-stat-v ap-side-stat-text" title={data.routeWhy}>
                  {data.routePick}
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* Main column */}
        <main className="pp-main">
          {showTabs && (
          <div className="pp-tabs">
            {(Object.keys(TAB_LABEL) as ProfileTab[]).map((id) => (
              <button
                key={id}
                type="button"
                className={`pp-tab ${tab === id ? 'is-active' : ''}`}
                onClick={() => {
                  setTab(id)
                  scrollPageToTop()
                }}
              >
                {TAB_LABEL[id]}
              </button>
            ))}
          </div>
          )}

          <div className="pp-title-row">
            <h1 className="pp-title">
              {tab === 'id' ? `${who.name}’s Business ID` : TAB_LABEL[tab]}
            </h1>
            {ownerMenu}
            <button className="btn btn-download active" type="button">
              <DownloadIcon /> Download PDF
            </button>
          </div>

          {tab === 'id' && <BusinessIdTab d={d} confidence={data.confidence} stageLevel={stageLevel} />}
          {tab === 'readiness' && <ReadinessTabView d={data.readiness} />}
          {tab === 'toolkit' && <ToolkitTabView d={data.toolkit} />}
        </main>
      </div>
    </div>
  )
}

/* ── Tab 1 — Business ID ─────────────────────────────────────────────
   The Financial ID page itself, card for card and rail for rail, carrying the
   advisor's answers instead of the client's: the change he named where the
   goals go, Practice Joy where Financial Joy goes, his six Confidence
   statements behind the same dial, and the three questions the flow handed him
   where the client's questions sit. Nothing is added and nothing dropped — an
   advisor reading his own page and a client reading theirs are looking at the
   same instrument. */

function BusinessIdTab({
  d,
  confidence: answers,
  stageLevel,
}: {
  d: AdvisorProfileData['id']
  confidence: AdvisorProfileData['confidence']
  stageLevel: number
}) {
  const [confidence, setConfidence] = useState(false)
  // The change he named, read as a goal at the stage the flow put him in.
  const goals = [{ title: d.move.change, readiness: stageLevel }]
  // He has taken the flow once, so every card's date picker offers that sitting.
  const dates = [d.header.completed]
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
            <div className="pp-attention">
              <div>
                <span className="pp-fy-label">More attention</span>
                {d.attention.more.map((m) => (
                  <div className="pp-attn-row pp-attn-more" key={m}>
                    {m}
                  </div>
                ))}
              </div>
              <div>
                <span className="pp-fy-label">Less attention</span>
                {d.attention.less.map((m) => (
                  <div className="pp-attn-row pp-attn-less" key={m}>
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
            <ConfidenceResults open={confidence} answers={answers} />
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
                them would put words in his mouth — so the card wears the empty
                tray a client's would, and the tray invites the rep to add one. */}
            <EmptyState art={EMPTY_ART.lifeEvents} label="Add a Life Event" cta />
          </section>

          <section className="pp-card">
            <div className="pp-card-head">
              <span className="pp-card-title">
                <img className="pp-card-ic" src={icQuestions} alt="" />
                Questions
              </span>
              <AddButton muted />
            </div>
            {/* He has asked nobody anything yet — this card is for questions he
                puts to Dynasty. The three the flow handed HIM are a different
                thing and live on the Recruiting Toolkit. */}
            <EmptyState art={EMPTY_ART.questions} label="No Questions Asked Yet" />
          </section>
        </div>
      </div>
    </>
  )
}

/* ── Tabs 2 and 3 ────────────────────────────────────────────────────────
   Nothing to see here: both are the prospect page's own tabs, rendered from
   the shared components in `readinessParts.tsx` with the advisor's answers.
   The enterprise-only cards that used to ride under the three columns —
   route, second seat, book profile, the comp clock — are gone: they are not
   in the design, and everything they carried that the flow actually captures
   already reads somewhere on these two tabs. */
