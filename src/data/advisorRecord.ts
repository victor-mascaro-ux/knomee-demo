/* Keeping the answers.
 *
 * A sitting is one person's run through the flow. This module flattens one into
 * a spreadsheet row, keeps every row in a ledger on the device, and posts them
 * to a Google Sheet in Drive — one tab per person, one row per sitting.
 *
 * Why a posted row rather than a live connection: the prototype is a static
 * page on GitHub Pages with no server of its own, so the only way it can write
 * to a spreadsheet is to hand the row to something that already can. That is an
 * Apps Script web app bound to the sheet — see `docs/answers-sheet.md` for the
 * script and the one-time setup. Until a URL is pasted in, the ledger still
 * fills up and can be downloaded as CSV: the answers are never only in flight.
 *
 * The consequence that matters for the flow: restarting resets the Business ID,
 * because it starts a fresh sheet — but the sitting it closed is on the ledger
 * and on its way to Drive, so nothing anybody typed is thrown away.
 */

import { steps, type Step } from './advisorFlow'
import { isQuestion, type Answers, type Derived } from './advisorAnswers'

/* ── one sitting, as a row ──────────────────────────────────────────────── */

export interface Sitting {
  /** Stable across saves, so re-sending a sitting updates its row rather than
      adding a second one. */
  id: string
  /** The tab it belongs on: the name typed on the "Who's answering?" screen. */
  tab: string
  /** When the row was last written here, not when it reached Drive. */
  at: string
  /** Fire-and-forget: the post went out, and an opaque response cannot tell us
      it landed. Null until something has been attempted. */
  sentAt: string | null
  /** Header → value, in `recordHeaders()` order. */
  values: Record<string, string>
}

/** A spreadsheet header has to survive being read by a person, so it carries
    the step id AND enough of the question to know what it asked. */
const label = (id: string, text: string | undefined, cap = 64) => {
  const t = (text ?? '').replace(/\s+/g, ' ').trim()
  return t.length > cap ? `${id} · ${t.slice(0, t.lastIndexOf(' ', cap))}…` : `${id} · ${t}`
}

/** The columns every tab carries before the questions start. */
const LEAD = [
  'Sitting ID',
  'Recorded at',
  'Name',
  'Role',
  'Assets',
  'Firm',
  'Completed',
  'EQ',
  'Tier',
  'Intent',
  'Clarity',
  'Receptivity',
  'Stage',
  'Confidence',
  'Route',
] as const

/** And the ones after them: what the flow told this person to go and ask. */
const TAIL = ['Question 1', 'Question 2', 'Question 3'] as const

/** One column per thing the flow actually asks — a scale set spends a column
    per statement and the attention grid one per area, so a tab can be read
    down a column rather than unpicked out of a sentence.

    Built from the flow rather than from a sheet, so the columns are the same
    for everyone whether or not they answered, and two people's tabs line up. */
function questionColumns(): { header: string; step: Step; part?: number; row?: string }[] {
  const out: { header: string; step: Step; part?: number; row?: string }[] = []
  for (const s of steps) {
    if (!isQuestion(s)) continue
    if (s.kind === 'scaleSet') {
      ;(s.statements ?? []).forEach((st, i) =>
        out.push({ header: label(`${s.id}.${i + 1}`, st.text), step: s, part: i }),
      )
    } else if (s.kind === 'grid') {
      ;(s.rows ?? []).forEach((r) => out.push({ header: `${s.id} · ${r.label}`, step: s, row: r.label }))
    } else {
      out.push({ header: label(s.id, s.title), step: s })
    }
  }
  return out
}

export function recordHeaders(): string[] {
  return [...LEAD, ...questionColumns().map((c) => c.header), ...TAIL]
}

/** The answer to one question, as a cell. */
function cell(c: { step: Step; part?: number; row?: string }, a: Answers): string {
  const s = c.step
  switch (s.kind) {
    case 'multi':
    case 'single': {
      const typed = (a.other[`${s.id}:other`] ?? '').trim()
      return (a.choice[s.id] ?? [])
        .map((p) => (p === 'Other' && typed ? typed : p))
        .join(' | ')
    }
    case 'text':
      return (a.text[s.id] ?? '').trim()
    case 'scale':
      return a.scale[s.id] ? String(a.scale[s.id]) : ''
    case 'scaleSet': {
      const v = a.scaleSet[s.id]?.[c.part ?? 0]
      return v ? String(v) : ''
    }
    case 'grid':
      return a.grid[s.id]?.[c.row ?? ''] ?? ''
    default:
      // `questionColumns` only ever hands over the six kinds above.
      return ''
  }
}

