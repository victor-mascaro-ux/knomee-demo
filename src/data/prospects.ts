export type Tier = 'tier1' | 'tier2' | 'tier3' | 'incomplete'

export interface Prospect {
  name: string
  email: string
  avatar?: string // image url for photo avatars; otherwise initial is used
  kq: number | null
  intent: number | null
  clarity: number | null
  receptivity: number | null
  signUp: string
  signUpLabel?: string // overrides the plain sign-up date (e.g. "Last invited:")
  topAction: string
  tier: Tier
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

// The hand-authored, "featured" prospects that lead each tier. The randomly
// distributed book below is appended to these.
const featuredProspects: Prospect[] = [
  {
    name: 'Sarah Mitchell',
    email: 'sara.mitchell@email.com',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=faces',
    kq: 81,
    intent: 83,
    clarity: 62,
    receptivity: 100,
    signUp: '06/05/2025',
    topAction:
      'Call now — “worked since 13, ready for adventures”; lead with Future You vision',
    tier: 'tier1',
  },
  {
    name: 'Emma Rossi',
    email: 'emma.rossi@beaconplan.co',
    kq: 88,
    intent: 86,
    clarity: 90,
    receptivity: 88,
    signUp: '06/05/2025',
    topAction:
      'Urgent personal circumstances (caregiving); call to discuss home & estate plan',
    tier: 'tier1',
  },
  {
    name: 'Jorday Ray',
    email: 'jorday.ray@email.com',
    kq: 76,
    intent: 80,
    clarity: 74,
    receptivity: 74,
    signUp: '06/05/2025',
    topAction:
      'Family legacy is their stated #1 life goal; lead with generational wealth',
    tier: 'tier1',
  },
  {
    name: 'Barbara Dean',
    email: 'barbara.dean@email.com',
    kq: 68,
    intent: 70,
    clarity: 69,
    receptivity: 65,
    signUp: '06/05/2025',
    topAction:
      'Hobby goal disconnected from financial vision; needs goal reframe session',
    tier: 'tier2',
  },
  {
    name: 'Sophie Dean',
    email: 'sophie.dean@email.com',
    kq: 62,
    intent: 60,
    clarity: 64,
    receptivity: 62,
    signUp: '06/05/2025',
    topAction:
      'Travel urgency but self-directed; send value-add travel planning content',
    tier: 'tier2',
  },
  {
    name: 'Sebastian Watson',
    email: 'Sebastian.Watson@email.com',
    kq: 58,
    intent: 55,
    clarity: 60,
    receptivity: 59,
    signUp: '06/05/2025',
    topAction:
      'Grandkids focus; not thinking about goal; re-engage with legacy content',
    tier: 'tier2',
  },
  {
    name: 'Miles Watson',
    email: 'miles.Watson@email.com',
    kq: 49,
    intent: 48,
    clarity: 52,
    receptivity: 47,
    signUp: '06/05/2025',
    topAction:
      'Goal driven by partner; involve both partners; relationship-based outreach',
    tier: 'tier2',
  },
  {
    name: 'Maya Watson',
    email: 'maya.Watson@email.com',
    kq: 42,
    intent: 40,
    clarity: 45,
    receptivity: 41,
    signUp: '06/05/2025',
    topAction:
      'Very terse responses; minimal engagement; low-touch nurture sequence',
    tier: 'tier2',
  },
  {
    name: 'Emily Watson',
    email: 'emily.watson@email.com',
    kq: 35,
    intent: 35,
    clarity: 38,
    receptivity: 32,
    signUp: '06/05/2025',
    topAction: 'Hobby-only focus; minimal urgency; quarterly light-touch check-in',
    tier: 'tier3',
  },
  {
    name: 'David Watson',
    email: 'david.watson@email.com',
    kq: 28,
    intent: 30,
    clarity: 25,
    receptivity: 29,
    signUp: '06/05/2025',
    topAction:
      'Financial reward only; thin Future You; send financial education series',
    tier: 'tier3',
  },
  {
    name: 'Janet Murphy',
    email: 'janet.murphy@email.com',
    kq: 28,
    intent: 30,
    clarity: 25,
    receptivity: 29,
    signUp: '06/05/2025',
    topAction:
      'Financial reward only; thin Future You; send financial education series',
    tier: 'tier3',
  },
  {
    name: 'Anna Abbot',
    email: 'anna.abbot@beaconplan.co',
    kq: null,
    intent: null,
    clarity: null,
    receptivity: null,
    signUp: '06/05/2025',
    signUpLabel: 'Last invited:',
    topAction: 'Complete Knomee Prospect flow.',
    tier: 'incomplete',
  },
]

/* ── Randomly distributed book ──────────────────────────────────────────────
   The rest of the book is generated from a fixed seed so the "distribution at
   random" is stable across builds. Each person is assigned a tier at random
   (weighted like a real funnel), a KQ inside that tier's band, and supporting
   scores that vary around it. This is what decides who is a prospect in the
   database — clients and converted prospects live in clients.ts. */

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
  'Olivia', 'Liam', 'Ava', 'Noah', 'Isabella', 'Ethan', 'Sofia', 'Lucas', 'Mia', 'Mason',
  'Charlotte', 'Logan', 'Amelia', 'Elijah', 'Harper', 'James', 'Evelyn', 'Benjamin', 'Abigail',
  'Henry', 'Grace', 'Alexander', 'Chloe', 'Daniel', 'Zoe', 'Matthew', 'Lily', 'Samuel', 'Nora',
  'Joseph', 'Hazel', 'Gabriel', 'Aurora', 'Julian', 'Ruby', 'Leo', 'Elena', 'Aaron', 'Clara',
  'Owen', 'Priya', 'Marcus', 'Naomi', 'Diego', 'Freya', 'Isaac', 'Leah', 'Victor', 'Sienna',
]
const LAST = [
  'Bennett', 'Carter', 'Nguyen', 'Patel', 'Reyes', 'Fischer', 'Okafor', 'Silva', 'Kowalski',
  'Haddad', 'Romano', 'Bauer', 'Larsen', 'Ivanov', 'Costa', 'Mensah', 'Petrov', 'Cohen', 'Wallace',
  'Ferreira', 'Novak', 'Sato', 'Blanc', 'Moreau', 'Klein', 'Vega', 'Hansen', 'Dubois', 'Serrano',
]

