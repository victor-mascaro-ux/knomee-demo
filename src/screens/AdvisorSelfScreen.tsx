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
import TopBar from '../components/TopBar'
import AdventureList from './AdventureList'
import { RailFace } from './profileParts'
import { useDragScroll } from './mobileGestures'
import {
  ArrowRight,
  CheckIcon,
  DEVICE_H,
  DEVICE_W,
  IPhone,
  SheetCredit,
  TabFinId,
  TabMark,
  TabQuestions,
  ZOOM_CONTROLS_TITLE,
  AppbarBrand,
  type FlowBrand,
  clampZoom,
  useDarkGround,
  useFitToWindow,
  useZoom,
  TabEdge,
} from './ClientExperienceScreen'
import { advisorAdventures, steps as flowSteps, type AdventureId, type Step } from '../data/advisorFlow'
import JoyFlow from './JoyFlow'
import { ADVISOR_JOY, sheetWithJoy } from './advisorJoy'
import ConfidenceFlow from './ConfidenceFlow'
import { ADVISOR_CONFIDENCE, sheetWithConfidence } from './advisorConfidence'
import OutlookFlow from './OutlookFlow'
import { ADVISOR_OUTLOOK, sheetWithOutlook } from './advisorOutlook'
import {
  adventureStates,
  anonymized,
  clearAnswers,
  derive,
  emptyAnswers,
  isAnswered,
  isQuestion,
  isShared,
  journeyDone,
  journeyProgress,
  journeyStates,
  withFinished,
  loadAnswers,
  privateSteps,
  redact,
  sampleAnswers,
  saveAnswers,
  unlockView,
  type Answers,
  type Derived,
  type Grade,
} from '../data/advisorAnswers'
import {
  entryOf,
  greeting,
  putEntry,
  touchInvite,
  type Entry,
  type Invite,
} from '../data/advisorDirectory'
import {
  downloadCsv,
  endpoint,
  ledger,
  noteSitting,
  pushSitting,
  pushTestRow,
  pushUnsent,
  setEndpoint,
  testUrl,
  type Sitting,
} from '../data/advisorRecord'
import './client-experience.css'
/* The adventures' open fields — the identity form and the free-text boxes
   wear them too. */
import './joyFlow.css'
import AdvisorWelcome from './AdvisorWelcome'
import './advisor-flow.css'

const ZOOM_STEP = 0.1
const OTHER = 'Other'

/* What this screen is being used for. `demo` is the flow as it has always been,
   opened from the menu and handed round a room. `invited` is one advisor's own
   link: their own sheet, their name on the first screen, and none of the
   operator's scaffolding. `view` is somebody else's finished sitting, read out
   of the directory — the Business ID and the playbooks behind it, and nothing
   that could write to their answers. */
export type SelfMode = 'demo' | 'invited' | 'view'

/* The walkthrough opens on Welcome and goes straight to the adventures list.
   Answering it yourself needs one screen in between: who the Business ID is
   headed with. It is inserted here rather than in the flow data, because the
   walkthrough is somebody whose name the demo already knows. */
const IDENTITY_HEAD =
  'This heads your Business ID. Check it and change anything that’s off — every field can be edited, and a blank one simply drops out.'

/* Where the answers actually go, said on the screen that collects the name.
   This used to read "Nothing is sent anywhere — the answers stay in this
   browser", which stopped being true the moment a sitting started reaching the
   shared directory. Telling somebody their answers are private while posting
   them is the one line on this page that is not allowed to be out of date. */
const IDENTITY_WHERE: Record<SelfMode, string> = {
  demo: 'Kept on this device and listed in the advisor directory — except the answers marked private, unless you choose to share them.',
  invited:
    'The firm that invited you sees your answers — except the ones marked private, which stay with you unless you choose to share them.',
  view: 'These are their answers, read from the directory.',
}

const IDENTITY: Step = {
  id: 'you',
  kind: 'identity',
  title: 'A little about you',
  body: `${IDENTITY_HEAD}

${IDENTITY_WHERE.demo}`,
  cta: 'Continue',
}

/* An invited advisor is greeted by name on the first screen — the link was made
   for them, and a page that opens "Welcome" to somebody who was sent it reads
   like a page that does not know who asked. Everywhere else the flow opens as
   it always has. */
function stepsFor(hello: string | null, mode: SelfMode): Step[] {
  const welcome = hello ? { ...flowSteps[0], title: hello } : flowSteps[0]
  const identity: Step = { ...IDENTITY, body: `${IDENTITY_HEAD}

${IDENTITY_WHERE[mode]}` }
  return [welcome, identity, ...flowSteps.slice(1)]
}

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
  share: (stepId: string, on: boolean) => void
  /** A whole adventure's answers at once, from a flow that keeps its own. */
  apply: (fn: (a: Answers) => Answers) => void
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
      share: (stepId, on) => set((a) => ({ ...a, shared: { ...a.shared, [stepId]: on } })),
      apply: (fn) => set(fn),
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
          className="jf-other af-other"
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

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="7" width="10" height="7" rx="1.6" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" strokeLinecap="round" />
    </svg>
  )
}

/** Said on the question itself, before anything is typed: this answer stays
    with you. Sharing is one switch per answer, and off unless you turn it on —
    an advisor weighing two or three firms may well want to keep it back. */
