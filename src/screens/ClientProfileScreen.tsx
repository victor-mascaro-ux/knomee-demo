import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import { AddButton, EMPTY_ART, EmptyState, HeadToggle, LifeEventIcon, COLLAPSED_GOALS, COLLAPSED_ROWS, DateSelect, ConfidenceResults, ShowToggle, orderGoals, useCollapsed, HighlightIcon, BadgeMedallion, Gauge, ReadinessLevel, GoalDetail, PostcardSection, CheckInCard } from './profileParts'
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
import ClientInsightsTab, { ClientToolkitTab } from './ClientInsightsTab'
import GoalModal from './GoalModal'
import { DEMO_TODAY } from '../data/financialId'
import type { LifeEvent, ProfileQuestion } from '../data/financialId'
import './familyModal.css'
import { scrollPageToTop } from '../reviewBridge'
import { usePrintSheet } from '../printSheet'
import { VisionBoardCard } from './VisionBoards'

const ADVENTURE_ICON: Record<string, string> = {
  'Financial Joy': icFinancialJoy,
  Confidence: icConfidence,
  Outlook: icOutlook,
  'Future You': icFutureYou,
  Goals: icGoals,
}

// The mobile app's own mood ramp, reused so the check-in the client tapped on
// their phone is the very same face the advisor sees here.

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

/* A tile's place in its grid, in CSS pixels. */
type Box = { x: number; y: number; w: number; h: number }

/* A photograph's cell, in columns × rows. */
export type TileSize = '1x1' | '2x1' | '1x2'

/* A board being made: the cross that takes a tile off it, on the tile itself. */
function TileRemove({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      className="cp-tile-x"
      aria-label="Remove from board"
      data-no-drag-scroll
      onClick={(e) => {
        /* The tile shrinks away first and the board closes over it after, so
           a delete is something seen happening rather than a gap appearing. */
        const tile = e.currentTarget.closest('.cp-tile')
        if (!tile || tile.classList.contains('is-leaving')) return
        tile.classList.add('is-leaving')
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        window.setTimeout(onRemove, reduce ? 0 : 190)
      }}
    >
      <svg viewBox="0 0 16 16" width="10" height="10" fill="none" aria-hidden>
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  )
}

const KEY_SIZE: Partial<Record<string, TileSize>> = {
  ArrowRight: '2x1',
  ArrowDown: '1x2',
  ArrowLeft: '1x1',
  ArrowUp: '1x1',
}

