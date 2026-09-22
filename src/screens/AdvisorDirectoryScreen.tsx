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

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  byRecency,
  createInvite,
  greeting,
  inviteLink,
  listEntries,
  listInvites,
  type Entry,
  type Invite,
  type Trouble,
} from '../data/advisorDirectory'
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
  state: 'answered' | 'started' | 'opened' | 'sent'
}

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
  const [made, setMade] = useState<Invite | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const make = async () => {
    setBusy(true)
    const { invite, trouble } = await createInvite(name)
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
            Opens straight into the flow and says “{greeting(made.name)}”. Nothing else — no
            dashboard, no sample answers, no way back into the demo.
          </span>
        </div>
        <div className="adir-link-row">
          <input className="adir-link" readOnly value={link} onFocus={(e) => e.target.select()} />
          <button className="adir-btn adir-btn-go" type="button" onClick={copy}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <div className="adir-invite-foot">
          <button
            className="adir-btn"
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
        <span>
          The name goes on their first screen. Leave it blank and the flow opens “Welcome,
          Advisor!” — which is the right thing to say on a link you are handing out before you
          know who is taking it.
        </span>
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
        <button className="adir-btn adir-btn-go" type="button" disabled={busy} onClick={make}>
          {busy ? 'Making…' : 'Generate link'}
        </button>
      </div>
    </div>
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
        <h1 className="page-title">Advisor Flow — Who Has Answered</h1>
        <div className="adir-actions">
          <button className="adir-btn" type="button" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button
            className="adir-btn adir-btn-go"
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

      <section className="card">
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="adir-note">
        A name opens that person's Business ID on the phone, the way they saw it — their readiness
        and toolkit are in its menu. Rows marked “walked in” were answered from the demo menu
        rather than through a link.
      </p>
    </>
  )
}
