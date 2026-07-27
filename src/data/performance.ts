// Advisor Performance page — engagement, outcomes, per-tier, onboarding funnel.
// All figures are placeholder sample data from the design handoff.

export interface EngagementMetric {
  label: string
  value: number
  sub: string
  tone: 'grey' | 'green'
}

export const engagement: EngagementMetric[] = [
  { label: 'Prospects Invited', value: 64, sub: '100% of outreach', tone: 'grey' },
  { label: 'Signed Up', value: 40, sub: '63% of invited', tone: 'green' },
  { label: 'Profile Complete', value: 33, sub: '52% of invited', tone: 'green' },
  { label: 'Meetings Booked', value: 27, sub: '42% of invited', tone: 'green' },
]

export const outcomes = {
  converted: 12,
  rate: 30, // %
  scored: 40,
  target: 25, // %
  avgKQ: 65.6,
}

export interface TierPerf {
  tier: string
  name: string
  count: number
  pct: number // share of the sector bar
  avgKQ: number
  conv: string
  convGood: boolean
  range: string
  color: string
}

export const byTier: TierPerf[] = [
  { tier: 'Tier 1', name: 'Ready Now', count: 19, pct: 47.5, avgKQ: 81, conv: '42%', convGood: true, range: '70–100', color: '#240446' },
  { tier: 'Tier 2', name: 'Considering', count: 20, pct: 50, avgKQ: 55, conv: '15%', convGood: true, range: '40–69', color: '#7639a1' },
  { tier: 'Tier 3', name: 'Nurture', count: 1, pct: 2.5, avgKQ: 31, conv: '0%', convGood: false, range: '0–39', color: '#c9a8dd' },
]

// A rate on a single prospect is noise, not a finding — rows at or below this
// are annotated so a 0% never reads as evidence.
export const MIN_SAMPLE = 5

// ── Impact header — every KPI carries its comparison ──
export interface ImpactStat {
  label: string
  value: string
  compare: string
  detail: string
  good: boolean
}

export const impactStats: ImpactStat[] = [
  {
    label: 'Clients Converted',
    value: '12',
    compare: '30% of scored prospects · target 25%',
    detail: 'Above target — n=40 scored this year',
    good: true,
  },
  {
    label: 'Conversion Lift',
    value: '2.8×',
    compare: 'Ready Now 42% vs Considering 15%',
    detail: 'Measured on your own conversions — n=39',
    good: true,
  },
  {
    label: 'Meetings Booked',
    value: '27',
    compare: '82% of the 33 completed Adventures',
    detail: '6 completed profiles have no meeting yet',
    good: true,
  },
]

// ── Niches: who your prospects are, crossed with which of them convert ──
// Niches overlap (a prospect can match more than one), so `share` deliberately
// sums past 100% and the per-niche client counts sum past the 12 total.
export interface Niche {
  name: string
  share: number // % of scored prospects
  count: number // n prospects in this niche
  clients: number
  conv: number // % — clients / count
  delta: number // percentage points vs last quarter
}

export const niches: Niche[] = [
  { name: 'Medical professionals · practice sale', share: 34, count: 14, clients: 5, conv: 36, delta: 6 },
  { name: 'Expat / international living', share: 28, count: 11, clients: 2, conv: 18, delta: -4 },
  { name: 'Special needs family planning', share: 22, count: 9, clients: 1, conv: 11, delta: -2 },
  { name: 'Business succession & exit', share: 19, count: 8, clients: 2, conv: 25, delta: 3 },
  { name: 'HNW estate complexity', share: 16, count: 6, clients: 3, conv: 50, delta: 11 },
  { name: 'Early retirees (pre-60)', share: 12, count: 5, clients: 0, conv: 0, delta: -5 },
]

export const nicheBenchmark = 20 // % — concentration benchmark

// ── Onboarding funnel (single proportional drop-off sector bar) ──
export interface FunnelSeg {
  stage: string
  pct: number // block width = cohort share
  count: number
  color?: string
  ink?: string
  gate?: boolean
  completed?: boolean
}

export interface FunnelConfig {
  welcome: boolean
  gate: 'early' | 'late'
}

