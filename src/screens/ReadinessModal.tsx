/* Assessing a goal's readiness.
 *
 * A goal somebody has just written down has no stage on it yet, and the stage
 * is the first thing an advisor reads off a goal. This asks for it the way the
 * app asks for everything else: four short questions, one tap each, with
 * nothing to rank the answers by — a ladder drawn beside the options would
 * tell them which answer is the good one, and then they are answering the
 * picture rather than the question.
 *
 * The stage is worked out from the answers rather than picked: whether they
 * have thought about how, whether they know the steps, and whether they have
 * started are what the model actually asks. The first question is not scored —
 * how much of the advisor they want in it says nothing about how far along
 * they are — but it is the one they can answer without thinking, and a flow
 * opens better on one of those.
 *
 * The shell is the app's own modal, like every other panel here.
 */

import { useEffect, useState } from 'react'
import './readinessModal.css'
import type { Goal } from '../data/financialId'
import { TTM_STATEMENTS } from '../data/ttm'
import { ReadinessLevel, TTM_STAGES } from './profileParts'
import { CloseIcon } from '../components/icons'

/* Each answer carries the rung it argues for, where it argues for one. */
type Answer = { label: string; level?: number }
type Question = { lead: string; strong: string; tail: string; options: Answer[] }

const QUESTIONS: Question[] = [
  {
    lead: 'How do you envision ',
    strong: 'support',
    tail: ' from your financial advisor when working towards your goal?',
    options: [{ label: 'I want to do it on my own' }, { label: 'I want help from my advisor' }],
  },
  {
    lead: 'Are you thinking about ',
    strong: 'how',
    tail: ' to make your goal happen?',
    options: [
      { label: 'Not really.', level: 1 },
      { label: 'Yes, but no plans yet', level: 2 },
      { label: 'Yes, and I’m considering next steps', level: 3 },
      { label: 'I already started working towards it', level: 4 },
    ],
  },
  {
    lead: 'Do you know what ',
    strong: 'steps',
    tail: ' to take to your goal?',
    options: [
      { label: 'No idea.', level: 1 },
      { label: 'Some ideas, but unsure', level: 2 },
      { label: 'Yes, I know what to do', level: 3 },
      { label: 'Yes, I’m already doing it', level: 4 },
    ],
  },
  {
    lead: 'Have you started to ',
    strong: 'take action',
    tail: ' on your goal?',
    options: [
      { label: 'Not yet.' },
      { label: 'Yes, I’ve taken steps', level: 4 },
      { label: 'Yes, I did it. Done.', level: 5 },
    ],
  },
]

/* Where the four answers put them. Acting, and having acted, are stated
   outright in the last question, so that answer wins wherever it is given;
   otherwise the stage is as far as the thinking has got, and thinking alone
   stops at Preparation however sure of it they are. */
function stageOf(answers: (Answer | null)[]) {
  const acted = answers[3]?.level
  if (acted) return acted
  const thought = Math.max(answers[1]?.level ?? 1, answers[2]?.level ?? 1)
  return Math.min(thought, 3)
}

export default function ReadinessModal({
  goal,
  onClose,
  onSave,
  saveLabel = 'See it in my Financial ID',
}: {
  goal: Goal
  onClose: () => void
  /** The stage the answers put them on, 1–5. */
  onSave: (level: number) => void
  /** What the last button says it leads to. */
  saveLabel?: string
}) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<(Answer | null)[]>([null, null, null, null])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const done = step >= QUESTIONS.length
  const q = QUESTIONS[Math.min(step, QUESTIONS.length - 1)]
  const level = done ? stageOf(answers) : 0
  const stage = level ? TTM_STAGES[level - 1] : null

  const answer = (a: Answer) => {
    setAnswers((list) => list.map((o, i) => (i === step ? a : o)))
    setStep((s) => s + 1)
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal rm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Goal Readiness</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body rm-body">
          {/* How far through, as one rule: four questions, then the reading. */}
          <span className="rm-rule" aria-hidden>
            <i style={{ width: `${((done ? QUESTIONS.length : step) / QUESTIONS.length) * 100}%` }} />
          </span>

          <p className="rm-goal">{goal.title}</p>

          {!done ? (
            <>
              <p className="rm-ask">
                {q.lead}
                <b>{q.strong}</b>
                {q.tail}
              </p>
              <ul className="rm-options">
                {q.options.map((o) => (
                  <li key={o.label}>
                    <button className="rm-option" type="button" onClick={() => answer(o)}>
                      {o.label}
                    </button>
                  </li>
                ))}
              </ul>
              {step > 0 && (
                <button className="rm-back" type="button" onClick={() => setStep((s) => s - 1)}>
                  Back
                </button>
              )}
            </>
          ) : (
            <>
              <p className="rm-ask">
                My <b>readiness</b> stage to my goal is:
              </p>
              <div className="rm-result">
                <ReadinessLevel level={level} />
                <span className="rm-stage">{stage}</span>
              </div>
              <p className="rm-statement">{stage ? TTM_STATEMENTS[stage] : ''}</p>
              <div className="rm-foot">
                <button className="btn btn-primary" type="button" onClick={() => onSave(level)}>
                  {saveLabel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