function PrivateNote({
  step,
  a,
  edit,
  stacked = false,
}: {
  step: Step
  a: Answers
  edit: Edit
  /** The journey page's version: the state as a bold word in the lock's
      colour, and what it means on a line of its own under it. */
  stacked?: boolean
}) {
  if (!step.private) return null
  const on = isShared(step.id, a)
  return (
    <div className={`af-private${on ? ' is-shared' : ''}${stacked ? ' is-stacked' : ''}`}>
      <LockIcon />
      {stacked ? (
        <span className="af-private-text">
          <b className="af-private-k">{on ? 'Shared' : 'Private'}</b>
          <span>
            {on
              ? 'The firm will see this answer.'
              : 'Only you see this answer, unless you choose to share it.'}
          </span>
        </span>
      ) : (
        <span className="af-private-text">
          {on
            ? 'You’re sharing this answer with the firm.'
            : 'Private. Only you see this answer, unless you choose to share it.'}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className="af-switch"
        onClick={() => edit.share(step.id, !on)}
      >
        <span>Share</span>
        <i aria-hidden />
      </button>
    </div>
  )
}

/* Speaking a long answer is easier than typing it on a phone. The browser's own
   speech recognition, where it has one (Chrome, Safari, Edge); where it does
   not, the button is simply not there and the keyboard's dictation still is. */
interface Recognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

function speechCtor(): (new () => Recognition) | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

function useDictation(onFinal: (text: string) => void) {
  const Ctor = speechCtor()
  const [on, setOn] = useState(false)
  const rec = useRef<Recognition | null>(null)
  const cb = useRef(onFinal)
  cb.current = onFinal
  useEffect(() => () => rec.current?.stop(), [])
  const toggle = () => {
    if (!Ctor) return
    if (on) {
      rec.current?.stop()
      return
    }
    const r = new Ctor()
    r.continuous = true
    r.interimResults = false
    r.lang = navigator.language || 'en-US'
    r.onresult = (e) => {
      for (let n = e.resultIndex; n < e.results.length; n++) {
        const res = e.results[n]
        if (res.isFinal) cb.current(res[0].transcript.trim())
      }
    }
    r.onend = () => setOn(false)
    r.onerror = () => setOn(false)
    rec.current = r
    try {
      r.start()
      setOn(true)
    } catch {
      setOn(false)
    }
  }
  return { supported: !!Ctor, on, toggle }
}

function MicIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="5.5" y="1.8" width="5" height="8" rx="2.5" />
      <path d="M3.2 7.6a4.8 4.8 0 009.6 0M8 12.4v2" strokeLinecap="round" />
    </svg>
  )
}

/** The microphone under a free-text box: what is said is added to what is
    there. Nothing at all where the browser cannot listen. */
