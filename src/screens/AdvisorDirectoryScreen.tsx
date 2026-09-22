// Who has taken the advisor flow, and who has been asked to.
//
// The flow itself keeps its answers on whatever device they were typed on. This
// page is the other end of a link: an advisor answers on their own phone and
// their name turns up here, because the sitting went to the shared directory on
// its way past (see `data/advisorDirectory`).
//
// Two kinds of row, one list. Somebody who has answered something is a person
// with a Business ID you can open; somebody who has only been sent a link is a
// name and a link to send again. Keeping them apart in two tables would mean
// reading both to answer "who have I asked, and did they do it".

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  byRecency,
  createInvite,
  deleteEntry,
  deleteInvite,
  greeting,
  inviteLink,
  listEntries,
  listInvites,
  type Entry,
  type Invite,
  type InviteBrand,
  type Trouble,
} from '../data/advisorDirectory'
import { advisor } from '../data/advisorFlow'
import { CLIENT_BRANDS } from '../components/clientBrands'
import './advisorDirectory.css'

/* One line per person, whichever kind they are. An entry and an invite are
   different records in Firestore and the same thing on this page. */
interface Row {
  key: string
  name: string
  meta: string
  /** Null for somebody who has only been invited — there is nothing to open. */
  entryId: string | null
  answered: number
  total: number
  at: string
  /** The link, for a row that is still waiting on somebody. */
  link: string | null
  /** The invite behind the row, where there is one — a sitting answered through
      a link has both, and removing the person means removing both. */
  token: string | null
  /** The worked example cannot be removed. It is what a room is walked through,
      and a directory that can be emptied of it is one tidy-up away from a demo
      with nothing in it. Matched on the walkthrough's own name rather than a
      string typed here, so renaming him renames this. */
  protected: boolean
  state: 'answered' | 'started' | 'opened' | 'sent'
}

/* The two bars a link can arrive under, each wearing its own colour. The tint
   is read off the brand rather than written here, so the segment paints what
   the advisor will actually see; knomee's is the token, because knomee is not
   one of the client brands. A segment where both options were plum said the
   choice had been made and then showed no sign of it. */
const SEND_AS: { id: InviteBrand; label: string; tint: string }[] = [
  { id: 'knomee', label: 'Knomee', tint: 'var(--k-plum)' },
  {
    id: 'acme',
    label: 'Acme',
    tint: CLIENT_BRANDS.find((b) => b.id === 'acme')?.primary ?? 'var(--k-plum)',
  },
]

const STATE_LABEL: Record<Row['state'], string> = {
  answered: 'Finished',
  started: 'Part way',
  opened: 'Opened the link',
  sent: 'Link sent',
}

const when = (iso: string) => {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString()
}

/* An invite whose advisor has answered something is represented by their
   sitting, not by the invite — otherwise every invited person would appear
   twice, once as a name and once as themselves. */
function rowsFrom(entries: Entry[], invites: Invite[]): Row[] {
  const claimed = new Set(entries.map((e) => e.token).filter(Boolean) as string[])
  const fromEntries: Row[] = entries.map((e) => ({
    key: `e:${e.id}`,
    name: e.name,
    meta: [e.role, e.book, e.firm].filter(Boolean).join(' · '),
    entryId: e.id,
    answered: e.answered,
    total: e.total,
    at: e.at,
    link: e.token ? inviteLink(e.token) : null,
    token: e.token,
    protected: e.name.trim() === advisor.name,
    state: e.answered >= e.total ? 'answered' : 'started',
  }))
  const fromInvites: Row[] = invites
    .filter((i) => !claimed.has(i.token))
    .map((i) => ({
      key: `i:${i.token}`,
      name: i.name.trim() || 'Advisor (no name)',
      meta: i.name.trim() ? 'Invited' : 'Invited without a name',
      entryId: null,
      answered: 0,
      total: 0,
      at: i.openedAt ?? i.createdAt,
      link: inviteLink(i.token),
      token: i.token,
      protected: false,
      state: i.openedAt ? 'opened' : 'sent',
    }))
  return byRecency([...fromEntries, ...fromInvites])
}

/* ── the invite panel ───────────────────────────────────────────────────── */

