/* The advisor flow's first screen, shared by the answerable flow and the
 * Marcus walkthrough so the two cannot drift apart.
 *
 * Set in the client's adventure-intro type (joyFlow.css), and what the eight
 * minutes hand back as three cards rather than a numbered list: each wears the
 * icon the app already uses for that thing — the adventures mark, the Business
 * ID tab, the Questions tab — so the card and the place it points to look like
 * the same object. The cards arrive one after another, their icons pop in, a
 * sheen passes over each once, and they lift under the pointer or finger.
 */

import type { CSSProperties } from 'react'
import type { Step } from '../data/advisorFlow'
import { ClockIcon, TabFinId, TabMark, TabQuestions } from './ClientExperienceScreen'
import './joyFlow.css'

const ICONS = [TabMark, TabFinId, TabQuestions]

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="7" width="10" height="7" rx="1.6" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" strokeLinecap="round" />
    </svg>
  )
}

/** "Title. The rest of it." — the first sentence is the card's heading. */
function split(value: string) {
  const at = value.indexOf('. ')
  return at < 0 ? { title: value, body: '' } : { title: value.slice(0, at), body: value.slice(at + 2) }
}

export default function AdvisorWelcome({ step }: { step: Step }) {
  return (
    <div className="af-welcome is-intro">
      <h2 className="jf-title">{step.title}</h2>
      {step.body?.split('\n\n').map((p) => (
        <p key={p} className="jf-body">
          {p}
        </p>
      ))}
      {step.aside && (
        <p className="af-aside">
          <LockIcon />
          {step.aside}
        </p>
      )}
      {/* The heading and how long it takes, on one line: the time is pushed
          to the far edge by the row itself rather than by a fixed gap. */}
      <div className="af-gets-head">
        <div className="af-getlist-title">What you’ll get</div>
        {step.stat && (
          <div className="af-est">
            <ClockIcon />
            {step.stat}
          </div>
        )}
      </div>
      <ol className="af-gets">
        {step.lines?.map((l, i) => {
          const { title, body } = split(l.value)
          const Icon = ICONS[i % ICONS.length]
          return (
            <li key={l.label} className="af-get" style={{ '--i': i } as CSSProperties}>
              <span className="af-get-icon" aria-hidden>
                <Icon />
                <b className="af-get-num">{l.label}</b>
              </span>
              <span className="af-get-text">
                <span className="af-get-title">{title}</span>
                {body && <span className="af-get-body">{body}</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
