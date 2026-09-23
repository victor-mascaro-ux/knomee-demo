import { useEffect, useState, type ReactNode } from 'react'
import './prospectProfile.css'
import moodWorried from '../assets/moods/worried.svg'
import moodUnsure from '../assets/moods/unsure.svg'
import moodNeutral from '../assets/moods/neutral.svg'
import moodGood from '../assets/moods/good.svg'
import moodGreat from '../assets/moods/great.svg'

/* Lowest to highest, the way every other reading of a mood is ordered here. */
const MOOD_FACE = [moodWorried, moodUnsure, moodNeutral, moodGood, moodGreat]
import { prospectToolkit, prospectReadiness } from '../data/readiness'
import { ToolkitTabView, ReadinessTabView } from './readinessParts'
import { AddButton, EMPTY_ART, EmptyState, HeadToggle, LifeEventIcon, COLLAPSED_GOALS, COLLAPSED_ROWS, DateSelect, ConfidenceResults, ShowToggle, orderGoals, useCollapsed, HighlightIcon, BadgeMedallion, Gauge, ReadinessLevel, RailFace, GoalDetail, PostcardSection, CheckInCard } from './profileParts'
import type { Prospect } from '../data/prospects'
import { DownloadIcon } from '../components/icons'
import {
  CalendarIcon,
  CaretIcon,
  CheckIcon,
  RowChevron,
  MailIcon,
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
import { scrollPageToTop } from '../reviewBridge'
import { usePrintSheet } from '../printSheet'
import GoalModal from './GoalModal'
import AddGoalModal from './AddGoalModal'
import ReadinessModal from './ReadinessModal'
import LifeEventModal, { AddLifeEventModal, SentimentFace } from './LifeEventModal'
import QuestionModal, { AddQuestionModal } from './QuestionModal'
import { useVisionBoards } from './VisionBoards'
import type { JoyAnswers } from './JoyFlow'
import icVision from '../assets/adventures/vision-board.svg'
import { DEMO_TODAY, financialId } from '../data/financialId'
import type { LifeEvent, ProfileQuestion } from '../data/financialId'

/* The five core adventures, in the order they are taken. */
const BADGE_ORDER = ['Financial Joy', 'Confidence', 'Outlook', 'Future You', 'Goals']

const ADVENTURE_ICON: Record<string, string> = {
  'Financial Joy': icFinancialJoy,
  Confidence: icConfidence,
  Outlook: icOutlook,
  'Future You': icFutureYou,
  Goals: icGoals,
}

type ProfileTab = 'id' | 'readiness' | 'toolkit'

export default function ProspectProfileScreen({
  prospect,
  onBack,
  onConvert,
  onToast,
  mine,
  ownerMenu,
  startFlow,
  onStartFlowDone,
  checkIn,
  fresh,
}: {
  /** Her phone as a new client's: nothing on the page until an adventure has
      put it there. `joy` is what Financial Joy handed back, once it has. */
  fresh?: { joy: JoyAnswers | null; done?: Record<string, string> }
  prospect: Prospect
  onBack: () => void
  onConvert?: (p: Prospect) => void
  /** Her own copy, on her phone: no trail back to a list she cannot see, no
      button that converts her, and none of the advisor's reading of her. */
  mine?: boolean
  /** The control her phone puts beside her name: her own face, opening her
      rail as a drawer. */
  ownerMenu?: ReactNode
  /** Open straight into one of the page's own forms — what the quick-access
      sheet on her phone asks for. */
  startFlow?: 'goal' | 'event' | 'question' | 'vision' | null
  onStartFlowDone?: () => void
  /** How she last said she felt, tapped on her own phone. It reads as part of
      who she is, so it sits with her name rather than over the page. */
  checkIn?: { level: number; mood: string; note?: string; date: string }
  /** The app's own toast, for the two things this page can add to a list. */
  onToast?: (msg: string) => void
}) {
  const [tab, setTab] = useState<ProfileTab>('id')
  const { printing, print } = usePrintSheet()
  /* A new client's page is empty, and fills as adventures are completed:
     only Financial Joy can be taken yet, so only what it produces appears —
     its card, a highlight drawn from the memory, and its badge. Everything
     else keeps its heading and waits. */
  const joy = fresh?.joy ?? null
  /* What is complete. Financial Joy's cards come from her answers; the rest
     are not built yet, so a completed one shows her authored answers. */
  const doneIds = fresh?.done ?? {}
  const isDone = (id: string) => !!doneIds[id] || (id === 'financial-joy' && !!joy)
  const fi = fresh
    ? {
        ...financialId,
        keyHighlights: [
          ...(joy
            ? [
                {
                  title: 'Joy & Motivation',
                  icon: 'financial-joy',
                  text: joy.notes.find((n) => n.trim()) ?? '',
                },
              ].filter((h) => h.text)
            : []),
          ...financialId.keyHighlights.filter((h) => h.icon !== 'financial-joy' && isDone(h.icon)),
        ],
        goals: isDone('goals') ? financialId.goals : [],
        lifeEvents: isDone('life-events') ? financialId.lifeEvents : [],
        questions: [],
        badges: BADGE_ORDER.filter((b) => isDone(b.toLowerCase().replace(/ /g, '-'))),
        financialJoy: {
          ...financialId.financialJoy,
          chips: joy ? [...joy.tools, ...(joy.other.trim() ? [joy.other.trim()] : [])] : [],
        },
        attention: {
          more: joy ? Object.keys(joy.attention).filter((k) => joy.attention[k] === 1) : [],
          less: joy ? Object.keys(joy.attention).filter((k) => joy.attention[k] === -1) : [],
        },
      }
    : financialId
  /* Which cards have anything in them yet. */
  const has = {
    joy: !fresh || !!joy,
    futureYou: !fresh || isDone('future-you'),
    outlook: !fresh || isDone('outlook'),
    confidence: !fresh || isDone('confidence'),
  }
  // Goals run earliest stage first with the completed ones last; each card
  // opens showing a few rows and grows on demand.
  const [confidence, setConfidence] = useState(false)
  const highlights = useCollapsed(fi.keyHighlights, COLLAPSED_ROWS)
  /* The goals are the one list this page can change — renamed, marked done or
     thrown away from the panel a row opens — so the screen holds them. */
  const [goalList, setGoalList] = useState(fi.goals)
  const [openGoal, setOpenGoal] = useState<string | null>(null)
  /* Adding one is the other thing this page can do to the list. */
  const [addingGoal, setAddingGoal] = useState(false)
  /* The goal whose form is open. The same panel that adds one edits one. */
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const editing = goalList.find((g) => g.title === editingGoal)
  /* And the goal whose stage is being taken. */
  const [assessing, setAssessing] = useState<string | null>(null)
  const assessed = goalList.find((g) => g.title === assessing)

  /* Their vision boards: none until they make one. */
  const vision = useVisionBoards([], onToast)
  /* Handed in from her phone's quick-access sheet, and cleared as soon as it
     is honoured so closing the form does not reopen it. */
  useEffect(() => {
    if (!startFlow) return
    if (startFlow === 'goal') setAddingGoal(true)
    if (startFlow === 'event') setEventForm('add')
    if (startFlow === 'question') setQuestionForm('add')
    if (startFlow === 'vision') vision.add()
    onStartFlowDone?.()
  }, [startFlow, onStartFlowDone])
  const goals = useCollapsed(orderGoals(goalList), COLLAPSED_GOALS)
  const goal = goalList.find((g) => g.title === openGoal)
  /* The life events are the page's second list it can change: added from the
     card's plus, opened to read, edited and marked done. */
  const [eventList, setEventList] = useState<LifeEvent[]>(fi.lifeEvents)
  const [openEvent, setOpenEvent] = useState<LifeEvent | null>(null)
  const [eventForm, setEventForm] = useState<'add' | 'edit' | null>(null)
  const events = useCollapsed(eventList, COLLAPSED_ROWS)
  /* And the questions, which behave the same way. */
  const [questionList, setQuestionList] = useState<ProfileQuestion[]>(fi.questions)
  const [openQuestion, setOpenQuestion] = useState<ProfileQuestion | null>(null)
  const [questionForm, setQuestionForm] = useState<'add' | 'edit' | null>(null)
  const questions = useCollapsed(questionList, COLLAPSED_ROWS)

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
    <div className={`pp ${mine ? 'cp-mine' : ''}`}>
      {!mine && (
        <nav className="pp-crumb">
          <button type="button" className="pp-crumb-link" onClick={onBack}>
            My Prospects
          </button>
          <span className="pp-crumb-sep">›</span>
          <span className="pp-crumb-cur">{prospect.name}</span>
        </nav>
      )}
      <div className="pp-layout">
        {/* Left profile sidebar — a full-height static strip */}
        <aside className="pp-side">
          <div className="pp-side-inner">
            <div className="pp-avatar">
              <RailFace name={prospect.name} fallback={prospect.avatar} />
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
            {checkIn && (
              <div className="cp-checkin">
                <span className="cp-checkin-face">
                  <img src={MOOD_FACE[checkIn.level]} alt="" />
                </span>
                <span className="cp-checkin-main">
                  <span className="cp-checkin-dots" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <i key={i} className={i <= checkIn.level ? 'is-on' : ''} />
                    ))}
                  </span>
                  <span className="cp-checkin-mood">{checkIn.mood}</span>
                </span>
                <span className="cp-checkin-date">Last check-in: {checkIn.date}</span>
                {checkIn.note && <p className="cp-checkin-note">“{checkIn.note}”</p>}
              </div>
            )}

            {!mine && onConvert && (
              <button className="pp-convert" type="button" onClick={() => onConvert(prospect)}>
                Convert to Client
              </button>
            )}
          </div>
        </aside>

        {/* Main column */}
        <main className="pp-main">
          {!mine && (
          <div className="pp-tabs">
            {(
              [
                ['id', 'Financial ID'],
                ['readiness', 'Prospect Readiness'],
                ['toolkit', 'Prospect Toolkit'],
              ] as [ProfileTab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`pp-tab ${tab === id ? 'is-active' : ''}`}
                onClick={() => {
                  setTab(id)
                  scrollPageToTop()
                }}
              >
                {label}
              </button>
            ))}
          </div>
          )}

          <div className="pp-title-row">
            <div className="pp-title-id">
              {ownerMenu}
              <h1 className="pp-title">
                {tab === 'id'
                  ? `${prospect.name}’s Financial ID`
                  : tab === 'readiness'
                    ? 'Prospect Readiness'
                    : 'Prospect Toolkit'}
              </h1>
            </div>
            <button className="btn btn-download active" type="button" onClick={print}>
              <DownloadIcon /> Download PDF
            </button>
          </div>

          {/* How she last said she felt, at the top of the page she said it on.
              The advisor's copy keeps it in the rail beside her name; on her
              own phone the rail is a drawer, and a check-in nobody can see is
              a check-in nobody made. */}
          {checkIn && <CheckInCard checkIn={checkIn} />}

          {!printing && tab === 'readiness' ? (
            <ReadinessTabView d={prospectReadiness} />
          ) : !printing && tab === 'toolkit' ? (
            <ToolkitTabView d={prospectToolkit} />
          ) : (
            <>
              {/* Key Highlights */}
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
                      <AddButton label="Add a goal" onClick={() => setAddingGoal(true)} />
                    </div>
                    <div className="pp-goals" ref={goals.box}>
                      {goals.shown.map((g, i) => (
                        <div
                          className={`pp-goal is-open-able ${g.completed ? 'is-done' : ''} ${
                            goals.entering(i) ?? ''
                          }`}
                          style={goals.delay(i)}
                          key={g.title}
                          role="button"
                          tabIndex={0}
                          onClick={() => setOpenGoal(g.title)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setOpenGoal(g.title)
                            }
                          }}
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
                          <GoalDetail g={g} />
                        </div>
                      ))}
                    </div>
                    {goals.overflows && <ShowToggle open={goals.open} onToggle={goals.toggle} />}
                  </section>

                  <section className={`pp-card${has.joy ? '' : ' is-waiting'}`}>
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icFinancialJoy} alt="" />Financial Joy</span>
                      {has.joy && <DateSelect />}
                    </div>
                    {!has.joy && <p className="pp-waiting">Complete the Financial Joy adventure</p>}
                    {has.joy && (
                    <>
                    <p className="pp-prompt">{fi.financialJoy.prompt}</p>
                    <div className="pp-chips">
                      {fi.financialJoy.chips.map((c) => (
                        <span className="pp-chip" key={c}>
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="pp-attention">
                      <div>
                        <span className="pp-fy-label">More attention</span>
                        {fi.attention.more.map((m) => (
                          <div className="pp-attn-row pp-attn-more" key={m}>
                            {m}
                          </div>
                        ))}
                      </div>
                      <div>
                        <span className="pp-fy-label">Less attention</span>
                        {fi.attention.less.map((m) => (
                          <div className="pp-attn-row pp-attn-less" key={m}>
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>
                    </>
                    )}
                  </section>

                  <section className={`pp-card${has.futureYou ? '' : ' is-waiting'}`}>
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icFutureYou} alt="" />Future You</span>
                      {has.futureYou && <DateSelect />}
                    </div>
                    {!has.futureYou && <p className="pp-waiting">Complete the Future You adventure</p>}
                    {has.futureYou && (
                    <>
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
                    <PostcardSection text={fi.postcard} />
                    </>
                    )}
                  </section>

                  <section className={`pp-card${has.outlook ? '' : ' is-waiting'}`}>
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icOutlook} alt="" />Outlook</span>
                      {has.outlook && <DateSelect />}
                    </div>
                    {!has.outlook && <p className="pp-waiting">Complete the Outlook adventure</p>}
                    {has.outlook && (
                    <>
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
                    </>
                    )}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic is-inset" src={icBadges} alt="" />
                        Badges
                      </span>
                    </div>
                    <div className="pp-badges">
                      {/* A new client sees all five, the ones not yet earned
                          waiting in grey — what there is to get, not a blank. */}
                      {(fresh ? BADGE_ORDER : fi.badges).map((label) => (
                        <div
                          className={`pp-badge${fi.badges.includes(label) ? '' : ' is-locked'}`}
                          key={label}
                        >
                          <BadgeMedallion label={label} icon={ADVENTURE_ICON[label]} />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Their boards: none until they make one — on her phone, or
                      here with the advisor. */}
                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic is-inset" src={icVision} alt="" />
                        Future Vision Board
                      </span>
                      <AddButton label="Add a vision board" onClick={vision.add} />
                    </div>
                    {vision.body}
                  </section>
                </div>

                {/* Right rail */}
                <div className="pp-rail">
                  <section className={`pp-card${has.confidence ? '' : ' is-waiting'}`}>
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icConfidence} alt="" />Confidence</span>
                      {has.confidence && <DateSelect />}
                    </div>
                    {!has.confidence && <p className="pp-waiting">Complete the Confidence adventure</p>}
                    {has.confidence && (
                    <>
                    <div className="pp-confidence">
                      <span className="pp-confidence-label">{fi.confidence}</span>
                      <Gauge label={fi.confidence} />
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
                    </>
                    )}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icLifeEvents} alt="" />Life Events</span>
                      <AddButton label="Add a life event" onClick={() => setEventForm('add')} />
                    </div>
                    {events.shown.length === 0 ? (
                      <EmptyState art={EMPTY_ART.lifeEvents} label="Add a Life Event" cta />
                    ) : (
                    <div className="pp-events" ref={events.box}>
                      {events.shown.map((e, i) => (
                        <div
                          className={`pp-event is-open-able ${events.entering(i) ?? ''}`}
                          style={events.delay(i)}
                          key={i}
                          role="button"
                          tabIndex={0}
                          onClick={() => setOpenEvent(e)}
                          onKeyDown={(k) => {
                            if (k.key === 'Enter' || k.key === ' ') setOpenEvent(e)
                          }}
                        >
                          <LifeEventIcon kind={e.kind} text={e.text} />
                          <span className="pp-event-body">
                            <span className="pp-event-head">
                              <span className="pp-event-kind">{e.kind}</span>
                            </span>
                            <span className="pp-event-text">{e.text}</span>
                            <span className="pp-event-meta">
                              <span className="pp-event-date">{e.date}</span>
                              {/* Who added it is the advisor's to know; her
                                  own phone is the client's flow. */}
                              {e.advisorAdded && !mine && (
                                <span className="pp-event-added">Advisor added</span>
                              )}
                            </span>
                          </span>
                          {/* How they felt about it, where the row has room —
                              only on the events somebody answered that for. */}
                          {e.sentiment ? (
                            <span className="pp-event-mood">
                              <SentimentFace level={e.sentiment} />
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    )}
                    
                    {events.overflows && <ShowToggle open={events.open} onToggle={events.toggle} />}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icQuestions} alt="" />Questions</span>
                      <AddButton
                        muted={questions.shown.length === 0}
                        label="Ask a question"
                        onClick={() => setQuestionForm('add')}
                      />
                    </div>
                    {questions.shown.length === 0 ? (
                      <EmptyState art={EMPTY_ART.questions} label="No Questions Asked Yet" />
                    ) : (
                    <div className="pp-questions" ref={questions.box}>
                      {questions.shown.map((q, i) => (
                        <div
                          className={`pp-question is-open-able ${q.resolved ? 'is-resolved' : ''} ${questions.entering(i) ?? ''}`}
                          style={questions.delay(i)}
                          key={i}
                          role="button"
                          tabIndex={0}
                          onClick={() => setOpenQuestion(q)}
                          onKeyDown={(k) => {
                            if (k.key === 'Enter' || k.key === ' ') setOpenQuestion(q)
                          }}
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
                    )}
                    
                    {questions.overflows && (
                      <ShowToggle open={questions.open} onToggle={questions.toggle} />
                    )}
                  </section>
                </div>
              </div>
            </>
          )}

          {/* Printing takes the whole sheet: the Financial ID above, then the
              two reads, each starting its own page. */}
          {printing && !mine && (
            <>
              <div className="print-page">
                <h2 className="print-head">Prospect Readiness</h2>
                <ReadinessTabView d={prospectReadiness} />
              </div>
              <div className="print-page">
                <h2 className="print-head">Prospect Toolkit</h2>
                <ToolkitTabView d={prospectToolkit} />
              </div>
            </>
          )}
        </main>
      </div>
      {addingGoal && (
        <AddGoalModal
          suggestions={fi.suggestedGoals}
          onClose={() => setAddingGoal(false)}
          onAdd={(g) => {
            setGoalList((list) => [g, ...list])
            setAddingGoal(false)
            setOpenGoal(g.title)
            onToast?.('Goal added')
            /* A goal at the first stage sorts to the end of the list, which is
               behind the fold on a page with four already. Open it, or the
               thing they just added is the one thing they cannot see. */
            if (!goals.open) goals.toggle()
          }}
        />
      )}

      {/* The same panel, on a goal that is already there: every answer filled
          in, and what comes back replaces it in place. */}
      {editing && (
        <AddGoalModal
          goal={editing}
          onClose={() => setEditingGoal(null)}
          onAdd={(g) => {
            setGoalList((list) => list.map((o) => (o === editing ? g : o)))
            setEditingGoal(null)
            setOpenGoal(g.title)
          }}
        />
      )}



      {vision.modal}

      {/* A question, opened — and the form that asks or rewords one. */}
      {openQuestion && !questionForm && (
        <QuestionModal
          question={openQuestion}
          onClose={() => setOpenQuestion(null)}
          onEdit={() => setQuestionForm('edit')}
          onToggleResolved={() => {
            const next = {
              ...openQuestion,
              resolved: openQuestion.resolved ? undefined : DEMO_TODAY,
            }
            setQuestionList((list) => list.map((q) => (q === openQuestion ? next : q)))
            setOpenQuestion(next)
            if (next.resolved) onToast?.('Question resolved')
          }}
          onDelete={() => {
            setQuestionList((list) => list.filter((q) => q !== openQuestion))
            setOpenQuestion(null)
          }}
        />
      )}
      {questionForm && (
        <AddQuestionModal
          question={questionForm === 'edit' ? (openQuestion ?? undefined) : undefined}
          onClose={() => setQuestionForm(null)}
          onSave={(q) => {
            setQuestionList((list) =>
              questionForm === 'edit' && openQuestion
                ? list.map((o) => (o === openQuestion ? q : o))
                : [q, ...list],
            )
            if (questionForm === 'add') onToast?.('Question added')
            setQuestionForm(null)
            setOpenQuestion(q)
          }}
        />
      )}

      {/* A life event, opened — and the form that adds or changes one. */}
      {openEvent && !eventForm && (
        <LifeEventModal
          event={openEvent}
          client={mine}
          onClose={() => setOpenEvent(null)}
          onEdit={() => setEventForm('edit')}
          onToggleComplete={() => {
            const next = {
              ...openEvent,
              completed: openEvent.completed ? undefined : DEMO_TODAY,
            }
            setEventList((list) => list.map((e) => (e === openEvent ? next : e)))
            setOpenEvent(next)
            if (next.completed) onToast?.('Life event completed')
          }}
          onDelete={() => {
            setEventList((list) => list.filter((e) => e !== openEvent))
            setOpenEvent(null)
          }}
        />
      )}
      {eventForm && (
        <AddLifeEventModal
          event={eventForm === 'edit' ? (openEvent ?? undefined) : undefined}
          client={mine}
          onClose={() => setEventForm(null)}
          onSave={(e) => {
            setEventList((list) =>
              eventForm === 'edit' && openEvent
                ? list.map((o) => (o === openEvent ? e : o))
                : [e, ...list],
            )
            if (eventForm === 'add') onToast?.('Life event added')
            setEventForm(null)
            setOpenEvent(e)
          }}
        />
      )}

      {/* One question, and the rung it puts them on. It lands on the goal
          and the page opens on it again, which is what the button at the end
          of the reading promises. */}
      {assessed && (
        <ReadinessModal
          goal={assessed}
          onClose={() => setAssessing(null)}
          onSave={(readiness) => {
            setGoalList((list) =>
              list.map((g) => (g === assessed ? { ...g, readiness, updated: DEMO_TODAY } : g)),
            )
            setAssessing(null)
            setOpenGoal(assessed.title)
            onToast?.('Readiness complete')
          }}
        />
      )}

      {/* The goal, opened. */}
      {goal && (
        <GoalModal
          goal={goal}
          onClose={() => setOpenGoal(null)}
          onAssess={() => {
            setAssessing(goal.title)
            setOpenGoal(null)
          }}
          onEdit={() => {
            /* The form takes over from the panel: two panels stacked is two
               copies of the same goal, one of them stale. */
            setEditingGoal(goal.title)
            setOpenGoal(null)
          }}
          onToggleComplete={() =>
            setGoalList((list) =>
              list.map((g) =>
                g === goal ? { ...g, completed: g.completed ? undefined : DEMO_TODAY } : g,
              ),
            )
          }
          onDelete={() => {
            setGoalList((list) => list.filter((g) => g !== goal))
            setOpenGoal(null)
          }}
        />
      )}
    </div>
  )
}
