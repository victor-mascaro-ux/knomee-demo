/* A goal, opened.
 *
 * Every goal row on every profile opens here: what the person said about that
 * goal — when they last touched it, the horizon they gave it, what they like
 * and what they do not, the sentence they wrote — and how ready they are.
 *
 * On a page that owns the goal, every one of those is changed where it is
 * read: the title is its own field, the rest are the goal form's own fields
 * (no pencil, no second panel). So is everything else the goal's own
 * adventure asks (`fields`), answered blank or not, and each the way the
 * adventure asks it: picked from one, picked from several, or in words. What
 * changed is handed back when the panel closes — Done, the close, Escape or
 * the ground behind it — and comes back "Updated". Completed is a checkbox; the foot is Delete · Done, as on every
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
import ReadinessModal, { QUESTIONS as READINESS } from './ReadinessModal'
import { InlineTitle, ReadBackCheck, ReadBackFoot, closesOnEscape } from './ReadBack'

type OpenGoal = Goal & { tags?: string[] }

/** One more thing a goal's adventure asks, beyond the goal form's own. Its
    answer rides in the goal's `extra` rows under its label; several picks
    are one value, joined with " · ". */
export type GoalField = { label: string; kind: 'one' | 'many' | 'text'; options?: string[] }

/* A client's Goals adventure asks one more thing: how they want to reach it. */
export const CLIENT_GOAL_FIELDS: GoalField[] = [
  { label: 'Support', kind: 'one', options: READINESS[0].options.map((o) => o.label) },
]

const JOIN = ' · '
/* What a goal says beyond the form, order aside: the same rows in another
   order are the same answers. */
const said = (rows?: { label: string; value: string }[]) =>
  (rows ?? [])
    .filter((r) => r.value)
    .map((r) => `${r.label}=${r.value}`)
    .sort()
    .join('\n')

export default function GoalModal({
  goal,
  onClose,
  onSave,
  onToggleComplete,
  onDelete,
  fields = CLIENT_GOAL_FIELDS,
  stamp = DEMO_TODAY,
}: {
  goal: OpenGoal
  /** Today, in the page's own date format, for "Last updated". */
  stamp?: string
  /** What else this goal's adventure asks. A client's goal by default. */
  fields?: GoalField[]
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
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries((goal.extra ?? []).map((r) => [r.label, r.value])),
  )
  /* The adventure's fields, then any row the goal carries that none of them
     is, read and changed as words. */
  const asked: GoalField[] = [
    ...fields,
    ...(goal.extra ?? [])
      .filter((r) => !fields.some((f) => f.label === r.label))
      .map((r) => ({ label: r.label, kind: 'text' as const })),
  ]
  const setVal = (label: string, value: string) => setVals((v) => ({ ...v, [label]: value }))
  /* A horizon from a road the panel's menu does not list (the adventures'
     stops) is still the one shown. */
  const timelines: string[] =
    goal.timeline && !TIMELINES.includes(goal.timeline) ? [goal.timeline, ...TIMELINES] : [...TIMELINES]
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
    /* A field left blank is a row left out, as a blank answer is everywhere. */
    extra: asked
      .map((f) => ({ label: f.label, value: (vals[f.label] ?? '').trim() }))
      .filter((r) => r.value),
    readiness,
  }
  const same = (a?: string[], b?: string[]) => (a ?? []).join('\n') === (b ?? []).join('\n')
  const changed =
    next.title !== goal.title ||
    next.timeline !== goal.timeline ||
    !same(next.pros, goal.pros) ||
    !same(next.cons, goal.cons) ||
    (next.note ?? '') !== (goal.note ?? '') ||
    said(next.extra) !== said(goal.extra) ||
    next.readiness !== goal.readiness

  /* Every way out keeps what was typed. */
  const close = () => {
    if (onSave && changed) onSave(withTag({ ...next, updated: stamp }, 'Updated'))
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
            <SelectMenu className="ag-input" value={timeline} options={timelines} onChange={setTimeline} />

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

            {/* The rest of what the adventure asked, each the way it asked. */}
            {asked.map((f, i) => {
              const value = vals[f.label] ?? ''
              const id = `goal-field-${i}`
              if (f.kind === 'text')
                return (
                  <React.Fragment key={f.label}>
                    <label className="ag-label" htmlFor={id}>
                      {f.label}
                    </label>
                    <input
                      id={id}
                      className="ag-input"
                      value={value}
                      onChange={(e) => setVal(f.label, e.target.value)}
                    />
                  </React.Fragment>
                )
              if (f.kind === 'one')
                return (
                  <React.Fragment key={f.label}>
                    <span className="ag-label">{f.label}</span>
                    <SelectMenu
                      className="ag-input"
                      value={value}
                      placeholder="Choose one"
                      options={f.options ?? []}
                      onChange={(v) => setVal(f.label, v)}
                    />
                  </React.Fragment>
                )
              /* Several: the options as pills, each on or off, kept in the
                 order the adventure lists them. */
              const on = value ? value.split(JOIN) : []
              const toggle = (o: string) => {
                const picked = on.includes(o) ? on.filter((x) => x !== o) : [...on, o]
                setVal(f.label, (f.options ?? []).filter((x) => picked.includes(x)).join(JOIN))
              }
              return (
                <React.Fragment key={f.label}>
                  <span className="ag-label" id={id}>
                    {f.label}
                  </span>
                  <div className="goal-picks" role="group" aria-labelledby={id}>
                    {(f.options ?? []).map((o) => (
                      <button
                        key={o}
                        type="button"
                        className={`goal-pick${on.includes(o) ? ' is-on' : ''}`}
                        aria-pressed={on.includes(o)}
                        onClick={() => toggle(o)}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </React.Fragment>
              )
            })}

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
