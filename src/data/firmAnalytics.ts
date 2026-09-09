// The firm's Analytics: the pipeline in aggregate.
//
// The advisor's analytics answers "who do I call". This one answers a
// different question — "what do we change about the offer" — so every section
// ends in something Dynasty can fix rather than something a rep can say.
//
// Nothing here is typed in. Every figure is computed from `candidates.ts`, the
// same array My Candidates renders, so the two screens cannot disagree; and
// every rate carries its denominator, with MIN_SAMPLE guarding the small ones.

import {
  candidates,
  candidateStats,
  reached,
  STAGES,
  type Apprehension,
  type Candidate,
  type RouteKey,
  type Stage,
} from './candidates'
import { clusterOf, clusters } from './candidateInsights'
import { MIN_SAMPLE } from './analytics'

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)
const round1 = (n: number) => Math.round(n * 10) / 10

const signed = (xs: Candidate[]) => xs.filter((c) => c.progress === 'signed').length
const met = (xs: Candidate[]) => xs.filter((c) => reached(c, 'meeting')).length

/* ── the header KPIs — every one carries its comparison ─────────────────── */

export interface Kpi {
  label: string
  value: string
  compare: string
  detail: string
  good: boolean
}

const invited = candidates.length
const completed = candidates.filter((c) => reached(c, 'completed')).length
const meetings = met(candidates)
const signedTotal = signed(candidates)
const transitions = candidates.filter((c) => reached(c, 'transition')).length
const signedRows = candidates.filter((c) => c.progress === 'signed')

export const kpis: Kpi[] = [
  {
    label: 'Flow completion',
    value: `${pct(completed, invited)}%`,
    compare: `${completed} of ${invited} invited advisors finished all five adventures`,
    detail:
      'The instrument is not the drop-off point. Anyone who starts it tends to finish it, which is the argument for putting it earlier in the outreach.',
    good: true,
  },
  {
    label: 'Meetings from completions',
    value: `${pct(meetings, completed)}%`,
    compare: `${meetings} first meetings from ${completed} completed profiles`,
    detail: `${completed - meetings} advisors told us everything and were never called. That is a follow-up problem, not a targeting one.`,
    good: false,
  },
  {
    label: 'Signed',
    value: `${signedTotal}`,
    compare: `${pct(signedTotal, meetings)}% of the ${meetings} advisors who took a meeting`,
    detail: `${transitions - signedTotal} more are in a live transition conversation.`,
    good: true,
  },
  {
    label: 'AUM signed',
    value: `$${round1(signedRows.reduce((a, c) => a + c.aum, 0) / 1000)}B`,
    compare: `out of $${round1(candidateStats.aum / 1000)}B in the pipeline`,
    detail: `Book size is the outcome, not the filter — ${
      signedRows.filter((c) => c.aum < 500).length
    } of the ${signedRows.length} signings are under $500M.`,
    good: true,
  },
]

/* ── 1. the pipeline funnel ─────────────────────────────────────────────── */

export interface FunnelStep {
  stage: string
  count: number
  /** Share of everyone invited, which is what the bar's width reads. */
  pct: number
  /** Lost between the previous rung and this one. */
  drop: number
  fill: string
  ink: string
}

const RUNGS: { stage: string; test: (c: Candidate) => boolean; fill: string; ink: string }[] = [
  { stage: 'Invited', test: () => true, fill: 'var(--k-grape-light)', ink: 'var(--k-plum)' },
  {
    stage: 'Started',
    test: (c) => reached(c, 'started'),
    fill: 'var(--k-lilac-soft)',
    ink: 'var(--k-plum)',
  },
  {
    stage: 'Completed',
    test: (c) => reached(c, 'completed'),
    fill: 'var(--k-lilac)',
    ink: 'var(--k-plum)',
  },
  {
    stage: 'First meeting',
    test: (c) => reached(c, 'meeting'),
    fill: 'var(--k-grape)',
    ink: 'var(--k-white)',
  },
  {
    stage: 'Transition talk',
    test: (c) => reached(c, 'transition'),
    fill: 'var(--k-bolt-deep)',
    ink: 'var(--k-white)',
  },
  {
    stage: 'Signed',
    test: (c) => reached(c, 'signed'),
    fill: 'var(--k-plum)',
    ink: 'var(--k-white)',
  },
]

export const funnel: FunnelStep[] = RUNGS.map((r, i) => {
  const count = candidates.filter(r.test).length
  const prev = i === 0 ? count : candidates.filter(RUNGS[i - 1].test).length
  return {
    stage: r.stage,
    count,
    pct: pct(count, invited),
    drop: prev - count,
    fill: r.fill,
    ink: r.ink,
  }
})

/* An aggregate bar hides the difference between a targeting problem and a
   follow-up problem, so each drop point says which it is. */
