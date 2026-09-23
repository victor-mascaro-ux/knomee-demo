/* A goal, opened.
 *
 * Every goal row on every profile has had a chevron on it since the first one
 * was drawn, and none of them went anywhere. This is where they go: what the
 * person said about that goal — when they last touched it, the horizon they
 * gave it, what they like and what they do not, the sentence they wrote — and
 * the two things an advisor can do about it from here.
 *
 * The modal is the app's own (.modal-backdrop / .modal / .modal-header), so it
 * opens, closes and sits on the page exactly as Invite and Convert do. It takes
 * the goal and hands back what changed; whoever owns the list decides what that
 * means. A page that does not own the list — the family's, where two people's
 * goals are being read side by side — passes no handlers and gets a panel you
 * can only read.
 */

import { useEffect, useState } from 'react'
import './goalModal.css'
import type { Goal } from '../data/financialId'
import { ReadinessLevel, TTM_STAGES } from './profileParts'
import { CloseIcon } from '../components/icons'

export default function GoalModal({
  goal,
  onClose,
  onRename,
  onToggleComplete,
  onDelete,
}: {
  goal: Goal & { tags?: string[] }
  onClose: () => void
  /** Renaming, marking done and deleting are the owner's to offer. */
  onRename?: (title: string) => void
  onToggleComplete?: () => void
  onDelete?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(goal.title)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = () => {
    const next = title.trim()
    setEditing(false)
    if (next && next !== goal.title) onRename?.(next)
    else setTitle(goal.title)
  }

  const stage = TTM_STAGES[goal.readiness - 1]

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal goal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Goals</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body goal-body">
          <div className="goal-head">
            {editing ? (
              <input
                className="goal-title-input"
                value={title}
                autoFocus
                onChange={(e) => setTitle(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save()
                  if (e.key === 'Escape') {
                    setTitle(goal.title)
                    setEditing(false)
                  }
                }}
              />
            ) : (
              <h3 className="goal-title">{title}</h3>
            )}
            {onRename && (
              <button
                className="goal-edit"
                type="button"
                aria-label={editing ? 'Save the goal’s name' : 'Rename this goal'}
                onClick={() => (editing ? save() : setEditing(true))}
              >
                <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden>
                  <path
                    d="M13.6 3.3a1.7 1.7 0 0 1 2.4 2.4l-8 8-3.2.8.8-3.2 8-8Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
          {goal.updated && <p className="goal-updated">Last updated: {goal.updated}</p>}

          <dl className="goal-rows">
            {goal.timeline && (
              <>
                <dt>Timeline</dt>
                <dd>{goal.timeline}</dd>
              </>
            )}
            {goal.pros && goal.pros.length > 0 && (
              <>
                <dt>Pros</dt>
                <dd>
                  {goal.pros.map((p) => (
                    <span className="goal-line" key={p}>
                      {p}
                    </span>
                  ))}
                </dd>
              </>
            )}
            {goal.cons && goal.cons.length > 0 && (
              <>
                <dt>Cons</dt>
                <dd>
                  {goal.cons.map((c) => (
                    <span className="goal-line" key={c}>
                      {c}
                    </span>
                  ))}
                </dd>
              </>
            )}
            {goal.note && (
              <>
                <dt>My goal</dt>
                <dd>{goal.note}</dd>
              </>
            )}
            <dt>Readiness</dt>
            <dd className="goal-readiness">
              <ReadinessLevel level={goal.readiness} />
              <span className="goal-stage">{stage ?? 'Not set'}</span>
            </dd>
          </dl>

          {onToggleComplete && (
            <label className="goal-complete">
              <input type="checkbox" checked={!!goal.completed} onChange={onToggleComplete} />
              <span>{goal.completed ? `Completed ${goal.completed}` : 'Mark complete'}</span>
            </label>
          )}
        </div>

        {onDelete && (
          <div className="modal-footer goal-foot">
            {/* The one destructive thing on the panel, so it is the one thing
                that does not look like a button. */}
            <button className="goal-delete" type="button" onClick={onDelete}>
              <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden>
                <path
                  d="M4 6h12M8.5 6V4.5h3V6M6 6l.7 9.2a1.3 1.3 0 0 0 1.3 1.2h4a1.3 1.3 0 0 0 1.3-1.2L14 6"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Delete Goal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
