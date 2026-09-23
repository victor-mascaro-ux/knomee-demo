import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import './prospectProfile.css'
import './clientProfile.css'
import { avatarSources } from '../data/clientProfile'
import { profileFor } from '../data/memberProfiles'
import AddGoalModal from './AddGoalModal'
import ReadinessModal from './ReadinessModal'
import LifeEventModal, { AddLifeEventModal, SentimentFace } from './LifeEventModal'
import QuestionModal, { AddQuestionModal } from './QuestionModal'
import type { HouseholdMember } from '../data/clientProfile'
import { AddButton, EMPTY_ART, EmptyState, HeadToggle, LifeEventIcon, COLLAPSED_GOALS, COLLAPSED_ROWS, DateSelect, ConfidenceResults, ShowToggle, orderGoals, useCollapsed, HighlightIcon, BadgeMedallion, Gauge, ReadinessLevel, GoalDetail, PostcardSection } from './profileParts'
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
/* The Future You mark the flow wears on the adventure this board comes out of.
   The board is the picture half of that adventure, not a thing of its own, and
   it should be recognised as the same one. */
import icVision from '../assets/adventures/future-you.svg'
import moodGood from '../assets/moods/good.svg'
import moodGreat from '../assets/moods/great.svg'
import moodNeutral from '../assets/moods/neutral.svg'
import moodUnsure from '../assets/moods/unsure.svg'
import moodWorried from '../assets/moods/worried.svg'
import ClientInsightsTab, { ClientToolkitTab } from './ClientInsightsTab'
import GoalModal from './GoalModal'
import { DEMO_TODAY } from '../data/financialId'
import type { LifeEvent, ProfileQuestion } from '../data/financialId'
import './familyModal.css'
import { scrollPageToTop } from '../reviewBridge'
import { usePrintSheet } from '../printSheet'

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

/* A person's portrait, or their initial while there is no file for them.
   Exported because the family page draws the same household in the same
   rail. */
export function Portrait({ name, size }: { name: string; size: 'lg' | 'sm' }) {
  /* Walk the spellings, then give up and show the letter. */
  const [attempt, setAttempt] = useState(0)
  const sources = avatarSources(name)
  const initial = name.charAt(0).toUpperCase()
  const cls = size === 'lg' ? 'pp-avatar' : 'cp-person-av'
  if (attempt >= sources.length) {
    return (
      <span className={cls}>
        {size === 'lg' ? <span className="pp-avatar-initial">{initial}</span> : initial}
      </span>
    )
  }
  return (
    <span className={cls}>
      <img src={sources[attempt]} alt="" onError={() => setAttempt((n) => n + 1)} />
    </span>
  )
}

/* A vision-board tile. Photographs live in public/vision/ and are dropped in by
   hand, so a missing file falls back to a labelled tint rather than a broken
   image — the board keeps its shape whatever is or isn't there yet. */
/* Wider than this and the picture is a landscape one, whatever the tile asked
   for. 1.15 rather than 1.0 so a square file that is a pixel off — every
   photograph in public/vision/ is 292×298 — is not read as landscape. */
const LANDSCAPE = 1.15

function BoardPhoto({
  src,
  alt,
  tall,
  wide,
  style,
}: {
  src: string
  alt: string
  tall?: boolean
  wide?: boolean
  style?: CSSProperties
}) {
  const [failed, setFailed] = useState(false)
  /* A landscape photograph never takes the tall cell. The tile cannot know the
     file's shape until it loads, so the image reports it and the tall spans is
     dropped — the rule holds for photographs dropped in later too, without
     anyone having to remember it. */
  const [landscape, setLandscape] = useState(false)
  const isTall = tall && !landscape
  return (
    <div
      style={style}
      className={`cp-tile cp-tile-photo ${isTall ? 'is-tall' : ''} ${wide ? 'is-wide' : ''} ${
        failed ? 'is-missing' : ''
      }`}
    >
      {failed ? (
        <span className="cp-tile-alt">{alt}</span>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          onLoad={(e) => {
            const im = e.currentTarget
            if (im.naturalHeight && im.naturalWidth / im.naturalHeight > LANDSCAPE) setLandscape(true)
          }}
        />
      )}
    </div>
  )
}