function BoardPhoto({
  src,
  alt,
  tall,
  wide,
  style,
  onResize,
  onRemove,
  lifted,
}: {
  src: string
  alt: string
  tall?: boolean
  wide?: boolean
  style?: CSSProperties
  onRemove?: () => void
  /** Being carried to a new place on the board. */
  lifted?: boolean
  /** A board being made: the photograph carries a handle that drags it to one
      cell, two across or two down. */
  onResize?: (size: TileSize) => void
}) {
  const [failed, setFailed] = useState(false)
  const tile = useRef<HTMLDivElement>(null)
  /* The size under the finger while the handle is held; null otherwise. */
  const [draft, setDraft] = useState<TileSize | null>(null)
  /* A landscape photograph never takes the tall cell. The tile cannot know the
     file's shape until it loads, so the image reports it and the tall spans is
     dropped — the rule holds for photographs dropped in later too, without
     anyone having to remember it. A hand that drags one tall has chosen it,
     though: the rule is for the authored boards, not for overruling her. */
  const [landscape, setLandscape] = useState(false)
  const size: TileSize =
    draft ?? (wide ? '2x1' : tall && (onResize || !landscape) ? '1x2' : '1x1')

  /* The drag is read in cells: the tile's size plus how far the handle has
     travelled, snapped to one cell or two on each axis. Past halfway on both is
     read as the axis it went further along — a photograph never takes four. */
  const startDrag = (e: React.PointerEvent) => {
    const el = tile.current
    const grid = el?.parentElement
    if (!el || !grid || !onResize) return
    e.preventDefault()
    e.stopPropagation()
    const cs = getComputedStyle(grid)
    const cols = cs.gridTemplateColumns.split(' ').length
    const gap = parseFloat(cs.columnGap) || 0
    const rowGap = parseFloat(cs.rowGap) || 0
    const cellW = (grid.clientWidth - gap * (cols - 1)) / cols
    const cellH = parseFloat(cs.gridAutoRows) || cellW
    // The phone is drawn scaled; the pointer moves in screen pixels.
    const scale = grid.getBoundingClientRect().width / grid.clientWidth || 1
    const w0 = el.offsetWidth
    const h0 = el.offsetHeight
    const x0 = e.clientX
    const y0 = e.clientY
    const pick = (ev: PointerEvent): TileSize => {
      const w = w0 + (ev.clientX - x0) / scale
      const h = h0 + (ev.clientY - y0) / scale
      const across = cols > 1 ? (w - cellW) / (cellW + gap) : 0
      const down = (h - cellH) / (cellH + rowGap)
      if (across < 0.5 && down < 0.5) return '1x1'
      return across >= down ? '2x1' : '1x2'
    }
    let last = size
    setDraft(size)
    const move = (ev: PointerEvent) => {
      last = pick(ev)
      setDraft(last)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      setDraft(null)
      onResize(last)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  return (
    <div
      ref={tile}
      /* While it is being sized, the stretch the board gave the last tile would
         fight the hand, so it is set aside until she lets go. */
      style={draft ? { ...style, gridColumn: undefined } : style}
      className={`cp-tile cp-tile-photo ${size === '1x2' ? 'is-tall' : ''} ${
        size === '2x1' ? 'is-wide' : ''
      } ${failed ? 'is-missing' : ''}${onResize || onRemove ? ' is-sizable' : ''}${
        draft ? ' is-sizing' : ''
      }${lifted ? ' is-lifted' : ''}`}
    >
      {failed ? (
        <span className="cp-tile-alt">{alt}</span>
      ) : (
        <img
          src={src}
          alt={alt}
          draggable={false}
          onError={() => setFailed(true)}
          onLoad={(e) => {
            const im = e.currentTarget
            if (im.naturalHeight && im.naturalWidth / im.naturalHeight > LANDSCAPE) setLandscape(true)
          }}
        />
      )}
      {onRemove && !draft && <TileRemove onRemove={onRemove} />}
      {onResize && (
        <>
          {draft && <span className="cp-tile-size">{draft.replace('x', ' × ')}</span>}
          <span
            className="cp-tile-handle"
            role="slider"
            aria-label="Photo size"
            aria-valuetext={size}
            tabIndex={0}
            data-no-drag-scroll
            onPointerDown={startDrag}
            onKeyDown={(e) => {
              // The arrows do what the drag does, for a hand not on a mouse.
              const next = KEY_SIZE[e.key]
              if (next) {
                e.preventDefault()
                onResize(next)
              }
            }}
          >
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden>
              <path
                d="M9.5 3.5h3v3M6.5 12.5h-3v-3M12.5 3.5 3.5 12.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </>
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
  onRemove,
  lifted,
}: {
  tile: Extract<BoardTile, { kind: 'note' }>
  style?: CSSProperties
  onRemove?: () => void
  lifted?: boolean
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
      }${onRemove ? ' is-sizable' : ''}${lifted ? ' is-lifted' : ''}`}
    >
      {onRemove && <TileRemove onRemove={onRemove} />}
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
  /* Measured from layout, not from paint: offsets ignore transforms, so a
     tile that is mid-animation — popping in, gliding to a new place, the whole
     panel scaling open — is read where it will be rather than where it is
     drawn. Reading painted boxes during an animation gave a different answer
     each frame, and the board re-laid itself without end. The grid is the
     tiles' offset parent (clientProfile.css), and offsets are CSS pixels, so
     the phone frame's scale does not enter into it either. */
  const colStep = tracks[0] + gap
  const rowStep = rowH + gap
  if (!(colStep > 0) || !(rowStep > 0)) return null

  const cells = new Set<string>()
  let lastRow = 0
  const placed = [...grid.children].map((node, i) => {
    const el = node as HTMLElement
    const col = Math.round(el.offsetLeft / colStep)
    const row = Math.round(el.offsetTop / rowStep)
    // Nothing on a board is more than two cells either way.
    const colSpan = Math.min(2, Math.max(1, Math.round((el.offsetWidth + gap) / colStep)))
    const rowSpan = Math.min(2, Math.max(1, Math.round((el.offsetHeight + gap) / rowStep)))
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
export function Board({
  board,
  onResize,
  onRemove,
  onEdit,
  onMove,
}: {
  board: VisionBoard
  /** A board being made: tiles are picked up and carried to a new place, and
      the board reorders under the pointer as they go. */
  onMove?: (from: number, to: number) => void
  /** A board that can be changed: an Edit beside its title opens it. */
  onEdit?: () => void
  /** A board being made: its photographs can be dragged to a size. */
  onResize?: (i: number, size: TileSize) => void
  /** A board being made: every tile carries a cross that takes it off. */
  onRemove?: (i: number) => void
}) {
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
    /* Not while a tile is being carried: re-stretching the last tile every time
       the order changes resized tiles under the hand, which read as the board
       blinking. It settles once, on the drop. */
    if (carry.current) return
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

  /* The tile being carried, by where it is now. It moves through the board
     rather than jumping at the end: every tile it passes over steps aside, so
     where it will land is always what is on the screen. */
  const [carried, setCarried] = useState<number | null>(null)
  /* The carry in progress, outside React: the tile is moved under the pointer
     straight on its style, every pointer move, because a render per pixel is
     what made it feel dragged through mud. React hears only when the order
     changes. */
  const carry = useRef<{
    at: number
    x0: number
    y0: number
    left: number
    top: number
    px: number
    py: number
    scale: number
  } | null>(null)

  /* Puts the carried tile under the pointer, wherever the board has laid it
     out: the pointer's travel, less how far its cell has moved since it was
     picked up. */
  const follow = () => {
    const c = carry.current
    const g = grid.current
    if (!c || !g) return
    const el = g.children[c.at] as HTMLElement | undefined
    if (!el) return
    const dx = (c.px - c.x0) / c.scale - (el.offsetLeft - c.left)
    const dy = (c.py - c.y0) / c.scale - (el.offsetTop - c.top)
    el.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`
  }

  const startCarry = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = grid.current
    if (!onMove || !g || e.button !== 0) return
    const target = e.target as HTMLElement
    // Its cross and its handle are controls of their own.
    if (target.closest('.cp-tile-x, .cp-tile-handle')) return
    const el = target.closest('.cp-tile') as HTMLElement | null
    if (!el || el.parentElement !== g) return
    e.preventDefault()
    const x0 = e.clientX
    const y0 = e.clientY
    const scale = g.getBoundingClientRect().width / g.clientWidth || 1
    const at0 = Array.from(g.children).indexOf(el)
    let moving = false

    const move = (ev: PointerEvent) => {
      if (!moving) {
        // A press that has not travelled is not a drag.
        if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return
        moving = true
        carry.current = { at: at0, x0, y0, left: el.offsetLeft, top: el.offsetTop, px: x0, py: y0, scale }
        setCarried(at0)
      }
      ev.preventDefault()
      const c = carry.current
      if (!c) return
      c.px = ev.clientX
      c.py = ev.clientY
      follow()
      /* Where the pointer is on the board, in the board's own pixels, and
         which other tile it is well inside — the middle of it, not its edge,
         so a pointer resting on a border does not swap two tiles back and
         forth. */
      const box = g.getBoundingClientRect()
      const x = (ev.clientX - box.left) / scale
      const y = (ev.clientY - box.top) / scale
      const kids = Array.from(g.children) as HTMLElement[]
      const to = kids.findIndex((k, i) => {
        if (i === c.at) return false
        const ix = k.offsetWidth * 0.2
        const iy = k.offsetHeight * 0.2
        return (
          x > k.offsetLeft + ix &&
          x < k.offsetLeft + k.offsetWidth - ix &&
          y > k.offsetTop + iy &&
          y < k.offsetTop + k.offsetHeight - iy
        )
      })
      if (to < 0) return
      onMove(c.at, to)
      c.at = to
      setCarried(to)
    }

    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      const c = carry.current
      carry.current = null
      if (!c) return
      /* Let go: it settles into the cell it was carried to. */
      const tile = g.children[c.at] as HTMLElement | undefined
      if (tile) {
        const from = tile.style.transform
        tile.style.transform = ''
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        if (from && !reduce)
          tile.animate([{ transform: from }, { transform: 'none' }], {
            duration: 200,
            easing: 'cubic-bezier(0.22, 0.81, 0.28, 1.05)',
          })
      }
      setCarried(null)
      remeasure()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  /* After the board reorders, the carried tile's cell has moved: put it back
     under the pointer before the frame paints. */
  useLayoutEffect(() => {
    follow()
  })

  /* Where each tile was on the last commit, by key, so the next one can play
     the difference: a tile that moved, grew or shrank glides from its old box
     to its new one instead of jumping. Only on a board being made — the page's
     boards do not rearrange themselves. */
  const boxes = useRef(new Map<string, Box>())
  const glides = useRef(new Map<string, Animation>())
  const keys: string[] = []
  useLayoutEffect(() => {
    const g = grid.current
    if (!g || !(onMove || onRemove || onResize)) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    /* Boxes from layout, not paint. A painted box read while a tile is still
       gliding is where the glide has got to, and starting the next glide from
       there compounded every frame until the tiles flew off the board. Layout
       is where the tile is, full stop — and in CSS pixels, so the phone
       frame's scale does not enter into it. */
    const next = new Map<string, Box>()
    Array.from(g.children).forEach((node, i) => {
      const el = node as HTMLElement
      const k = keys[i]
      if (!k) return
      const now: Box = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
      next.set(k, now)
      const was = boxes.current.get(k)
      /* A tile the board has not had before grows into its cell. Played from
         here rather than as a CSS animation, because the browser restarts a
         CSS animation whenever a node is moved — and reordering moves them —
         so every tile a drag passed flashed its entrance again. */
      if (!was && boxes.current.size && !reduce) {
        el.animate(
          [
            { opacity: 0, transform: 'scale(0.82)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 280, easing: 'cubic-bezier(0.2, 1.2, 0.4, 1)' },
        )
        return
      }
      // The tile in hand is placed by the pointer, not by a glide.
      if (carry.current?.at === i) return
      if (reduce || !was || !now.w || !now.h) return
      if (was.x === now.x && was.y === now.y && was.w === now.w && was.h === now.h) return
      glides.current.get(k)?.cancel()
      glides.current.set(
        k,
        el.animate(
          [
            {
              transformOrigin: '0 0',
              transform: `translate(${was.x - now.x}px, ${was.y - now.y}px) scale(${was.w / now.w}, ${was.h / now.h})`,
            },
            { transformOrigin: '0 0', transform: 'none' },
          ],
          { duration: 240, easing: 'cubic-bezier(0.22, 0.81, 0.28, 1.05)' },
        ),
      )
    })
    boxes.current = next
  })

  /* Keyed by what each tile is, and which of its kind it is, but not by where:
     a tile carried across the board, or one taken off before it, stays the same
     element and does not flash while it reloads. A note's shape is its own
     words' business, so moving it does not need a fresh measure. */
  const seen = new Map<string, number>()
  const keyOf = (t: BoardTile) => {
    const base = t.kind === 'photo' ? `p:${t.src}` : `n:${t.title ?? ''}${t.text ?? ''}`
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    const k = `${base}#${n}`
    keys.push(k)
    return k
  }

  return (
    <div className="cp-board">
      {onEdit ? (
        <div className="cp-board-head">
          <h4 className="cp-board-title">{board.title}</h4>
          <button type="button" className="cp-board-edit" onClick={onEdit}>
            <svg viewBox="0 0 20 20" width="13" height="13" fill="none" aria-hidden>
              <path
                d="M13.6 3.3a1.7 1.7 0 0 1 2.4 2.4l-8 8-3.2.8.8-3.2 8-8Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            Edit
          </button>
        </div>
      ) : (
        <h4 className="cp-board-title">{board.title}</h4>
      )}
      <p className="cp-board-blurb">{board.blurb}</p>
      <div
        className={`cp-board-grid${onMove ? ' is-movable' : ''}${carried !== null ? ' is-carrying' : ''}`}
        ref={grid}
        onPointerDown={onMove ? startCarry : undefined}
        {...(onMove ? { 'data-no-drag-scroll': '' } : {})}
      >
        {board.tiles.map((t, i) =>
          t.kind === 'photo' ? (
            <BoardPhoto
              key={keyOf(t)}
              lifted={carried === i}
              src={t.src}
              alt={t.alt}
              tall={t.tall}
              wide={t.wide}
              style={spanOf(i)}
              onResize={onResize ? (size) => onResize(i, size) : undefined}
              onRemove={onRemove ? () => onRemove(i) : undefined}
            />
          ) : (
            <BoardNote
              key={keyOf(t)}
              lifted={carried === i}
              tile={t}
              style={spanOf(i)}
              onSpan={remeasure}
              onRemove={onRemove ? () => onRemove(i) : undefined}
            />
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
  /* Done events go to the end, the way completed goals do; the rest keep
     their order. */
  const orderedEvents = useMemo(
    () => [...eventList.filter((e) => !e.completed), ...eventList.filter((e) => e.completed)],
    [eventList],
  )
  const events = useCollapsed(orderedEvents, COLLAPSED_ROWS)
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

            {/* On the advisor's page the check-in sits with who she is, in the
                rail beside her name; on her own phone the rail is a drawer, so
                there it goes under the title instead. */}
            {!mine && <CheckInCard checkIn={cp.checkIn} />}

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

          {/* How she last said she felt, under the name of the page she said it
              on — the same card her own phone shows her, in the same place. */}
          {mine && <CheckInCard checkIn={cp.checkIn} />}

          {!printing && tab === 'insights' ? (
            <ClientInsightsTab name={client.name} />
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
                        <img className="pp-card-ic is-inset" src={icBadges} alt="" />
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

                  {/* Keyed by who, so another client's page starts from their
                      own boards rather than the last one's edits. */}
                  <VisionBoardCard key={client.name} initial={cp.boards} onToast={onToast} />
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
                      <EmptyState art={EMPTY_ART.lifeEvents} label="Add a Life Event" cta onClick={() => setEventForm('add')} />
                    ) : (
                    <div className="pp-events" ref={events.box}>
                      {events.shown.map((e, i) => (
                        <div
                          className={`pp-event is-open-able ${e.completed ? 'is-done' : ''} ${events.entering(i) ?? ''}`}
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
                              {e.completed ? (
                                <span className="pp-goal-done"><CheckIcon /> Completed: {e.completed}</span>
                              ) : (
                                <span className="pp-event-date">{e.date}</span>
                              )}
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
                      <EmptyState art={EMPTY_ART.questions} label="Ask a Question" cta onClick={() => setQuestionForm('add')} />
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
                <ClientInsightsTab name={client.name} />
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
