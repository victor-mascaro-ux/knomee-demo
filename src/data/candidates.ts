// The firm's pipeline: advisors Dynasty is assessing, and assessing it back.
//
// Shaped like `prospects.ts` — a handful of hand-authored rows lead each tier,
// the rest are distributed from a fixed seed so the demo is stable across
// builds — but the columns are the firm's: AUM, team size, the readiness stage
// as a word, and which of the three destinations the answers point at.
//
// The behavioural fields (change, vision, second seat, dominant apprehension)
// are authored per archetype; the six clusters in `candidateInsights.ts` are
// then DERIVED from those fields by rule, so a cluster can never claim someone
// the row does not describe.
//
// Marcus Hale's row is not retyped: his scores, tier, route and top action are
// imported from `advisorProfile.ts`, which computes them from the flow.
//
// All figures, firms and people are invented. No real advisor is represented.

import { advisor } from './advisorFlow'
import {
  KQ_WEIGHTS,
  kq as marcusKQ,
  route as marcusRoute,
  teamSize as marcusTeam,
  tier as marcusTier,
  topAction as marcusTopAction,
  dimensions as marcusDimensions,
} from './advisorProfile'

export type Tier = 'tier1' | 'tier2' | 'tier3' | 'incomplete'

export type Stage =
  | 'Pre-contemplation'
  | 'Contemplation'
  | 'Preparation'
  | 'Action'
  | 'Maintenance'

/** One entry point, three destinations. */
export type RouteKey = 'Connect' | 'Investment Bank' | 'Optima'

/** The dominant thing standing in the way, in the firm's words. */
export type Apprehension =
  | 'Client attrition'
  | 'Team obligation'
  | 'Transition disruption'
  | 'Deferred comp'
  | 'Ops and compliance load'
  | 'Losing the brand'
  | 'Nothing named'

export type Segment = 'Breakaway' | 'Succession' | 'Existing RIA'

export type Source = 'Connect' | 'Conference' | 'Referral' | 'Outbound' | 'Go Independent link'

/** Who else has to be convinced, and whether they already are. */
export type SecondSeat = 'Aligned' | 'G2 not aligned' | 'Spouse' | 'Partner' | 'Nobody but me'

/** The change they named on The Move, Q1. */
export type Change =
  | 'Go independent with my team'
  | 'Join an existing RIA'
  | 'Buy another practice'
  | 'Sell or merge my book'
  | 'Bring in a successor'
  | 'Change nothing, but fix the parts that don’t work'

/** Where Future You is. "Winding down" and "Exit" are what route someone to
    the investment bank or to Optima rather than to Connect. */
export type Vision = 'Own firm' | 'Bigger platform' | 'Winding down' | 'Exit' | 'Unclear'

/** How far down the funnel they have come. Ordered — phase 3 reads it as a
    ladder. */
export const PROGRESS = [
  'invited',
  'started',
  'completed',
  'meeting',
  'transition',
  'signed',
] as const
export type Progress = (typeof PROGRESS)[number]

export interface Candidate {
  name: string
  firm: string
  kq: number | null
  intent: number | null
  clarity: number | null
  receptivity: number | null
  stage: Stage | null
  aum: number // $M
  team: number
  /** Where the answers say this should go. */
  route: RouteKey
  /** Where it actually went, once there is a deal to compare — phase 3. */
  routedTo?: RouteKey
  segment: Segment
  source: Source
  apprehension: Apprehension
  secondSeat: SecondSeat
  change: Change
  vision: Vision
  progress: Progress
  topAction: string
  tier: Tier
  isNew?: boolean
}

export interface TierGroup {
  id: Tier
  title: string
  range?: string
}

export const tierGroups: TierGroup[] = [
  { id: 'tier1', title: 'TIER 1 - READY NOW', range: '70-100 KQ' },
  { id: 'tier2', title: 'TIER 2 - CONSIDERING', range: '40-69 KQ' },
  { id: 'tier3', title: 'TIER 3 - NURTURE', range: '0-39 KQ' },
  { id: 'incomplete', title: 'INCOMPLETE PROFILES' },
]

/* ── the score ──────────────────────────────────────────────────────────────
   The same weights the profile uses, so a row and the profile behind it can
   never show two different KQs. */

