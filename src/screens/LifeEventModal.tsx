/* Life events: the one that adds them, and the one that reads one back.
 *
 * Adding is two steps, the way the phone asks it. First WHICH event, out of a
 * list long enough to need its three supercategories — Purchase, Professional,
 * Personal — as sections you open one at a time. Then the event itself: what
 * happened in their words, anything else worth keeping, when, and how they
 * feel about it, which is the app's own five faces rather than a rating.
 *
 * Everything after the kind is optional. An advisor logging a client's news
 * mid-call has a name for it and little else, and a form that refuses to save
 * without a date is a form that does not get used.
 *
 * Anything an advisor adds here carries the same "Advisor added" mark the
 * table shows — said on the panel while they are filling it in, not just
 * afterwards. On the client's own phone (`client`) the one filling it in is
 * the client, so there is no mark to make and none to show.
 */

import { useEffect, useState } from 'react'
import './lifeEventModal.css'
import type { LifeEvent } from '../data/financialId'
import { DEMO_TODAY } from '../data/financialId'
import { LifeEventIcon, StatusTags, lifeEventArt, withTag } from './profileParts'
import { CaretIcon } from '../components/profileIcons'
import { CloseIcon } from '../components/icons'
import SelectMenu from '../components/SelectMenu'
import { InlineTitle, ReadBackCheck, ReadBackFoot, closesOnEscape } from './ReadBack'
import icCategoryPurchase from '../assets/life-events/category-purchase.svg'
import icCategoryProfessional from '../assets/life-events/category-professional.svg'
import icCategoryPersonal from '../assets/life-events/category-personal.svg'
import moodWorried from '../assets/moods/worried.svg'
import moodUnsure from '../assets/moods/unsure.svg'
import moodNeutral from '../assets/moods/neutral.svg'
import moodGood from '../assets/moods/good.svg'
import moodGreat from '../assets/moods/great.svg'

/* The picker's own shape: three sections, each a list of the events filed
   under it, in the order the phone shows them. */
const CATEGORIES: { name: string; icon: string; events: string[] }[] = [
  {
    name: 'Purchase',
    icon: icCategoryPurchase,
    events: ['Vehicle purchase', 'Property purchase', 'Other'],
  },
  {
    name: 'Professional',
    icon: icCategoryProfessional,
    events: [
      'Education',
      'Career change',
      'Relocation',
      'New business',
      'Sale of business',
      'Retirement',
      'Other',
    ],
  },
  {
    name: 'Personal',
    icon: icCategoryPersonal,
    events: [
      'New marriage',
      'New baby',
      'Separation',
      'Divorce',
      'Death of parent(s)',
      'Widowhood',
      'Inheritance',
      'Health issues',
      'Debt repayment',
      'Vacation',
      'Empty nester',
      'Other',
    ],
  },
]

/* The same five faces the client taps in their own app and the table shows in
   the Sentiment column, lowest to highest. */
const FACES = [
  { art: moodWorried, label: 'Frustrated' },
  { art: moodUnsure, label: 'Concerned' },
  { art: moodNeutral, label: 'Neutral' },
  { art: moodGood, label: 'Positive' },
  { art: moodGreat, label: 'Delighted' },
]

export function SentimentFace({ level }: { level: number }) {
  const f = FACES[level - 1]
  if (!f) return null
  return (
    <span className="le-face-read" title={f.label}>
      <img src={f.art} alt={f.label} />
    </span>
  )
}

/* ── adding one ─────────────────────────────────────────────────────────── */

