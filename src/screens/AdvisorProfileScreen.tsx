/* The candidate profile on the FIRM side — what a Dynasty rep reads about one
   advisor. Modelled on ProspectProfileScreen so the two products share a
   vocabulary of cards, tabs and rails, but the content is a different
   decision: this person is being recruited, not sold to.

   All three tabs are the prospect page's own tabs: the Financial ID card for
   card, and Prospect Readiness / Prospect Toolkit rendered from the shared
   components in `readinessParts.tsx`. Only the content is the advisor's, and
   only four cards are new — route, second seat, book profile and the comp
   clock, which the client version has no slot for. */

import ExperienceButton from '../components/ExperienceButton'
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
  StatusTags,
} from './profileParts'
import GoalModal, { type GoalField } from './GoalModal'
import QuestionModal, { renamed } from './QuestionModal'
import AddGoalModal from './AddGoalModal'
import type { Goal, ProfileQuestion } from '../data/financialId'
import { steps as flowSteps } from '../data/advisorFlow'
import { today } from '../data/advisorAnswers'

import { DownloadIcon } from '../components/icons'
import {
  BuildingIcon,
  CalendarIcon,
  CaretIcon,
  CheckIcon,
  CoinsIcon,
  MailIcon,
  PeopleIcon,
  RowChevron,
} from '../components/profileIcons'
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
import SharingView, { ADVISOR_ROLES } from './SharingView'

/* An answer that is a list of things rather than a sentence — "Ownership, my
   name on it, equity for Ana and Dev" — reads as lines. One with a full stop in
   it is prose somebody wrote, and stays whole. */
const listOf = (text?: string) =>
  text ? (text.includes('.') ? [text] : text.split(/,\s*/).filter(Boolean)) : []

type ProfileTab = 'id' | 'readiness' | 'toolkit'