const clamp = (n: number) => Math.max(1, Math.min(100, Math.round(n)))

export function composite(intent: number, clarity: number, receptivity: number) {
  return Math.round(
    intent * KQ_WEIGHTS.Intent + clarity * KQ_WEIGHTS.Clarity + receptivity * KQ_WEIGHTS.Receptivity,
  )
}

export const tierOf = (kq: number): Tier => (kq >= 70 ? 'tier1' : kq >= 40 ? 'tier2' : 'tier3')

/* ── the archetypes ─────────────────────────────────────────────────────────
   Each slot below is one advisor, described by the shape of their answers and
   the readiness stage they reached. The stage column is a quota, not a random
   draw: it reproduces the proportions the live client data shows — 3%
   pre-contemplation, 34% contemplation, 25% preparation, 26% action, 12%
   maintenance — across the 40 advisors who finished the flow. */

type Archetype = 'ready-blocked' | 'wants-waiting' | 'unclear' | 'succession' | 'team-blocked' | 'no-fit'

interface Slot {
  arch: Archetype
  stage: Stage
  /** Where they are in the funnel — assigned per slot so cluster conversion is
      a property of the population rather than a number typed into a card. */
  progress: Progress
}

const SLOTS: Slot[] = [
  // Ready, blocked on one thing — 6. The highest-yield group.
  { arch: 'ready-blocked', stage: 'Action', progress: 'signed' },
  { arch: 'ready-blocked', stage: 'Action', progress: 'signed' },
  { arch: 'ready-blocked', stage: 'Action', progress: 'transition' },
  { arch: 'ready-blocked', stage: 'Action', progress: 'transition' },
  { arch: 'ready-blocked', stage: 'Maintenance', progress: 'meeting' },
  { arch: 'ready-blocked', stage: 'Maintenance', progress: 'meeting' },

  // Wants it, hasn't started — 13, the largest group. Marcus leads it.
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'completed' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'signed' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'meeting' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'meeting' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'meeting' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'completed' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'completed' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'completed' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'completed' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'completed' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'completed' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'completed' },
  { arch: 'wants-waiting', stage: 'Contemplation', progress: 'completed' },

  // Unhappy but unclear — 6. Two of them are taking steps without a map.
  { arch: 'unclear', stage: 'Preparation', progress: 'meeting' },
  { arch: 'unclear', stage: 'Preparation', progress: 'meeting' },
  { arch: 'unclear', stage: 'Preparation', progress: 'completed' },
  { arch: 'unclear', stage: 'Action', progress: 'completed' },
  { arch: 'unclear', stage: 'Action', progress: 'completed' },
  { arch: 'unclear', stage: 'Action', progress: 'completed' },

  // Succession-shaped, not independence-shaped — 5.
  { arch: 'succession', stage: 'Preparation', progress: 'signed' },
  { arch: 'succession', stage: 'Preparation', progress: 'meeting' },
  { arch: 'succession', stage: 'Action', progress: 'meeting' },
  { arch: 'succession', stage: 'Action', progress: 'completed' },
  { arch: 'succession', stage: 'Maintenance', progress: 'completed' },

  // Team-blocked — 5. Their own readiness is high; the second seat is not.
  { arch: 'team-blocked', stage: 'Preparation', progress: 'signed' },
  { arch: 'team-blocked', stage: 'Preparation', progress: 'meeting' },
  { arch: 'team-blocked', stage: 'Preparation', progress: 'meeting' },
  { arch: 'team-blocked', stage: 'Preparation', progress: 'meeting' },
  { arch: 'team-blocked', stage: 'Action', progress: 'transition' },

  // Not a fit, or not this year — 5. The instrument has to be able to say so.
  { arch: 'no-fit', stage: 'Pre-contemplation', progress: 'completed' },
  { arch: 'no-fit', stage: 'Contemplation', progress: 'completed' },
  { arch: 'no-fit', stage: 'Preparation', progress: 'completed' },
  { arch: 'no-fit', stage: 'Maintenance', progress: 'completed' },
  { arch: 'no-fit', stage: 'Maintenance', progress: 'completed' },
]

interface Shape {
  intent: [number, number]
  clarity: [number, number]
  receptivity: [number, number]
  apprehensions: Apprehension[]
  secondSeats: SecondSeat[]
  changes: Change[]
  visions: Vision[]
  routes: RouteKey[]
  segments: Segment[]
  actions: string[]
}

