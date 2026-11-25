/* Day 4: Alex logs in, still with no invite sent, and his dashboard asks one
   question in the design system's modal. What happens next depends on the
   answer: the email, a heads-up to the Knomee team, a check-in next week, or
   a box to tell us more. */

import { useEffect, useRef, type CSSProperties } from 'react'
import { CloseIcon } from '../components/icons'
import BusyButton from './BusyButton'
import { CheckIcon } from './icons'
import { ASK, ASK_QUESTION } from './steps'

export default function AskModal({
  answer,
  text,
  sent,
  leaving,
  onAnswer,
  onText,
  onSend,
  onClose,
}: {
  answer: number
  text: string
  sent: boolean
  leaving: boolean
  onAnswer: (i: number) => void
  onText: (t: string) => void
  onSend: () => void
  onClose: () => void
}) {
  const box = useRef<HTMLTextAreaElement>(null)
  /* The box grows with what is typed, and takes the cursor when it opens. */
  const fit = () => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  useEffect(() => {
    if (answer !== 3 || sent) return
    fit()
    box.current?.focus({ preventScroll: true })
  }, [answer, sent])

  return (
    <div
      className={`modal-backdrop${leaving ? ' ad-leaving' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-ask-title"
    >
      <div className={`modal ad-ask${leaving ? ' ad-leaving' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="ad-ask-title">
            Quick question
          </h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body ad-ask-body">
          <h3 className="ask-q">{ASK_QUESTION}</h3>
          <div className="ask-opts">
            {ASK.map((o, i) => (
              <button
                key={o}
                className={`ask-opt${i === answer ? ' sel' : ''}`}
                type="button"
                aria-pressed={i === answer}
                style={{ '--i': i } as CSSProperties}
                onClick={() => onAnswer(i)}
              >
                {o}
                {i === answer && <CheckIcon />}
              </button>
            ))}
          </div>
          {answer === 2 && <p className="ask-reply">Got it. We’ll check in next week.</p>}
          {answer === 3 &&
            (sent ? (
              <p className="ask-reply">Thanks. Someone from Knomee will reach out.</p>
            ) : (
              <textarea
                ref={box}
                className="ad-grow"
                placeholder="Tell us more"
                aria-label="Tell us more"
                value={text}
                rows={1}
                onChange={(e) => {
                  onText(e.target.value)
                  fit()
                }}
              />
            ))}
        </div>
        {(answer === 2 || answer === 3) && (
          <div className="modal-footer ad-ask-foot">
            {answer === 3 && !sent ? (
              <BusyButton className="btn btn-primary" onDone={onSend}>
                Send
              </BusyButton>
            ) : (
              <button className="btn btn-primary" type="button" onClick={onClose}>
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