function InvitePanel({
  onDone,
  onTrouble,
}: {
  onDone: () => void
  onTrouble: (t: Trouble) => void
}) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState<InviteBrand>('knomee')
  const [made, setMade] = useState<Invite | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const make = async () => {
    setBusy(true)
    const { invite, trouble } = await createInvite(name, brand)
    setBusy(false)
    onTrouble(trouble)
    // A link that never reached the directory would open to nothing, so it is
    // not offered — the name is still in the field to try again with.
    if (!trouble) {
      setMade(invite)
      onDone()
    }
  }

  const copy = async () => {
    if (!made) return
    try {
      await navigator.clipboard.writeText(inviteLink(made.token))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the field beside the button holds the link and is
      // selectable, so there is always a way to get it out.
      setCopied(false)
    }
  }

  if (made) {
    const link = inviteLink(made.token)
    return (
      <div className="adir-invite is-made">
        <div className="adir-invite-head">
          <b>Link ready</b>
          <span>
            Opens straight into the flow and says “{greeting(made.name)}”, under{' '}
            {made.brand === 'acme' ? 'Acme’s' : 'knomee’s'} bar. Nothing else — no dashboard, no
            sample answers, no way back into the demo.
          </span>
        </div>
        <div className="adir-link-row">
          <input className="adir-link" readOnly value={link} onFocus={(e) => e.target.select()} />
          <button className="btn btn-primary" type="button" onClick={copy}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <div className="adir-invite-foot">
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => {
              setMade(null)
              setName('')
            }}
          >
            Invite another
          </button>
          <a className="adir-open" href={link} target="_blank" rel="noreferrer">
            Open it yourself ↗
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="adir-invite">
      <div className="adir-invite-head">
        <b>Invite a new advisor</b>
      </div>
      <div className="adir-link-row">
        <input
          className="adir-name"
          value={name}
          maxLength={60}
          placeholder="Their name (optional)"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void make()
          }}
        />
        {/* Who the advisor is told they are talking to. knomee leads because it
            is the default — a link to somebody who has signed nothing should
            not arrive wearing a firm's branding unless you chose that. */}
        <span className="adir-seg-wrap">
          <span className="adir-seg-label" id="adir-send-as">
            Send as:
          </span>
          <span className="adir-seg" role="group" aria-labelledby="adir-send-as">
            {SEND_AS.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`adir-seg-btn ${brand === b.id ? 'is-on' : ''}`}
                aria-pressed={brand === b.id}
                style={{ '--seg-tint': b.tint } as CSSProperties}
                onClick={() => setBrand(b.id)}
              >
                {b.label}
              </button>
            ))}
          </span>
        </span>
        <button className="btn btn-primary" type="button" disabled={busy} onClick={make}>
          {busy ? 'Making…' : 'Generate link'}
        </button>
      </div>
    </div>
  )
}

/* Removing somebody is two clicks, not a modal: the first arms it, the second
   does it, and walking away disarms it on its own. A dialog for this would be
   one more thing to dismiss on a page whose whole job is tidying a list — and a
   bare ✕ that fired on the first click would sooner or later take eight minutes
   of somebody's answers by accident. */
function DeleteCell({ row, onGone }: { row: Row; onGone: (t: Trouble) => void }) {
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!armed) return
    const id = window.setTimeout(() => setArmed(false), 4000)
    return () => window.clearTimeout(id)
  }, [armed])

  const remove = async () => {
    setBusy(true)
    /* A person answered through a link has both records. Removing the sitting
       and leaving the invite would put them straight back on the list as
       somebody who has not started, which is not what "delete" looked like it
       would do. */
    const troubles: Trouble[] = []
    if (row.entryId) troubles.push(await deleteEntry(row.entryId))
    if (row.token) troubles.push(await deleteInvite(row.token))
    setBusy(false)
    setArmed(false)
    onGone(troubles.find(Boolean) ?? null)
  }

  if (busy) return <span className="adir-meta">Removing…</span>
  return armed ? (
    <button className="adir-del is-armed" type="button" onClick={remove}>
      Really?
    </button>
  ) : (
    <button
      className="adir-del"
      type="button"
      title={`Remove ${row.name} from the directory`}
      aria-label={`Remove ${row.name} from the directory`}
      onClick={() => setArmed(true)}
    >
      ✕
    </button>
  )
}