export const dropReadings = [
  {
    where: 'Invited, never started',
    reading: 'Targeting. The invitation reached someone the offer was never for.',
    fix: 'Tighten the list before the copy.',
  },
  {
    where: 'Started, never finished',
    reading: 'Experience friction, and the smallest drop here — the flow holds.',
    fix: 'Nothing to fix yet. Watch it as volume grows.',
  },
  {
    where: 'Completed, never met',
    reading:
      'Follow-up. They answered eight minutes of questions about their marriage and their team and heard nothing back.',
    fix: 'A same-week call rule, and route the completion alert to a named rep rather than a queue.',
  },
  {
    where: 'Met, no transition talk',
    reading: 'The meeting did not answer the thing that was blocking them.',
    fix: 'Bring the cluster’s named blocker to the meeting. It is on the profile before the call.',
  },
]

/* ── 2. stage distribution, and conversion by stage ─────────────────────── */

export interface StageRow {
  stage: Stage
  count: number
  share: number
  signed: number
  conv: number
  thin: boolean
}

export const byStage: StageRow[] = STAGES.map((stage) => {
  const rows = candidates.filter((c) => c.stage === stage)
  return {
    stage,
    count: rows.length,
    share: pct(rows.length, candidateStats.scored),
    signed: signed(rows),
    conv: pct(signed(rows), rows.length),
    thin: rows.length <= MIN_SAMPLE,
  }
})

const contemplation = byStage.find((s) => s.stage === 'Contemplation')!
const action = byStage.find((s) => s.stage === 'Action')!

export const stageReading = `${contemplation.share}% of the pipeline is in Contemplation and ${action.share}% is in Action, and they convert at ${contemplation.conv}% against ${action.conv}%. No CRM field anywhere carries this distinction: both groups look like "interested" until someone asks them the seven questions that separate them.`

/* ── 3. cluster performance ─────────────────────────────────────────────── */

export interface ClusterRow {
  n: number
  name: string
  size: number
  meetings: number
  signed: number
  conv: number
  /** Meetings that did not become a signing — rep time absorbed. */
  absorbed: number
  thin: boolean
  action: string
}

export const clusterPerformance: ClusterRow[] = clusters.map((c) => {
  const m = met(c.members)
  const s = signed(c.members)
  return {
    n: c.n,
    name: c.name,
    size: c.size,
    meetings: m,
    signed: s,
    conv: pct(s, c.size),
    absorbed: m - s,
    thin: c.size <= MIN_SAMPLE,
    action: c.action,
  }
})

const bestCluster = [...clusterPerformance].sort((a, b) => b.conv - a.conv)[0]
const heaviest = [...clusterPerformance].sort((a, b) => b.absorbed - a.absorbed)[0]

export const clusterReadings = [
  `“${bestCluster.name}” converts at ${bestCluster.conv}% — ${bestCluster.signed} of ${bestCluster.size}${
    bestCluster.thin ? `, on a base of ${bestCluster.size}, so treat it as a direction rather than a rate` : ''
  }. Staff it first.`,
  `“${heaviest.name}” has absorbed ${heaviest.absorbed} meetings without a signing. ${heaviest.action}`,
]

/* ── 4. recurring apprehensions, ranked ─────────────────────────────────── */

/* The most important section on the page, and the argument for selling to the
   enterprise rather than to advisors one at a time: the same instrument that
   tells one rep what to say tells the firm what to build. Each row names the
   fix, not the finding. */
const FIXES: Record<Apprehension, string> = {
  'Client attrition':
    'Publish retention by team size and AUM band, including the two worst outcomes of the last ten moves. Every rep is currently improvising this answer, and the good ones are guessing.',
  'Team obligation':
    'Ship the G2 equity one-pager: what a junior advisor owns on day one, vesting, and what it is worth on a sale. It does not exist, and five reps have promised it verbally.',
  'Transition disruption':
    'Publish the real transition calendar with named owners. The fear is eighteen months of chaos; the counter is a dated plan, not reassurance.',
  'Deferred comp':
    'Build the net-of-forfeiture model as a tool reps can run live, and decide whether Dynasty bridges the forfeiture. This is a capital question, not a talk track.',
  'Ops and compliance load':
    'Lead with the service model, not the platform. This group is buying relief from operations and hears "technology" as more work.',
  'Losing the brand':
    'Show three firms that kept their own name and their own client experience. This is answered with evidence or not at all.',
  'Nothing named':
    'No dominant blocker — send them back through Outlook and Future You before booking anything.',
}

export interface ApprehensionRow {
  label: Apprehension
  count: number
  share: number
  signed: number
  conv: number
  thin: boolean
  fix: string
}

export const apprehensionsRanked: ApprehensionRow[] = (
  Object.keys(FIXES) as Apprehension[]
)
  .map((label) => {
    const rows = candidates.filter((c) => c.kq !== null && c.apprehension === label)
    return {
      label,
      count: rows.length,
      share: pct(rows.length, candidateStats.scored),
      signed: signed(rows),
      conv: pct(signed(rows), rows.length),
      thin: rows.length <= MIN_SAMPLE,
      fix: FIXES[label],
    }
  })
  .filter((r) => r.count > 0)
  .sort((a, b) => b.count - a.count)

