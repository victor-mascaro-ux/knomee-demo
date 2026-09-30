/* Who sees it — the other face of her Financial ID.
 *
 * The same page, read for who can see each part of it rather than for what it
 * says: her team first (the people her answers can go to, each with a role),
 * then every card of the ID with its own switch and the people it goes to.
 * On by default, one tap to take a person off a card or the card off
 * everybody. It is her data; this is where that is visible.
 *
 * Kept on this device: a demo convenience, so the choices survive switching
 * tabs and reloading. Nothing here is sent anywhere.
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './sharing.css'
import SelectMenu from '../components/SelectMenu'
import { AddButton, EmptyState, EMPTY_ART } from './profileParts'
import icTeam from '../assets/adventures/my-team.svg'

export const ROLES = ['partner', 'advisor', 'banker', 'accountant', 'attorney', 'insurance agent']
/* An advisor's team is the practice's: the people a Business ID goes to. */
export const ADVISOR_ROLES = ['business partner', 'junior advisor', 'associate', 'compliance', 'spouse', 'accountant']
type Role = string
export type Person = { id: string; name: string; role: Role; email?: string }
type Access = Record<string, { on: boolean; off: string[] }>

export type SharedCard = { id: string; title: string; icon: string }

export const CLIENT_TEAM: Person[] = [
  { id: 'p1', name: 'Alex', role: 'partner' },
  { id: 'p2', name: 'Sam', role: 'advisor' },
  { id: 'p3', name: 'Florence', role: 'banker' },
  { id: 'p4', name: 'Kim', role: 'accountant' },
]
/* v2: v1 kept each page's starting team as if it had been chosen. */
const KEY = 'knomee.sharing.v2'

function useStored<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  /* Saved only once something is changed: the team a page starts with is not
     a choice anybody made, and storing it would keep it after it changes. */
  const changed = useRef(false)
  useEffect(() => {
    if (!changed.current) return
    try {
      window.localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* private window: the choices last the session */
    }
  }, [key, v])
  const set = (next: T | ((prev: T) => T)) => {
    changed.current = true
    setV(next)
  }
  return [v, set] as const
}

const Lock = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.6" />
    <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" strokeLinecap="round" />
  </svg>
)

/* The switch between the ID's two faces: what it says, and who sees it. */
export function SharingLens({ value, onChange }: { value: 'id' | 'sharing'; onChange: (v: 'id' | 'sharing') => void }) {
  return (
    <div className={`sh-lens${value === 'sharing' ? ' is-second' : ''}`} role="group" aria-label="ID view">
      <i className="sh-lens-pill" aria-hidden />
      <button type="button" aria-pressed={value === 'id'} onClick={() => onChange('id')}>
        My ID
      </button>
      <button type="button" aria-pressed={value === 'sharing'} onClick={() => onChange('sharing')}>
        Who sees it
      </button>
    </div>
  )
}