const SHAPES: Record<Archetype, Shape> = {
  'ready-blocked': {
    intent: [72, 90],
    clarity: [70, 92],
    receptivity: [70, 95],
    apprehensions: ['Client attrition', 'Deferred comp', 'Transition disruption'],
    secondSeats: ['Aligned', 'Nobody but me'],
    changes: ['Go independent with my team', 'Join an existing RIA'],
    visions: ['Own firm', 'Bigger platform'],
    routes: ['Connect'],
    segments: ['Breakaway', 'Existing RIA'],
    actions: [
      'Answer the one blocker with evidence this week — retention data, not reassurance',
      'Bring the net-of-forfeiture model to the next call; it is the only open question',
      'Put a transition plan with names and dates in front of them; they are ready',
    ],
  },
  'wants-waiting': {
    intent: [30, 52],
    clarity: [64, 88],
    receptivity: [62, 92],
    apprehensions: ['Client attrition', 'Transition disruption', 'Team obligation'],
    secondSeats: ['Spouse', 'Aligned', 'G2 not aligned'],
    changes: ['Go independent with my team'],
    visions: ['Own firm'],
    routes: ['Connect'],
    segments: ['Breakaway'],
    actions: [
      'Shorten the perceived transition — a dated timeline with names on it, not a pitch',
      'Send the 90-day transition map; the vision is there and the movement is not',
      'Two-quarter cadence. Open on ownership, and give them one date to react to',
    ],
  },
  unclear: {
    intent: [42, 66],
    clarity: [24, 46],
    receptivity: [45, 75],
    apprehensions: ['Ops and compliance load', 'Losing the brand', 'Nothing named'],
    secondSeats: ['Nobody but me', 'Partner'],
    changes: ['Join an existing RIA', 'Buy another practice', 'Go independent with my team'],
    visions: ['Unclear'],
    routes: ['Connect'],
    segments: ['Breakaway', 'Existing RIA'],
    actions: [
      'Diagnostic conversation, not a platform conversation — find out what is actually wrong',
      'Do not pitch. Ask what they would fix first, and listen for whether independence fixes it',
      'Send them back through Future You before any meeting; the vision is too thin to sell to',
    ],
  },
  succession: {
    intent: [55, 85],
    clarity: [60, 88],
    receptivity: [55, 85],
    apprehensions: ['Losing the brand', 'Team obligation', 'Client attrition'],
    secondSeats: ['Partner', 'Aligned'],
    changes: ['Sell or merge my book', 'Bring in a successor'],
    visions: ['Winding down', 'Exit'],
    routes: ['Investment Bank', 'Optima'],
    segments: ['Succession'],
    actions: [
      'Route to the investment bank — this is a sale, and Connect would waste the quarter',
      'Optima: they want continuity for the clients, not a firm of their own',
      'Valuation conversation first. They named an exit, not independence',
    ],
  },
  'team-blocked': {
    // Above the 55 the team-blocked rule asks for: the point of the cluster is
    // that THEIR readiness is not the problem.
    intent: [62, 82],
    clarity: [66, 88],
    receptivity: [65, 90],
    apprehensions: ['Team obligation', 'Client attrition'],
    secondSeats: ['G2 not aligned'],
    changes: ['Go independent with my team'],
    visions: ['Own firm'],
    routes: ['Connect'],
    segments: ['Breakaway'],
    actions: [
      'Bring the G2 equity answer to the first meeting — the blocker is the second seat',
      'Get the junior advisors in the room. Their own readiness is not the problem',
      'Model what the team owns on day one before anything else is discussed',
    ],
  },
  'no-fit': {
    intent: [12, 38],
    clarity: [30, 62],
    receptivity: [20, 48],
    apprehensions: ['Ops and compliance load', 'Nothing named'],
    secondSeats: ['Nobody but me', 'Partner'],
    changes: ['Change nothing, but fix the parts that don’t work'],
    visions: ['Bigger platform', 'Unclear'],
    routes: ['Connect'],
    segments: ['Existing RIA', 'Breakaway'],
    actions: [
      'Low-touch nurture. They chose to change nothing, and said so plainly',
      'Quarterly content only — no meeting request until something in the answers moves',
      'Not this year. Keep them warm and spend the hour on Tier 1',
    ],
  },
}

