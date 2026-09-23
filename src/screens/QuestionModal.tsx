/* Questions: asking one, and reading one back.
 *
 * A question a client wants answered is the shortest thing on the page and the
 * hardest to word, so the form starts it for them: a list of openers the app
 * already knows people ask in, then the rest of it in their own words. The two
 * halves are stored as the one sentence they make, because that is what an
 * advisor reads.
 *
 * Reading one back is a panel with a single state on it — asked, or answered —
 * and the date it changed, which is the only fact a question carries beyond
 * its own text.
 */

import { useEffect, useState } from 'react'
import './questionModal.css'
import type { ProfileQuestion } from '../data/financialId'
import { DEMO_TODAY } from '../data/financialId'
import { CheckIcon } from '../components/profileIcons'
import { CloseIcon } from '../components/icons'

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
          <select
            id="qm-starter"
            className="qm-input qm-select"
            value={starter}
            onChange={(e) => setStarter(e.target.value)}
          >
            <option value="">Choose one option</option>
            {STARTERS.map((s) => (
              /* The ellipsis is the list saying "carry on", not part of what
                 they are asking — so it is in the label and not the value. */
              <option key={s} value={s}>
                {s}…
              </option>
            ))}
          </select>

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
                if (e.key === 'Enter' && full) onSave({ ...question, q: full, date: DEMO_TODAY })
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
            onClick={() => onSave({ ...question, q: full, date: DEMO_TODAY })}
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal qm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Question</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body qm-body">
          <div className="qm-head">
            <h3 className="qm-question">{question.q}</h3>
            {onEdit && (
              <button className="goal-edit" type="button" aria-label="Edit this question" onClick={onEdit}>
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
          {question.date && <p className="qm-asked">Last updated: {question.date}</p>}

          {onToggleResolved &&
            (question.resolved ? (
              <p className="qm-resolved">
                <CheckIcon /> Marked resolved: {question.resolved}
              </p>
            ) : (
              <label className="goal-complete">
                <input type="checkbox" checked={false} onChange={onToggleResolved} />
                <span>Mark resolved</span>
              </label>
            ))}
          {question.resolved && onToggleResolved && (
            <button className="qm-unresolve" type="button" onClick={onToggleResolved}>
              Reopen this question
            </button>
          )}

          <div className="qm-cta">
            <button className="btn btn-primary" type="button" onClick={onClose}>
              See it in my Financial ID
            </button>
          </div>
        </div>

        {onDelete && (
          <div className="modal-footer goal-foot">
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
              Delete Question
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
