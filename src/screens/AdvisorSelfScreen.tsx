// The advisor flow, answered by whoever opens it — the page where you take the
// eight minutes yourself and get your own three artefacts out of them.
//
// `AdvisorFlowScreen` is the walkthrough: Marcus Hale's answers, pre-filled,
// clicked through to show the instrument. This is the same instrument with the
// answers taken out. It renders the same steps from `data/advisorFlow` as
// controls rather than as read-only summaries, keeps what you tap and type on
// the sheet in `data/advisorAnswers`, and computes a Business ID, a readiness
// read and a Recruiting Toolkit from it — every line of them traceable to a
// question you answered, none of them Marcus's.
//
// The phone frame, the fit/zoom hooks and the adventure rows come from
// ClientExperienceScreen, and the desktop report is AdvisorProfileScreen handed
// your sheet instead of the worked example — so nothing here is a lookalike of
// a page that already exists.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdvisorProfileScreen from './AdvisorProfileScreen'
import { RailFace } from './profileParts'
import { useDragScroll } from './mobileGestures'
import {
  ActionRow,
  ArrowRight,
  CheckIcon,
  ClockIcon,
  CompletedRow,
  DEVICE_H,
  DEVICE_W,
  IPhone,
  LockedRow,
  ProgressMeter,
  TabAdventures,
  TabFinId,
  ZOOM_CONTROLS_TITLE,
  clampZoom,
  useDarkGround,
  useFitToWindow,
  useZoom,
} from './ClientExperienceScreen'
import { advisorAdventures, steps as flowSteps, type AdventureId, type Step } from '../data/advisorFlow'
import {
  adventureStates,
  clearAnswers,
  derive,
  emptyAnswers,
  isAnswered,
  isQuestion,
  loadAnswers,
  sampleAnswers,
  saveAnswers,
  today,
  unlockView,
  type Answers,
  type Derived,
  type Grade,
} from '../data/advisorAnswers'
import knomeeMark from '../assets/knomee-mark.svg'
import './client-experience.css'
import './advisor-flow.css'

const ZOOM_STEP = 0.1
const TAB_EDGE = 'M0 18H154a55.7 55.7 0 0 1 82 0h154'
const OTHER = 'Other'

/* The walkthrough opens on Welcome and goes straight to the adventures list.
   Answering it yourself needs one screen in between: who the Business ID is
   headed with. It is inserted here rather than in the flow data, because the
   walkthrough is somebody whose name the demo already knows. */
const IDENTITY: Step = {
  id: 'you',
  kind: 'identity',
  title: 'Who’s answering?',
  body: `Your Business ID is headed with this. Leave a field blank and it simply drops out of the line.

Nothing is sent anywhere — the answers stay in this browser.`,
  cta: 'Continue',
}

const steps: Step[] = [flowSteps[0], IDENTITY, ...flowSteps.slice(1)]

/* ── writing to the sheet ────────────────────────────────────────────────
   One place that knows how an answer is stored, handed down to the question
   components so none of them holds state of its own. Every setter replaces the
   sheet rather than mutating it, which is what lets the derived page recompute
   on the same render as the tap. */

interface Edit {
  toggle: (stepId: string, option: string, single: boolean, max?: number) => void
  other: (stepId: string, text: string) => void
  grade: (stepId: string, row: string, grade: Grade) => void
  text: (stepId: string, text: string) => void
  scale: (stepId: string, value: number) => void
  scaleAt: (stepId: string, index: number, value: number) => void
  identity: (patch: Partial<Answers['identity']>) => void
}