const ACTIONS: Record<Tier, string[]> = {
  tier1: [
    'Book a meeting this week — strong readiness and a clear Future You vision',
    'Call now — high intent and receptivity; lead with their stated goal',
    'Send a personalised plan; they are ready to act on legacy priorities',
    'Fast-track to a first meeting — vision and readiness both above the book',
  ],
  tier2: [
    'Reframe the goal into a concrete first step; then follow up',
    'Send value-add content matched to their concern; re-engage in two weeks',
    'Involve both partners; relationship-based outreach before a meeting',
    'Confidence is the gap — share a short win before pitching a plan',
  ],
  tier3: [
    'Quarterly light-touch check-in; keep warm with education',
    'Send the financial education series; minimal urgency today',
    'Low-touch nurture sequence; revisit after the next Adventure',
    'Thin Future You — invite to complete another Adventure first',
  ],
  incomplete: ['Complete Knomee Prospect flow.'],
}

const clamp = (n: number) => Math.max(1, Math.min(100, Math.round(n)))

function randomProspects(count: number, seed: number): Prospect[] {
  const rand = mulberry32(seed)
  const used = new Set(featuredProspects.map((p) => p.name.toLowerCase()))
  const out: Prospect[] = []
  let guard = 0
  while (out.length < count && guard < count * 20) {
    guard++
    const first = FIRST[Math.floor(rand() * FIRST.length)]
    const last = LAST[Math.floor(rand() * LAST.length)]
    const name = `${first} ${last}`
    if (used.has(name.toLowerCase())) continue
    used.add(name.toLowerCase())

    // Weighted funnel: mostly Considering, a solid Ready Now head, a Nurture
    // tail, and a few profiles that never finished the Adventure.
    const roll = rand()
    const tier: Tier = roll < 0.28 ? 'tier1' : roll < 0.72 ? 'tier2' : roll < 0.9 ? 'tier3' : 'incomplete'

    if (tier === 'incomplete') {
      out.push({
        name,
        email: `${first}.${last}@email.com`.toLowerCase(),
        kq: null,
        intent: null,
        clarity: null,
        receptivity: null,
        signUp: randomDate(rand),
        signUpLabel: 'Last invited:',
        topAction: ACTIONS.incomplete[0],
        tier,
      })
      continue
    }

    const band = tier === 'tier1' ? [70, 99] : tier === 'tier2' ? [40, 69] : [5, 39]
    const kq = Math.round(band[0] + rand() * (band[1] - band[0]))
    const jitter = () => (rand() - 0.5) * 16
    out.push({
      name,
      email: `${first}.${last}@email.com`.toLowerCase(),
      kq,
      intent: clamp(kq + jitter()),
      clarity: clamp(kq + jitter()),
      receptivity: clamp(kq + jitter()),
      signUp: randomDate(rand),
      topAction: ACTIONS[tier][Math.floor(rand() * ACTIONS[tier].length)],
      tier,
    })
  }
  return out
}

function randomDate(rand: () => number): string {
  // Spread sign-ups across spring 2025.
  const start = Date.UTC(2025, 2, 1) // 01 Mar 2025
  const end = Date.UTC(2025, 5, 6) // 06 Jun 2025
  const d = new Date(start + rand() * (end - start))
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

export const prospects: Prospect[] = [...featuredProspects, ...randomProspects(30, 0x5eed)]

// Pulse metrics for the dashboard, derived from the book so they can never
// drift from the table below them. Every tab that talks about the standing
// prospect book reads these, so the numbers agree everywhere.
const scored = prospects.filter((p) => p.kq !== null)
const round1 = (n: number) => Math.round(n * 10) / 10
const mean = (xs: number[]) => (xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)
const tierKQ = (t: Tier) => mean(prospects.filter((p) => p.tier === t && p.kq !== null).map((p) => p.kq as number))

export const prospectStats = {
  total: prospects.length,
  scored: scored.length,
  avgKQ: mean(scored.map((p) => p.kq as number)),
  avgIntent: mean(scored.map((p) => p.intent as number)),
  avgClarity: mean(scored.map((p) => p.clarity as number)),
  avgReceptivity: mean(scored.map((p) => p.receptivity as number)),
  byTier: {
    tier1: prospects.filter((p) => p.tier === 'tier1').length,
    tier2: prospects.filter((p) => p.tier === 'tier2').length,
    tier3: prospects.filter((p) => p.tier === 'tier3').length,
    incomplete: prospects.filter((p) => p.tier === 'incomplete').length,
  },
  avgKQByTier: {
    tier1: tierKQ('tier1'),
    tier2: tierKQ('tier2'),
    tier3: tierKQ('tier3'),
  },
}