export function sittingOf(a: Answers, d: Derived, id: string): Sitting {
  const values: Record<string, string> = {
    'Sitting ID': id,
    'Recorded at': new Date().toISOString(),
    Name: a.identity.name.trim() || 'Anonymous',
    Role: a.identity.role.trim(),
    Assets: a.identity.book.trim(),
    Firm: a.identity.firm.trim(),
    Completed: a.completed,
    EQ: String(d.kq),
    Tier: `${d.tier.tier} · ${d.tier.name}`,
    Intent: String(d.scores.intent),
    Clarity: String(d.scores.clarity),
    Receptivity: String(d.scores.receptivity),
    Stage: d.stage,
    Confidence: d.id.readiness.confidence,
    Route: d.routePick,
  }
  for (const c of questionColumns()) values[c.header] = cell(c, a)
  d.id.questions.slice(0, 3).forEach((q, i) => {
    values[`Question ${i + 1}`] = q
  })
  return {
    id,
    // A tab per person, named the way they named themselves. Sheets refuses
    // : \ / ? * [ ] in a tab name and caps it at 100 characters.
    tab: (a.identity.name.trim() || 'Anonymous').replace(/[:\\/?*[\]]/g, ' ').slice(0, 90),
    at: new Date().toISOString(),
    sentAt: null,
    values,
  }
}

/* ── the ledger ─────────────────────────────────────────────────────────────
   Every sitting this device has seen, newest last. It is written on every save
   rather than at the end, so a sitting abandoned half-way is still a row — and
   it survives the restart that resets the Business ID, which is the whole
   point of it being a separate store from the answers. */

const LEDGER = 'knomee.advisor-record.v1'
const ENDPOINT = 'knomee.advisor-endpoint.v1'

/* Filled in once the Apps Script web app is deployed, so a fresh browser
   records without anybody pasting anything. Empty means "ask the operator". */
const DEFAULT_ENDPOINT = ''

export function ledger(): Sitting[] {
  try {
    const raw = window.localStorage.getItem(LEDGER)
    return raw ? (JSON.parse(raw) as Sitting[]) : []
  } catch {
    return []
  }
}

function writeLedger(rows: Sitting[]) {
  try {
    window.localStorage.setItem(LEDGER, JSON.stringify(rows))
  } catch {
    /* storage full or blocked — the sitting is still in memory for this run */
  }
}

/** Upsert the sitting on the ledger. Called on every answer, so the row is
    always the current state of the sheet rather than a stale copy of it. */
export function noteSitting(a: Answers, d: Derived, id: string): Sitting {
  const fresh = sittingOf(a, d, id)
  const rows = ledger()
  const at = rows.findIndex((r) => r.id === id)
  if (at < 0) {
    rows.push(fresh)
  } else {
    // A row already sent stays marked as sent; editing after the fact makes it
    // unsent again, because Drive is now holding an older version of it.
    const was = rows[at]
    const changed = JSON.stringify(was.values) !== JSON.stringify(fresh.values)
    rows[at] = { ...fresh, sentAt: changed ? null : was.sentAt }
  }
  writeLedger(rows)
  return rows[at < 0 ? rows.length - 1 : at]
}

export function forgetLedger() {
  try {
    window.localStorage.removeItem(LEDGER)
  } catch {
    /* nothing to undo */
  }
}

/* ── where it goes ──────────────────────────────────────────────────────── */

export function endpoint(): string {
  try {
    return (window.localStorage.getItem(ENDPOINT) ?? DEFAULT_ENDPOINT).trim()
  } catch {
    return DEFAULT_ENDPOINT
  }
}

export function setEndpoint(url: string) {
  try {
    window.localStorage.setItem(ENDPOINT, url.trim())
  } catch {
    /* the URL just will not survive a reload */
  }
}

/** Post one sitting to the spreadsheet.
 *
 * `no-cors` with a text/plain body is what an Apps Script web app accepts from
 * a page it does not share an origin with. The response comes back opaque, so
 * this can report that the row was SENT and never that it arrived — which is
 * why the ledger keeps it either way and the recording screen says so plainly
 * rather than showing a tick it cannot stand behind. */
export async function pushSitting(row: Sitting): Promise<boolean> {
  const url = endpoint()
  if (!url) return false
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ tab: row.tab, headers: recordHeaders(), values: row.values }),
    })
    const rows = ledger()
    const at = rows.findIndex((r) => r.id === row.id)
    if (at >= 0) {
      rows[at] = { ...rows[at], sentAt: new Date().toISOString() }
      writeLedger(rows)
    }
    return true
  } catch {
    return false
  }
}

/** Everything the spreadsheet has not been handed yet, oldest first. */
export function unsent(): Sitting[] {
  return ledger().filter((r) => !r.sentAt)
}

export async function pushUnsent(): Promise<number> {
  if (!endpoint()) return 0
  let n = 0
  for (const row of unsent()) if (await pushSitting(row)) n += 1
  return n
}

/* ── the fallback ───────────────────────────────────────────────────────────
   No endpoint, or a room with no network: the ledger comes out as a CSV with a
   Tab column, which is what a person would paste into the spreadsheet by hand
   and split into tabs. Same columns, same order. */

const csvCell = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`

export function toCsv(rows = ledger()): string {
  const headers = recordHeaders()
  const head = ['Tab', ...headers].map(csvCell).join(',')
  const body = rows.map((r) => [r.tab, ...headers.map((h) => r.values[h] ?? '')].map(csvCell).join(','))
  return [head, ...body].join('\r\n')
}

/** Hand the CSV to the browser as a file. */
export function downloadCsv(rows = ledger()) {
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `knomee-advisor-answers-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Let the click start before the URL stops resolving.
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}
