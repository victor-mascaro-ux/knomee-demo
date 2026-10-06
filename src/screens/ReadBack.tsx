/* What every read-back panel — a question, a goal, a life event — is made of.
 *
 * The thing it is about is its own field: what you read is what you change,
 * so there is no pencil and no second panel. Its state (resolved, completed)
 * is a checkbox, never a filled button: a filled button after an edit reads as
 * Save and gets pressed as one. And the foot is the same two pills on every
 * panel — Delete, and Done, which only closes, because the panel has already
 * kept what was typed.
 *
 * The styles are the question panel's (questionModal.css), where the pattern
 * was settled.
 */

import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import './questionModal.css'

/** The panel's subject as a field: the forms' input at the title's size, as
    tall as what it holds. Enter leaves it; Escape puts back `original` and
    leaves it without closing the panel. */
export function InlineTitle({
  value,
  original,
  label,
  onChange,
  onBlur,
}: {
  value: string
  original: string
  label: string
  onChange: (v: string) => void
  onBlur?: () => void
}) {
  const field = useRef<HTMLTextAreaElement>(null)
  const reverting = useRef(false)
  useLayoutEffect(() => {
    const el = field.current
    if (!el) return
    el.style.height = 'auto'
    /* scrollHeight leaves out the border the field draws. */
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
  }, [value])
  return (
    <textarea
      ref={field}
      className="qm-question qm-edit"
      aria-label={label}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {
        if (reverting.current) {
          reverting.current = false
          return
        }
        onBlur?.()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          reverting.current = true
          onChange(original)
          e.currentTarget.blur()
        }
      }}
    />
  )
}

/** Escape closes a read-back panel — except inside its title field, where it
    undoes the typing instead. */
export function closesOnEscape(e: KeyboardEvent) {
  return e.key === 'Escape' && !(e.target as HTMLElement | null)?.closest?.('.qm-edit')
}

/** The state, as a checkbox: "Resolved", "Completed" — and the day, once it is. */
export function ReadBackCheck({
  label,
  on,
  onToggle,
}: {
  label: string
  /** The date it was ticked, or nothing. */
  on?: string
  onToggle: () => void
}) {
  return (
    <label className="qm-check">
      <input type="checkbox" checked={!!on} onChange={onToggle} />
      <span>{on ? `${label} · ${on}` : label}</span>
    </label>
  )
}

/** Delete · Done. Delete asks first, in place, without the panel moving; Keep
    It takes the focus, so a second press lands on the safe choice. */
export function ReadBackFoot({
  noun,
  onDelete,
  onDone,
}: {
  noun: string
  onDelete?: () => void
  onDone: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="modal-footer qm-actions">
      {/* Keyed so the confirm is a new set of controls, not the old pills
          relabelled: Keep It has to mount to take the focus. */}
      {confirming && onDelete ? (
        <Fragment key="confirm">
          <p className="qm-confirm" id="rb-confirm-line">
            Delete this {noun}?
          </p>
          <button
            className="btn btn-outline"
            type="button"
            autoFocus
            aria-describedby="rb-confirm-line"
            onClick={() => setConfirming(false)}
          >
            Keep It
          </button>
          <button className="btn btn-danger" type="button" onClick={onDelete}>
            Delete
          </button>
        </Fragment>
      ) : (
        <Fragment key="actions">
          {onDelete && (
            <button className="btn btn-outline qm-delete" type="button" onClick={() => setConfirming(true)}>
              Delete
            </button>
          )}
          <button className="btn btn-primary" type="button" onClick={onDone}>
            Done
          </button>
        </Fragment>
      )}
    </div>
  )
}
