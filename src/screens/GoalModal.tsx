/* A goal, opened.
 *
 * Every goal row on every profile opens here: what the person said about that
 * goal — when they last touched it, the horizon they gave it, what they like
 * and what they do not, the sentence they wrote — and how ready they are.
 *
 * On a page that owns the goal, every one of those is changed where it is
 * read: the title is its own field, the rest are the goal form's own fields
 * (no pencil, no second panel). What changed is handed back when the panel
 * closes — Done, the close, Escape or the ground behind it — and comes back
 * "Updated". Completed is a checkbox; the foot is Delete · Done, as on every
 * read-back (ReadBack.tsx).
 *
 * A page that does not own the list passes no handlers and gets a panel you
 * can only read.
 */

import React, { useEffect, useState } from 'react'
import './goalModal.css'
import './addGoalModal.css'
import type { Goal } from '../data/financialId'
import { DEMO_TODAY } from '../data/financialId'
import { ReadinessLevel, StatusTags, TTM_STAGES, withTag } from './profileParts'
import { CloseIcon } from '../components/icons'
import SelectMenu from '../components/SelectMenu'
import { PointList, TIMELINES } from './AddGoalModal'
import ReadinessModal from './ReadinessModal'
import { InlineTitle, ReadBackCheck, ReadBackFoot, closesOnEscape } from './ReadBack'

type OpenGoal = Goal & { tags?: string[] }