/* ── the page ───────────────────────────────────────────────────────────── */

export default function AdvisorDirectoryScreen({ onOpen }: { onOpen: (entryId: string) => void }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [trouble, setTrouble] = useState<Trouble>(null)
  const [inviting, setInviting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [e, i] = await Promise.all([listEntries(), listInvites()])
    setEntries(e.values)
    setInvites(i.values)
    // Either call failing is worth saying once; both failing is the same
    // sentence twice.
    setTrouble(e.trouble ?? i.trouble)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(() => rowsFrom(entries, invites), [entries, invites])
  const finished = rows.filter((r) => r.state === 'answered').length
  const waiting = rows.filter((r) => r.state === 'sent' || r.state === 'opened').length

  return (
    <>
      <div className="page-title-row">
        <h1 className="page-title">Advisor Recruit (Testing Entries)</h1>
        <div className="adir-actions">
          <button className="btn btn-outline" type="button" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setInviting((v) => !v)}
          >
            Invite New Advisor
          </button>
        </div>
      </div>

      {trouble && (
        <div className="adir-trouble">
          {trouble} The list below is whatever loaded before that happened.
        </div>
      )}

      {inviting && <InvitePanel onDone={load} onTrouble={setTrouble} />}

      <section className="card adir-card">
        <header className="card-head">
          <div className="card-title">
            <span>Everyone who has opened the flow</span>
          </div>
          <span className="adir-count">
            {rows.length} {rows.length === 1 ? 'person' : 'people'}
            {finished ? ` · ${finished} finished` : ''}
            {waiting ? ` · ${waiting} not started` : ''}
          </span>
        </header>

        {rows.length === 0 ? (
          <div className="adir-empty">
            {loading ? (
              'Reading the directory…'
            ) : (
              <>
                <b>Nobody yet.</b> Generate a link and send it to an advisor, or walk the flow
                yourself from the demo menu — either way the sitting turns up here.
              </>
            )}
          </div>
        ) : (
          <table className="adir-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Practice</th>
                <th>Progress</th>
                <th>Last seen</th>
                <th>Link</th>
                <th className="adir-del-col"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className={r.entryId ? '' : 'is-waiting'}>
                  <td>
                    {/* A name is a link only when there is something behind it.
                        Somebody who has not answered has no Business ID yet,
                        and a link to an empty one is a dead end. */}
                    {r.entryId ? (
                      <button
                        className="adir-name-btn"
                        type="button"
                        onClick={() => onOpen(r.entryId as string)}
                      >
                        {r.name}
                      </button>
                    ) : (
                      <span className="adir-name-flat">{r.name}</span>
                    )}
                  </td>
                  <td className="adir-meta">{r.meta || '—'}</td>
                  <td className="adir-prog">
                    {r.total ? (
                      <>
                        <span className="adir-prog-track">
                          <i style={{ width: `${Math.round((r.answered / r.total) * 100)}%` }} />
                        </span>
                        <span className="adir-prog-n">
                          {r.answered} of {r.total}
                        </span>
                      </>
                    ) : (
                      <span className="adir-state">{STATE_LABEL[r.state]}</span>
                    )}
                  </td>
                  <td className="adir-when">{when(r.at)}</td>
                  <td>
                    {r.link ? (
                      <button
                        className="adir-copy"
                        type="button"
                        onClick={() => void navigator.clipboard?.writeText(r.link as string)}
                      >
                        Copy
                      </button>
                    ) : (
                      <span className="adir-meta">walked in</span>
                    )}
                  </td>
                  <td className="adir-del-col">
                    {/* No control at all rather than a disabled one: there is
                        nothing here a person could enable, so a greyed ✕ would
                        only invite the click it refuses. */}
                    {!r.protected && (
                      <DeleteCell
                        row={r}
                        onGone={(t) => {
                          setTrouble(t)
                          void load()
                        }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="adir-note">
        A name opens that person's Business ID on the phone, the way they saw it — their readiness
        and toolkit are in its menu. Rows marked “walked in” were answered from the demo menu
        rather than through a link. Removing a row throws away the answers behind it and stops
        their link working; the device they answered on keeps its own copy.
      </p>
    </>
  )
}
