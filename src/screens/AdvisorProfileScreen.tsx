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
import { usePrintSheet } from '../printSheet'
import { ToolkitTabView, ReadinessTabView } from './readinessParts'
import {
  AddButton,
  BadgeMedallion,
  ConfidenceResults,
  DateSelect,
  EMPTY_ART,
  EmptyState,
  Gauge,
  GoalDetail,
  HeadToggle,
  HighlightIcon,
  ReadinessLevel,
  TTM_STAGES,
  COLLAPSED_ROWS,
  useCollapsed,
} from './profileParts'
import GoalModal from './GoalModal'
import type { Goal } from '../data/financialId'

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

/* An answer that is a list of things rather than a sentence — "Ownership, my
   name on it, equity for Ana and Dev" — reads as lines. One with a full stop in
   it is prose somebody wrote, and stays whole. */
const listOf = (text?: string) =>
  text ? (text.includes('.') ? [text] : text.split(/,\s*/).filter(Boolean)) : []

type ProfileTab = 'id' | 'readiness' | 'toolkit'

const TAB_LABEL: Record<ProfileTab, string> = {
  id: 'Business ID',
  readiness: 'Advisor Readiness',
  toolkit: 'Recruiting Toolkit',
}

function CardHead({
  icon,
  title,
  right,
  children,
}: {
  icon: string
  title: string
  right?: string
  /* A control on the head's right, where the client's cards put theirs. */
  children?: React.ReactNode
}) {
  return (
    <div className="pp-card-head">
      <span className="pp-card-title">
        <img className="pp-card-ic" src={icon} alt="" />
        {title}
      </span>
      {right && <span className="ap-card-note">{right}</span>}
      {children}
    </div>
  )
}