function useEdit(set: React.Dispatch<React.SetStateAction<Answers>>): Edit {
  return useMemo(
    () => ({
      toggle: (stepId, option, single, max) =>
        set((a) => {
          const had = a.choice[stepId] ?? []
          let next: string[]
          if (single) next = had[0] === option ? [] : [option]
          else if (had.includes(option)) next = had.filter((o) => o !== option)
          // At the cap, the oldest pick makes room for the new one. Refusing the
          // tap instead leaves you hunting for which of three to drop.
          else next = max && had.length >= max ? [...had.slice(1), option] : [...had, option]
          return { ...a, choice: { ...a.choice, [stepId]: next } }
        }),
      other: (stepId, text) =>
        set((a) => ({ ...a, other: { ...a.other, [`${stepId}:other`]: text } })),
      grade: (stepId, row, grade) =>
        set((a) => ({
          ...a,
          grid: { ...a.grid, [stepId]: { ...(a.grid[stepId] ?? {}), [row]: grade } },
        })),
      text: (stepId, text) => set((a) => ({ ...a, text: { ...a.text, [stepId]: text } })),
      scale: (stepId, value) => set((a) => ({ ...a, scale: { ...a.scale, [stepId]: value } })),
      scaleAt: (stepId, index, value) =>
        set((a) => {
          const had = [...(a.scaleSet[stepId] ?? [])]
          had[index] = value
          return { ...a, scaleSet: { ...a.scaleSet, [stepId]: had } }
        }),
      identity: (patch) => set((a) => ({ ...a, identity: { ...a.identity, ...patch } })),
    }),
    [set],
  )
}

/* ── small pieces ── */

function Eyebrow({ text }: { text?: string }) {
  if (!text) return null
  return <div className="af-eyebrow">{text}</div>
}

function Paras({ text }: { text?: string }) {
  if (!text) return null
  return (
    <>
      {text.split('\n\n').map((p, i) => (
        <p key={i} className="af-body">
          {p}
        </p>
      ))}
    </>
  )
}

