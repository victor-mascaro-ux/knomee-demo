/* Questions: asking one, and reading one back.
 *
 * A question a client wants answered is the shortest thing on the page and the
 * hardest to word, so the form starts it for them: a list of openers the app
 * already knows people ask in, then the rest of it in their own words. The two
 * halves are stored as the one sentence they make, because that is what an
 * advisor reads.
 *
 * Reading one back: its pills, the question as a field you can simply type
 * into (no pencil, no second panel), where it stands, and two pills — Delete
 * and Mark Resolved. A page that can only read it gets the text and no
 * footer.
 */

import { useEffect, useState } from 'react'
import './questionModal.css'
import type { ProfileQuestion } from '../data/financialId'
import { DEMO_TODAY } from '../data/financialId'
import { CheckIcon } from '../components/profileIcons'
import { CloseIcon } from '../components/icons'
import SelectMenu from '../components/SelectMenu'
import { StatusTags, withTag } from './profileParts'
import { InlineTitle, ReadBackCheck, ReadBackFoot, closesOnEscape } from './ReadBack'

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

/* A question reworded in place: dated today, said "Updated" on its row, and
   no longer Knomee's words — so it loses "Knomee generated". */
export function renamed(question: ProfileQuestion, q: string): ProfileQuestion {
  return withTag({ ...question, q, date: DEMO_TODAY, knomee: undefined }, 'Updated')
}

export default function QuestionModal({
  question,
  onClose,
  onRename,
  onToggleResolved,
  onDelete,
}: {
  question: ProfileQuestion
  onClose: () => void
  /** Rewording it in place. Without it the question is only read. */
  onRename?: (q: string) => void
  onToggleResolved?: () => void
  onDelete?: () => void
}) {
  /* The question is its own field: what you read is what you change. */
  const [draft, setDraft] = useState(question.q)
  useEffect(() => setDraft(question.q), [question.q])

  /* Saved on leaving the field (click away, Enter, or closing the panel):
     tidied, given its question mark, and only if it actually changed. An
     emptied field puts the question back. */
  const commit = () => {
    const t = draft.trim().replace(/\s+/g, ' ')
    if (!t) return setDraft(question.q)
    const full = /[?!.]$/.test(t) ? t : `${t}?`
    if (full !== question.q) onRename?.(full)
    else setDraft(question.q)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (closesOnEscape(e)) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /* Where it stands. Where it can be resolved, the checkbox says so and the
     line keeps to the date; read-only, resolved replaces the date. */
  const status =
    question.resolved && !onToggleResolved
      ? `Resolved: ${question.resolved}`
      : question.date
        ? `Last updated: ${question.date}`
        : null
  const hasActions = !!(onRename || onToggleResolved || onDelete)

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

        {/* On one left edge, in the row's own order: its pills, the question,
            where it stands. */}
        <div className="modal-body qm-read">
          <StatusTags tags={question.tags} knomee={question.knomee} />
          {onRename ? (
            <InlineTitle
              value={draft}
              original={question.q}
              label="Question"
              onChange={setDraft}
              onBlur={commit}
            />
          ) : (
            <h3 className="qm-question">{question.q}</h3>
          )}
          {status && (
            <p
              className={`qm-status${question.resolved ? ' is-resolved' : ''}`}
              aria-live="polite"
            >
              {question.resolved && !onToggleResolved && <CheckIcon size={14} />}
              <span>{status}</span>
            </p>
          )}
          {onToggleResolved && (
            <ReadBackCheck label="Resolved" on={question.resolved} onToggle={onToggleResolved} />
          )}
        </div>

        {hasActions && <ReadBackFoot noun="question" onDelete={onDelete} onDone={onClose} />}
      </div>
    </div>
  )
}