export function AddLifeEventModal({
  event,
  client,
  onClose,
  onSave,
}: {
  /** An event already on the page, opened to be changed. */
  event?: LifeEvent
  /** The client is adding it, on their own phone. */
  client?: boolean
  onClose: () => void
  onSave: (e: LifeEvent) => void
}) {
  const [kind, setKind] = useState<string | null>(event?.kind ?? null)
  const [open, setOpen] = useState<string | null>(null)
  const [text, setText] = useState(event?.text ?? '')
  const [details, setDetails] = useState(event?.details ?? '')
  const [date, setDate] = useState(event?.date ?? '')
  const [sentiment, setSentiment] = useState(event?.sentiment ?? 0)
  const [completed, setCompleted] = useState(event?.completed ?? '')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = () => {
    if (!kind) return
    onSave({
      ...event,
      kind,
      /* Unnamed, it is called what it is — better than an empty line on a
         card somebody has to open to understand. */
      text: text.trim() || kind,
      date: date.trim(),
      details: details.trim() || undefined,
      sentiment: sentiment || undefined,
      completed: completed || undefined,
      advisorAdded: client ? event?.advisorAdded : true,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal le-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{event ? 'Edit Life Event' : 'Add a Life Event'}</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {kind === null ? (
          <div className="modal-body le-body">
            {/* Three sections, one open at a time: the list is thirty events
                long and all of it at once is a wall. */}
            {CATEGORIES.map((c) => (
              <div className={`le-cat ${open === c.name ? 'is-open' : ''}`} key={c.name}>
                <button
                  className="le-cat-head"
                  type="button"
                  aria-expanded={open === c.name}
                  onClick={() => setOpen((o) => (o === c.name ? null : c.name))}
                >
                  <img className="le-cat-ic" src={c.icon} alt="" />
                  <span className="le-cat-name">{c.name}</span>
                  <CaretIcon up={open === c.name} />
                </button>
                <div className={`collapse ${open === c.name ? 'open' : ''}`}>
                  <div className="collapse-inner">
                    <ul className="le-kinds">
                      {c.events.map((e) => (
                        <li key={e}>
                          <button className="le-kind" type="button" onClick={() => setKind(e)}>
                            <img className="le-kind-ic" src={lifeEventArt(e, e)} alt="" />
                            {e}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="modal-body le-body">
              <div className="le-kind-line">
                <LifeEventIcon kind={kind} text={kind} />
                <h3 className="le-kind-name">{kind}</h3>
                {/* Who is filling this in, at the end of the line the event
                    names itself on rather than on a line of its own. */}
                {!client && <span className="le-advisor">Advisor added</span>}
              </div>

              <label className="le-label" htmlFor="le-text">
                Describe or name this life event
              </label>
              <input
                id="le-text"
                className="le-input"
                value={text}
                autoFocus
                placeholder="Describe or name this life event."
                onChange={(e) => setText(e.target.value)}
              />

              <label className="le-label" htmlFor="le-details">
                More details (optional)
              </label>
              <textarea
                id="le-details"
                className="le-input le-area"
                value={details}
                rows={2}
                placeholder="Add more details here."
                onChange={(e) => setDetails(e.target.value)}
              />

              <label className="le-label" htmlFor="le-date">
                Event date (optional)
              </label>
              <input
                id="le-date"
                className="le-input"
                value={date}
                placeholder="MM/DD/YYYY"
                onChange={(e) => setDate(e.target.value)}
              />

              <span className="le-label">How do you feel about it? (optional)</span>
              <div className="le-faces">
                {FACES.map((f, i) => (
                  <button
                    className={`le-face ${sentiment === i + 1 ? 'is-on' : ''}`}
                    type="button"
                    key={f.label}
                    aria-label={f.label}
                    aria-pressed={sentiment === i + 1}
                    onClick={() => setSentiment((s) => (s === i + 1 ? 0 : i + 1))}
                  >
                    <img src={f.art} alt="" />
                  </button>
                ))}
              </div>

              <label className="le-complete">
                <input
                  type="checkbox"
                  checked={!!completed}
                  onChange={() => setCompleted((c) => (c ? '' : DEMO_TODAY))}
                />
                <span>{completed ? `Marked complete: ${completed}` : 'Mark complete'}</span>
              </label>
            </div>
            <div className="modal-footer le-foot">
              <button className="btn btn-outline" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={save}>
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── reading one back ───────────────────────────────────────────────────── */

/* Every kind the picker lists, for changing one in place. */
const ALL_KINDS = CATEGORIES.flatMap((c) => c.events)

export default function LifeEventModal({
  event,
  client,
  onClose,
  onSave,
  onToggleComplete,
  onDelete,
}: {
  event: LifeEvent
  /** Read on the client's own phone. "Advisor added" shows there too: it is
      on the events her advisor put on her page, never on her own. */
  client?: boolean
  onClose: () => void
  /** What changed, handed back as the panel closes — the event's own fields,
      changed where they are read (no pencil, no second panel). Without it the
      event is only read. */
  onSave?: (e: LifeEvent) => void
  onToggleComplete?: () => void
  onDelete?: () => void
}) {
  const editable = !!onSave
  const [text, setText] = useState(event.text)
  const [kind, setKind] = useState(event.kind)
  const [details, setDetails] = useState(event.details ?? '')
  const [date, setDate] = useState(event.date ?? '')
  const [sentiment, setSentiment] = useState(event.sentiment ?? 0)

  const next: LifeEvent = {
    ...event,
    kind,
    /* Unnamed, it is called what it is. */
    text: text.trim().replace(/\s+/g, ' ') || kind,
    details: details.trim() || undefined,
    date: date.trim(),
    sentiment: sentiment || undefined,
  }
  const changed =
    next.kind !== event.kind ||
    next.text !== event.text ||
    (next.details ?? '') !== (event.details ?? '') ||
    next.date !== (event.date ?? '') ||
    (next.sentiment ?? 0) !== (event.sentiment ?? 0)

  /* Every way out keeps what was typed. An advisor's change marks it as
     theirs, as the form always has; the client's own does not. */
  const close = () => {
    if (onSave && changed)
      onSave(withTag({ ...next, advisorAdded: client ? event.advisorAdded : true }, 'Updated'))
    onClose()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (closesOnEscape(e)) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const pills = (event.tags?.length || event.advisorAdded) && (
    <div className="card-pills">
      <StatusTags tags={event.tags} />
      {event.advisorAdded && <span className="le-advisor">Advisor added</span>}
    </div>
  )

  return (
    <div className="modal-backdrop" onClick={close} role="dialog" aria-modal="true">
      <div className="modal le-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Life Event</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={close}>
            <CloseIcon />
          </button>
        </div>

        {editable ? (
          <div className="modal-body le-body le-live">
            <div className="qm-read">
              {pills}
              <InlineTitle value={text} original={event.text} label="Life event" onChange={setText} />
            </div>

            <span className="le-label">Event type</span>
            <SelectMenu
              className="le-input"
              value={kind}
              options={ALL_KINDS.includes(kind) ? ALL_KINDS : [kind, ...ALL_KINDS]}
              onChange={setKind}
            />

            <label className="le-label" htmlFor="le-details">
              More details (optional)
            </label>
            <textarea
              id="le-details"
              className="le-input le-area"
              value={details}
              rows={2}
              placeholder="Add more details here."
              onChange={(e) => setDetails(e.target.value)}
            />

            <label className="le-label" htmlFor="le-date">
              Event date (optional)
            </label>
            <input
              id="le-date"
              className="le-input"
              value={date}
              placeholder="MM/DD/YYYY"
              onChange={(e) => setDate(e.target.value)}
            />

            <span className="le-label">How do you feel about it? (optional)</span>
            <div className="le-faces">
              {FACES.map((f, i) => (
                <button
                  className={`le-face ${sentiment === i + 1 ? 'is-on' : ''}`}
                  type="button"
                  key={f.label}
                  aria-label={f.label}
                  aria-pressed={sentiment === i + 1}
                  onClick={() => setSentiment((s) => (s === i + 1 ? 0 : i + 1))}
                >
                  <img src={f.art} alt="" />
                </button>
              ))}
            </div>

            {onToggleComplete && (
              <ReadBackCheck label="Completed" on={event.completed} onToggle={onToggleComplete} />
            )}
          </div>
        ) : (
          <div className="modal-body le-body le-read">
            {pills}
            <h3 className="le-title">{event.text}</h3>
            <dl className="goal-rows">
              <dt>Event type</dt>
              <dd>{event.kind}</dd>
              {event.details && (
                <>
                  <dt>Details</dt>
                  <dd>{event.details}</dd>
                </>
              )}
              {event.date && (
                <>
                  <dt>Event date</dt>
                  <dd>{event.date}</dd>
                </>
              )}
              {event.sentiment && (
                <>
                  {/* The face has no baseline to sit on, so its row centres
                      instead of aligning to one. */}
                  <dt className="le-row-face">Sentiment</dt>
                  <dd className="le-row-face">
                    <SentimentFace level={event.sentiment} />
                  </dd>
                </>
              )}
              {event.completed && (
                <>
                  <dt>Completed</dt>
                  <dd>{event.completed}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        {(editable || onDelete) && (
          <ReadBackFoot noun="life event" onDelete={onDelete} onDone={close} />
        )}
      </div>
    </div>
  )
}
