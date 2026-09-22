/* The shared directory: who has been invited to the flow, and who has taken it.
 *
 * Everything else the flow keeps, it keeps on the device — `advisorAnswers`
 * holds the sheet you are filling in, `advisorRecord` holds every sitting this
 * browser has seen. That is enough while one phone is being passed around a
 * room. It is not enough the moment a link is sent: an invited advisor answers
 * on their own phone, and the person reading the list is on another machine
 * entirely. Nothing on either device can see the other.
 *
 * So these two records — the invite and the finished sitting — live in
 * Firestore, which is the one piece of shared storage this prototype already
 * has. Same Firebase project as the commenting overlay in the repo's root
 * `index.html`, and the same top-level collection (`video-feedback`), because
 * the project's security rules allow that one name and nothing else. A doc id
 * of our own keeps us out of the overlay's way.
 *
 * Over the REST API rather than the Firebase SDK. The SDK is tens of kilobytes
 * of machinery for realtime subscriptions, and the bundle is already large
 * enough to earn a warning at build time; nothing here needs a live socket. A
 * screen fetches when it opens and when somebody asks it to again.
 *
 * Every document is one `json` string rather than a map of typed Firestore
 * fields. The REST encoding wants `{stringValue: …}` / `{integerValue: …}` per
 * leaf, which for a nested answer sheet would be a page of conversion either
 * way — and the answers are read by this app and nothing else, so a shape
 * Firestore can query buys nothing.
 *
 * The API key is a public one, already in the overlay's source. Firebase web
 * keys are project identifiers, not credentials; what may be read and written
 * is decided by the security rules, not by who holds the key.
 */

import { steps } from './advisorFlow'
import { isQuestion, type Answers } from './advisorAnswers'
import { sittingOf } from './advisorRecord'

const PROJECT = 'knomee-playbook'
const KEY = 'AIzaSyBqmxrO__M6mGypXsxQ_HgCu81qs8mXe90'
/* Our own doc under the collection the rules allow. The overlay keeps its
   comments under `knomee-demo`; this is deliberately not that. */
const ROOT = 'video-feedback/knomee-demo-directory'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

/* ── what is stored ─────────────────────────────────────────────────────── */

export interface Invite {
  /** The tail of the link, and the document id. Lowercase, because the router
      lowercases the whole hash before it reads it. */
  token: string
  /** What the admin typed when they made the link. Blank is allowed and means
      the flow greets them as "Advisor" — see `greeting()`. */
  name: string
  createdAt: string
  /** First time the link was opened. Null until somebody does. */
  openedAt: string | null
  /** When a sitting under this token last reached the directory. */
  answeredAt: string | null
}

export interface Entry {
  /** The sitting id, so answering more of the flow updates one row rather than
      adding a second person. */
  id: string
  /** The invite this came in through, where there was one. Somebody who opened
      the flow from the demo menu has none. */
  token: string | null
  name: string
  role: string
  book: string
  firm: string
  /** Last written, not first started. */
  at: string
  answered: number
  total: number
  /** Everything they tapped and typed. The Business ID is not stored — it is
      rules over these, and a stored copy would go stale the moment a rule
      changes. `derive()` rebuilds it from here. */
  answers: Answers
}

/** How many questions the flow asks, for a row that has to show "14 of 26"
    before anybody has answered anything. */
export const askedCount = steps.filter(isQuestion).length

/* ── talking to Firestore ───────────────────────────────────────────────── */

/** Anything that went wrong reaching the directory, in words a screen can show.
    Null means the last call worked. */
export type Trouble = string | null

const wrap = (v: unknown) => ({ fields: { json: { stringValue: JSON.stringify(v) } } })

/** Pulls our one field back out of a REST document. Returns null rather than
    throwing on a document written in some other shape — a half-written record
    should cost one row, not the whole list. */
