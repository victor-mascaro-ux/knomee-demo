// Activation Analytics — the tracking behind the activation toolkit, as a firm
// would see it: are advisors using Knomee, and where does prospect conversion
// break? Placeholder data, built to roll up to the Prospect Analytics totals
// (analytics.ts): 64 invited · 40 signed up · 33 complete · 27 meetings · 12
// clients. Those five are read from there, never retyped, so the two pages
// cannot disagree.
//
// Where each number would come from once the tracking is live:
// - toolkit opens and template copies: the toolkit's own events, per firm link
// - invitations sent: Knomee
// - signed up, completed, where they stopped: Typeform
// - meetings and clients: reported by the advisors
// - which template a prospect came from: the utm_content tag the toolkit adds

import { engagement, outcomes } from './analytics'

const count = (label: string) => engagement.find((m) => m.label === label)?.value ?? 0

export const prospectTotals = {
  invited: count('Prospects Invited'),
  signedUp: count('Signed Up'),
  complete: count('Profile Complete'),
  meetings: count('Meetings Booked'),
  clients: outcomes.converted,
}

/** The firm's own figure, entered once; the revenue tile is only ever an estimate from it. */
export const revenuePerClient = 8500

// ── Advisors ──────────────────────────────────────────────────────────────
export type AdvisorStatus = 'sending' | 'copied' | 'opened' | 'idle'

export interface AdvisorRow {
  name: string
  /** Last 30 days, from the toolkit's events. */
  opens: number
  copies: number
  /** Adventures sent in the last 30 days. */
  sent: number
  /** This year, to match the prospect side. */
  invited: number
  signedUp: number
}

/* Sums to the prospect totals: 64 invited and 40 signed up across the firm. */
export const advisors: AdvisorRow[] = [
  { name: 'Alex Advisor', opens: 9, copies: 6, sent: 5, invited: 14, signedUp: 9 },
  { name: 'Priya Shah', opens: 7, copies: 5, sent: 4, invited: 12, signedUp: 8 },
  { name: 'Dana Brooks', opens: 6, copies: 4, sent: 3, invited: 10, signedUp: 7 },
  { name: 'Sam Rivera', opens: 5, copies: 3, sent: 3, invited: 9, signedUp: 6 },
  { name: 'Jordan Ellis', opens: 4, copies: 2, sent: 2, invited: 7, signedUp: 4 },
  { name: 'Taylor Kim', opens: 3, copies: 2, sent: 1, invited: 5, signedUp: 3 },
  { name: 'Riley Chen', opens: 2, copies: 1, sent: 1, invited: 4, signedUp: 2 },
  { name: 'Morgan Price', opens: 4, copies: 3, sent: 0, invited: 2, signedUp: 1 },
  { name: 'Casey Nolan', opens: 2, copies: 1, sent: 0, invited: 1, signedUp: 0 },
  { name: 'Jamie Ortiz', opens: 1, copies: 0, sent: 0, invited: 0, signedUp: 0 },
  { name: 'Avery Grant', opens: 0, copies: 0, sent: 0, invited: 0, signedUp: 0 },
  { name: 'Quinn Harper', opens: 0, copies: 0, sent: 0, invited: 0, signedUp: 0 },
]

export function statusOf(a: AdvisorRow): AdvisorStatus {
  if (a.sent > 0) return 'sending'
  if (a.copies > 0) return 'copied'
  if (a.opens > 0) return 'opened'
  return 'idle'
}

export const statusLabel: Record<AdvisorStatus, string> = {
  sending: 'Sending',
  copied: 'Copied, not sent',
  opened: 'Opened only',
  idle: 'Not started',
}

const withAccess = advisors.length
const opened = advisors.filter((a) => a.opens > 0).length
const copied = advisors.filter((a) => a.copies > 0).length
const sending = advisors.filter((a) => a.sent > 0).length

export const advisorTotals = { withAccess, opened, copied, sending }

// ── The funnel: advisors first (last 30 days), then their prospects (this year) ──
export interface FunnelStep {
  label: string
  count: number
  /** What the step's bar is measured against: the group's first step. */
  base: number
  /** People lost since the step before. */
  lost?: number
  lostLabel?: string
}

function steps(rows: { label: string; count: number; lostLabel?: string }[]): FunnelStep[] {
  return rows.map((r, i) => ({
    ...r,
    base: rows[0].count,
    lost: i ? rows[i - 1].count - r.count : undefined,
  }))
}

export const advisorFunnel = steps([
  { label: 'Have access', count: withAccess },
  { label: 'Opened the toolkit', count: opened, lostLabel: 'never opened it' },
  { label: 'Copied a template', count: copied, lostLabel: 'looked, copied nothing' },
  { label: 'Sent an adventure', count: sending, lostLabel: 'copied, sent nothing' },
])

export const prospectFunnel = steps([
  { label: 'Invited', count: prospectTotals.invited },
  { label: 'Signed up', count: prospectTotals.signedUp, lostLabel: 'never signed up' },
  { label: 'Profile complete', count: prospectTotals.complete, lostLabel: 'stopped partway' },
  { label: 'Meeting booked', count: prospectTotals.meetings, lostLabel: 'no meeting yet' },
  { label: 'Became a client', count: prospectTotals.clients, lostLabel: 'met, not yet a client' },
])

/** The step that loses the most people — where fixing pays off first. */
export const biggestLoss = prospectFunnel.reduce((a, b) => ((b.lost ?? 0) > (a.lost ?? 0) ? b : a))

/* Where the 24 who never signed up stopped (Typeform views and drop-off). */
export const whereTheyStopped = [
  { where: 'Never opened the invitation', count: 7 },
  { where: 'Left at the welcome screen', count: 9 },
  { where: 'Left during an adventure', count: 6 },
  { where: 'Left at the sign-up step', count: 2 },
]

// ── Templates: copies in the toolkit, and what their tagged links brought in ──
export interface TemplateRow {
  name: string
  kind: string
  copies: number
  signedUp: number
  complete: number
  clients: number
}

/* A subset of the prospect totals: 26 of the 40 sign-ups and 8 of the 12
   clients came in on a link a toolkit template tagged. */
export const templates: TemplateRow[] = [
  { name: 'Before we meet', kind: 'Hot · Confirmation email', copies: 31, signedUp: 9, complete: 9, clients: 4 },
  { name: 'How well does your financial advisor really know you?', kind: 'Cold · Email', copies: 18, signedUp: 5, complete: 4, clients: 1 },
  { name: 'What do I actually want my money to make possible?', kind: 'Warm · LinkedIn message', copies: 14, signedUp: 5, complete: 3, clients: 1 },
  { name: 'Before your next financial decision', kind: 'Warm · Email', copies: 12, signedUp: 4, complete: 3, clients: 1 },
  { name: 'A quick reminder before we meet', kind: 'Hot · Reminder email', copies: 9, signedUp: 2, complete: 2, clients: 1 },
  { name: 'Most financial conversations start in the wrong place', kind: 'Cold · Email', copies: 7, signedUp: 1, complete: 1, clients: 0 },
  { name: 'Six other templates', kind: 'Ads, events, follow-ups', copies: 5, signedUp: 0, complete: 0, clients: 0 },
]

const sum = (rows: TemplateRow[], k: 'copies' | 'signedUp' | 'complete' | 'clients') => rows.reduce((a, r) => a + r[k], 0)

export const templateTotals = {
  copies: sum(templates, 'copies'),
  signedUp: sum(templates, 'signedUp'),
  complete: sum(templates, 'complete'),
  clients: sum(templates, 'clients'),
}