/* ── the distributed book ───────────────────────────────────────────────── */

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = [
  'Marcus', 'Priya', 'Dale', 'Renata', 'Curtis', 'Yvonne', 'Hector', 'Bridget', 'Malcolm',
  'Simone', 'Grant', 'Adaeze', 'Terrence', 'Lena', 'Rowan', 'Beatriz', 'Desmond', 'Ingrid',
  'Rafael', 'Colette', 'Wendell', 'Anika', 'Bruno', 'Marguerite', 'Emeka', 'Delia', 'Roland',
  'Saoirse', 'Kenji', 'Paloma', 'Wallace', 'Thandiwe', 'Auguste', 'Fiona', 'Stellan', 'Odette',
  'Ravi', 'Marlene', 'Gideon', 'Camille', 'Boyd', 'Xiomara', 'Errol', 'Tamsin', 'Lucien',
]
const LAST = [
  'Hale', 'Vandermeer', 'Okonjo', 'Castellanos', 'Whitfield', 'Bergström', 'Nakamura', 'Delacroix',
  'Rasmussen', 'Achebe', 'Fontaine', 'Marchetti', 'Sorensen', 'Baptiste', 'Kowalczyk', 'Almeida',
  'Thorne', 'Villanueva', 'Osei', 'Lindqvist', 'Barrington', 'Escobar', 'Yamada', 'Prasad',
  'Steinberg', 'Moreau', 'Kilpatrick', 'Sarkisian', 'Oyelaran', 'Ferreiro', 'Blackwood',
]
const FIRMS = [
  'Wirehouse', 'Regional broker-dealer', 'Bank wealth division', 'Insurance broker-dealer',
  'National wirehouse', 'Independent broker-dealer', 'Boutique RIA', 'Multi-family office',
  'Trust company', 'Wirehouse (private bank)',
]

