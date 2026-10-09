/* The first form of a journey — who the ID is headed with — on the head of
   that ID: a card on the living gradient that fills in as they type, and one
   field at a time under it. The advisor's Business ID and the client's
   Financial ID ask different things and look the same, which is why it is one
   component. The owner keeps the values and which field is showing; the foot's
   Continue and Back step through `field`. Styles in advisor-flow.css. */

import type { ReactNode } from 'react'
import './joyFlow.css'
import './advisor-flow.css'

export type IdIconKind = 'name' | 'book' | 'firm' | 'place' | 'work' | 'clients'

export interface IdField {
  key: string
  label: string
  hint?: string
  /** What the field's chip on the card says while it is blank. */
  chip?: string
  icon: IdIconKind
  /** Drawn by the owner (`renderField`) instead of a text box — a choice
      rather than a thing to type. */
  custom?: boolean
}

export default function IdentityCardForm({
  title,
  sub,
  idName,
  fields,
  values,
  onChange,
  field,
  onNext,
  foot,
  renderField,
}: {
  /** The control for a `custom` field. */
  renderField?: (key: string) => ReactNode
  title: string
  sub: string
  /** "Business ID", "Financial ID" — the card's eyebrow. */
  idName: string
  /** The first is the name the card is headed with; the rest are its chips. */
  fields: IdField[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  field: number
  onNext: () => void
  /** The line held at the foot of the screen. */
  foot?: ReactNode
}) {
  const current = fields[field] ?? fields[0]
  const [head, ...chips] = fields
  const name = (values[head.key] ?? '').trim()
  const initial = name.charAt(0).toUpperCase()
  return (
    <div className="af-welcome af-id">
      <header className="af-idhead">
        <h2 className="af-h1">{title}</h2>
        <p className="af-idsub">{sub}</p>
      </header>
      {/* The head of their ID, filling in as they type — so the fields read
          as the start of something rather than a form. */}
      <div className="af-idcard" aria-hidden>
        <span className="af-idcard-sky">
          <i className="af-idcard-glow is-a" />
          <i className="af-idcard-glow is-b" />
          <i className="af-idcard-glow is-c" />
        </span>
        <span className="af-idcard-eyebrow">{idName}</span>
        <div className="af-idcard-who">
          <span className={`af-idcard-avatar${initial ? ' is-set' : ''}`}>{initial || <IdIcon k="name" />}</span>
          <span className={`af-idcard-name${name ? '' : ' is-empty'}`}>{name || head.label}</span>
        </div>
        {chips.length > 0 && (
          <div className="af-idcard-chips">
            {chips.map((f) => {
              const v = (values[f.key] ?? '').trim()
              return (
                <span
                  key={f.key}
                  className={`af-idcard-chip${v ? '' : ' is-empty'}${current.key === f.key ? ' is-on' : ''}`}
                >
                  <IdIcon k={f.icon} />
                  <span className="af-idcard-chip-t">{v || f.chip || f.label}</span>
                </span>
              )
            })}
          </div>
        )}
      </div>
      {/* The adventures' own open field — label, italic hint, input — so the
          first thing they type into looks like everything after it. */}
      <div className="af-idform">
        {fields.length > 1 && (
          <div className="af-idsteps" aria-label={`${field + 1} of ${fields.length}`}>
            {fields.map((f, n) => (
              <i key={f.key} className={n === field ? 'is-on' : n < field ? 'is-done' : undefined} />
            ))}
          </div>
        )}
        <div className="af-idfield" key={current.key}>
          <label className="jf-other-label" htmlFor={`af-id-${current.key}`}>
            {current.label}
          </label>
          {current.hint && <span className="jf-other-hint">{current.hint}</span>}
          {current.custom && renderField ? (
            renderField(current.key)
          ) : (
          <span className="af-idinput">
            <IdIcon k={current.icon} />
            <input
              id={`af-id-${current.key}`}
              className="jf-other"
              autoFocus
              enterKeyHint={field < fields.length - 1 ? 'next' : 'done'}
              value={values[current.key] ?? ''}
              onChange={(e) => onChange(current.key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onNext()
                }
              }}
            />
          </span>
          )}
        </div>
      </div>
      {foot && <p className="lg-consent is-left">{foot}</p>}
    </div>
  )
}

/** The identity fields' marks: a person, a stack of coins, a building, a pin, a briefcase. */
export function IdIcon({ k }: { k: IdIconKind }) {
  const paths: Record<IdIconKind, ReactNode> = {
    name: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
      </>
    ),
    book: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="2.5" />
        <path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
        <path d="M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
      </>
    ),
    firm: (
      <>
        <path d="M4 20h16" />
        <path d="M6 20V9l6-4 6 4v11" />
        <path d="M10 20v-5h4v5" />
      </>
    ),
    place: (
      <>
        <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </>
    ),
    clients: (
      <>
        <circle cx="9" cy="8" r="3.4" />
        <path d="M3 19.5c.9-3.3 3.3-5 6-5s5.1 1.7 6 5" />
        <path d="M15.5 4.9a3.4 3.4 0 0 1 0 6.3M17.5 14.8c1.7.6 3 2.2 3.5 4.7" />
      </>
    ),
    work: (
      <>
        <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
        <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
        <path d="M3.5 12.5h17" />
      </>
    ),
  }
  return (
    <svg className="af-idicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[k]}
    </svg>
  )
}