function MicButton({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const latest = useRef(value)
  latest.current = value
  const mic = useDictation((heard) => {
    if (!heard) return
    const had = latest.current.trim()
    const next = had ? `${had} ${heard}` : heard.charAt(0).toUpperCase() + heard.slice(1)
    latest.current = next
    onChange(next)
  })
  if (!mic.supported) return null
  return (
    <button
      type="button"
      className={`af-mic${mic.on ? ' is-on' : ''}`}
      aria-pressed={mic.on}
      onClick={mic.toggle}
    >
      {mic.on ? <i className="af-mic-dot" aria-hidden /> : <MicIcon />}
      {mic.on ? 'Listening… tap to stop' : 'Say your answer'}
    </button>
  )
}

/** Free text. The prompts under the box are the spec's, and tapping one drops
    it into the box as an opening — which is what a prompt is for. */
function TextQuestion({ step, a, edit }: { step: Step; a: Answers; edit: Edit }) {
  const value = a.text[step.id] ?? ''
  const box = useRef<HTMLTextAreaElement>(null)
  const canListen = !!speechCtor()
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
        className="jf-note af-textarea"
        value={value}
        placeholder={canListen ? 'Type your answer, or tap the mic and say it' : 'Type your answer'}
        onChange={(e) => edit.text(step.id, e.target.value)}
      />
      <MicButton value={value} onChange={(v) => edit.text(step.id, v)} />
      {step.hints && (
        <div className="af-hints">
          <div className="af-hints-title">Tap a prompt to start your answer</div>
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
  const fields: [keyof Answers['identity'], string, string, string?][] = [
    ['name', 'Your name', 'Alex Rivera'],
    ['role', 'Your role', 'Lead advisor · team of four', 'Your title, and the size of your team'],
    ['book', 'Assets you advise on', '$840M', 'A rough figure is fine'],
    ['firm', 'Where you are today', 'Wirehouse', 'The kind of firm, or its name'],
  ]
  return (
    <div className="af-welcome">
      <h2 className="af-h1">{step.title}</h2>
      <Paras text={step.body} />
      {/* The adventures' own open field — label, italic hint, input — so the
          first thing an advisor types into looks like everything after it. */}
      <div className="af-idform">
        {fields.map(([key, label, placeholder, hint]) => (
          <div className="af-idfield" key={key}>
            <label className="jf-other-label" htmlFor={`af-id-${key}`}>
              {label}
            </label>
            {hint && <span className="jf-other-hint">{hint}</span>}
            <input
              id={`af-id-${key}`}
              className="jf-other"
              value={a.identity[key]}
              placeholder={placeholder}
              onChange={(e) => edit.identity({ [key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** The last screen: the three questions, the two ways on to the artefacts, and
    what happened to the answers. It is a component rather than a branch of the
    switch below because it holds one piece of state — whether this sitting has
    been handed to the spreadsheet yet. */
function EndQuestions({
  d,
  a,
  onHome,
  onReport,
  onSend,
  onRecord,
}: {
  d: Derived
  a: Answers
  onHome: () => void
  onReport: () => void
  onSend: () => void
  onRecord: () => void
}) {
  const [sent, setSent] = useState(false)
  const wired = !!endpoint()
  const kept = privateSteps.filter((s) => isAnswered(s, a) && !isShared(s.id, a)).length
  return (
    <div className="af-unlock">
      <h2 className="af-h1">My Three Questions</h2>
      <p className="af-body">Put these to every firm you’re considering — including this one. They come from your own answers, so what you hear back tells you whether a firm is right for you.</p>
      <ol className="af-qs">
        {d.id.questions.map((q, i) => (
          <li key={q}>
            <span className="af-getnum">{i + 1}</span>
            <span>{q}</span>
          </li>
        ))}
      </ol>
      {/* One thing to do next, and it says what it is. Testers did not realise
          the Business ID was the thing the eight minutes had produced for
          them, so the card names it before the button opens it. */}
      <div className="af-idcard">
        <div className="af-idcard-k">Your Business ID is ready</div>
        <p className="af-idcard-body">
          The one-page summary of everything you told us — what your practice is for, your hopes
          and concerns, and the move you’re weighing. It’s yours to keep.
        </p>
        <button className="cx-start af-wide" type="button" onClick={onHome}>
          View my Business ID
        </button>
      </div>
      {kept > 0 && (
        <p className="af-private-sum">
          <LockIcon />
          {kept === 1
            ? 'You kept 1 answer private. You can share it from its question.'
            : `You kept ${kept} answers private. You can share any of them from its question.`}
        </p>
      )}
      <div className="af-links">
        {/* The read a firm gets handed, minus anything kept private — the
            thing the flow is for, and hiding it from the person who answered
            would be the wrong way round. */}
        <button className="af-link" type="button" onClick={onReport}>
          See what the firm sees
        </button>
        {/* What became of the answers. A post to the spreadsheet comes back
            opaque, so this claims it was sent and never that it arrived. */}
        {wired ? (
          <button
            className="af-link"
            type="button"
            disabled={sent}
            onClick={() => {
              onSend()
              setSent(true)
            }}
          >
            {sent ? 'Sent to the spreadsheet' : 'Send to the spreadsheet'}
          </button>
        ) : (
          <button className="af-link" type="button" onClick={onRecord}>
            Where my answers are kept
          </button>
        )}
      </div>
      <div className="af-stat">If you’d like to talk it through with Dynasty, book a time.</div>
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
  onRecord,
  onSend,
  onAdventure,
  journey = false,
}: {
  /** The journey page: the list counts an adventure taken to its end as
      complete, and a locked row does not open. */
  journey?: boolean
  step: Step
  a: Answers
  edit: Edit
  d: Derived
  onHome: () => void
  onReport: () => void
  onRecord: () => void
  onSend: () => void
  onAdventure: (id: AdventureId) => void
}) {
  switch (step.kind) {
    case 'welcome':
      return <AdvisorWelcome step={step} />

    case 'identity':
      return <IdentityForm step={step} a={a} edit={edit} />

    case 'home':
      return (
        <AdventureList
          rows={journey ? journeyStates(a) : adventureStates(a)}
          done={journey ? journeyProgress(a).done : d.progress.done}
          required={d.progress.required}
          completedOn={a.completed}
          onOpen={onAdventure}
          lockedOpens={!journey}
          doneLast={journey}
        />
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
          <PrivateNote step={step} a={a} edit={edit} stacked={journey} />
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
          <PrivateNote step={step} a={a} edit={edit} stacked={journey} />
          <TextQuestion key={step.id} step={step} a={a} edit={edit} />
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
            You’re taking a meaningful step. Here’s a first look at your Business ID — the summary
            of everything you told us. The full page is under Business ID at the foot of the app.
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
        <EndQuestions d={d} a={a} onHome={onHome} onReport={onReport} onSend={onSend} onRecord={onRecord} />
      )

    default:
      return null
  }
}

/* ── the screen ── */

export default function AdvisorSelfScreen({
  onExit,
  brand,
  mode = 'demo',
  invite = null,
  entry = null,
  phone = false,
  rich = false,
}: {
  /** The adventures on the client's own mechanism — photo picks, the swipe
      deck, the reveal and the reward — wherever one has been built for the
      advisor. The rest stay on the plain screens. */
  rich?: boolean
  onExit: () => void
  brand?: FlowBrand | null
  mode?: SelfMode
  /** Invited mode: the record behind the link, so the flow can say their name
      and the directory can tie what they answer back to the invite. */
  invite?: Invite | null
  /** Viewing mode: somebody else's sitting, already fetched. */
  entry?: Entry | null
  /** Viewing mode: open on their phone rather than on the report. */
  phone?: boolean
}) {
  const viewing = mode === 'view'
  // An invited advisor's sheet is scoped to their token, so a device that has
  // been used to demo the flow does not hand them its leftovers.
  const scope = mode === 'invited' && invite ? invite.token : null
  // The sheet outlives the session: answering eight minutes of questions and
  // losing them to a reload is not a thing to do to anyone. Viewing is the
  // exception — those answers are somebody else's and arrive with the entry.
  const [answers, setAnswers] = useState<Answers>(() => {
    if (viewing && entry) return entry.answers
    const loaded = loadAnswers(scope)
    /* The name the link was made for arrives already in the field. The page has
       just greeted them by it, so asking them to type it is asking them to tell
       us something we have visibly used — and the field is still theirs to
       correct, which is why this only fills a blank one and never overwrites a
       name they have changed. */
    const given = invite?.name.trim() ?? ''
    if (mode === 'invited' && given && !loaded.identity.name.trim()) {
      return { ...loaded, identity: { ...loaded.identity, name: given } }
    }
    return loaded
  })
  /* Somebody else's sitting, opened from the firm's candidate table, lands on
     the report a rep reads — not on their phone. */
  const [view, setView] = useState<'flow' | 'report' | 'record'>(viewing && !phone ? 'report' : 'flow')
  const edit = useEdit(setAnswers)
  /* On the journey page, and reading somebody else's sitting, the person is
     shown by their initials. Only what is drawn changes: the sheet — and what
     reaches the directory — keeps the name they typed. */
  const anon = rich || viewing
  const d = useMemo(() => derive(anon ? anonymized(answers) : answers), [answers, anon])
  /* The sheet as the firm sees it: private answers the advisor has not chosen
     to share are left out of everything that leaves this device, and out of
     the report that shows them what a firm reads. */
  const visible = useMemo(() => redact(answers), [answers])
  const dFirm = useMemo(() => derive(anon ? anonymized(visible) : visible), [visible, anon])
  const steps = useMemo(
    () => stepsFor(mode === 'invited' && invite ? greeting(invite.name) : null, mode),
    [mode, invite],
  )
  useEffect(() => {
    if (!viewing) saveAnswers(answers, scope)
  }, [answers, viewing, scope])

  // Two stores, on purpose. `saveAnswers` holds the sheet you are filling in
  // and a restart wipes it — that is what resets the Business ID. The record
  // is the other one: every sitting this device has seen, written on every
  // answer, and a restart adds to it rather than clearing it. So the answers
  // outlive the ID they built.
  const answered = !d.empty || Object.keys(answers.text).length > 0 ||
    Object.keys(answers.choice).length > 0 || !!answers.identity.name.trim()
  useEffect(() => {
    if (answered && !viewing) noteSitting(visible, answers.sittingId)
  }, [visible, answers.sittingId, answered, viewing])

  /* And the third store: the shared directory, so the person who sent the link
     can see that it was answered. The ledger above is this device's; this one
     is everybody's.

     Written on a timer rather than on every keystroke. Each answer would
     otherwise be its own request, and a free-text screen would post on every
     letter typed — a second of quiet is a fine proxy for "they have stopped
     doing that for now", and the row is a whole sheet each time rather than a
     delta, so a lost write costs nothing but freshness. */
  useEffect(() => {
    if (viewing || !answered) return
    const fallback = invite?.name ?? ''
    const id = window.setTimeout(() => {
      void putEntry(entryOf(answers, invite?.token ?? null, fallback, visible))
      if (invite) void touchInvite(invite.token, true)
    }, 1000)
    return () => window.clearTimeout(id)
  }, [answers, visible, answered, viewing, invite])

  /* An opened link is worth knowing about on its own: it separates "has not
     looked at it yet" from "looked, and did not answer", which are two
     different conversations to have with somebody. */
  useEffect(() => {
    if (mode === 'invited' && invite) void touchInvite(invite.token, false)
  }, [mode, invite])

  const restart = useCallback((next: Answers) => {
    setAnswers(next)
    setView('flow')
  }, [])

  /* Closing a sitting: hand it to the spreadsheet, then start an empty sheet
     under a new id — a new person, a new Business ID. The row it just sent
     stays on the record whether or not the post got anywhere. */
  const close = useCallback(() => {
    if (answered) void pushSitting(noteSitting(visible, answers.sittingId))
    /* A restart under an invite is the same person starting over, not the next
       person in the room — so it keeps the token and the name on the link, and
       lands in the directory as a second sitting rather than overwriting the
       first. Nothing they already answered is lost. */
    restart(emptyAnswers())
  }, [answered, answers.sittingId, visible, restart])

  if (view === 'report')
    return <FlowReport d={viewing ? d : dFirm} rich={rich} mode={mode} brand={brand} onBack={() => setView('flow')} onList={onExit} />
  if (view === 'record') return <RecordScreen onBack={() => setView('flow')} />

  return (
    <FlowPhone
      answers={answers}
      edit={edit}
      d={d}
      steps={steps}
      mode={mode}
      brand={brand}
      rich={rich}
      onExit={onExit}
      onReport={() => setView('report')}
      onRecord={() => setView('record')}
      onSend={() => {
        if (answered) void pushSitting(noteSitting(visible, answers.sittingId))
      }}
      onRestart={close}
      onSample={() => restart(sampleAnswers())}
      onDiscard={() => {
        clearAnswers(scope)
        restart(emptyAnswers())
      }}
    />
  )
}

/* ── the phone ── */

function FlowPhone({
  answers,
  edit,
  d,
  steps,
  mode,
  onReport,
  onRecord,
  onSend,
  brand,
  rich = false,
}: {
  rich?: boolean
  answers: Answers
  edit: Edit
  d: Derived
  /** The flow's screens, welcome title and all — handed down rather than read
      from the module, because an invite's first screen says their name. */
  steps: Step[]
  mode: SelfMode
  brand?: FlowBrand | null
  /* The menu's old ways around the demo — back to it, restart, samples,
     discard — are gone from the phone's menu (the demo menu has them); still
     accepted, no longer read. */
  onExit?: () => void
  onReport: () => void
  onRecord: () => void
  onSend: () => void
  onRestart?: () => void
  onSample?: () => void
  onDiscard?: () => void
}) {
  // Where you have been, not just where you are: tapping a row on the
  // adventures list jumps across the flow, and Back has to mean "the screen I
  // came from" rather than "the step before this one" — otherwise Back out of
  // The Move would land in the middle of Future You.
  const [trail, setTrail] = useState<number[]>([0])
  const i = trail[trail.length - 1]
  const viewing = mode === 'view'
  const [tab, setTab] = useState<'flow' | 'finid' | 'questions'>(viewing ? 'finid' : 'flow')
  const [menuOpen, setMenuOpen] = useState(false)
  const [railOpen, setRailOpen] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)
  /* A tab opens at its top, not wherever the last one was scrolled to. */
  useEffect(() => {
    viewport.current?.scrollTo({ top: 0 })
  }, [tab])
  useDragScroll(viewport)
  useDarkGround()
  const { scale: fitScale, windowH, bare } = useFitToWindow()
  const { zoom, setZoom, reset: resetZoom } = useZoom()
  /* On a handset the frame is a picture of the device already in your hand,
     so it comes off and the screen is the window. */
  const scale = bare ? 1 : fitScale * zoom

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
    /* On the journey page, passing an adventure's closing card is finishing
       it, the client's way — so the next one opens even with a question
       skipped. */
    if (rich && (step.kind === 'unlock' || step.kind === 'stage') && step.adventure) {
      const id = step.adventure
      edit.apply((a) => withFinished(a, id))
    }
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

  /* An adventure running on the client's own mechanism. It keeps its answers
     while it runs and hands them to the sheet when it ends, the way the
     client's do — so it takes over the screen, bar to foot. */
  const [richOpen, setRichOpen] = useState<AdventureId | null>(null)
  const RICH: AdventureId[] = rich ? ['practice-joy', 'confidence', 'outlook'] : []

  // Tapping a row on the adventures list drops you at that adventure's intro.
  const openAdventure = (id: AdventureId) => {
    if (RICH.includes(id)) {
      setTab('flow')
      setRichOpen(id)
      toTop()
      return
    }
    const at = steps.findIndex((s) => s.adventure === id)
    if (at >= 0) go(at)
  }
  /* The reward counts the way the list does on this page: an adventure is
     complete once it has been taken to its end, so finishing one for the
     first time always moves the bar on — as it does on the client's phone. */
  const jp = journeyProgress(answers)
  const rewardFor = (id: AdventureId, next: string) => ({
    before: jp.done,
    after: journeyDone(id, answers) ? jp.done : jp.done + 1,
    total: jp.required,
    next,
  })
  const finish = (id: AdventureId, write: (a: Answers) => Answers) => {
    edit.apply((a) => withFinished(write(a), id))
    setRichOpen(null)
    closeToList()
  }
  /* The concerns screen answers both private concern questions at once, so
     its one switch shares — or keeps back — both. */
  const concernStep = steps.find((s) => s.id === 'ol-q1')
  const shareConcerns: Edit = {
    ...edit,
    share: (_id, on) => {
      edit.share('ol-q1', on)
      edit.share('ol-q2', on)
    },
  }

  // Closing an adventure returns to the list and ends the trail there.
  const HOME_AT = steps.findIndex((s) => s.kind === 'home')
  const closeToList = () => {
    setTab('flow')
    reset(HOME_AT)
  }

  /* The meter under the bar. On the journey page it counts only the screens
     of the adventure you are in, as the client's do; the plain flow keeps its
     count of the whole flow. */
  /* Nothing to show on the Business ID yet. On the journey page that is
     "no adventure taken to its end" — the rule its list uses. */
  const idEmpty = rich ? journeyProgress(answers).done === 0 : d.empty
  const meterSteps = rich && step.adventure ? steps.filter((s) => s.adventure === step.adventure) : steps
  const meterAt = rich && step.adventure ? meterSteps.findIndex((s) => s.id === step.id) : i
  // Inside an adventure the app bar carries its name and a way out, in place
  // of the wordmark and the burger.
  const adventure = richOpen
    ? advisorAdventures.find((a) => a.id === richOpen)
    : step.adventure
      ? advisorAdventures.find((a) => a.id === step.adventure)
      : undefined

  return (
    <div
      className={`cx-page${bare ? ' is-bare' : ''}${rich ? ' is-journey' : ''}`}
      style={windowH ? { minHeight: windowH } : undefined}
    >
      <div
        className="cx-fit"
        style={bare ? undefined : { height: DEVICE_H * scale, width: DEVICE_W * scale }}
      >
        <IPhone scale={scale} bare={bare}>
          {/* Under a firm's brand only the bar changes — its colour and its
              logo — the way the client's phone does it. */}
          <header className="cx-appbar" style={brand ? { background: brand.primary } : undefined}>
            {adventure && tab === 'flow' ? (
              <>
                <div className="af-appbar-title">{adventure.title}</div>
                <button
                  className="cx-appbar-burger"
                  type="button"
                  aria-label="Close this adventure and go back to My Adventures"
                  onClick={() => {
                    setRichOpen(null)
                    closeToList()
                  }}
                >
                  <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M5.5 5.5l11 11M16.5 5.5l-11 11" strokeLinecap="round" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <AppbarBrand brand={brand} />
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

          {/* Where you are in the flow, at the top under the bar. Nothing to
              measure yet before the first question, so no strip until then. */}
          {inFlow && !richOpen && step.kind !== 'welcome' && step.kind !== 'identity' && (
            <div className="af-top">
              <div className="af-progress" aria-hidden>
                {meterSteps.map((s, n) => (
                  <i key={s.id} className={n <= meterAt ? 'is-on' : ''} />
                ))}
              </div>
            </div>
          )}
          <div
            className={`cx-viewport${tab === 'finid' && railOpen ? ' is-menu-open' : ''}`}
            ref={viewport}
          >
            {richOpen === 'outlook' ? (
              <OutlookFlow
                content={ADVISOR_OUTLOOK}
                reward={rewardFor('outlook', 'Future You')}
                askSlot={(kind, text, setText) => ({
                  above:
                    kind === 'concern' && concernStep ? (
                      <PrivateNote step={concernStep} a={answers} edit={shareConcerns} stacked />
                    ) : null,
                  below: <MicButton value={text} onChange={setText} />,
                })}
                onComplete={(o) => finish('outlook', (a) => sheetWithOutlook(a, o))}
              />
            ) : richOpen === 'confidence' ? (
              <ConfidenceFlow
                content={ADVISOR_CONFIDENCE}
                reward={rewardFor('confidence', 'Outlook')}
                onComplete={(c) => finish('confidence', (a) => sheetWithConfidence(a, c))}
              />
            ) : richOpen === 'practice-joy' ? (
              <JoyFlow
                content={ADVISOR_JOY}
                reward={rewardFor('practice-joy', 'Confidence')}
                reflectSlot={(s, value, set) => {
                  const flowStep = steps.find((x) => x.id === s.id)
                  return {
                    above: flowStep ? <PrivateNote step={flowStep} a={answers} edit={edit} stacked /> : null,
                    below: <MicButton value={value} onChange={set} />,
                  }
                }}
                onComplete={(j) => finish('practice-joy', (a) => sheetWithJoy(a, j))}
              />
            ) : tab === 'questions' ? (
              /* The three questions are rules over the answers, like the
                 Business ID — so before anything is answered there is nothing
                 to ask, and saying so is better than printing three questions
                 nobody earned. */
              idEmpty ? (
                <div className="af-blank">
                  <h2 className="af-h1">My Three Questions</h2>
                  <p className="af-body">
                    {viewing
                      ? 'Not enough answered yet for these to take shape. They come out of the adventures, and there are still some to finish.'
                      : 'These come out of what you answer — the three worth putting to any platform you are considering. Finish an adventure and they start taking shape.'}
                  </p>
                  {!viewing && (
                    <button
                      className="cx-start af-wide"
                      type="button"
                      onClick={() => setTab('flow')}
                    >
                      Go to My Adventures
                    </button>
                  )}
                </div>
              ) : (
                <div className="af-unlock">
                  {/* His page, in the words he reads it in — the directory shows
                      what he saw, so this speaks to him whoever is holding the
                      phone. */}
                  <h2 className="af-h1">My Three Questions</h2>
                  <p className="af-body">Put these to every platform you’re considering — including this one. They come out of your own answers, so what you hear back tells you whether a platform is the right one, and holds it to what it promises.</p>
                  <ol className="af-qs">
                    {d.id.questions.map((q, n) => (
                      <li key={q}>
                        <span className="af-getnum">{n + 1}</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )
            ) : tab === 'finid' ? (
              idEmpty ? (
                /* Nothing answered yet. An empty page of empty cards would read
                   as a broken Business ID rather than an unearned one.

                   Reading somebody else's, the same emptiness is a fact about
                   them rather than a nudge: it is their adventures that are
                   unfinished, and there is nothing the person looking can do
                   about it from here — so no button, and their name on it so it
                   is clear whose page is empty. */
                <div className="af-blank">
                  <h2 className="af-h1">
                    {viewing ? `${d.who.name}’s Business ID` : 'Your Business ID'}
                  </h2>
                  <p className="af-body">
                    {viewing
                      ? 'Not enough answered yet for this to say anything. It is built out of their answers and fills in as they finish each adventure — their progress is on the directory.'
                      : 'This page is built out of your answers. Finish an adventure and it starts filling in — the first one takes about two minutes.'}
                  </p>
                  {!viewing && (
                    <button
                      className="cx-start af-wide"
                      type="button"
                      onClick={() => setTab('flow')}
                    >
                      Go to My Adventures
                    </button>
                  )}
                </div>
              ) : (
                /* The Business ID he reads is the Business ID the firm
                   reads — one page, his answers, the same cards. It used to be a
                   second, flatter rendering of the same data that lived only
                   here, so the two drifted every time one of them was touched. */
                <AdvisorProfileScreen
                  mine
                  noBadges={rich}
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
                onRecord={onRecord}
                onSend={onSend}
                onAdventure={openAdventure}
                journey={rich}
              />
            )}
          </div>

          {/* Inside an adventure the phone's bottom bar IS Back and OK — they
              take the tab bar's place rather than stacking above it, so they
              are always on screen however long the question runs. The tab bar
              comes back on the two destinations: the adventures list and the
              Business ID. */}
          {richOpen ? null : inFlow ? (
            <div className="af-foot">
              <div className="af-nav">
                {/* Two controls, never three: Back is a small arrow, and the
                    one wide button is Skip until the question has an answer,
                    then OK. Three buttons in a row read as three choices. */}
                {trail.length > 1 && (
                  <button className="af-back" type="button" aria-label="Back" onClick={back}>
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                {!last &&
                  (asks && !answered ? (
                    <button className="af-next af-next-skip" type="button" onClick={() => go(i + 1)}>
                      Skip this question
                    </button>
                  ) : (
                    <button className="cx-start af-next" type="button" onClick={() => go(i + 1)}>
                      {cta}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
          <nav className="cx-tabbar">
            <TabEdge />
            {/* Business ID · the mark · Questions. The mark is the way back to
                the adventures rather than an ornament in the middle of two
                tabs — it is the one control on this bar that goes to them,
                which is why it is the one wearing the brand. */}
            <button
              type="button"
              className={`cx-tab ${tab === 'finid' ? 'is-on' : ''}`}
              onClick={() => setTab('finid')}
            >
              <TabFinId />
              <span className="cx-tab-lbl">Business ID</span>
            </button>
            <button
              type="button"
              className={`cx-tab cx-tab-center ${tab === 'flow' ? 'is-on' : ''}`}
              aria-label="Adventures"
              onClick={closeToList}
            >
              <TabMark />
            </button>
            {/* The other half of what the eight minutes produce. The Business
                ID is what a platform reads about you; these are what you put to
                it — so they belong on the bar beside it rather than only at the
                end of the flow, where you would have to walk it again to find
                them. */}
            <button
              type="button"
              className={`cx-tab ${tab === 'questions' ? 'is-on' : ''}`}
              onClick={() => setTab('questions')}
            >
              <TabQuestions />
              <span className="cx-tab-lbl">{viewing ? 'Questions' : 'My Questions'}</span>
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
                    <i>
                      {d.id.header.meta ||
                        (viewing
                          ? 'Their answers, from the directory'
                          : 'Your answers, on this device')}
                    </i>
                  </span>
                  <SheetCredit />
                </div>
                {/* The product's own account menu, as mocks, on every phone:
                    each answers the tap and goes nowhere. The demo's own ways
                    around — restart, samples, the report — live in the demo
                    menu, not in somebody's app. */}
                <button className="cx-sheet-item" type="button" onClick={() => setMenuOpen(false)}>
                  Account Settings
                  <ArrowRight />
                </button>
                <button className="cx-sheet-item" type="button" onClick={() => setMenuOpen(false)}>
                  Sign Out
                  <ArrowRight />
                </button>
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

function FlowReport({
  d,
  rich = false,
  onBack,
  mode,
  onList,
  brand,
}: {
  d: Derived
  /** The journey page: no badges. */
  rich?: boolean
  onBack: () => void
  mode: SelfMode
  /** The firm's colours and logo, for the product bar. */
  brand?: FlowBrand | null
  /** Reading somebody else's: the way back to the directory they came from. */
  onList?: () => void
}) {
  useEffect(() => {
    window.scrollTo(0, 0)
    try {
      if (window.parent && window.parent !== window) window.parent.scrollTo(0, 0)
    } catch {
      /* cross-origin parent — ignore */
    }
  }, [])
  const viewing = mode === 'view'
  return (
    <div
      className={`page af-report${viewing ? ' af-report-viewed' : ''}${brand ? ' brand-client' : ''}`}
      /* The same white label the shell's pages wear: the bar's colour and the
         firm's logo in it. */
      style={
        brand
          ? ({ '--plum': brand.primary, '--purple-bolt': brand.accent } as React.CSSProperties)
          : undefined
      }
    >
      {/* Reading somebody else's answers is a desktop page in the firm's own
          product, so it wears the product's own bar — brand and account menu,
          the same one the directory it was opened from has. The way back is the
          profile's breadcrumb, which names where it goes.

          Your own report is not in that product: it is the other side of the
          flow you are holding, and its bar is the way back to it. */}
      {viewing ? (
        <TopBar sub="ADVISOR RECRUIT" logo={brand ? brand.logo : undefined} cobrand="left" />
      ) : (
        <header className="af-report-bar">
          <button className="af-report-back" type="button" onClick={onBack}>
            ‹ Back to the flow
          </button>
          <span className="af-report-note">
            What the firm reads from your answers. Private answers you haven’t shared are left out.
          </span>
        </header>
      )}
      <main className="content content-profile">
        <AdvisorProfileScreen
          mine={!viewing}
          tabs
          noBadges={rich}
          data={d}
          /* The crumb goes where it says it goes: to the list this person was
             opened from, not back one step to their phone. */
          backLabel={viewing ? 'My Candidates' : undefined}
          onBack={viewing ? (onList ?? onBack) : onBack}
        />
      </main>
    </div>
  )
}

/* ── the record ──────────────────────────────────────────────────────────
   Where the answers went, and the one thing an operator has to set up for them
   to reach Drive. It is a plain page rather than another phone screen: this is
   back-of-house, and the person reading it is running the demo rather than
   taking it. */

/* The sheet the rows land on. Not a secret — it is a Drive file id, and the
   file itself is protected by Drive's own permissions — and having it here
   saves the operator hunting through Drive for it. */
const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1BS4zugcZQQceTAUfBjrVfx6BzweonWHwXppIgNIHBmk/edit'

function RecordScreen({ onBack }: { onBack: () => void }) {
  const [url, setUrl] = useState(endpoint())
  const [rows, setRows] = useState<Sitting[]>(ledger)
  const [note, setNote] = useState('')
  const waiting = rows.filter((r) => !r.sentAt).length

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const save = () => {
    setEndpoint(url)
    setNote(url ? 'Saved. New sittings will be posted to it.' : 'Cleared. Nothing will be posted.')
  }

  const send = async () => {
    setNote('Sending…')
    const n = await pushUnsent()
    setRows(ledger())
    setNote(
      n === 0
        ? 'Nothing was sent — check the web-app URL above.'
        : `${n} sitting${n === 1 ? '' : 's'} posted. Check the spreadsheet: a post from a page like this one comes back blank, so this cannot confirm they landed.`,
    )
  }

  return (
    <div className="page af-report">
      <header className="af-report-bar">
        <button className="af-report-back" type="button" onClick={onBack}>
          ‹ Back to the flow
        </button>
        <span className="af-report-note">
          Where the answers are kept — {rows.length} sitting{rows.length === 1 ? '' : 's'} on this
          device{waiting ? `, ${waiting} not yet posted` : ''}
        </span>
      </header>
      <main className="content content-profile">
        <div className="af-record">
          <h1 className="af-record-h1">Recorded answers</h1>
          <p className="af-record-body">
            Every sitting is written here as it is answered, and stays here when the flow is
            restarted — restarting resets the Business ID, not the record. Each one is posted to a
            Google Sheet in Drive as a row on its own tab, named after the person who answered.
          </p>

          <section className="af-record-card">
            <h2 className="af-record-h2">The spreadsheet</h2>
            <p className="af-record-body">
              The rows land in{' '}
              <a className="af-record-link" href={SHEET_URL} target="_blank" rel="noreferrer">
                Knomee — Advisor Flow Answers
              </a>
              , one tab per person. This page has no server of its own, so it hands each row to an
              Apps Script web app bound to that sheet: deploy the script in{' '}
              <code>docs/answers-sheet.md</code>, then paste its <code>/exec</code> URL here. Until
              then the answers still collect on this device and can be downloaded.
            </p>
            <label className="af-label">
              Apps Script web app URL
              <input
                className="af-field"
                value={url}
                placeholder="https://script.google.com/macros/s/…/exec"
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
            <div className="af-record-actions">
              <button className="cx-start" type="button" onClick={save}>
                Save the URL
              </button>
              <button className="af-secondary af-record-btn" type="button" onClick={() => void send()}>
                Post {waiting || 'the'} unsent {waiting === 1 ? 'sitting' : 'sittings'}
              </button>
              <button
                className="af-secondary af-record-btn"
                type="button"
                onClick={() => downloadCsv(rows)}
                disabled={!rows.length}
              >
                Download CSV
              </button>
            </div>
            {note && <p className="af-record-note">{note}</p>}
          </section>

          {/* Before the flow is worth answering twice: prove the wire. Three
              tests, cheapest first, and the middle one is the only one that
              can answer for itself. */}
          <section className="af-record-card">
            <h2 className="af-record-h2">Test it before you answer anything</h2>
            <ol className="af-record-steps">
              <li>
                <b>Without deploying anything.</b> In the Apps Script editor, pick{' '}
                <code>testRow</code> and press Run. A <code>_test</code> tab appears in the
                spreadsheet with one row. Run it twice — the second run updates that row instead of
                adding another, which is the behaviour real sittings rely on.
              </li>
              <li>
                <b>Once it is deployed.</b> Open{' '}
                {url ? (
                  <a
                    className="af-record-link"
                    href={testUrl(true)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    the endpoint with <code>?test=1</code>
                  </a>
                ) : (
                  <code>your /exec URL + ?test=1</code>
                )}{' '}
                in a browser tab. The script answers with JSON listing the tabs and writes another
                test row. This is the only test that tells you it worked rather than asking you to
                go and look — save the URL above first.
              </li>
              <li>
                <b>From this page, on the real code path.</b> The button below posts exactly what a
                finished sitting posts, to the <code>_test</code> tab. A post from a page like this
                one comes back blank, so check the spreadsheet.
              </li>
            </ol>
            <div className="af-record-actions">
              <button
                className="cx-start"
                type="button"
                disabled={!url}
                onClick={() => {
                  setNote('Posting a test row…')
                  void pushTestRow().then((ok) =>
                    setNote(
                      ok
                        ? 'Test row posted. Look for a _test tab in the spreadsheet — if it is not there, the deployment is not set to “Anyone”.'
                        : 'Nothing was sent. Save a web-app URL above first.',
                    ),
                  )
                }}
              >
                Post a test row
              </button>
              {url && (
                <a
                  className="af-secondary af-record-btn af-record-anchor"
                  href={testUrl(false)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open the endpoint
                </a>
              )}
            </div>
            <p className="af-record-body">
              Delete the <code>_test</code> tab whenever you like — nothing reads it.
            </p>
          </section>

          <section className="af-record-card">
            <h2 className="af-record-h2">Sittings</h2>
            {rows.length === 0 ? (
              <p className="af-record-body">Nothing answered on this device yet.</p>
            ) : (
              <table className="af-record-table">
                <thead>
                  <tr>
                    <th>Tab</th>
                    <th>Answered</th>
                    <th>Questions</th>
                    <th>The change they named</th>
                    <th>Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map((r) => (
                    <tr key={r.id}>
                      <td>{r.tab}</td>
                      <td>{new Date(r.at).toLocaleString()}</td>
                      <td>
                        {r.answered ?? 0} of {r.total ?? 0}
                      </td>
                      {/* Their own answer rather than a score — the sheet no
                          longer holds a score, and this table reads the sheet. */}
                      <td>{r.values[Object.keys(r.values).find((k) => k.startsWith('mv-q1 ')) ?? ''] || '—'}</td>
                      <td className={r.sentAt ? 'af-record-sent' : 'af-record-waiting'}>
                        {r.sentAt ? new Date(r.sentAt).toLocaleString() : 'not yet'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