export default function AdvisorProfileScreen({
  onBack,
  onAdd,
  ownerMenu,
  mine,
  tabs,
  backLabel,
  data = marcusProfile,
}: {
  onBack: () => void
  onAdd?: () => void
  /** What the breadcrumb calls the list behind this page. A candidate opened
      from the firm's pipeline came from My Candidates; one opened from the
      advisor directory did not, and a crumb that said so would be pointing at
      a page they were never on. */
  backLabel?: string
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
  const { printing, print } = usePrintSheet()
  const [photoFailed, setPhotoFailed] = useState(false)
  const d = data.id
  const who = data.who
  const showTabs = !mine || tabs
  const stageLevel = TTM_STAGES.indexOf(d.readiness.stage) + 1
  /* Whatever of the three the page happens to know. Marcus's are in the flow;
     a rail built from answers somebody just typed has none of them yet, and
     each one simply drops out rather than standing there empty. */
  const practice = (
    [
      ['Book', who.book],
      ['Role', who.role],
      ['Where I am today', who.firm],
    ] as [string, string | undefined][]
  ).filter((f): f is [string, string] => !!f[1])

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
            {backLabel ?? 'My Candidates'}
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
            {/* Name and date are one thing — who this is and when they said it.
                They are wrapped so the narrow layout can put them on a line
                together beside the portrait; at full width the wrapper is
                `display: contents` and the column is exactly as it was. */}
            <div className="ap-idline">
              <h2 className="pp-name">{who.name}</h2>
              <div className="pp-meta">
                <span className="pp-meta-row">
                  <CalendarIcon /> <span className="ap-completed-word">Completed </span>
                  {d.header.completed}
                </span>
              </div>
            </div>
            {/* One page, one rail — but whose rail decides what hangs under the
                portrait. A Dynasty rep needs the recruiting read and the one
                action it leads to. The advisor reading his own page is not
                being scored by his own app and has nothing to add himself to,
                so his rail carries what a client's carries in the same place:
                who he is, and the practice he spent the eight minutes
                answering about. Stripping the two and putting nothing back is
                what left this a name and a date last time. */}
            {mine ? (
              practice.length > 0 && (
                <div className="ap-side-block">
                  <span className="ap-side-head">My Practice</span>
                  {practice.map(([label, value]) => (
                    <div className="ap-side-fact" key={label}>
                      <b>{value}</b>
                      <i>{label}</i>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <>
                <button className="pp-convert" type="button" onClick={() => onAdd?.()}>
                  Add to Network
                </button>
                <div className="ap-side-stat">
                  <span className="ap-side-stat-k">Recruitment Quotient</span>
                  <span className="ap-side-stat-v">
                    {data.kq}
                    <i>
                      Tier {data.tier.tier} · {data.tier.name}
                    </i>
                  </span>
                </div>
              </>
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
            <div className="pp-title-id">
              {ownerMenu}
              <h1 className="pp-title">
                {tab === 'id' ? `${who.name}’s Business ID` : TAB_LABEL[tab]}
              </h1>
            </div>
            {/* The sheet is all three tabs, so that is what downloads —
                whichever one you were reading. */}
            <button className="btn btn-download active" type="button" onClick={print}>
              <DownloadIcon /> Download PDF
            </button>
          </div>

          {/* On screen, the tab you chose. On paper, every tab: the Business
              ID, then the readiness and the toolkit, each starting its own
              page under its own heading. */}
          {(printing || tab === 'id') && (
            <BusinessIdTab d={d} confidence={data.confidence} stageLevel={stageLevel} />
          )}
          {(printing || tab === 'readiness') && (
            <div className={printing ? 'print-page' : undefined}>
              <h2 className="print-head">{TAB_LABEL.readiness}</h2>
              <ReadinessTabView d={data.readiness} />
            </div>
          )}
          {(printing || tab === 'toolkit') && (
            <div className={printing ? 'print-page' : undefined}>
              <h2 className="print-head">{TAB_LABEL.toolkit}</h2>
              <ToolkitTabView d={data.toolkit} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

/* A card that opens rather than one that is always open. Written here rather
   than reaching for `CollapsibleCard`, which is the dashboard's `.card` with
   the dashboard's SHOW MORE bar — this is a `.pp-card`, and the control it
   wants is the caret the profile pages already use. */
function FoldCard({
  icon,
  title,
  children,
}: {
  icon: string
  title: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className={`pp-card ap-fold${open ? " is-open" : ""}`}>
      <button
        className="pp-card-head ap-fold-head"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="pp-card-title">
          <img className="pp-card-ic" src={icon} alt="" />
          {title}
        </span>
        <span className="ap-fold-caret">
          <CaretIcon up={open} />
        </span>
      </button>
      <div className={`collapse ${open ? 'open' : ''}`}>
        <div className="collapse-inner">
          <div className="ap-fold-body">{children}</div>
        </div>
      </div>
    </section>
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
  const [postcard, setPostcard] = useState(false)
  const [openGoal, setOpenGoal] = useState<Goal | null>(null)
  /* Six highlights, three of them shown — the same fold the client and the
     prospect pages have had, and the same on paper: a print shows all six
     whether the card is open or shut. */
  const highlights = useCollapsed(d.highlights, COLLAPSED_ROWS)
  /* The change they named, read as a goal at the stage the flow put them in —
     and carrying everything else The Move asked, so the row opens onto the same
     panel a client's goal does. Marcus's answers and an advisor who took the
     flow this morning fill the same shape, so Gary's move opens as readily as
     his. */
  const goals: Goal[] = [
    {
      title: d.move.change,
      readiness: stageLevel,
      updated: d.header.completed,
      timeline: d.move.when,
      pros: listOf(d.move.worthIt),
      cons: listOf(d.move.challenging),
      extra: [
        ...(d.move.stakeholders
          ? [{ label: 'Who it involves', value: d.move.stakeholders }]
          : []),
        ...(d.move.blocker
          ? [{ label: 'Holding the decision', value: d.move.blocker }]
          : []),
      ],
    },
  ]
  // He has taken the flow once, so every card's date picker offers that sitting.
  const dates = [d.header.completed]
  return (
    <>
      {/* Key Highlights */}
      <section className="pp-card">
        <CardHead icon={icKeyHighlights} title="Key Highlights">
          {highlights.overflows && (
            <HeadToggle open={highlights.open} onToggle={highlights.toggle} />
          )}
        </CardHead>
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
                <div
                  className="pp-goal is-open-able"
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
                    <span className="pp-goal-title">{g.title}</span>
                  </div>
                  <ReadinessLevel level={g.readiness} />
                  <span className="pp-goal-caret">
                    <RowChevron />
                  </span>
                  <GoalDetail g={g} />
                </div>
              ))}
            </div>
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
            {/* What Future You wrote back, inside the adventure it came out of
                rather than in a card of its own — a section of this one, shut
                until asked for, because it is a letter among lists. Open on
                paper, where there is nothing to scroll past. */}
            {d.postcard && (
              <div className="ap-sub">
                <button
                  className="ap-sub-head"
                  type="button"
                  aria-expanded={postcard}
                  onClick={() => setPostcard((v) => !v)}
                >
                  <span className="pp-fy-label">Postcard from Future Me</span>
                  <CaretIcon up={postcard} />
                </button>
                <div className={`collapse ${postcard ? 'open' : ''}`}>
                  <div className="collapse-inner">
                    <p className="ap-postcard">{d.postcard}</p>
                  </div>
                </div>
              </div>
            )}
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

          {/* The two cards nobody arrives for, under the dial where the rail
              has room for them — folded, so two empty trays do not carry the
              same weight as the reading above them, and open when there is
              something to put in them. */}
          <FoldCard icon={icLifeEvents} title="Life Events">
            {/* The advisor adventures do not ask for these yet, and inventing
                them would put words in his mouth — so the card wears the empty
                tray a client's would, and the tray invites you to add one. */}
            <EmptyState art={EMPTY_ART.lifeEvents} label="Add a Life Event" cta />
          </FoldCard>

          <FoldCard icon={icQuestions} title="Questions">
            {/* He has asked nobody anything yet — this card is for questions he
                puts to Dynasty. The three the flow handed HIM are a different
                thing and live on the Recruiting Toolkit. An empty tray that
                only reports its own emptiness is a dead end: this one is the
                way in, the same way the Life Events tray above it is. */}
            <EmptyState art={EMPTY_ART.questions} label="Ask a Question" cta />
          </FoldCard>
        </div>
      </div>

      {/* Their move, opened. Read-only: these are their answers, and a rep
          reading them has nothing to rename or throw away. */}
      {openGoal && <GoalModal goal={openGoal} onClose={() => setOpenGoal(null)} />}
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