/** Two or three worked readings, in the order the data ranks them, so the copy
    and the table can never fall out of step. */
export const apprehensionReadings = apprehensionsRanked.slice(0, 3).map(
  (r) =>
    `${r.label} is the dominant blocker for ${r.count} of ${candidateStats.scored} advisors (${r.share}%). That is not a rep-script problem. ${r.fix}`,
)

/* ── 5. segment views ───────────────────────────────────────────────────── */

export interface FirmSegment {
  name: string
  invited: number
  completed: number
  meetings: number
  signed: number
  conv: number
  thin: boolean
}

function segment(name: string, rows: Candidate[]): FirmSegment {
  return {
    name,
    invited: rows.length,
    completed: rows.filter((c) => reached(c, 'completed')).length,
    meetings: met(rows),
    signed: signed(rows),
    conv: pct(signed(rows), rows.length),
    thin: rows.length <= MIN_SAMPLE,
  }
}

const group = <K extends string>(keys: readonly K[], of: (c: Candidate) => K) =>
  keys.map((k) => segment(k, candidates.filter((c) => of(c) === k))).sort((a, b) => b.invited - a.invited)

export const bySource = group(
  ['Connect', 'Conference', 'Referral', 'Outbound', 'Go Independent link'] as const,
  (c) => c.source,
)

export const bySegment = group(['Breakaway', 'Succession', 'Existing RIA'] as const, (c) => c.segment)

const BANDS: { name: string; test: (aum: number) => boolean }[] = [
  { name: 'Under $250M', test: (a) => a < 250 },
  { name: '$250M–$500M', test: (a) => a >= 250 && a < 500 },
  { name: '$500M–$1B', test: (a) => a >= 500 && a < 1000 },
  { name: '$1B+', test: (a) => a >= 1000 },
]

export const byAum: FirmSegment[] = BANDS.map((b) =>
  segment(b.name, candidates.filter((c) => b.test(c.aum))),
)

const topSource = [...bySource].filter((s) => !s.thin).sort((a, b) => b.conv - a.conv)[0]

/* The book-size view has to be allowed to be the boring one, and to say why:
   the extremes are too thin to read, and what is left is a separation the firm
   already knows before anyone answers a question. */
const readableBands = byAum.filter((b) => !b.thin)
const thinBands = byAum.filter((b) => b.thin)

export const aumNote = `Book size is what a recruiter already sorts by, and it is the view that says least here. ${thinBands
  .map((b) => `${b.name} (n=${b.invited})`)
  .join(' and ')} ${
  thinBands.length === 1 ? 'is' : 'are'
} too thin to read at all, and the rest convert at ${readableBands
  .map((b) => `${b.name} ${b.conv}%`)
  .join(', ')}. That is a spread you can already see from the CRM without asking anybody anything — the stage and cluster views are the ones that need the instrument.`

export const segmentReadings = [
  topSource
    ? `${topSource.name} converts at ${topSource.conv}% — ${topSource.signed} of ${topSource.invited}. Spend the marketing budget where the completions already are.`
    : 'No source has enough volume yet to rank. Keep every channel on until one does.',
  `Succession-shaped advisors are ${bySegment.find((s) => s.name === 'Succession')?.invited ?? 0} of the pipeline. They are not a Connect audience, and counting them as one flatters the funnel.`,
]

/* ── 6. route accuracy ──────────────────────────────────────────────────── */

/* Three destinations and no current way to check whether a lead reached the
   right one. Only deals that actually went somewhere can be scored. */
const routed = candidates.filter((c) => c.routedTo)

export interface RouteRow {
  route: RouteKey
  recommended: number
  matched: number
  accuracy: number
  thin: boolean
}

export const routeAccuracy: RouteRow[] = (['Connect', 'Investment Bank', 'Optima'] as RouteKey[]).map(
  (route) => {
    const rows = routed.filter((c) => c.route === route)
    const matched = rows.filter((c) => c.routedTo === route).length
    return {
      route,
      recommended: rows.length,
      matched,
      accuracy: pct(matched, rows.length),
      thin: rows.length <= MIN_SAMPLE,
    }
  },
)

export const routeOverall = {
  scored: routed.length,
  matched: routed.filter((c) => c.routedTo === c.route).length,
  accuracy: pct(routed.filter((c) => c.routedTo === c.route).length, routed.length),
  thin: routed.length <= MIN_SAMPLE,
  /** The ones that went somewhere other than the recommendation. */
  misses: routed
    .filter((c) => c.routedTo !== c.route)
    .map((c) => ({ name: c.name, from: c.route, to: c.routedTo as RouteKey, cluster: clusterOf(c) })),
}

export const routeReading = `${routeOverall.matched} of ${routeOverall.scored} deals went where the answers said they should${
  routeOverall.thin ? ', which is too few to call an accuracy rate yet' : ''
}. Every miss is a quarter of rep time spent in the wrong product — score this monthly from the day there are twenty deals, not from the day someone complains.`

export { MIN_SAMPLE }