// Each config re-composes the same bar. Recommended = Welcome ON · Gate late.
const ADV = [
  { color: '#bf9fe0', ink: '#3A2456' },
  { color: '#a679d3', ink: '#3A2456' },
  { color: '#8a52bf', ink: '#ffffff' },
  { color: '#6d38a0', ink: '#ffffff' },
  { color: '#501f7d', ink: '#ffffff' },
]
const WELCOME = { color: '#d8c5ec', ink: '#3A2456' }
const COMPLETE = { color: '#3dbdaa', ink: '#ffffff' }

function seg(stage: string, pct: number, count: number, style: { color?: string; ink?: string; gate?: boolean; completed?: boolean }): FunnelSeg {
  return { stage, pct, count, ...style }
}

export function buildFunnel({ welcome, gate }: FunnelConfig): { segments: FunnelSeg[]; complete: number } {
  const advDrops = welcome ? [13, 11, 9, 7, 6] : [18, 14, 11, 8, 6]
  const advSegs = advDrops.map((d, i) => seg(`Adv ${i + 1}`, d, d, ADV[i]))
  const signup = seg('Sign-up', gate === 'early' ? 8 : 5, gate === 'early' ? 8 : 5, { gate: true })
  const parts: FunnelSeg[] = []
  if (welcome) parts.push(seg('Welcome', 15, 15, WELCOME))
  if (gate === 'early') parts.push(signup)
  parts.push(...advSegs)
  if (gate === 'late') parts.push(signup)
  const used = parts.reduce((a, p) => a + p.pct, 0)
  const complete = 100 - used
  parts.push(seg('Fin ID', complete, complete, { ...COMPLETE, completed: true }))
  return { segments: parts, complete }
}

// What each drop point actually means — an aggregate bar hides the difference
// between a targeting problem and a follow-up problem.
export const dropReadings = [
  { where: 'Drop before Adventure 1', reading: 'Wrong audience' },
  { where: 'Drop mid-Adventure', reading: 'Experience friction' },
  { where: 'Drop at sign-up gate', reading: 'Value not yet established' },
  { where: 'Completed, never booked', reading: 'Follow-up problem, not targeting' },
]

// ── Funnel segmentation ──
// Rolls up to the practice totals: 64 invited · 40 signed up · 33 complete · 12 clients.
export interface Segment {
  name: string
  invited: number
  scored: number // signed up + scored
  completed: number
  clients: number
}

export const bySource: Segment[] = [
  { name: 'Referral', invited: 9, scored: 8, completed: 7, clients: 4 },
  { name: 'LinkedIn', invited: 16, scored: 12, completed: 11, clients: 4 },
  { name: 'Google Ads', invited: 27, scored: 15, completed: 11, clients: 3 },
  { name: 'Direct', invited: 12, scored: 5, completed: 4, clients: 1 },
]

// Niche segments overlap, so these do not sum to the practice totals.
export const byNiche: Segment[] = [
  { name: 'Medical · practice sale', invited: 18, scored: 14, completed: 12, clients: 5 },
  { name: 'Expat / international', invited: 15, scored: 11, completed: 8, clients: 2 },
  { name: 'Special needs planning', invited: 14, scored: 9, completed: 6, clients: 1 },
  { name: 'Business succession', invited: 10, scored: 8, completed: 7, clients: 2 },
  { name: 'HNW estate complexity', invited: 7, scored: 6, completed: 5, clients: 3 },
  { name: 'Early retirees (pre-60)', invited: 8, scored: 5, completed: 3, clients: 0 },
]

// ── UTM attribution, ranked by clients produced rather than clicks ──
export interface AttributionGroup {
  key: string
  label: string
  rows: { value: string; scored: number; clients: number }[]
}

export const attribution: AttributionGroup[] = [
  {
    key: 'utm_source',
    label: 'Where traffic came from',
    rows: [
      { value: 'referral', scored: 8, clients: 4 },
      { value: 'linkedin', scored: 12, clients: 4 },
      { value: 'google', scored: 15, clients: 3 },
      { value: 'direct', scored: 5, clients: 1 },
    ],
  },
  {
    key: 'utm_medium',
    label: 'Marketing channel type',
    rows: [
      { value: 'organic', scored: 13, clients: 5 },
      { value: 'social', scored: 12, clients: 4 },
      { value: 'cpc', scored: 10, clients: 2 },
      { value: 'email', scored: 5, clients: 1 },
    ],
  },
  {
    key: 'utm_campaign',
    label: 'Campaign name identifier',
    rows: [
      { value: 'spring_growth', scored: 15, clients: 5 },
      { value: 'legacy_2025', scored: 11, clients: 4 },
      { value: 'brand_always_on', scored: 9, clients: 2 },
      { value: '(none)', scored: 5, clients: 1 },
    ],
  },
]