function Scale({
  low,
  high,
  value,
  onPick,
}: {
  low: string
  high: string
  value: number
  onPick: (n: number) => void
}) {
  return (
    <div className="af-scale">
      <div className="af-scale-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`af-dot ${n === value ? 'is-on' : ''}`}
            aria-pressed={n === value}
            onClick={() => onPick(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="af-scale-ends">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

/** The multi/single choice list. "Other" opens a field under itself, because a
    list of twelve options is a guess about somebody's practice and the
    thirteenth answer is the honest one. */
function Choices({ step, a, edit }: { step: Step; a: Answers; edit: Edit }) {
  const single = step.kind === 'single'
  const picks = a.choice[step.id] ?? []
  const typed = a.other[`${step.id}:other`] ?? ''
  return (
    <>
      <div className="af-opts">
        {step.options?.map((o) => {
          const on = picks.includes(o)
          return (
            <button
              key={o}
              type="button"
              className={`af-opt ${on ? 'is-on' : ''}`}
              aria-pressed={on}
              onClick={() => edit.toggle(step.id, o, single, step.max)}
            >
              <span className={`af-box ${single ? 'is-round' : ''}`}>
                {on && <CheckIcon size={11} />}
              </span>
              {o}
            </button>
          )
        })}
      </div>
      {picks.includes(OTHER) && (
        <input
          className="af-field af-other"
          value={typed}
          placeholder="In your own words"
          onChange={(e) => edit.other(step.id, e.target.value)}
        />
      )}
      {step.max && (
        <div className="af-count">
          {picks.length} of {step.max} chosen
        </div>
      )}
    </>
  )
}

function GridQuestion({ step, a, edit }: { step: Step; a: Answers; edit: Edit }) {
  const grades: Grade[] = ['More', 'Same', 'Less']
  return (
    <div className="af-grid">
      <div className="af-grid-head">
        <span>Area</span>
        <span>+ More</span>
        <span>= Same</span>
        <span>− Less</span>
      </div>
      {step.rows?.map((r) => (
        <div className="af-grid-row" key={r.label}>
          <span className="af-grid-label">{r.label}</span>
          {grades.map((v) => (
            <button
              key={v}
              type="button"
              className={`af-radio ${a.grid[step.id]?.[r.label] === v ? 'is-on' : ''}`}
              aria-label={`${r.label}: ${v}`}
              aria-pressed={a.grid[step.id]?.[r.label] === v}
              onClick={() => edit.grade(step.id, r.label, v)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Free text. The prompts under the box are the spec's, and tapping one drops
    it into the box as an opening — which is what a prompt is for. */
function TextQuestion({ step, a, edit }: { step: Step; a: Answers; edit: Edit }) {
  const value = a.text[step.id] ?? ''
  const box = useRef<HTMLTextAreaElement>(null)
  // Grow to the answer rather than scrolling inside a four-line window: on a
  // phone, a box that hides the top of your own sentence is unreadable.
  useEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(96, el.scrollHeight)}px`
  }, [value])
  return (
    <>
      <textarea
        ref={box}
        className="af-field af-textarea"
        value={value}
        placeholder="Type your answer"
        onChange={(e) => edit.text(step.id, e.target.value)}
      />
      {step.hints && (
        <div className="af-hints">
          <div className="af-hints-title">Here are some prompts to help you start</div>
          {step.hints.map((h) => (
            <button
              key={h}
              type="button"
              className="af-hint"
              onClick={() => {
                const seed = h.replace(/^[“"]|[”"]$/g, '')
                edit.text(step.id, value ? `${value} ${seed}` : seed)
                box.current?.focus()
              }}
            >
              {h}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/** Who the Business ID is headed with. Four fields, none of them required —
    an unanswered one just drops out of the header line. */
function IdentityForm({ step, a, edit }: { step: Step; a: Answers; edit: Edit }) {
  const fields: [keyof Answers['identity'], string, string][] = [
    ['name', 'Your name', 'Alex Rivera'],
    ['role', 'Your role', 'Lead advisor · team of four'],
    ['book', 'Assets you advise on', '$840M'],
    ['firm', 'Where you are today', 'Wirehouse'],
  ]
  return (
    <div className="af-welcome">
      <h2 className="af-h1">{step.title}</h2>
      <Paras text={step.body} />
      <div className="af-form">
        {fields.map(([key, label, placeholder]) => (
          <label className="af-label" key={key}>
            {label}
            <input
              className="af-field"
              value={a.identity[key]}
              placeholder={placeholder}
              onChange={(e) => edit.identity({ [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

/* ── the step renderer ── */

function StepBody({
  step,
  a,
  edit,
  d,
  onHome,
  onReport,
  onAdventure,
}: {
  step: Step
  a: Answers
  edit: Edit
  d: Derived
  onHome: () => void
  onReport: () => void
  onAdventure: (id: AdventureId) => void
}) {
  switch (step.kind) {
    case 'welcome':
      return (
        <div className="af-welcome">
          <h2 className="af-h1">{step.title}</h2>
          <Paras text={step.body} />
          <div className="af-getlist-title">What you’ll get</div>
          <ol className="af-getlist">
            {step.lines?.map((l) => (
              <li key={l.label}>
                <span className="af-getnum">{l.label}</span>
                <span>{l.value}</span>
              </li>
            ))}
          </ol>
          <div className="af-est">
            <ClockIcon />
            {step.stat}
          </div>
        </div>
      )

    case 'identity':
      return <IdentityForm step={step} a={a} edit={edit} />

    case 'home':
      return (
        <>
          <ProgressMeter done={d.progress.done} required={d.progress.required} />
          <h2 className="cx-screen-title">My Adventures</h2>
          <div className="cx-adv-list">
            {adventureStates(a).map((row) => {
              // Every row opens its adventure — this is a walkthrough as much as
              // a form, so the state a row wears is a look, not a gate.
              const open = () => onAdventure(row.id)
              if (row.state === 'done') {
                return (
                  <CompletedRow
                    key={row.id}
                    title={row.title}
                    artKey={row.art}
                    on={a.completed}
                    onRow={open}
                  />
                )
              }
              if (row.state === 'open') {
                return (
                  <ActionRow
                    key={row.id}
                    a={{
                      title: row.title,
                      art: row.art,
                      // Half-answered says so, rather than inviting you to
                      // start something you are already three questions into.
                      blurb: row.count.done
                        ? `${row.count.done} of ${row.count.total} questions answered`
                        : row.blurb,
                      minutes: row.minutes,
                      label: row.count.done ? 'Continue' : 'Start',
                    }}
                    onAct={open}
                    onRow={open}
                  />
                )
              }
              return <LockedRow key={row.id} title={row.title} artKey={row.art} onRow={open} />
            })}
          </div>
        </>
      )

    case 'intro':
      return (
        <div className="af-intro">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h1">{step.title}</h2>
          <Paras text={step.body} />
          {step.cite && <div className="af-cite">{step.cite}</div>}
        </div>
      )

    case 'reflect':
      return (
        <div className="af-reflect">
          <h2 className="af-h2">{step.title}</h2>
          <Paras text={step.body} />
        </div>
      )

    case 'multi':
    case 'single':
      return (
        <div className="af-q">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h2">{step.title}</h2>
          <Paras text={step.body} />
          <Choices step={step} a={a} edit={edit} />
        </div>
      )

    case 'grid':
      return (
        <div className="af-q">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h2">{step.title}</h2>
          <GridQuestion step={step} a={a} edit={edit} />
        </div>
      )

    case 'text':
      return (
        <div className="af-q">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h2">{step.title}</h2>
          <Paras text={step.body} />
          <TextQuestion step={step} a={a} edit={edit} />
        </div>
      )

    case 'scale':
      return (
        <div className="af-q">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h2">{step.title}</h2>
          {step.scale && (
            <Scale
              low={step.scale.low}
              high={step.scale.high}
              value={a.scale[step.id] ?? 0}
              onPick={(n) => edit.scale(step.id, n)}
            />
          )}
        </div>
      )

    case 'scaleSet':
      return (
        <div className="af-q">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h2">{step.title}</h2>
          <div className="af-stmts">
            {step.statements?.map((s, i) => (
              <div className="af-stmt" key={s.text}>
                <div className="af-stmt-text">
                  <span className="af-stmt-n">{i + 1}</span>
                  {s.text}
                </div>
                <Scale
                  low={s.low}
                  high={s.high}
                  value={a.scaleSet[step.id]?.[i] ?? 0}
                  onPick={(n) => edit.scaleAt(step.id, i, n)}
                />
              </div>
            ))}
          </div>
        </div>
      )

    case 'unlock':
    case 'stage': {
      // The card an adventure ends on says what you just told it, so its title,
      // its lines and its stat are computed from the sheet — the authored copy
      // is only the fallback for the parts a sheet has nothing to say about.
      const view = unlockView(step.id, a)
      const lines = view.lines ?? step.lines
      return (
        <div className={`af-unlock ${step.kind === 'stage' ? 'is-stage' : ''}`}>
          {step.kind === 'stage' && <div className="af-eyebrow">My readiness stage is</div>}
          <h2 className="af-h1">{view.title ?? step.title}</h2>
          <Paras text={view.body ?? step.body} />
          <div className="af-lines">
            {lines?.map((l) => (
              <div className="af-line" key={l.label}>
                <span className="af-line-k">{l.label}</span>
                <span className="af-line-v">{l.value}</span>
              </div>
            ))}
          </div>
          {(view.stat ?? step.stat) && <div className="af-stat">{view.stat ?? step.stat}</div>}
        </div>
      )
    }

    case 'summary':
      return (
        <div className="af-unlock">
          <h2 className="af-h1">Congratulations</h2>
          <p className="af-body">
            You’re taking a meaningful step. Here’s your personalized summary.
          </p>
          <div className="af-lines">
            {d.id.highlights.map((h) => (
              <div className="af-line" key={h.title}>
                <span className="af-line-k">{h.title}</span>
                <span className="af-line-v">{h.text}</span>
              </div>
            ))}
            <div className="af-line">
              <span className="af-line-k">Readiness stage</span>
              <span className="af-line-v">
                {d.id.readiness.stage} · confidence {d.id.readiness.confidence.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      )

    case 'questions':
      return (
        <div className="af-unlock">
          <h2 className="af-h1">Your three questions</h2>
          <p className="af-body">
            Put these to every platform you’re considering. Including this one.
          </p>
          <ol className="af-qs">
            {d.id.questions.map((q, i) => (
              <li key={q}>
                <span className="af-getnum">{i + 1}</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
          <button className="cx-start af-wide" type="button" onClick={onHome}>
            View my Business ID
          </button>
          {/* The other half of the same eight minutes: the read a platform gets
              handed. It is the thing the flow is actually for, and hiding it
              from the person who answered would be the wrong way round. */}
          <button className="af-secondary" type="button" onClick={onReport}>
            See my readiness and toolkit
          </button>
          <div className="af-stat">If you’d like to talk it through with Dynasty, book a time.</div>
        </div>
      )

    default:
      return null
  }
}

/* ── the screen ── */

export default function AdvisorSelfScreen({ onExit }: { onExit: () => void }) {
  // The sheet outlives the session: answering eight minutes of questions and
  // losing them to a reload is not a thing to do to anyone.
  const [answers, setAnswers] = useState<Answers>(loadAnswers)
  const [view, setView] = useState<'flow' | 'report'>('flow')
  const edit = useEdit(setAnswers)
  const d = useMemo(() => derive(answers), [answers])
  useEffect(() => saveAnswers(answers), [answers])

  const restart = useCallback((next: Answers) => {
    setAnswers(next)
    setView('flow')
  }, [])

  if (view === 'report') return <FlowReport d={d} onBack={() => setView('flow')} />

  return (
    <FlowPhone
      answers={answers}
      edit={edit}
      d={d}
      onExit={onExit}
      onReport={() => setView('report')}
      onSample={() => restart(sampleAnswers())}
      onClear={() => {
        clearAnswers()
        restart({ ...emptyAnswers(), completed: today() })
      }}
    />
  )
}

/* ── the phone ── */

function FlowPhone({
  answers,
  edit,
  d,
  onExit,
  onReport,
  onSample,
  onClear,
}: {
  answers: Answers
  edit: Edit
  d: Derived
  onExit: () => void
  onReport: () => void
  onSample: () => void
  onClear: () => void
}) {
  // Where you have been, not just where you are: tapping a row on the
  // adventures list jumps across the flow, and Back has to mean "the screen I
  // came from" rather than "the step before this one" — otherwise Back out of
  // The Move would land in the middle of Future You.
  const [trail, setTrail] = useState<number[]>([0])
  const i = trail[trail.length - 1]
  const [tab, setTab] = useState<'flow' | 'finid'>('flow')
  const [menuOpen, setMenuOpen] = useState(false)
  const [railOpen, setRailOpen] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)
  useDragScroll(viewport)
  useDarkGround()
  const { scale: fitScale, windowH } = useFitToWindow()
  const { zoom, setZoom, reset: resetZoom } = useZoom()
  const scale = fitScale * zoom

  const step = steps[i]
  const last = i === steps.length - 1
  // Inside an adventure the bottom bar is Back and OK; on the two destinations
  // — the adventures list and the Business ID — it is the tab bar. The
  // welcome screen counts as in-flow: its "Get started" is the same button.
  const inFlow = tab === 'flow' && step.kind !== 'home'
  // A question holds its own button until it has an answer. Skip is next to it
  // rather than absent, because a question somebody does not want to answer is
  // itself an answer and the flow should not trap them on it.
  const asks = isQuestion(step)
  const answered = isAnswered(step, answers)
  const cta = useMemo(() => {
    if (step.cta) return step.cta
    if (step.kind === 'unlock' || step.kind === 'stage') return 'Submit'
    if (step.kind === 'summary') return 'Continue'
    return 'OK'
  }, [step])

  // Scroll back to the top of the phone on every step change; a long question
  // followed by a short one would otherwise open half-way down.
  const toTop = () => viewport.current?.scrollTo({ top: 0 })
  const go = (n: number) => {
    setTrail((t) => [...t, n])
    toTop()
  }
  const back = () => {
    setTrail((t) => (t.length > 1 ? t.slice(0, -1) : t))
    toTop()
  }

  // A fresh start rather than another screen on the trail — Back after this
  // has nowhere behind it to go, which is the point of restarting.
  const reset = (n: number) => {
    setTrail([n])
    toTop()
  }

  // Tapping a row on the adventures list drops you at that adventure's intro.
  const openAdventure = (id: AdventureId) => {
    const at = steps.findIndex((s) => s.adventure === id)
    if (at >= 0) go(at)
  }

  // Closing an adventure returns to the list and ends the trail there.
  const HOME_AT = steps.findIndex((s) => s.kind === 'home')
  const closeToList = () => {
    setTab('flow')
    reset(HOME_AT)
  }

  // Inside an adventure the app bar carries its name and a way out, in place
  // of the wordmark and the burger.
  const adventure = step.adventure
    ? advisorAdventures.find((a) => a.id === step.adventure)
    : undefined

  return (
    <div className="cx-page" style={windowH ? { minHeight: windowH } : undefined}>
      <div className="cx-fit" style={{ height: DEVICE_H * scale, width: DEVICE_W * scale }}>
        <IPhone scale={scale}>
          <header className="cx-appbar">
            {adventure && tab === 'flow' ? (
              <>
                <div className="af-appbar-title">{adventure.title}</div>
                <button
                  className="cx-appbar-burger"
                  type="button"
                  aria-label="Close this adventure and go back to My Adventures"
                  onClick={closeToList}
                >
                  <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M5.5 5.5l11 11M16.5 5.5l-11 11" strokeLinecap="round" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div className="cx-appbar-brand">
                  <img src="./knomee-logo-white.svg" alt="knomee" />
                </div>
                <button
                  className="cx-appbar-burger"
                  type="button"
                  aria-label="Menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.9">
                    <path d="M3 6h16M3 11h16M3 16h16" strokeLinecap="round" />
                  </svg>
                </button>
              </>
            )}
          </header>

          <div
            className={`cx-viewport${tab === 'finid' && railOpen ? ' is-menu-open' : ''}`}
            ref={viewport}
          >
            {tab === 'finid' ? (
              d.empty ? (
                /* Nothing answered yet. An empty page of empty cards would read
                   as a broken Business ID rather than an unearned one. */
                <div className="af-blank">
                  <h2 className="af-h1">Your Business ID</h2>
                  <p className="af-body">
                    This page is built out of your answers. Finish an adventure and it starts
                    filling in — the first one takes about two minutes.
                  </p>
                  <button className="cx-start af-wide" type="button" onClick={() => setTab('flow')}>
                    Go to My Adventures
                  </button>
                </div>
              ) : (
                /* The Business ID he reads is the Business ID the firm
                   reads — one page, his answers, the same cards. It used to be a
                   second, flatter rendering of the same data that lived only
                   here, so the two drifted every time one of them was touched. */
                <AdvisorProfileScreen
                  mine
                  data={d}
                  onBack={() => setTab('flow')}
                  ownerMenu={
                    /* The same control his page carries everywhere else: his own
                       portrait, under his name, opening his rail from the left. */
                    <button
                      className="cxm-rail-btn"
                      type="button"
                      aria-label={railOpen ? 'Close my details' : 'My details'}
                      aria-expanded={railOpen}
                      onClick={() => setRailOpen((o) => !o)}
                    >
                      <RailFace name={d.who.name} />
                    </button>
                  }
                />
              )
            ) : (
              <StepBody
                step={step}
                a={answers}
                edit={edit}
                d={d}
                onHome={() => setTab('finid')}
                onReport={onReport}
                onAdventure={openAdventure}
              />
            )}
          </div>

          {/* Inside an adventure the phone's bottom bar IS Back and OK — they
              take the tab bar's place rather than stacking above it, so they
              are always on screen however long the question runs. The tab bar
              comes back on the two destinations: the adventures list and the
              Business ID. */}
          {inFlow ? (
            <div className="af-foot">
              <div className="af-nav">
                {trail.length > 1 && (
                  <button className="af-back" type="button" onClick={back}>
                    Back
                  </button>
                )}
                {!last && (
                  <button
                    className="cx-start af-next"
                    type="button"
                    disabled={asks && !answered}
                    onClick={() => go(i + 1)}
                  >
                    {cta}
                  </button>
                )}
                {asks && !answered && !last && (
                  <button className="af-skip" type="button" onClick={() => go(i + 1)}>
                    Skip
                  </button>
                )}
              </div>
              <div className="af-progress" aria-hidden>
                {steps.map((s, n) => (
                  <i key={s.id} className={n <= i ? 'is-on' : ''} />
                ))}
              </div>
            </div>
          ) : (
          <nav className="cx-tabbar">
            <svg className="cx-tab-edge" viewBox="0 0 390 96" width="390" height="96" aria-hidden>
              <path d={`${TAB_EDGE}V96H0Z`} fill="#fff" />
              <path d={TAB_EDGE} fill="none" stroke="#e6e5ea" strokeWidth="1.2" />
            </svg>
            <button
              type="button"
              className={`cx-tab ${tab === 'flow' ? 'is-on' : ''}`}
              onClick={() => setTab('flow')}
            >
              <TabAdventures />
              <span className="cx-tab-lbl">Adventures</span>
            </button>
            <button type="button" className="cx-tab cx-tab-center" aria-label="Knomee">
              <img className="cx-tab-mark" src={knomeeMark} alt="knomee" />
            </button>
            <button
              type="button"
              className={`cx-tab ${tab === 'finid' ? 'is-on' : ''}`}
              onClick={() => setTab('finid')}
            >
              <TabFinId />
              <span className="cx-tab-lbl">Business ID</span>
            </button>
          </nav>
          )}

          <div className="cx-home-bar" />

          {tab === 'finid' && railOpen && (
            <button
              className="cxm-scrim"
              type="button"
              aria-label="Close my details"
              onClick={() => setRailOpen(false)}
            />
          )}

          {menuOpen && (
            <div className="cx-sheet" onClick={() => setMenuOpen(false)}>
              <div className="cx-sheet-panel" onClick={(e) => e.stopPropagation()}>
                <div className="cx-sheet-account">
                  <span className="cx-sheet-avatar">{d.who.initial}</span>
                  <span>
                    <b>{d.who.name}</b>
                    <i>{d.id.header.meta || 'Your answers, on this device'}</i>
                  </span>
                </div>
                {/* Nothing to read until something is answered — an empty
                    report is worse than no way to it. */}
                {!d.empty && (
                  <button
                    className="cx-sheet-item"
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onReport()
                    }}
                  >
                    My readiness and toolkit
                    <ArrowRight />
                  </button>
                )}
                <button
                  className="cx-sheet-item"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setTab('flow')
                    reset(0)
                  }}
                >
                  Restart the flow
                  <ArrowRight />
                </button>
                {/* The worked example, one tap away. It is what this flow was
                    before it could be answered, and it is still the fastest way
                    to show somebody the whole instrument. */}
                <button
                  className="cx-sheet-item"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setTab('flow')
                    reset(0)
                    onSample()
                  }}
                >
                  Fill in the sample answers
                  <ArrowRight />
                </button>
                <button
                  className="cx-sheet-item"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setTab('flow')
                    reset(0)
                    onClear()
                  }}
                >
                  Clear my answers
                  <ArrowRight />
                </button>
                <button className="cx-sheet-item" type="button" onClick={onExit}>
                  Advisor Experience
                  <ArrowRight />
                </button>
                <div className="cx-sheet-hint">Switches back to the adviser demo.</div>
              </div>
            </div>
          )}
        </IPhone>
      </div>

      <div className="cx-view" role="group" aria-label="View">
        {zoom !== 1 && (
          <span className="cx-zoom">
            <button type="button" onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))} aria-label="Zoom out">
              &minus;
            </button>
            <span className="cx-zoom-pct">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))} aria-label="Zoom in">
              +
            </button>
          </span>
        )}
        <button type="button" className="cx-fit-btn" onClick={resetZoom} title={ZOOM_CONTROLS_TITLE}>
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              d="M2 6V2.6h3.4M14 6V2.6h-3.4M2 10v3.4h3.4M14 10v3.4h-3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Fit to screen
        </button>
      </div>
    </div>
  )
}

/* ── the report ──────────────────────────────────────────────────────────
   The other side of the same eight minutes, on the desktop page a Dynasty rep
   would be reading: Business ID, Advisor Readiness, Recruiting Toolkit. Not a
   preview of that page — it IS that page, handed the sheet from the phone
   instead of the worked example. */

function FlowReport({ d, onBack }: { d: Derived; onBack: () => void }) {
  useEffect(() => {
    window.scrollTo(0, 0)
    try {
      if (window.parent && window.parent !== window) window.parent.scrollTo(0, 0)
    } catch {
      /* cross-origin parent — ignore */
    }
  }, [])
  return (
    <div className="page af-report">
      <header className="af-report-bar">
        <button className="af-report-back" type="button" onClick={onBack}>
          ‹ Back to the flow
        </button>
        <span className="af-report-note">
          What a platform reads from your answers — the same page, the same three tabs.
        </span>
      </header>
      <main className="content content-profile">
        <AdvisorProfileScreen mine tabs data={d} onBack={onBack} />
      </main>
    </div>
  )
}
