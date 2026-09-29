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

import { useEffect, useState } from 'react'
import './sharing.css'
import SelectMenu from '../components/SelectMenu'
import icTeam from '../assets/adventures/my-team.svg'

export const ROLES = ['partner', 'advisor', 'banker', 'accountant', 'attorney', 'insurance agent'] as const
type Role = (typeof ROLES)[number]
type Person = { id: string; name: string; role: Role }
type Access = Record<string, { on: boolean; off: string[] }>

export type SharedCard = { id: string; title: string; icon: string }

const TEAM: Person[] = [
  { id: 'p1', name: 'Alex', role: 'partner' },
  { id: 'p2', name: 'Sam', role: 'advisor' },
  { id: 'p3', name: 'Florence', role: 'banker' },
  { id: 'p4', name: 'Kim', role: 'accountant' },
]
const KEY = 'knomee.sharing.v1'

function useStored<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* private window: the choices last the session */
    }
  }, [key, v])
  return [v, setV] as const
}

const Lock = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.6" />
    <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" strokeLinecap="round" />
  </svg>
)
const Pencil = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M10.8 2.8a1.6 1.6 0 0 1 2.3 2.3L6.2 12l-3 .8.8-3 6.8-7Z" strokeLinejoin="round" />
  </svg>
)
export default function SharingView({ cards }: { cards: SharedCard[] }) {
  const [team, setTeam] = useStored<Person[]>(`${KEY}.team`, TEAM)
  const [access, setAccess] = useStored<Access>(`${KEY}.access`, {})
  const [editing, setEditing] = useState<string | null>(null)
  const of = (id: string) => access[id] ?? { on: true, off: [] }
  const setCard = (id: string, patch: Partial<Access[string]>) =>
    setAccess((a) => ({ ...a, [id]: { ...of(id), ...patch } }))
  const addPerson = () => {
    const id = `p${Date.now()}`
    setTeam((t) => [...t, { id, name: '', role: 'advisor' }])
    setEditing(id)
  }
  const shared = cards.filter((c) => of(c.id).on).length

  return (
    <div className="sh">
      <p className="sh-lead">
        Your Financial ID is yours. Choose who on your team sees each part of it — everything is
        shared until you say otherwise, and you can change it any time.
      </p>

      {/* The team: the people the ID can go to, each with a role. */}
      <section className="pp-card sh-team">
        <div className="pp-card-head">
          <span className="pp-card-title">
            <img className="pp-card-ic" src={icTeam} alt="" />
            My Team
          </span>
          <button className="sh-add" type="button" aria-label="Add someone to your team" onClick={addPerson}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M8 3v10M3 8h10" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ul className="sh-people">
          {team.map((p, i) => (
            <li className="sh-person" key={p.id} style={{ ['--i' as string]: i }}>
              <span className="sh-avatar" aria-hidden>
                {(p.name || '?').charAt(0).toUpperCase()}
              </span>
              {editing === p.id ? (
                <input
                  className="sh-name-input"
                  autoFocus
                  value={p.name}
                  placeholder="Their name"
                  onChange={(e) => setTeam((t) => t.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))}
                  onBlur={() => {
                    setEditing(null)
                    setTeam((t) => t.filter((x) => x.id !== p.id || x.name.trim()))
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                />
              ) : (
                <button className="sh-name" type="button" onClick={() => setEditing(p.id)}>
                  {p.name}
                  <Pencil />
                </button>
              )}
              {/* The product's own dropdown, not the browser's list. */}
              <SelectMenu
                className="sh-role"
                value={p.role}
                options={[...ROLES]}
                onChange={(v) => setTeam((t) => t.map((x) => (x.id === p.id ? { ...x, role: v as Role } : x)))}
              />
            </li>
          ))}
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
                <div className="sh-chips">
                  {team.map((p, k) => {
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
    </div>
  )
}