export const marketingEffectiveness = [
  'Referral produces a third of your clients from an eighth of your invitations — the highest-yield channel you have.',
  'Google Ads brings the most people (27 invited) and the fewest completions (41%) — volume that is not qualifying.',
  'Organic content converts at 38%, ahead of every paid channel.',
  'spring_growth and legacy_2025 together account for 9 of 12 clients.',
]

// ── Onboarding experiments — each config with its measured outcome ──
export interface Experiment {
  key: string
  name: string
  cfg: FunnelConfig
  signUps: number
  clients: number
  recommended?: boolean
}

// Every signed-up prospect saw exactly one configuration, so sign-ups sum to 40
// and clients to 12. Completion comes from buildFunnel so the table and the
// bars can never disagree.
export const experiments: Experiment[] = [
  { key: 'won-late', name: 'Welcome on · Gate late', cfg: { welcome: true, gate: 'late' }, signUps: 18, clients: 6, recommended: true },
  { key: 'won-early', name: 'Welcome on · Gate early', cfg: { welcome: true, gate: 'early' }, signUps: 12, clients: 3 },
  { key: 'woff-late', name: 'Welcome off · Gate late', cfg: { welcome: false, gate: 'late' }, signUps: 7, clients: 2 },
  { key: 'woff-early', name: 'Welcome off · Gate early', cfg: { welcome: false, gate: 'early' }, signUps: 3, clients: 1 },
]

export const currentConfigSince = '6 May 2026'

// ── Who to talk to this week ──
// Every chip is something the prospect said in their own words. Tracked
// behaviour (adventures completed, logins, scheduling state) is deliberately
// excluded — the point of the card is that the score shows its reasoning.
export interface TalkTo {
  name: string
  tier: string
  kq: number
  niche: string
  said: string[]
}

export const talkTo: TalkTo[] = [
  {
    name: 'Emma Rossi',
    tier: 'Tier 1',
    kq: 88,
    niche: 'HNW estate complexity',
    said: ['Owns property in three countries', 'Named estate planning the top priority', 'Caring for a parent right now', 'Wants it settled before year end'],
  },
  {
    name: 'Sarah Mitchell',
    tier: 'Tier 1',
    kq: 81,
    niche: 'Medical · practice sale',
    said: ['Named practice sale as top concern', 'Stated a 3-year exit horizon', 'Has worked since 13, wants adventures', 'Asked what a sale nets after tax'],
  },
  {
    name: 'Jorday Ray',
    tier: 'Tier 1',
    kq: 76,
    niche: 'Business succession & exit',
    said: ['Family legacy is their stated #1 goal', 'No family successor named', 'Wants the business to outlast them', 'Asked about generational wealth'],
  },
  {
    name: 'Barbara Dean',
    tier: 'Tier 2',
    kq: 68,
    niche: 'Expat / international living',
    said: ['Plans to retire to France', 'Asked whether the move is affordable', 'Unsure about cross-border tax', 'Named a 2-year timeline'],
  },
  {
    name: 'Sophie Dean',
    tier: 'Tier 2',
    kq: 62,
    niche: 'Special needs family planning',
    said: ['Has an adult child with special needs', 'Named lifetime protection as the goal', 'Asked what happens after the parents', 'Wants a trust explained plainly'],
  },
  {
    name: 'Sebastian Watson',
    tier: 'Tier 2',
    kq: 58,
    niche: 'Early retirees (pre-60)',
    said: ['Wants to stop working at 57', 'Named income certainty as the worry', 'Says the current plan feels vague', 'Asked for a concrete number'],
  },
]

// ── Verbatim prospect language ──
export interface Verbatim {
  quote: string
  niche: string
  count: number
}

export const verbatims: Verbatim[] = [
  { quote: 'Should I sell my medical practice now or in 3 years?', niche: 'Medical · practice sale', count: 9 },
  { quote: 'Can I afford to live in France after retirement?', niche: 'Expat / international living', count: 7 },
  { quote: 'What protection should I consider for my adult special-needs child?', niche: 'Special needs family planning', count: 6 },
  { quote: 'How do I exit my business without a family successor?', niche: 'Business succession & exit', count: 5 },
  { quote: 'I have multiple properties across countries — how do I plan my estate?', niche: 'HNW estate complexity', count: 4 },
]
