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
  { label: 'Finished Onboarding', value: 27, sub: '42% of invited', tone: 'green' },
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
  { tier: 'Tier 1', name: 'Ready Now', count: 19, pct: 47.5, avgKQ: 81, conv: '42%', convGood: true, range: '70–100', color: '#086375' },
  { tier: 'Tier 2', name: 'Considering', count: 20, pct: 50, avgKQ: 55, conv: '15%', convGood: true, range: '40–69', color: '#5B97A1' },
  { tier: 'Tier 3', name: 'Nurture', count: 1, pct: 2.5, avgKQ: 31, conv: '0%', convGood: false, range: '0–39', color: '#B18FD4' },
]

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