const pick = <T,>(rand: () => number, xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
const span = (rand: () => number, [lo, hi]: [number, number]) => clamp(lo + rand() * (hi - lo))

/** The one hand-authored row: Marcus's numbers come from his profile. */
const marcus: Candidate = {
  name: advisor.name,
  firm: advisor.firm,
  kq: marcusKQ,
  intent: marcusDimensions.find((d) => d.key === 'Intent')!.score,
  clarity: marcusDimensions.find((d) => d.key === 'Clarity')!.score,
  receptivity: marcusDimensions.find((d) => d.key === 'Receptivity')!.score,
  stage: 'Contemplation',
  aum: 840,
  team: marcusTeam,
  route: marcusRoute.pick.replace('Dynasty ', '') as RouteKey,
  segment: 'Breakaway',
  source: 'Go Independent link',
  apprehension: 'Client attrition',
  secondSeat: 'G2 not aligned',
  change: 'Go independent with my team',
  vision: 'Own firm',
  progress: 'completed',
  topAction: marcusTopAction.title,
  tier: `tier${marcusTier.tier}` as Tier,
  isNew: true,
}

/* Marcus takes the first "wants it, hasn't started" slot; the other 39 are
   generated from their slot's shape. */
function generate(): Candidate[] {
  const rand = mulberry32(0x4f1a2b)
  const used = new Set<string>([marcus.name.toLowerCase()])
  const out: Candidate[] = []
  let marcusPlaced = false

  for (const slot of SLOTS) {
    if (slot.arch === 'wants-waiting' && !marcusPlaced) {
      marcusPlaced = true
      out.push(marcus)
      continue
    }
    const shape = SHAPES[slot.arch]
    let name = ''
    for (let i = 0; i < 60 && (!name || used.has(name.toLowerCase())); i++) {
      name = `${pick(rand, FIRST)} ${pick(rand, LAST)}`
    }
    used.add(name.toLowerCase())

    const intent = span(rand, shape.intent)
    const clarity = span(rand, shape.clarity)
    const receptivity = span(rand, shape.receptivity)
    const kq = composite(intent, clarity, receptivity)
    const route = pick(rand, shape.routes)
    // Books run from a single-advisor practice to a small team. AUM tracks the
    // team roughly, the way it does in life.
    const team = 1 + Math.floor(rand() * 6)
    const aum = Math.round((60 + team * 90 + rand() * 320) / 5) * 5

    out.push({
      name,
      firm: pick(rand, FIRMS),
      kq,
      intent,
      clarity,
      receptivity,
      stage: slot.stage,
      aum,
      team,
      route,
      // Where it actually went. Most deals follow the recommendation; a few do
      // not, which is the whole point of measuring route accuracy in phase 3.
      routedTo:
        slot.progress === 'signed' || slot.progress === 'transition'
          ? rand() < 0.8
            ? route
            : pick(rand, ['Connect', 'Investment Bank', 'Optima'] as RouteKey[])
          : undefined,
      segment: pick(rand, shape.segments),
      source: pick(rand, [
        'Connect',
        'Conference',
        'Referral',
        'Outbound',
        'Go Independent link',
      ] as Source[]),
      apprehension: pick(rand, shape.apprehensions),
      secondSeat: pick(rand, shape.secondSeats),
      change: pick(rand, shape.changes),
      vision: pick(rand, shape.visions),
      progress: slot.progress,
      topAction: pick(rand, shape.actions),
      tier: tierOf(kq),
      isNew: rand() < 0.12,
    })
  }

  // Invited, never finished — no scores, so no stage and no cluster.
  const incompleteNames = ['Dorothy Kwan', 'Ellis Rourke', 'Nadia Belkacem', 'Owen Trask']
  incompleteNames.forEach((name, i) => {
    out.push({
      name,
      firm: FIRMS[i % FIRMS.length],
      kq: null,
      intent: null,
      clarity: null,
      receptivity: null,
      stage: null,
      aum: [1200, 310, 640, 95][i],
      team: [7, 2, 4, 1][i],
      route: 'Connect',
      segment: 'Breakaway',
      source: (['Conference', 'Outbound', 'Referral', 'Outbound'] as Source[])[i],
      apprehension: 'Nothing named',
      secondSeat: 'Nobody but me',
      change: 'Go independent with my team',
      vision: 'Unclear',
      progress: i % 2 === 0 ? 'started' : 'invited',
      topAction: 'Re-invite — the flow was opened and never finished',
      tier: 'incomplete',
    })
  })

  return out
}

export const candidates: Candidate[] = generate()

/* ── pipeline totals, derived ───────────────────────────────────────────── */

const scored = candidates.filter((c) => c.kq !== null)
const round1 = (n: number) => Math.round(n * 10) / 10
const mean = (xs: number[]) => (xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)

export const STAGES: Stage[] = [
  'Pre-contemplation',
  'Contemplation',
  'Preparation',
  'Action',
  'Maintenance',
]

export const candidateStats = {
  total: candidates.length,
  scored: scored.length,
  avgKQ: mean(scored.map((c) => c.kq as number)),
  avgIntent: mean(scored.map((c) => c.intent as number)),
  avgClarity: mean(scored.map((c) => c.clarity as number)),
  avgReceptivity: mean(scored.map((c) => c.receptivity as number)),
  aum: candidates.reduce((a, c) => a + c.aum, 0),
  byTier: {
    tier1: candidates.filter((c) => c.tier === 'tier1').length,
    tier2: candidates.filter((c) => c.tier === 'tier2').length,
    tier3: candidates.filter((c) => c.tier === 'tier3').length,
    incomplete: candidates.filter((c) => c.tier === 'incomplete').length,
  },
  byStage: STAGES.map((s) => ({
    stage: s,
    count: scored.filter((c) => c.stage === s).length,
    share: Math.round((scored.filter((c) => c.stage === s).length / scored.length) * 100),
  })),
  byRoute: (['Connect', 'Investment Bank', 'Optima'] as RouteKey[]).map((r) => ({
    route: r,
    count: candidates.filter((c) => c.kq !== null && c.route === r).length,
  })),
  signed: candidates.filter((c) => c.progress === 'signed').length,
}

/** How far along the funnel a row is, as a number, so phase 3 can compare. */
export const progressIndex = (p: Progress) => PROGRESS.indexOf(p)
/** Reached this rung or beyond. */
export const reached = (c: Candidate, p: Progress) => progressIndex(c.progress) >= progressIndex(p)
