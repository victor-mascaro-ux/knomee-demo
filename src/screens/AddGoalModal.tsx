/* Adding a goal, in two steps.
 *
 * The plus on the Goals card has been drawn since the card was, and it went
 * nowhere. This is where it goes.
 *
 * First the goal itself: three the journey already suggests — the adventures
 * they have taken are what those are drawn from — or their own words. Then the
 * detail, which is the same set of questions the goal panel reads back:
 * timeline, what is good about it, what is not, and why they want it. Nothing
 * here asks for a readiness. A goal somebody has just named is at the start of
 * it by definition, and the stage is the app's reading rather than theirs.
 *
 * The shell is the app's own modal, so it opens, closes and sits on the page
 * exactly as Invite, Convert and the goal panel do.
 */

import { useEffect, useState } from 'react'
import './addGoalModal.css'
import type { Goal } from '../data/financialId'
import { DEMO_TODAY } from '../data/financialId'
import { CloseIcon } from '../components/icons'
import { AddButton } from './profileParts'

/* The horizons the profiles already speak in. Kept in one list so a goal added
   here reads like the ones that came out of the app. */
const TIMELINES = [
  '<6 months',
  '6–12 months',
  '1–3 years',
  '3–5 years',
  '5–10 years',
  '10+ years',
  'Ongoing',
]

const Sparkle = () => (
  <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden>
    <path
      d="M10 2.6l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5 1.5-4Z"
      fill="currentColor"
      opacity=".9"
    />
    <path d="M15.6 12.6l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" fill="currentColor" />
  </svg>
)

const ArrowGo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="11" fill="currentColor" />
    <path
      d="M8 12h7.4m-2.6-3l3 3-3 3"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const PencilTip = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden>
    <path
      d="M13.6 3.3a1.7 1.7 0 0 1 2.4 2.4l-8 8-3.2.8.8-3.2 8-8Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

/* A pro or a con: a line they are typing, or one they have typed. The list is
   the thing, so an empty last line is simply not saved. */
function PointList({
  label,
  hint,
  items,
  onChange,
}: {
  label: string
  hint: string
  items: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div className="ag-points">
      <div className="ag-points-head">
        <span className="ag-label">{label}</span>
        {/* The card's own plus — the one that opened this panel — rather than a
            second drawing of the same idea. */}
        <AddButton
          label={`Add a ${label.slice(0, -1).toLowerCase()}`}
          onClick={() => onChange([...items, ''])}
        />
      </div>
      {items.length === 0 ? (
        /* The line that says what goes here is also the way to start one: it
           is the only thing under the heading, and it reads as the place to
           write. */
        <button className="ag-hint" type="button" onClick={() => onChange([...items, ''])}>
          {hint}
        </button>
      ) : (
        items.map((v, i) => (
          <div className="ag-point" key={i}>
            <input
              className="ag-input"
              value={v}
              autoFocus={i === items.length - 1 && v === ''}
              placeholder={hint}
              onChange={(e) => onChange(items.map((o, j) => (j === i ? e.target.value : o)))}
            />
            <button
              className="ag-drop"
              type="button"
              aria-label={`Remove “${v || hint}”`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden>
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))
      )}
    </div>
  )
}

export default function AddGoalModal({
  suggestions = [],
  goal,
  onClose,
  onAdd,
}: {
  /** What the journey so far suggests they might name. */
  suggestions?: string[]
  /** A goal already on the page, opened to be changed. The panel is the same
      one, minus the step that asks which goal this is — they are looking at
      it — and every answer arrives filled in. */
  goal?: Goal
  onClose: () => void
  onAdd: (goal: Goal) => void
}) {
  /* Null until a goal has been named: the first step is choosing one, the
     second is saying what it is. An edit starts at the second. */
  const [title, setTitle] = useState<string | null>(goal?.title ?? null)
  const [own, setOwn] = useState('')
  const [timeline, setTimeline] = useState(goal?.timeline ?? TIMELINES[0])
  const [pros, setPros] = useState<string[]>(goal?.pros ?? [])
  const [cons, setCons] = useState<string[]>(goal?.cons ?? [])
  const [note, setNote] = useState(goal?.note ?? '')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = () => {
    const name = (title ?? '').trim()
    if (!name) return
    const keep = (xs: string[]) => {
      const kept = xs.map((x) => x.trim()).filter(Boolean)
      return kept.length ? kept : undefined
    }
    onAdd({
      /* Everything the goal already carries — its stage, whether it is done,
         the rows only some goals have — and then what this panel asks. */
      ...goal,
      title: name,
      /* No rung until they take one: the panel that opens on a new goal asks
         for it, and a stage nobody chose is not a reading. */
      readiness: goal?.readiness ?? 0,
      updated: DEMO_TODAY,
      timeline,
      pros: keep(pros),
      cons: keep(cons),
      note: note.trim() || undefined,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal ag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{goal ? 'Edit Goal' : 'Add a Goal'}</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {title === null ? (
          <div className="modal-body ag-body">
            <h3 className="ag-step-title">Select a goal</h3>
            <p className="ag-step-note">
              Based on your Knomee self-discovery journey so far, here are suggested goals:
            </p>
            <ul className="ag-suggestions">
              {suggestions.map((s) => (
                <li key={s}>
                  <button className="ag-suggestion" type="button" onClick={() => setTitle(s)}>
                    <span className="ag-spark" aria-hidden>
                      <Sparkle />
                    </span>
                    <span className="ag-suggestion-text">{s}</span>
                    <span className="ag-go" aria-hidden>
                      <ArrowGo />
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <h3 className="ag-step-title ag-own-title">Write your own goal</h3>
            <div className="ag-own">
              <input
                className="ag-input"
                value={own}
                placeholder="Add your own goal"
                onChange={(e) => setOwn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && own.trim()) setTitle(own.trim())
                }}
              />
              <button
                className="ag-go ag-go-btn"
                type="button"
                aria-label="Use this goal"
                disabled={!own.trim()}
                onClick={() => setTitle(own.trim())}
              >
                <ArrowGo />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="modal-body ag-body">
              <h3 className="ag-goal-name">{title}</h3>
              <p className="ag-step-note">Adjust goal details.</p>

              <span className="ag-label">My goal</span>
              <div className="ag-field">
                <input
                  className="ag-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <span className="ag-pencil" aria-hidden>
                  <PencilTip />
                </span>
              </div>

              <span className="ag-label">Timeline</span>
              <select
                className="ag-input ag-select"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              >
                {TIMELINES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>

              <div className="ag-cols">
                <PointList
                  label="Pros"
                  hint="Add a pro to your goal."
                  items={pros}
                  onChange={setPros}
                />
                <PointList
                  label="Cons"
                  hint="Add a con to your goal."
                  items={cons}
                  onChange={setCons}
                />
              </div>

              <span className="ag-label">I want to do this because…</span>
              <div className="ag-field">
                <input
                  className="ag-input"
                  value={note}
                  placeholder="Write your primary motivation."
                  onChange={(e) => setNote(e.target.value)}
                />
                <span className="ag-pencil" aria-hidden>
                  <PencilTip />
                </span>
              </div>
            </div>
            <div className="modal-footer ag-foot">
              <button className="btn btn-outline" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={save}>
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