const TAB_LABEL: Record<ProfileTab, string> = {
  id: 'Business ID',
  readiness: 'Advisor Readiness',
  toolkit: 'Recruiting Playbook',
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

/** Which of the Business ID's cards are still waiting for their adventure. */
export type IdCard = 'move' | 'joy' | 'future' | 'outlook' | 'confidence'
export type WaitingCards = Partial<Record<IdCard, boolean>>

/* A card whose adventure is still to come: its head, greyed, and the line the
   client's Financial ID says in the same place. */
function Waiting({ icon, title, adventure }: { icon: string; title: string; adventure: string }) {
  return (
    <section className="pp-card is-waiting">
      <div className="pp-card-head">
        <span className="pp-card-title">
          <img className="pp-card-ic" src={icon} alt="" />
          {title}
        </span>
      </div>
      <p className="pp-waiting">Complete {/^The /.test(adventure) ? adventure : `the ${adventure}`} adventure</p>
    </section>
  )
}

export default function AdvisorProfileScreen({
  onBack,
  onAdd,
  onOpenExperience,
  ownerMenu,
  mine,
  tabs,
  backLabel,
  data = marcusProfile,
  noBadges = false,
  waiting,
}: {
  /** Leave out the Badges card — the advisor journey page does without badges. */
  noBadges?: boolean
  /** Cards still waiting for their adventure, as the client's Financial ID
      has them: the title greyed, and "Complete the … adventure". */
  waiting?: WaitingCards
  onBack: () => void
  onAdd?: () => void
  /** The person's own experience, from the foot of the rail. */
  onOpenExperience?: () => void
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
  /* His ID read for what it says, or for who sees it. */
  const { printing, print } = usePrintSheet()
  const [photoFailed, setPhotoFailed] = useState(false)
  const d = data.id
  const who = data.who
  /* The firm sees a candidate by their full name, but not their picture. */
  const shownName = who.name
  const photo = mine ? who.photo : undefined
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
            {backLabel ?? 'My Candidates'}
          </button>
          <span className="pp-crumb-sep">›</span>
          <span className="pp-crumb-cur">{shownName}</span>
        </nav>
      )}
      <div className="pp-layout">
        {/* Left profile sidebar */}
        <aside className="pp-side">
          <div className="pp-side-inner">
            <div className={`pp-avatar ap-portrait${photoFailed || !photo ? '' : ' has-photo'}`}>
              {photoFailed || !photo ? (
                <span>{who.initial}</span>
              ) : (
                <img src={photo} alt="" onError={() => setPhotoFailed(true)} />
              )}
            </div>
            {/* Name and date are one thing — who this is and when they said it.
                They are wrapped so the narrow layout can put them on a line
                together beside the portrait; at full width the wrapper is
                `display: contents` and the column is exactly as it was. */}
            <div className="ap-idline">
              <h2 className="pp-name">{shownName}</h2>
              <div className="pp-meta">
                <span className="pp-meta-row">
                  <CalendarIcon /> <span className="ap-completed-word">Completed </span>
                  {d.header.completed}
                </span>
                {/* Who they are: how to reach them, the book, and where they
                    are today — the same on their own page as on the firm's.
                    Each drops out when it was left blank. */}
                {who.email && (
                  <span className="pp-meta-row tt" data-tip={who.email}>
                    <MailIcon /> <span className="pp-meta-email">{who.email}</span>
                  </span>
                )}
                {who.book && (
                  <span className="pp-meta-row">
                    <CoinsIcon /> {who.book}
                  </span>
                )}
                {who.firm && (
                  <span className="pp-meta-row">
                    <BuildingIcon /> {who.firm}
                  </span>
                )}
                {!!who.serves?.length && (
                  <span className="pp-meta-row">
                    <PeopleIcon /> {who.serves.join(', ')}
                  </span>
                )}
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
            {mine ? null : (
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
            {!mine && onOpenExperience && <ExperienceButton onClick={onOpenExperience} />}
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
                {tab === 'id' ? (who.name === 'You' ? 'Your Business ID' : `${shownName}’s Business ID`) : TAB_LABEL[tab]}
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
          {/* Who on his team sees each part of it is the phone's My Team
              tab now, so the ID is read one way: what it says. */}
          {(printing || tab === 'id') && (
            <BusinessIdTab d={d} confidence={data.confidence} stageLevel={stageLevel} noBadges={noBadges} waiting={waiting} />
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
  defaultOpen = false,
  id,
}: {
  /** An anchor, for a way in that lands on this card (The Move's ending). */
  id?: string
  icon: string
  title: string
  children: ReactNode
  /** Open on arrival — a card with something in it worth reading first. */
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section id={id} className={`pp-card ap-fold${open ? " is-open" : ""}`}>
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

/* An advisor's team and who of them sees each part of their Business ID —
   the My Team tab on their phone. */
export function AdvisorTeam({ name }: { name: string }) {
  const who = { name }
  return (
    <SharingView
      who={`advisor-${who.name.toLowerCase().replace(/[^a-z]+/g, '-')}`}
      idName="Business ID"
      roles={ADVISOR_ROLES}
      /* For the demo every link is sent by Marla; the invite does not
         yet record who made it. */
      sender={{ id: 'sender', name: 'Marla Sofer', role: 'recruiter', email: 'marla.sofer@knomee.com' }}
      /* Marcus, the worked example, arrives with his team; everybody
         else's is theirs to add. */
      team={
        who.name === 'Marcus Hale'
          ? [
              { id: 'p1', name: 'Ana', role: 'junior advisor', email: 'ana@example.com' },
              { id: 'p2', name: 'Dev', role: 'associate', email: 'dev@example.com' },
              { id: 'p3', name: 'Rachel', role: 'spouse', email: 'rachel@example.com' },
              { id: 'p4', name: 'Tom', role: 'accountant', email: 'tom@example.com' },
            ]
          : []
      }
      cards={[
        { id: 'the-move', title: 'The Move', icon: icTheMove },
        { id: 'practice-joy', title: 'Practice Joy', icon: icPracticeJoy },
        { id: 'confidence', title: 'Confidence', icon: icConfidence },
        { id: 'outlook', title: 'Outlook', icon: icOutlook },
        { id: 'future-you', title: 'Future You', icon: icFutureYou },
      ]}
    />
  )
}

/* Everything else The Move asks, beyond the goal form's own fields, each the
   way the flow asks it: its options are the flow's own, so the two cannot
   drift. The retired brand question is not among them. */
const moveOptions = (id: string) =>
  (flowSteps.find((s) => s.id === id)?.options ?? []).filter((o) => o !== 'Other')
const MOVE_FIELDS: GoalField[] = [
  { label: 'Support', kind: 'one', options: moveOptions('mv-q4') },
  { label: 'Who it involves', kind: 'many', options: moveOptions('mv-q10') },
  { label: 'Holding back', kind: 'text' },
]

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
  noBadges = false,
  waiting = {},
  only,
}: {
  /** Just this one adventure's card, as the page draws it — for the
      celebration at the end of that adventure. */
  only?: IdCard
  noBadges?: boolean
  waiting?: WaitingCards
  d: AdvisorProfileData['id']
  confidence: AdvisorProfileData['confidence']
  stageLevel: number
}) {
  const [confidence, setConfidence] = useState(false)
  const [postcard, setPostcard] = useState(false)
  const [openGoal, setOpenGoal] = useState<number | null>(null)
  /* The three questions, opened on the panel a client's question opens on
     and changed the way hers are: reworded, resolved or deleted, held on
     this page. */
  const [questionEdits, setQuestionEdits] = useState<ProfileQuestion[] | null>(null)
  const questions: ProfileQuestion[] =
    questionEdits ?? d.questions.map((q) => ({ q, date: d.header.completed, knomee: true }))
  const [openQuestion, setOpenQuestion] = useState<number | null>(null)
  const changeQuestion = (i: number, q: ProfileQuestion | null) =>
    setQuestionEdits(questions.flatMap((x, j) => (j !== i ? [x] : q ? [q] : [])))
  /* A goal edited here — its stage by taking the assessment again — laid over
     the one the flow put together, by its place in the list. */
  const [edits, setEdits] = useState<Record<number, Goal>>({})
  const [editingGoal, setEditingGoal] = useState<number | null>(null)
  /* Six highlights, three of them shown — the same fold the client and the
     prospect pages have had, and the same on paper: a print shows all six
     whether the card is open or shut. */
  const highlights = useCollapsed(d.highlights, COLLAPSED_ROWS)
  /* The change they named, read as a goal at the stage the flow put them in —
     and carrying everything else The Move asked, so the row opens onto the same
     panel a client's goal does. Marcus's answers and an advisor who took the
     flow this morning fill the same shape, so Gary's move opens as readily as
     his. A move they skipped naming is no row at all, not a row without a
     title. */
  const authored: Goal[] = (d.move.change ? [d.move.change] : []).map((change) => (
    {
      title: change,
      readiness: stageLevel,
      updated: d.header.completed,
      timeline: d.move.when,
      pros: listOf(d.move.worthIt),
      cons: listOf(d.move.challenging),
      note: d.move.why || undefined,
      extra: [
        ...(d.move.support ? [{ label: 'Support', value: d.move.support }] : []),
        ...(d.move.stakeholders
          ? [{ label: 'Who it involves', value: d.move.stakeholders }]
          : []),
        ...(d.move.blocker ? [{ label: 'Holding back', value: d.move.blocker }] : []),
      ],
    }
  ))
  const goals = authored.map((g, i) => edits[i] ?? g)
  // He has taken the flow once, so every card's date picker offers that sitting.
  const dates = [d.header.completed]
  const show = (k: IdCard) => !only || only === k
  return (
    <>
      {/* Key Highlights — none drawn from a sheet that answered nothing they
          read, and then no card to hold them. */}
      {!only && d.highlights.length > 0 && (
      <section className="pp-card">
        <CardHead icon={icKeyHighlights} title="Key Highlights" />
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
        {highlights.overflows && <HeadToggle open={highlights.open} onToggle={highlights.toggle} />}
      </section>
      )}

      <div className={only ? 'pp-only' : 'pp-cols'}>
        {/* Left content column */}
        <div className={only ? undefined : 'pp-col-main'}>
          {!show('move') ? null : waiting.move ? (
            <Waiting icon={icTheMove} title="The Move" adventure="The Move" />
          ) : (
          <section className="pp-card">
            <div className="pp-card-head">
              <span className="pp-card-title">
                <img className="pp-card-ic" src={icTheMove} alt="" />
                The Move
              </span>
              <AddButton />
            </div>
            <div className="pp-goals">
              {goals.map((g, i) => (
                <div
                  className="pp-goal is-open-able"
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenGoal(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setOpenGoal(i)
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
          )}

          {!show('joy') ? null : waiting.joy ? (
            <Waiting icon={icPracticeJoy} title="Practice Joy" adventure="Practice Joy" />
          ) : (
          <section className="pp-card">
            <div className="pp-card-head">
              <span className="pp-card-title">
                <img className="pp-card-ic" src={icPracticeJoy} alt="" />
                Practice Joy
              </span>
              <DateSelect dates={dates} />
            </div>
            {/* A question left blank is left off: no prompt over no chips. */}
            {d.practiceJoy.chips.length > 0 && (
              <>
                <p className="pp-prompt">{d.practiceJoy.prompt}</p>
                <div className="pp-chips">
                  {d.practiceJoy.chips.map((c) => (
                    <span className="pp-chip" key={c}>
                      {c}
                    </span>
                  ))}
                </div>
              </>
            )}
            {/* The second half of the same adventure: where he wants his days to
                go. It rides in this card rather than a new one, so the page
                keeps the client page's shape. A side nothing was sorted into
                is not drawn. */}
            {(d.attention.more.length > 0 || d.attention.less.length > 0) && (
            <div className="pp-attention">
              {d.attention.more.length > 0 && (
              <div>
                <span className="pp-fy-label">More attention</span>
                {d.attention.more.map((m) => (
                  <div className="pp-attn-row pp-attn-more" key={m}>
                    {m}
                  </div>
                ))}
              </div>
              )}
              {d.attention.less.length > 0 && (
              <div>
                <span className="pp-fy-label">Less attention</span>
                {d.attention.less.map((m) => (
                  <div className="pp-attn-row pp-attn-less" key={m}>
                    {m}
                  </div>
                ))}
              </div>
              )}
            </div>
            )}
          </section>
          )}

          {!show('future') ? null : waiting.future ? (
            <Waiting icon={icFutureYou} title="Future You" adventure="Future You" />
          ) : (
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
            )
              .filter(([, items]) => items.length > 0)
              .map(([label, items]) => (
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
          )}

          {!show('outlook') ? null : waiting.outlook ? (
            <Waiting icon={icOutlook} title="Outlook" adventure="Outlook" />
          ) : (
          <section className="pp-card">
            <div className="pp-card-head">
              <span className="pp-card-title">
                <img className="pp-card-ic" src={icOutlook} alt="" />
                Outlook
              </span>
              <DateSelect dates={dates} />
            </div>
            {d.outlook.concerns.length > 0 && (
              <span className="pp-fy-label">Concerns</span>
            )}
            {d.outlook.concerns.map((c) => (
              <p className="pp-quote" key={c}>
                “{c}”
              </p>
            ))}
            {d.outlook.hopes.length > 0 && (
              <span className="pp-fy-label pp-hope">Hopes</span>
            )}
            {d.outlook.hopes.map((h) => (
              <p className="pp-quote" key={h}>
                “{h}”
              </p>
            ))}
          </section>
          )}

          {!noBadges && !only && d.badges.length > 0 && (
          <section className="pp-card">
            <div className="pp-card-head">
              <span className="pp-card-title">
                <img className="pp-card-ic is-inset" src={icBadges} alt="" />
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
          )}

        </div>

        {/* Right rail */}
        <div className={only ? undefined : 'pp-rail'}>
          {!show('confidence') ? null : waiting.confidence ? (
            <Waiting icon={icConfidence} title="Confidence" adventure="Confidence" />
          ) : (
          <section className="pp-card">
            <div className="pp-card-head">
              <span className="pp-card-title">
                <img className="pp-card-ic" src={icConfidence} alt="" />
                Confidence
              </span>
              <DateSelect dates={dates} />
            </div>
            {/* No statement rated, no reading: the dial and its results are
                left off rather than drawn at a band nobody gave. */}
            {d.readiness.confidence && (
              <>
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
                  {confidence ? 'Hide Results' : 'Show Results'} <CaretIcon up={confidence} />
                </button>
              </>
            )}
          </section>
          )}

          {/* The two cards nobody arrives for, under the dial where the rail
              has room for them — folded, so two empty trays do not carry the
              same weight as the reading above them, and open when there is
              something to put in them. */}
          {!only && (
          <>
          <FoldCard icon={icLifeEvents} title="Life Events">
            {/* The advisor adventures do not ask for these yet, and inventing
                them would put words in his mouth — so the card wears the empty
                tray a client's would, and the tray invites you to add one. */}
            <EmptyState art={EMPTY_ART.lifeEvents} label="Add a Life Event" cta />
          </FoldCard>

          <FoldCard id="ap-questions" icon={icQuestions} title="Questions" defaultOpen={d.questions.length > 0}>
            {/* The three questions the adventures handed him — the ones to put
                to every platform he is considering — live here, on his ID,
                where a client's questions sit. Before anything is answered
                there are none, and the tray is the way in to asking one. */}
            {questions.length > 0 ? (
              /* The question rows the Financial ID's Questions card uses —
                 the question, and the day the adventures gave it. */
              <div className="pp-questions">
                {questions.map((q, i) => (
                  <div
                    className={`pp-question is-open-able${q.resolved ? ' is-resolved' : ''}`}
                    key={i}
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenQuestion(i)}
                    onKeyDown={(k) => {
                      if (k.key === 'Enter' || k.key === ' ') setOpenQuestion(i)
                    }}
                  >
                    {/* Knomee's, drawn from their answers, until it is
                        reworded — said on the row, as on a client's ID. */}
                    <span className="pp-q-text">
                      <StatusTags tags={q.tags} knomee={q.knomee} />
                      {q.q}
                    </span>
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
            ) : (
              <EmptyState art={EMPTY_ART.questions} label="Ask a Question" cta />
            )}
          </FoldCard>
          </>
          )}
        </div>
      </div>

      {openQuestion !== null && questions[openQuestion] && (
        <QuestionModal
          question={questions[openQuestion]}
          onClose={() => setOpenQuestion(null)}
          /* Dated the way the rest of the Business ID is (09.09.2026). */
          onRename={(text) =>
            changeQuestion(openQuestion, { ...renamed(questions[openQuestion], text), date: today() })
          }
          onToggleResolved={() => {
            const q = questions[openQuestion]
            changeQuestion(openQuestion, { ...q, resolved: q.resolved ? undefined : today() })
          }}
          onDelete={() => {
            changeQuestion(openQuestion, null)
            setOpenQuestion(null)
          }}
        />
      )}
      {/* Their move, opened on the panel a client's goal opens on, with
          everything else The Move asks as its own fields. */}
      {openGoal !== null && (
        <GoalModal
          goal={goals[openGoal]}
          fields={MOVE_FIELDS}
          stamp={today()}
          onClose={() => setOpenGoal(null)}
          onSave={(g) => setEdits((e) => ({ ...e, [openGoal]: { ...goals[openGoal], ...g } }))}
        />
      )}
      {editingGoal !== null && (
        <AddGoalModal
          goal={goals[editingGoal]}
          onClose={() => setEditingGoal(null)}
          onAdd={(g) => {
            setEdits((e) => ({ ...e, [editingGoal]: { ...goals[editingGoal], ...g } }))
            setEditingGoal(null)
          }}
        />
      )}
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

/* One adventure's card from the Business ID, exactly as the page draws it:
   the celebration at the end of an adventure shows what it just added. */
export function BusinessIdCard({ data, which }: { data: AdvisorProfileData; which: IdCard }) {
  const stageLevel = TTM_STAGES.indexOf(data.id.readiness.stage) + 1
  /* Inside the page's own wrapper: the dial's colours, and the cards'
     spacing, are set on it. */
  return (
    <div className="pp ap ap-mine pp-only-card">
      <BusinessIdTab d={data.id} confidence={data.confidence} stageLevel={stageLevel} noBadges only={which} />
    </div>
  )
}