/* Which way a note grows when one cell is not enough. Read off the note's own
   words rather than its position, so the same note always takes the same shape
   and the board's mix of talls and wides is stable between renders — random to
   look at, settled in fact. */
function noteGrowth(tile: Extract<BoardTile, { kind: 'note' }>) {
  const words = `${tile.title ?? ''}${tile.text ?? ''}${tile.items?.join('') ?? ''}`
  let h = 0
  for (let i = 0; i < words.length; i += 1) h = (h * 31 + words.charCodeAt(i)) | 0
  return Math.abs(h) % 2 === 0 ? 'is-tall' : 'is-wide'
}

function BoardNote({
  tile,
  style,
  onSpan,
}: {
  tile: Extract<BoardTile, { kind: 'note' }>
  style?: CSSProperties
  /* The board has to re-measure when a note claims a second cell, and a note's
     own state change does not re-render its parent. It says so instead. */
  onSpan?: () => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  /* A note takes one cell if its words fit in one. If they do not it takes a
     second — down or across, whichever its own text picks — rather than being
     clipped mid-sentence. Nothing grows past two cells: a vision board is
     pictures with a few words on it, not a page of text. */
  const [span, setSpan] = useState('')
  const [measuring, setMeasuring] = useState(true)
  const lastWidth = useRef(0)

  useLayoutEffect(() => {
    if (!measuring) return
    const el = box.current
    const inn = inner.current
    if (!el || !inn) return
    /* Measured with no span applied, so the question is always the same one:
       do these words fit the single cell? */
    const pad = getComputedStyle(el)
    const room =
      el.clientHeight - parseFloat(pad.paddingTop || '0') - parseFloat(pad.paddingBottom || '0')
    setSpan(inn.scrollHeight <= room + 1 ? '' : noteGrowth(tile))
    setMeasuring(false)
  }, [measuring, tile])

  useEffect(() => {
    if (!measuring) onSpan?.()
  }, [span, measuring, onSpan])

  /* The cell changes size between the desktop's three columns and the phone's
     two, and the answer changes with it. Width only — the note's own height
     moves when the span lands, and watching that would chase its own tail. */
  useEffect(() => {
    const grid = box.current?.parentElement
    if (!grid) return
    lastWidth.current = grid.clientWidth
    const ro = new ResizeObserver(() => {
      if (grid.clientWidth === lastWidth.current) return
      lastWidth.current = grid.clientWidth
      setMeasuring(true)
    })
    ro.observe(grid)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={box}
      style={style}
      className={`cp-tile cp-tile-note ${tile.tone ? `is-${tile.tone}` : ''} ${
        measuring ? '' : span
      }`}
    >
      <div className="cp-note-inner" ref={inner}>
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
    </div>
  )
}

/* Where the grid's own placement leaves a gap, and how wide it is.

   `grid-auto-flow: dense` already backfills a hole beside a tall or wide tile
   with the next tile that fits. What it cannot fix is the end: when the tiles
   do not add up to whole rows, the final row runs out part-way and the board
   finishes on a blank square. Nothing follows it to pull forward, so the tile
   that is there stretches into it instead. */
function trailingGap(grid: HTMLDivElement) {
  const cs = getComputedStyle(grid)
  const tracks = cs.gridTemplateColumns.split(' ').map(parseFloat)
  const cols = tracks.length
  if (!cols || Number.isNaN(tracks[0])) return null
  const gap = parseFloat(cs.rowGap) || 0
  const rowH = parseFloat(cs.gridAutoRows) || 0
  const box = grid.getBoundingClientRect()
  /* The board can be inside the scaled phone frame, where painted pixels and
     CSS pixels are not the same length. One ratio recovers the scale. */
  const laid = tracks.reduce((a, b) => a + b, 0) + gap * (cols - 1)
  const k = laid > 0 ? box.width / laid : 1
  const colStep = (tracks[0] + gap) * k
  const rowStep = (rowH + gap) * k
  if (!(colStep > 0) || !(rowStep > 0)) return null

  const cells = new Set<string>()
  let lastRow = 0
  const placed = [...grid.children].map((el, i) => {
    const b = el.getBoundingClientRect()
    const col = Math.round((b.left - box.left) / colStep)
    const row = Math.round((b.top - box.top) / rowStep)
    const colSpan = Math.max(1, Math.round((b.width + gap * k) / colStep))
    const rowSpan = Math.max(1, Math.round((b.height + gap * k) / rowStep))
    for (let r = row; r < row + rowSpan; r += 1) {
      for (let c = col; c < col + colSpan; c += 1) cells.add(`${r},${c}`)
      lastRow = Math.max(lastRow, r)
    }
    return { i, row, col, colSpan, rowSpan }
  })

  /* Only the final row is ours to close — a hole anywhere above it means the
     measurement is off, and stretching a tile into it would be a guess. */
  for (let r = 0; r < lastRow; r += 1) {
    for (let c = 0; c < cols; c += 1) if (!cells.has(`${r},${c}`)) return null
  }
  const empty = []
  for (let c = 0; c < cols; c += 1) if (!cells.has(`${lastRow},${c}`)) empty.push(c)
  if (!empty.length) return null

  /* The tile to stretch is the one on that row that the gap sits beside. */
  const first = Math.min(...empty)
  const neighbour = placed.find(
    (p) => p.row === lastRow && p.rowSpan === 1 && p.col + p.colSpan === first,
  )
  if (!neighbour) return null
  return { i: neighbour.i, span: neighbour.colSpan + empty.length }
}

/* Exported because the Family ID draws the same boards in its own column. */
export function Board({ board }: { board: VisionBoard }) {
  const grid = useRef<HTMLDivElement>(null)
  const [fill, setFill] = useState<{ i: number; span: number } | null>(null)
  const [, bump] = useState(0)
  const remeasure = useCallback(() => bump((n) => n + 1), [])

  /* After every commit, because the answer depends on where the tiles landed
     and the notes decide their own size a commit later. The measurement is
     taken with the stretch stripped off, so it is always asking about the
     board's natural layout rather than the one it produced last time — which
     is what lets it settle instead of arguing with itself. */
  useLayoutEffect(() => {
    const g = grid.current
    if (!g) return
    const stretched = fill ? (g.children[fill.i] as HTMLElement | undefined) : undefined
    if (stretched) stretched.style.gridColumn = ''
    const next = trailingGap(g)
    if (stretched && fill) stretched.style.gridColumn = `span ${fill.span}`
    const settled = next && fill ? next.i === fill.i && next.span === fill.span : !next && !fill
    if (!settled) setFill(next)
  })

  /* The column count changes between the desktop's three and the phone's two
     without React hearing about it — that is a container query, not a prop. A
     ResizeObserver is the only thing that sees it, but it is delivered with the
     frame, so a tab that is not painting never hears from it. It is the belt;
     the notes calling back are the braces. */
  useEffect(() => {
    const g = grid.current
    if (!g) return
    const ro = new ResizeObserver(remeasure)
    ro.observe(g)
    return () => ro.disconnect()
  }, [remeasure])

  const spanOf = (i: number) =>
    fill && fill.i === i ? { gridColumn: `span ${fill.span}` } : undefined

  return (
    <div className="cp-board">
      <h4 className="cp-board-title">{board.title}</h4>
      <p className="cp-board-blurb">{board.blurb}</p>
      <div className="cp-board-grid" ref={grid}>
        {board.tiles.map((t, i) =>
          t.kind === 'photo' ? (
            <BoardPhoto
              key={i}
              src={t.src}
              alt={t.alt}
              tall={t.tall}
              wide={t.wide}
              style={spanOf(i)}
            />
          ) : (
            <BoardNote key={i} tile={t} style={spanOf(i)} onSpan={remeasure} />
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
  onOpen,
}: {
  g: ClientGoal
  className?: string
  style?: React.CSSProperties
  /* Every goal row has had a chevron since the first one was drawn. This is
     where it goes. */
  onOpen: () => void
}) {
  return (
    <div
      className={`pp-goal is-open-able ${g.completed ? 'is-done' : ''} ${className ?? ''}`}
      style={style}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
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
        {g.completed && <span className="pp-goal-done"><CheckIcon /> Completed: {g.completed}</span>}
      </div>
      <ReadinessLevel level={g.readiness} />
      <span className="pp-goal-caret">
        <RowChevron />
      </span>
      <GoalDetail g={g} />
    </div>
  )
}

type ClientTab = 'id' | 'insights' | 'toolkit'

export default function ClientProfileScreen({
  client,
  onBack,
  ownerMenu,
  onOpenHousehold,
  household,
  onAddMember,
  mine,
  onToast,
  startFlow,
  onStartFlowDone,
}: {
  client: Client
  onBack: () => void
  /** The app's own toast, for the two things this page can add to a list. */
  onToast?: (msg: string) => void
  /** Open straight into one of the page's own forms. The client's phone has
      the same three things on a quick-access sheet, and a sheet that lands you
      on the right page with the form shut has not saved you the taps. */
  startFlow?: 'goal' | 'event' | 'question' | null
  onStartFlowDone?: () => void
  /* The phone frame hands in the control that opens the rail as a drawer. It
     belongs above the client's name, next to the person it is about, not in
     the app bar — the app bar's burger is the advisor's own menu, as it is on
     a desktop. Nothing renders here on a desktop, where the rail is on screen
     already. */
  ownerMenu?: ReactNode
  /* Opens the family page. The breadcrumb's middle step and the household at
     the top of the rail both go there — they name the family, and naming
     something that goes nowhere is the same as not naming it. */
  onOpenHousehold?: () => void
  /* The household she is in, or null while she is in none — in which case the
     rail offers to make one rather than naming a family that does not exist. */
  household?: { name: string; members: HouseholdMember[] } | null
  onAddMember?: () => void
  /* Emily reading her own Financial ID in her own app, rather than her advisor
     reading it about her. Same page — it is the artefact the five adventures
     produce — without the two things that only make sense from a client list:
     the breadcrumb back to one, and the Client Insights tab beside it, which is
     the advisor's read on her and not hers. The rail is untouched: her
     household and her advisory team are hers. */
  mine?: boolean
}) {
  const [tab, setTab] = useState<ClientTab>('id')
  const { printing, print } = usePrintSheet()
  /* Whose answers this page shows. Emily and Sebastian have their own; anyone
     else opens the built-out one, as the page always did. */
  const cp = profileFor(client.name)

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
  const highlights = useCollapsed(cp.keyHighlights, COLLAPSED_ROWS)
  /* The goals are the one list on this page that the page can change — a goal
     can be renamed, marked done or thrown away from the panel it opens. So the
     screen holds them, seeded from her profile and reset when another client's
     page is opened over this one. */
  const [goalList, setGoalList] = useState<ClientGoal[]>(cp.goals)
  useEffect(() => setGoalList(cp.goals), [cp])
  const [openGoal, setOpenGoal] = useState<string | null>(null)
  /* Adding one is the other thing this page can do to the list. */
  const [addingGoal, setAddingGoal] = useState(false)
  /* The goal whose form is open. The same panel that adds one edits one. */
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const editing = goalList.find((g) => g.title === editingGoal)
  /* And the goal whose stage is being taken. */
  const [assessing, setAssessing] = useState<string | null>(null)
  const assessed = goalList.find((g) => g.title === assessing)

  /* Handed in from outside — the quick-access sheet on the phone — and cleared
     as soon as it is honoured, so closing the form does not reopen it. */
  useEffect(() => {
    if (!startFlow) return
    if (startFlow === 'goal') setAddingGoal(true)
    if (startFlow === 'event') setEventForm('add')
    if (startFlow === 'question') setQuestionForm('add')
    onStartFlowDone?.()
  }, [startFlow, onStartFlowDone])
  const goals = useCollapsed(orderGoals(goalList), COLLAPSED_GOALS)
  const goal = goalList.find((g) => g.title === openGoal)
  /* The life events are the page's second list it can change: added from the
     card's plus, opened to read, edited and marked done. */
  const [eventList, setEventList] = useState<LifeEvent[]>(cp.lifeEvents)
  useEffect(() => setEventList(cp.lifeEvents), [cp])
  const [openEvent, setOpenEvent] = useState<LifeEvent | null>(null)
  const [eventForm, setEventForm] = useState<'add' | 'edit' | null>(null)
  const events = useCollapsed(eventList, COLLAPSED_ROWS)
  /* And the questions, which behave the same way: asked from the plus, opened
     to read, reworded, marked answered. */
  const [questionList, setQuestionList] = useState<ProfileQuestion[]>(cp.questions)
  useEffect(() => setQuestionList(cp.questions), [cp])
  const [openQuestion, setOpenQuestion] = useState<ProfileQuestion | null>(null)
  const [questionForm, setQuestionForm] = useState<'add' | 'edit' | null>(null)
  const questions = useCollapsed(questionList, COLLAPSED_ROWS)

  return (
    <div className={`pp cp ${mine ? 'cp-mine' : ''}`}>
      {!mine && (
        <nav className="pp-crumb">
          <button type="button" className="pp-crumb-link" onClick={onBack}>
            My Clients
          </button>
          {/* The separator belongs to the step BEFORE it, or a trail with no
              family in it loses the one between the list and the person. */}
          <span className="pp-crumb-sep">›</span>
          {household && (
            <>
              <button
                type="button"
                className="pp-crumb-link"
                onClick={onOpenHousehold ?? onBack}
              >
                {household.name}
              </button>
              <span className="pp-crumb-sep">›</span>
            </>
          )}
          <span className="pp-crumb-cur">{client.name}</span>
        </nav>
      )}
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

            {/* How she last said she felt, tapped on her phone. It reads as part of
                who she is rather than as a banner over whichever tab is open —
                which is why it sits with her name and her email, not above the
                page. */}
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

            {household ? (
              <div className="cp-side-block">
                <button className="cp-side-head" type="button" onClick={onOpenHousehold}>
                  {household.name}
                  <span className="cp-side-count">{household.members.length}</span>
                  <RowChevron />
                </button>
                {household.members.map((m) => (
                  <button
                    className={`cp-person ${m.name === client.name ? 'is-current' : ''}`}
                    type="button"
                    key={m.name}
                    onClick={onOpenHousehold}
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
            ) : (
              /* No household yet. The rail says so by offering the one thing
                 that would make one, in the place the household would sit. */
              <button className="cp-add-family" type="button" onClick={onAddMember}>
                Add a Family Member
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                  <path
                    d="M12 5.5v13M5.5 12h13"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}

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

          {!mine && (
            <div className="pp-tabs">
              {(
                [
                  ['id', 'Financial ID'],
                  ['insights', 'Client Insights'],
                  ['toolkit', 'Client Toolkit'],
                ] as [ClientTab, string][]
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
            {/* Whose page this is, as one thing: her face, then the page named
                after the tab it is showing — her Financial ID is the artefact
                the adventures produce, her Insights the advisor's read on it.
                The portrait leads it, the way a name badge does. */}
            <div className="pp-title-id">
              {ownerMenu}
              <h1 className="pp-title">
                {client.name}’s{' '}
                {tab === 'id' ? 'Financial ID' : tab === 'insights' ? 'Insights' : 'Toolkit'}
              </h1>
            </div>
            {/* The PDF is of the Financial ID — there is no insights document to
                download, and a button that says there is would be a promise. */}
            {tab === 'id' && (
              <button className="btn btn-download active" type="button" onClick={print}>
                <DownloadIcon /> Download PDF
              </button>
            )}
          </div>

          {!printing && tab === 'insights' ? (
            <ClientInsightsTab />
          ) : !printing && tab === 'toolkit' ? (
            <ClientToolkitTab />
          ) : (
            <>
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
                <div className="pp-col-main">
                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">
                        <img className="pp-card-ic" src={icGoals} alt="" />
                        Goals
                      </span>
                      <AddButton label="Add a goal" onClick={() => setAddingGoal(true)} />
                    </div>
                    <div className="cp-goal-cols" ref={goals.box}>
                      {goals.shown.map((g, i) => (
                        <GoalRow
                          g={g}
                          key={g.title}
                          className={goals.entering(i)}
                          style={goals.delay(i)}
                          onOpen={() => setOpenGoal(g.title)}
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
                    {/* Where they want their attention is the second half of the
                        Joy adventure, and not everyone has answered it. The card
                        carries the chips and stops rather than printing two
                        empty headings. */}
                    {(cp.attention.more.length > 0 || cp.attention.less.length > 0) && (
                    <div className="pp-attention">
                      <div>
                        <span className="pp-fy-label">More attention</span>
                        {cp.attention.more.map((m) => (
                          <div className="pp-attn-row pp-attn-more" key={m}>
                            {m}
                          </div>
                        ))}
                      </div>
                      <div>
                        <span className="pp-fy-label">Less attention</span>
                        {cp.attention.less.map((m) => (
                          <div className="pp-attn-row pp-attn-less" key={m}>
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>
                    )}
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
                    <PostcardSection text={cp.postcard} />
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
                    {/* The statements behind the dial, where this person has
                        their own. */}
                    <ConfidenceResults open={confidence} answers={cp.confidenceAnswers} />
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
                              {e.advisorAdded && (
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
                      <span className="pp-card-title">
                        <img className="pp-card-ic" src={icQuestions} alt="" />
                        Questions
                      </span>
                      <AddButton
                        muted={questions.shown.length === 0}
                        label="Ask a question"
                        onClick={() => setQuestionForm('add')}
                      />
                    </div>
                    {questions.shown.length === 0 ? (
                      <EmptyState art={EMPTY_ART.questions} label="Ask a Question" cta />
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
                    
                    {questions.overflows && <ShowToggle open={questions.open} onToggle={questions.toggle} />}
                  </section>
                </div>
              </div>
            </>
          )}

          {/* Printing takes the whole sheet: her Financial ID above, then the
              insights and the toolkit, each starting its own page — for the
              advisor. On her own copy the sheet is her Financial ID and stops
              there: the insights and the toolkit are the advisor's read of her,
              written for the meeting rather than for her. */}
          {printing && !mine && (
            <>
              <div className="print-page">
                <h2 className="print-head">Client Insights</h2>
                <ClientInsightsTab />
              </div>
              <div className="print-page">
                <h2 className="print-head">Client Toolkit</h2>
                <ClientToolkitTab />
              </div>
            </>
          )}
        </main>
      </div>

      {/* A new goal. It lands at the top of the list she is looking at, at the
          stage a goal just named is at. */}
      {addingGoal && (
        <AddGoalModal
          suggestions={cp.suggestedGoals}
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

      {/* The goal, opened. Renaming, marking done and deleting all land on the
          list this page holds, so the card behind the panel changes with it. */}
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
