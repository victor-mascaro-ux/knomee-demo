/* Questions: asking one, and reading one back.
 *
 * A question a client wants answered is the shortest thing on the page and the
 * hardest to word, so the form starts it for them: a list of openers the app
 * already knows people ask in, then the rest of it in their own words. The two
 * halves are stored as the one sentence they make, because that is what an
 * advisor reads.
 *
 * Reading one back is a panel you read top to bottom — its pills, the
 * question, where it stands — with everything you can do to it as a pill in
 * its footer. A page that can only read it gets no footer.
 */

import { Fragment, useEffect, useState } from 'react'
import './questionModal.css'
import type { ProfileQuestion } from '../data/financialId'
import { DEMO_TODAY } from '../data/financialId'
import { CheckIcon } from '../components/profileIcons'
import { CloseIcon } from '../components/icons'
import SelectMenu from '../components/SelectMenu'
import { StatusTags } from './profileParts'

/* The openers, in the order the phone lists them. They are the shapes a money
   question actually takes: can I, when will I, what happens if, how much, how
   do I, which is better. */
const STARTERS = [
  'Can I afford to',
  'When will I be able to',
  'What happens if',
  'How much do I need to',
  'How do I',
  'Which is better,',
  'Should I',
  'Is it worth it to',
]

export function AddQuestionModal({
  question,
  onClose,
  onSave,
}: {
  /** A question already on the page, opened to be reworded. */
  question?: ProfileQuestion
  onClose: () => void
  onSave: (q: ProfileQuestion) => void
}) {
  /* An edit arrives as one sentence rather than two halves, so it opens with
     whichever opener it starts with and the remainder in the field — and with
     neither, if it was worded some other way entirely. */
  const opener = question ? (STARTERS.find((s) => question.q.startsWith(s)) ?? '') : ''
  const [starter, setStarter] = useState(opener)
  const [rest, setRest] = useState(
    question ? question.q.slice(opener.length).trim().replace(/\?$/, '') : '',
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sentence = [starter, rest.trim()].filter(Boolean).join(' ').trim()
  const full = sentence && !/[?!.]$/.test(sentence) ? `${sentence}?` : sentence
  /* A Knomee question reworded is no longer Knomee's words: it keeps the
     "Knomee generated" chip only while its text is the one Knomee wrote. */
  const saved = (): ProfileQuestion => ({
    ...question,
    q: full,
    date: DEMO_TODAY,
    knomee: question?.knomee && full === question.q ? true : undefined,
  })

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal qm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{question ? 'Edit Question' : 'Add a Question'}</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body qm-body">
          <label className="qm-label" htmlFor="qm-starter">
            Pick a question starter
          </label>
          <SelectMenu
            id="qm-starter"
            className="qm-input"
            value={starter}
            placeholder="Choose one option"
            /* The ellipsis is the list saying "carry on", not part of what
               they are asking — so it is in the label and not the value. */
            options={STARTERS.map((s) => ({ value: s, label: `${s}…` }))}
            onChange={setStarter}
          />

          <label className="qm-label" htmlFor="qm-rest">
            Add the rest of your question
          </label>
          <div className="qm-field">
            <input
              id="qm-rest"
              className="qm-input"
              value={rest}
              placeholder="Click to start writing."
              onChange={(e) => setRest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && full) onSave(saved())
              }}
            />
            <span className="qm-pencil" aria-hidden>
              <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
                <path
                  d="M13.6 3.3a1.7 1.7 0 0 1 2.4 2.4l-8 8-3.2.8.8-3.2 8-8Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          {/* What they are about to ask, as one sentence — the two fields are
              how it is built, not how it will be read. */}
          {full && <p className="qm-preview">{full}</p>}
        </div>

        <div className="modal-footer qm-foot">
          <button className="btn btn-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!full}
            onClick={() => onSave(saved())}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QuestionModal({
  question,
  onClose,
  onEdit,
  onToggleResolved,
  onDelete,
}: {
  question: ProfileQuestion
  onClose: () => void
  onEdit?: () => void
  onToggleResolved?: () => void
  onDelete?: () => void
}) {
  /* Delete is the one thing here that cannot be undone, so it asks first, in
     the footer it was pressed in, not in a second panel. */
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /* Where it stands, said the way its row says it: resolved replaces the date
     rather than adding a second one. Read from the data, not from whether a
     handler was passed, so a read-only page shows it too. */
  const status = question.resolved
    ? `Resolved: ${question.resolved}`
    : question.date
      ? `Last updated: ${question.date}`
      : null
  /* Every action lives in the footer, so a page that offers none (an
     advisor's Business ID) gets a panel with no footer and the same body. */
  const hasActions = !!(onToggleResolved || onEdit || onDelete)

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qm-read-title"
    >
      <div className="modal qm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="qm-read-title">
            Question
          </h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Reading only, on one left edge, in the row's own order: its pills,
            the question, where it stands. Nothing in here is a control. */}
        <div className="modal-body qm-read">
          <StatusTags tags={question.tags} knomee={question.knomee} />
          <h3 className="qm-question">{question.q}</h3>
          {status && (
            <p
              className={`qm-status${question.resolved ? ' is-resolved' : ''}`}
              aria-live="polite"
            >
              {question.resolved && <CheckIcon size={14} />}
              <span>{status}</span>
            </p>
          )}
        </div>

        {hasActions && (
          <div className="modal-footer qm-actions">
            {/* Keyed so the confirm is a new set of controls, not the old
                pills relabelled: Keep It has to mount to take the focus. */}
            {confirming && onDelete ? (
              <Fragment key="confirm">
                {/* Holds the main pill's 44px so the panel doesn't recentre,
                    and Keep It lands exactly where Delete was. */}
                <p className="qm-confirm" id="qm-confirm-line">
                  Delete this question?
                </p>
                <button
                  className="btn btn-outline"
                  type="button"
                  autoFocus
                  aria-describedby="qm-confirm-line"
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
                {/* The question's state, on its own row: filled while there
                    is something to do, outline once it is done. */}
                {onToggleResolved && (
                  <button
                    className={`btn ${question.resolved ? 'btn-outline' : 'btn-primary'} qm-act-main`}
                    type="button"
                    onClick={onToggleResolved}
                  >
                    {question.resolved ? 'Reopen' : 'Mark Resolved'}
                  </button>
                )}
                {onDelete && (
                  <button
                    className="btn btn-outline qm-delete"
                    type="button"
                    onClick={() => setConfirming(true)}
                  >
                    Delete
                  </button>
                )}
                {onEdit && (
                  <button className="btn btn-outline" type="button" onClick={onEdit}>
                    Edit
                  </button>
                )}
              </Fragment>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
