// Activation Analytics — the tracking behind the activation toolkit, as a firm
// would see it: are advisors using Knomee, and where does prospect conversion
// break? Placeholder data, built to roll up to the Prospect Analytics totals
// (analytics.ts): 64 invited · 40 signed up · 33 complete · 12 clients. Those
// four are read from there, never retyped, so the two pages cannot disagree.
//
// Where each number would come from once the tracking is live:
// - toolkit opens and template copies: the toolkit's own events, per firm link
// - invitations sent: Knomee
// - signed up, completed, where they stopped: Typeform
// - clients: the advisor's Convert to Client button in Knomee
// - which template a prospect came from: the utm_content tag the toolkit adds
// Whether a meeting happened is not something Knomee sees, so the funnel has
// no meeting step: it goes from a completed profile to a client.

import { engagement, outcomes } from './analytics'
import { CLIENT_ANNUAL_RATE, CONVERSION_RATE } from './billing'

const count = (label: string) => engagement.find((m) => m.label === label)?.value ?? 0

export const prospectTotals = {
  invited: count('Prospects Invited'),
  signedUp: count('Signed Up'),
  complete: count('Profile Complete'),
  clients: outcomes.converted,
}

// ── ROI ───────────────────────────────────────────────────────────────────
// Three ways to answer "how much did Knomee bring us, and how do we know it
// was Knomee": the assets an advisor enters when they convert a client, the
// firm's numbers from before Knomee against its numbers since, and each
// client's trail from the invitation that started it.

/** The firm's own figures, entered once at onboarding. */
export const revenuePerClient = 8500 // average first-year revenue per new client, before Knomee
export const firmFeeRate = 0.01 // the firm's advisory fee, so assets entered at conversion become revenue

/** First-year revenue from the assets an advisor enters on Convert to Client. */
export const revenueFrom = (assets: number) => Math.round(assets * firmFeeRate)

/* The firm's baseline from the toolkit's "Know Your Baseline" (Prospect
   Toolkit), entered at onboarding. The toolkit's other two baseline numbers,
   time to first meeting and meetings to close, depend on meetings, which
   Knomee doesn't see — they stay in the firm's CRM. */
export const baseline = {
  conversionRate: 0.11, // of prospects the firm reached out to
  daysToClient: 74, // first contact to signed client
  revenuePerClient,
}

export interface KnomeeClient {
  name: string
  advisor: string
  /** The template whose tagged link the prospect came in on; null = a link without a tag. */
  template: string | null
  invited: string
  signedUp: string
  complete: string
  converted: string
  /** Entered by the advisor on Convert to Client; null = left blank. */
  assets: number | null
}

/* The 12 clients, consistent with the rest of the page: by advisor (Alex 3,
   Priya 3, Dana 2, Sam 2, Jordan 1, Taylor 1) and by template (the template
   table's 8 clients, plus 4 who came in on an untagged link). Dates are 2026. */
export const knomeeClients: KnomeeClient[] = [
  { name: 'Grace Liu', advisor: 'Alex Advisor', template: 'Before we meet', invited: '2026-03-02', signedUp: '2026-03-03', complete: '2026-03-04', converted: '2026-03-24', assets: 1250000 },
  { name: 'Marco Bianchi', advisor: 'Priya Shah', template: 'Before we meet', invited: '2026-03-16', signedUp: '2026-03-16', complete: '2026-03-18', converted: '2026-04-21', assets: 820000 },
  { name: 'Hannah Okafor', advisor: 'Alex Advisor', template: 'How well does your financial advisor really know you?', invited: '2026-02-09', signedUp: '2026-02-20', complete: '2026-02-22', converted: '2026-04-28', assets: 540000 },
  { name: 'Leo Fischer', advisor: 'Dana Brooks', template: 'Before we meet', invited: '2026-04-06', signedUp: '2026-04-07', complete: '2026-04-07', converted: '2026-05-04', assets: 2100000 },
  { name: 'Nina Patel', advisor: 'Sam Rivera', template: null, invited: '2026-04-13', signedUp: '2026-04-15', complete: '2026-04-19', converted: '2026-05-26', assets: null },
  { name: 'Owen Clarke', advisor: 'Priya Shah', template: 'What do I actually want my money to make possible?', invited: '2026-04-20', signedUp: '2026-04-29', complete: '2026-05-01', converted: '2026-06-15', assets: 960000 },
  { name: 'Clara Mendes', advisor: 'Jordan Ellis', template: null, invited: '2026-05-11', signedUp: '2026-05-12', complete: '2026-05-14', converted: '2026-06-22', assets: 700000 },
  { name: 'Ethan Walsh', advisor: 'Alex Advisor', template: 'Before we meet', invited: '2026-06-01', signedUp: '2026-06-01', complete: '2026-06-02', converted: '2026-06-30', assets: 1480000 },
  { name: 'Ruth Adler', advisor: 'Dana Brooks', template: 'Before your next financial decision', invited: '2026-05-25', signedUp: '2026-06-08', complete: '2026-06-09', converted: '2026-07-21', assets: null },
  { name: 'Daniel Reyes', advisor: 'Taylor Kim', template: null, invited: '2026-06-29', signedUp: '2026-07-01', complete: '2026-07-02', converted: '2026-08-11', assets: 610000 },
  { name: 'Lena Hoffman', advisor: 'Priya Shah', template: 'A quick reminder before we meet', invited: '2026-07-27', signedUp: '2026-07-28', complete: '2026-07-28', converted: '2026-08-25', assets: 1050000 },
  { name: 'Tom Ishida', advisor: 'Sam Rivera', template: null, invited: '2026-08-10', signedUp: '2026-08-13', complete: '2026-08-15', converted: '2026-09-22', assets: null },
]

const day = (d: string) => Date.parse(d) / 864e5
export const daysToClient = (c: KnomeeClient) => Math.round(day(c.converted) - day(c.invited))

const reported = knomeeClients.filter((c) => c.assets != null)
const reportedRevenue = reported.reduce((a, c) => a + revenueFrom(c.assets as number), 0)
const unreported = knomeeClients.length - reported.length

export const roi = {
  reportedClients: reported.length,
  reportedRevenue,
  estimatedClients: unreported,
  estimatedRevenue: unreported * revenuePerClient,
  totalRevenue: reportedRevenue + unreported * revenuePerClient,
  /** Average first-year revenue of the clients whose assets were entered. */
  revenuePerClient: Math.round(reportedRevenue / Math.max(reported.length, 1)),
  daysToClient: Math.round(knomeeClients.reduce((a, c) => a + daysToClient(c), 0) / knomeeClients.length),
  conversionRate: outcomes.converted / count('Prospects Invited'),
  /** What Knomee charged for these clients: each conversion once, and a year of each client. */
  cost: knomeeClients.length * (CONVERSION_RATE + CLIENT_ANNUAL_RATE),
}

/* The lift, in clients and in revenue: what the same invitations would have
   brought at the firm's baseline rate, and what Knomee brought on top. The
   extra clients are valued at the firm's own pre-Knomee average, so the
   figure leans low rather than high. */
const expectedAtBaseline = Math.round(count('Prospects Invited') * baseline.conversionRate)
export const lift = {
  expectedAtBaseline,
  extraClients: outcomes.converted - expectedAtBaseline,
  extraRevenue: (outcomes.converted - expectedAtBaseline) * revenuePerClient,
}

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
  { label: 'Became a client', count: prospectTotals.clients, lostLabel: 'not converted yet' },
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