export default function GoalModal({
  goal,
  onClose,
  onSave,
  onToggleComplete,
  onDelete,
}: {
  goal: OpenGoal
  onClose: () => void
  /** What changed, handed back as the panel closes. Without it the goal is
      only read. */
  onSave?: (g: OpenGoal) => void
  onToggleComplete?: () => void
  onDelete?: () => void
}) {
  const editable = !!onSave
  const [title, setTitle] = useState(goal.title)
  const [timeline, setTimeline] = useState(goal.timeline ?? TIMELINES[0])
  const [pros, setPros] = useState<string[]>(goal.pros ?? [])
  const [cons, setCons] = useState<string[]>(goal.cons ?? [])
  const [note, setNote] = useState(goal.note ?? '')
  const [readiness, setReadiness] = useState(goal.readiness)
  const [assessing, setAssessing] = useState(false)

  /* The goal as it now reads, and whether that is any different. */
  const keep = (xs: string[]) => {
    const kept = xs.map((x) => x.trim()).filter(Boolean)
    return kept.length ? kept : undefined
  }
  const next: OpenGoal = {
    ...goal,
    title: title.trim().replace(/\s+/g, ' ') || goal.title,
    /* A goal that never had a horizon keeps none until one is picked. */
    timeline: goal.timeline || timeline !== TIMELINES[0] ? timeline : undefined,
    pros: keep(pros),
    cons: keep(cons),
    note: note.trim() || undefined,
    readiness,
  }
  const same = (a?: string[], b?: string[]) => (a ?? []).join('\n') === (b ?? []).join('\n')
  const changed =
    next.title !== goal.title ||
    next.timeline !== goal.timeline ||
    !same(next.pros, goal.pros) ||
    !same(next.cons, goal.cons) ||
    (next.note ?? '') !== (goal.note ?? '') ||
    next.readiness !== goal.readiness

  /* Every way out keeps what was typed. */
  const close = () => {
    if (onSave && changed) onSave(withTag({ ...next, updated: DEMO_TODAY }, 'Updated'))
    onClose()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!assessing && closesOnEscape(e)) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const stage = TTM_STAGES[readiness - 1]

  return (
    <div className="modal-backdrop" onClick={close} role="dialog" aria-modal="true">
      <div className="modal goal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Goal</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={close}>
            <CloseIcon />
          </button>
        </div>

        {editable ? (
          <div className="modal-body ag-body goal-live">
            <div className="qm-read">
              <StatusTags tags={goal.tags} />
              <InlineTitle value={title} original={goal.title} label="Goal" onChange={setTitle} />
              {goal.updated && <p className="qm-status">Last updated: {goal.updated}</p>}
            </div>

            <span className="ag-label">Timeline</span>
            <SelectMenu className="ag-input" value={timeline} options={TIMELINES} onChange={setTimeline} />

            <div className="ag-cols">
              <PointList label="Pros" hint="Add a pro to your goal." items={pros} onChange={setPros} />
              <PointList label="Cons" hint="Add a con to your goal." items={cons} onChange={setCons} />
            </div>

            <label className="ag-label" htmlFor="goal-note">
              I want to do this because…
            </label>
            <input
              id="goal-note"
              className="ag-input"
              value={note}
              placeholder="Write your primary motivation."
              onChange={(e) => setNote(e.target.value)}
            />

            {/* Rows only some goals have (an advisor's move): read, not asked. */}
            {goal.extra?.some((r) => r.value) && (
              <dl className="goal-rows">
                {goal.extra.map((row) =>
                  row.value ? (
                    <React.Fragment key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </React.Fragment>
                  ) : null,
                )}
              </dl>
            )}

            {/* The stage is not picked, it is worked out: changing it means
                answering the readiness questions again. */}
            <span className="ag-label">Readiness</span>
            <div className="ag-ttm">
              <span className="ag-ttm-now">
                <ReadinessLevel level={readiness} />
                {stage ?? 'Not set'}
              </span>
              <button className="ag-ttm-retake" type="button" onClick={() => setAssessing(true)}>
                {readiness ? 'Retake Assessment' : 'Assess Readiness'}
              </button>
            </div>

            {onToggleComplete && (
              <ReadBackCheck label="Completed" on={goal.completed} onToggle={onToggleComplete} />
            )}
          </div>
        ) : (
          <div className="modal-body goal-body">
            <StatusTags tags={goal.tags} />
            <h3 className="goal-title">{goal.title}</h3>
            {goal.updated && <p className="goal-updated">Last updated: {goal.updated}</p>}
            <dl className="goal-rows">
              {goal.timeline && (
                <>
                  <dt>Timeline</dt>
                  <dd>{goal.timeline}</dd>
                </>
              )}
              {/* Pros and cons, each line marked; a list left blank is left out. */}
              {(['pros', 'cons'] as const).map((kind) => {
                const items = goal[kind] ?? []
                return items.length > 0 ? (
                  <React.Fragment key={kind}>
                    <dt>{kind === 'pros' ? 'Pros' : 'Cons'}</dt>
                    <dd className={`goal-list is-${kind}`}>
                      {items.map((x) => (
                        <span className="goal-line" key={x}>
                          {x}
                        </span>
                      ))}
                    </dd>
                  </React.Fragment>
                ) : null
              })}
              {goal.note && (
                <>
                  <dt>Because</dt>
                  <dd>{goal.note}</dd>
                </>
              )}
              {goal.extra?.map((row) =>
                row.value ? (
                  <React.Fragment key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </React.Fragment>
                ) : null,
              )}
              {goal.readiness > 0 && (
                <>
                  <dt>Readiness</dt>
                  <dd className="goal-readiness">
                    <ReadinessLevel level={goal.readiness} />
                    <span className="goal-stage">{TTM_STAGES[goal.readiness - 1] ?? 'Not set'}</span>
                  </dd>
                </>
              )}
            </dl>
          </div>
        )}

        {(editable || onDelete) && <ReadBackFoot noun="goal" onDelete={onDelete} onDone={close} />}
      </div>

      {/* The readiness questions, over the panel; what they come to lands on
          this goal when the panel closes. */}
      {assessing && (
        <div onClick={(e) => e.stopPropagation()}>
          <ReadinessModal
            goal={{ ...goal, title: next.title }}
            saveLabel="Use This Stage"
            onClose={() => setAssessing(false)}
            onSave={(lv) => {
              setReadiness(lv)
              setAssessing(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