function unwrap<T>(doc: unknown): T | null {
  try {
    const raw = (doc as { fields?: { json?: { stringValue?: string } } })?.fields?.json?.stringValue
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

async function put(path: string, value: unknown): Promise<Trouble> {
  try {
    const res = await fetch(`${BASE}/${path}?key=${KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wrap(value)),
    })
    return res.ok ? null : `The directory refused the write (${res.status}).`
  } catch {
    return 'Could not reach the directory.'
  }
}

async function get<T>(path: string): Promise<{ value: T | null; trouble: Trouble }> {
  try {
    const res = await fetch(`${BASE}/${path}?key=${KEY}`)
    // A document that was never written is a 404, which is an answer rather
    // than a failure: there is no invite by that name.
    if (res.status === 404) return { value: null, trouble: null }
    if (!res.ok) return { value: null, trouble: `The directory refused the read (${res.status}).` }
    return { value: unwrap<T>(await res.json()), trouble: null }
  } catch {
    return { value: null, trouble: 'Could not reach the directory.' }
  }
}

async function list<T>(collection: string): Promise<{ values: T[]; trouble: Trouble }> {
  try {
    const res = await fetch(`${BASE}/${ROOT}/${collection}?key=${KEY}&pageSize=300`)
    if (res.status === 404) return { values: [], trouble: null }
    if (!res.ok) return { values: [], trouble: `The directory refused the read (${res.status}).` }
    const body = (await res.json()) as { documents?: unknown[] }
    const out: T[] = []
    for (const doc of body.documents ?? []) {
      const v = unwrap<T>(doc)
      if (v) out.push(v)
    }
    return { values: out, trouble: null }
  } catch {
    return { values: [], trouble: 'Could not reach the directory.' }
  }
}

/* ── invites ────────────────────────────────────────────────────────────── */

/** Eight lowercase base-36 characters. Long enough that a link cannot be
    guessed into somebody else's flow, short enough to read out loud. */
export function newToken(): string {
  let out = ''
  // crypto where it exists; Math.random is a fine fallback for a prototype's
  // demo links and keeps this working in any embedder.
  const bytes = new Uint8Array(8)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256)
  for (const b of bytes) out += (b % 36).toString(36)
  return out
}

export async function createInvite(name: string): Promise<{ invite: Invite; trouble: Trouble }> {
  const invite: Invite = {
    token: newToken(),
    name: name.trim().slice(0, 60),
    createdAt: new Date().toISOString(),
    openedAt: null,
    answeredAt: null,
  }
  const trouble = await put(`${ROOT}/invites/${invite.token}`, invite)
  return { invite, trouble }
}

export async function readInvite(token: string) {
  return get<Invite>(`${ROOT}/invites/${token}`)
}

export async function listInvites() {
  return list<Invite>('invites')
}

/** Stamps the invite the first time its link is opened, and again whenever a
    sitting under it reaches the directory. Failures are swallowed: an advisor
    answering questions should never be stopped by bookkeeping. */
export async function touchInvite(token: string, answered: boolean) {
  const { value } = await readInvite(token)
  if (!value) return
  const now = new Date().toISOString()
  await put(`${ROOT}/invites/${token}`, {
    ...value,
    openedAt: value.openedAt ?? now,
    answeredAt: answered ? now : value.answeredAt,
  })
}

/* ── sittings ───────────────────────────────────────────────────────────── */

/** One sitting, as the directory holds it. The counts come from `sittingOf` so
    "answered 9 of 26" means the same thing here as it does on the spreadsheet
    row and in the flow's own progress meter. */
export function entryOf(a: Answers, token: string | null, fallbackName: string): Entry {
  const counted = sittingOf(a, a.sittingId)
  return {
    id: a.sittingId,
    token,
    // What they typed on "Who's answering?", or the name on the invite if they
    // have not got to that screen yet. A row with no name at all is a row
    // nobody can act on.
    name: a.identity.name.trim() || fallbackName.trim() || 'Advisor',
    role: a.identity.role.trim(),
    book: a.identity.book.trim(),
    firm: a.identity.firm.trim(),
    at: new Date().toISOString(),
    answered: counted.answered,
    total: counted.total,
    answers: a,
  }
}

export async function putEntry(e: Entry): Promise<Trouble> {
  return put(`${ROOT}/sittings/${e.id}`, e)
}

export async function listEntries() {
  return list<Entry>('sittings')
}

export async function readEntry(id: string) {
  return get<Entry>(`${ROOT}/sittings/${id}`)
}

/* ── what a screen shows ────────────────────────────────────────────────── */

/** The greeting the flow opens with. A blank invite is not an error — an admin
    generating a link before they know who it is for is a normal thing to do,
    and "Welcome, Advisor!" is a decent thing to say to a stranger. */
export function greeting(name: string): string {
  const n = name.trim()
  return n ? `Welcome, ${n.split(/\s+/)[0]}!` : 'Welcome, Advisor!'
}

/** The link to hand somebody. Built from where this page actually is, so it is
    right on the live site, on a local dev server and inside the review
    overlay's iframe alike — the overlay mirrors the route up to the parent, so
    the address to copy is the parent's. */
export function inviteLink(token: string): string {
  if (typeof window === 'undefined') return `#/flow/${token}`
  const top = window.parent !== window ? window.parent.location : window.location
  try {
    return `${top.origin}${top.pathname}#/flow/${token}`
  } catch {
    // Cross-origin parent: fall back to our own address.
    const here = window.location
    return `${here.origin}${here.pathname}#/flow/${token}`
  }
}

/** Newest first, and a person with answers above an invite with none. The list
    is a worklist: somebody who just finished is the row you want. */
export function byRecency<T extends { at?: string; createdAt?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (b.at ?? b.createdAt ?? '').localeCompare(a.at ?? a.createdAt ?? ''))
}