export default function SharingView({
  cards,
  team: startTeam = CLIENT_TEAM,
  roles = ROLES,
  who = 'client',
  idName = 'Financial ID',
  sender,
}: {
  /** Whoever sent the link, at the head of the team: named, marked as the
      one who sent it, and not removable, so the page opens on a person rather
      than an empty list. */
  sender?: Person
  cards: SharedCard[]
  /** The team they start with. */
  team?: Person[]
  roles?: string[]
  /** Whose choices these are, so two people's phones keep their own. */
  who?: string
  idName?: string
}) {
  const store = who === 'client' ? KEY : `${KEY}.${who}`
  const [team, setTeam] = useStored<Person[]>(`${store}.team`, startTeam)
  const [access, setAccess] = useStored<Access>(`${store}.access`, {})
  /* The person being added or changed, in the form; null when it is shut. */
  const [form, setForm] = useState<Person | null>(null)
  const everyone = sender ? [sender, ...team] : team
  const of = (id: string) => access[id] ?? { on: true, off: [] }
  const setCard = (id: string, patch: Partial<Access[string]>) =>
    setAccess((a) => ({ ...a, [id]: { ...of(id), ...patch } }))
  const addPerson = () => setForm({ id: `p${Date.now()}`, name: '', email: '', role: roles[0] })
  const savePerson = (p: Person) => {
    setTeam((t) => (t.some((x) => x.id === p.id) ? t.map((x) => (x.id === p.id ? p : x)) : [...t, p]))
    setForm(null)
  }
  const shared = cards.filter((c) => of(c.id).on).length

  return (
    <div className="sh">
      <p className="sh-lead">
        Your {idName} is yours. Choose who on your team sees each part of it — everything is
        shared until you say otherwise, and you can change it any time.
      </p>

      {/* The team: the people the ID can go to, each with a role. */}
      <section className="pp-card sh-team">
        <div className="pp-card-head">
          <span className="pp-card-title">
            <img className="pp-card-ic" src={icTeam} alt="" />
            My Team
          </span>
          <AddButton label="Add someone to your team" onClick={addPerson} />
        </div>
        {everyone.length === 0 && (
          <EmptyState art={EMPTY_ART.team} label="Add someone to your team" cta onClick={addPerson} />
        )}
        <ul className="sh-people">
          {everyone.map((p, i) => {
            const isSender = p.id === sender?.id
            return (
              <li className="sh-person" key={p.id} style={{ ['--i' as string]: i }}>
                <span className="sh-avatar" aria-hidden>
                  {(p.name || '?').charAt(0).toUpperCase()}
                </span>
                {/* Who they are, in one look: name, then what they do and how
                    to reach them. Tapping opens the form they were added with. */}
                <button
                  className="sh-who"
                  type="button"
                  disabled={isSender}
                  onClick={() => setForm(p)}
                  aria-label={isSender ? undefined : `Change ${p.name}`}
                >
                  <b className="sh-who-name">
                    {p.name}
                    {isSender && <span className="sh-tag">Sent your invite</span>}
                  </b>
                  <span className="sh-who-sub">
                    {p.role}
                    {p.email ? ` · ${p.email}` : ''}
                  </span>
                </button>
                {!isSender && (
                  <button
                    className="sh-remove"
                    type="button"
                    aria-label={`Remove ${p.name || 'this person'} from your team`}
                    onClick={() => {
                      setTeam((t) => t.filter((x) => x.id !== p.id))
                      setAccess((acc) =>
                        Object.fromEntries(
                          Object.entries(acc).map(([k, v]) => [k, { ...v, off: v.off.filter((x) => x !== p.id) }]),
                        ),
                      )
                    }}
                  >
                    <svg viewBox="0 0 16 16" width="10" height="10" fill="none" aria-hidden>
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <p className="sh-count">
        <b key={shared} className="sh-tick">
          {shared}
        </b>{' '}
        of {cards.length} parts shared
      </p>

      {/* Every card of the ID, with its switch and the people it goes to. */}
      {cards.map((c, n) => {
        const a = of(c.id)
        return (
          <section className={`pp-card sh-card${a.on ? '' : ' is-private'}`} key={c.id} style={{ ['--i' as string]: n }}>
            <div className="pp-card-head">
              <span className="pp-card-title">
                <img className="pp-card-ic" src={c.icon} alt="" />
                {c.title}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={a.on}
                aria-label={`Share ${c.title}`}
                className="af-switch sh-switch"
                onClick={() => setCard(c.id, { on: !a.on })}
              >
                <span>{a.on ? 'Shared' : 'Private'}</span>
                <i aria-hidden />
              </button>
            </div>
            <div className={`sh-fold${a.on ? ' is-open' : ''}`}>
              <div className="sh-fold-in">
                <span className="pp-fy-label">Shared with</span>
                {everyone.length === 0 && (
                  <p className="sh-none">Add the people on your team, then choose who sees this.</p>
                )}
                <div className="sh-chips">
                  {everyone.map((p, k) => {
                    const on = !a.off.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        style={{ ['--i' as string]: k }}
                        tabIndex={a.on ? 0 : -1}
                        className={`sh-chip${on ? ' is-on' : ''}`}
                        aria-pressed={on}
                        onClick={() =>
                          setCard(c.id, { off: on ? [...a.off, p.id] : a.off.filter((x) => x !== p.id) })
                        }
                      >
                        <span className="sh-chip-av" aria-hidden key={on ? 'on' : 'off'}>
                          {on ? (p.name || '?').charAt(0).toUpperCase() : <Lock />}
                        </span>
                        <span className="sh-chip-text">
                          <b>{p.name || 'New'}</b>
                          <span>{p.role}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className={`sh-fold${a.on ? '' : ' is-open'}`}>
              <div className="sh-fold-in">
                <p className="sh-private">
                  <span className="sh-private-lock" key={a.on ? 'on' : 'off'}>
                    <Lock />
                  </span>
                  Only you can see this.
                </p>
              </div>
            </div>
          </section>
        )
      })}
      {form && (
        <PersonForm
          person={form}
          roles={roles}
          isNew={!team.some((x) => x.id === form.id)}
          onCancel={() => setForm(null)}
          onSave={savePerson}
        />
      )}
    </div>
  )
}

/* Adding someone, or changing them: their name, their email and what they
   do, in a sheet over the phone's screen (or over the page, off a phone). */
function PersonForm({
  person,
  roles,
  isNew,
  onCancel,
  onSave,
}: {
  person: Person
  roles: string[]
  isNew: boolean
  onCancel: () => void
  onSave: (p: Person) => void
}) {
  const [p, setP] = useState<Person>(person)
  const anchor = useRef<HTMLSpanElement>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setHost((anchor.current?.closest('.cx-screen') as HTMLElement | null) ?? document.body)
  }, [])
  const ok = !!p.name.trim() && /\S+@\S+\.\S+/.test(p.email ?? '')
  const sheet = (
    <div className={`sh-form-back${host && host !== document.body ? ' is-in-phone' : ''}`} onClick={onCancel}>
      <form
        className="sh-form"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (ok) onSave({ ...p, name: p.name.trim(), email: p.email?.trim() })
        }}
      >
        <h3 className="sh-form-title">{isNew ? 'Add someone to your team' : 'Change their details'}</h3>
        <label className="sh-field">
          <span>Name</span>
          <input autoFocus value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder="Their name" />
        </label>
        <label className="sh-field">
          <span>Email</span>
          <input
            type="email"
            value={p.email ?? ''}
            onChange={(e) => setP({ ...p, email: e.target.value })}
            placeholder="name@firm.com"
          />
        </label>
        <div className="sh-field">
          <span>Role</span>
          <SelectMenu className="sh-role" value={p.role} options={[...roles]} onChange={(v) => setP({ ...p, role: v })} />
        </div>
        <div className="sh-form-acts">
          <button type="button" className="sh-form-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="sh-form-save" disabled={!ok}>
            {isNew ? 'Add to team' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
  return (
    <>
      <span ref={anchor} hidden />
      {host && createPortal(sheet, host)}
    </>
  )
}
