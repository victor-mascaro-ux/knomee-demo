import { advisorConfidenceAnswer, confidenceAnswers, financialId } from './financialId'

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
  isNew?: boolean // signed up since the advisor last looked
  /* What they answered, which is all a segment is read from
     (prospectSegments.ts). The answers are stored, never the labels, so a
     segment cannot say something the person did not. */
  /** Financial Joy's "I want money to help me with", ranked, up to three. */
  joy?: string[]
  /** The Confidence adventure's six sliders, 0–100, in its order: condition,
      resilience, goal belief, joy spend, never-regret, advisor value. */
  confidence?: number[]
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
// distributed book below is appended to these. Each carries the answers its
// top action was written from, so the purpose and posture half of its segment
// agrees with it. The other half, vision × readiness, is read against the
// whole book's medians, so it can say something the action did not.
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
    // Hers are read off her Financial ID rather than typed again, so her
    // segment and her profile can never disagree.
    joy: financialId.financialJoy.chips,
    confidence: [...confidenceAnswers, advisorConfidenceAnswer].map((a) => a.value),
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
    joy: ['Supporting my family', 'Security', 'Control'],
    confidence: [70, 55, 80, 60, 65, 90],
    isNew: true,
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
    joy: ['Supporting my family', 'Independence', 'Security'],
    confidence: [80, 78, 85, 70, 80, 75],
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
    joy: ['Enjoying the moment', 'Comfort', 'Simplicity'],
    confidence: [60, 55, 65, 75, 60, 65],
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
    joy: ['Independence', 'Enjoying the moment', 'Choice'],
    confidence: [72, 65, 78, 80, 70, 40],
    isNew: true,
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
    joy: ['Supporting my family', 'Comfort', 'Security'],
    confidence: [55, 50, 60, 55, 62, 60],
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
    joy: ['Supporting my family', 'Simplicity'],
    confidence: [45, 40, 55, 50, 45, 60],
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
    joy: ['Security'],
    confidence: [40, 45, 50, 40, 50, 45],
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
    joy: ['Enjoying the moment', 'Comfort'],
    confidence: [50, 40, 45, 65, 50, 40],
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
    joy: ['Status', 'Control'],
    confidence: [30, 25, 35, 40, 30, 35],
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
    joy: ['Status', 'Security'],
    confidence: [35, 30, 40, 45, 35, 30],
    isNew: true,
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

/* ── What the generated book answered ──────────────────────────────────────
   A segment is read from answers (prospectSegments.ts), so every scored row
   needs some: its ranked Financial Joy picks and its six Confidence sliders.
   They are drawn here, after the loop above and from streams of their own, so
   adding them moved no name, tier, KQ, date, action or receptivity it made.

   Real books cluster, and the draws lean on the row the way people do: whoever
   can see the future but is not yet moving tends to want money for living it,
   whoever is already acting tends to want it as a shield, and confidence rises
   with readiness. No row is handed a segment — the labels come out of the
   rules applied to these answers, and land wherever those rules put them. */

/* Separate seeds from the loop's 0x5eed, so the answers can be re-drawn
   without disturbing the book they describe. */
const ANSWER_SEEDS = { tilt: 0x5147, joy: 0x2772, confidence: 0x3b06 }

/* The loop draws Clarity and Intent as the same KQ ± 8, so the two move
   together and almost nobody can see the future without acting on it, or act
   without seeing it — no real cohort looks like that, and the vision ×
   readiness quadrants collapse onto the diagonal. Each row trades up to this
   many points between the two, their sum kept, so Clarity and Intent still
   centre on the row's KQ, and neither is pushed past either end. */
const TILT = 18
/* How far Clarity and Intent must sit apart before a row leans one way. */
const LEAN_GAP = 4

/* The actions above that vouch for a score. The trade may not move a row
   against its own action: one that calls the picture clear never loses
   Clarity, one that calls them ready never loses Intent, the thin-picture
   action never gains Clarity and the low-urgency one never gains Intent. An
   action that vouches for both keeps the loop's scores as drawn. */
type Claim = { clarity?: 'high' | 'low'; intent?: 'high' | 'low' }
const CLAIMS: Record<string, Claim> = {
  [ACTIONS.tier1[0]]: { clarity: 'high', intent: 'high' },
  [ACTIONS.tier1[1]]: { intent: 'high' },
  [ACTIONS.tier1[2]]: { intent: 'high' },
  [ACTIONS.tier1[3]]: { clarity: 'high', intent: 'high' },
  [ACTIONS.tier3[1]]: { intent: 'low' },
  [ACTIONS.tier3[3]]: { clarity: 'low' },
}

/* The prototype's Joy cards in the clusters people pick them in — whoever
   picks Security is likely to pick Supporting my family next — plus the
   write-in the phone suggests for giving. */
const JOY_CLUSTERS = [
  ['Supporting my family', 'Security', 'Control'],
  ['Choice', 'Independence', 'Simplicity'],
  ['Enjoying the moment', 'Comfort'],
  ['Philanthropy and giving'],
  ['Status'],
]

/* How strongly each kind of row reaches for each cluster above. */
const JOY_LEAN = {
  // Can see the future, not yet moving: money for living it, and room to choose.
  vision: [1, 3, 5, 1, 0.3],
  // Moving, the picture still forming: money as a shield.
  action: [6, 2, 1, 1, 0.3],
  even: [4, 2, 2, 1, 0.3],
  // The nurture tail: comfort now, and what money says about them.
  nurture: [2, 1, 4, 0.5, 2],
}

/* Where a row's confidence centres: steadier the further along it is. */
const CONF_BASE = 15
const CONF_SLOPE = 0.75

const weighted = (weights: number[], r: number) => {
  let x = r * weights.reduce((a, b) => a + b, 0)
  const i = weights.findIndex((w) => (x -= w) < 0)
  return i < 0 ? weights.length - 1 : i
}

function drawJoy(rand: () => number, lean: number[]): string[] {
  const home = weighted(lean, rand())
  const count = 1 + Math.floor(rand() * 3)
  const joy: string[] = []
  for (let k = 0; k < count; k++) {
    // The first pick comes from the row's own cluster, and most later ones do.
    const own = JOY_CLUSTERS[home].filter((o) => !joy.includes(o))
    const pool =
      own.length && (k === 0 || rand() < 0.55)
        ? own
        : JOY_CLUSTERS[weighted(lean.map((w, i) => (i === home ? 0 : w)), rand())].filter(
            (o) => !joy.includes(o),
          )
    if (pool.length) joy.push(pool[Math.floor(rand() * pool.length)])
  }
  return joy
}

function drawConfidence(rand: () => number, kq: number): number[] {
  const centre = CONF_BASE + CONF_SLOPE * kq + (rand() * 2 - 1) * 6
  return Array.from({ length: 6 }, () => clamp(centre + (rand() * 2 - 1) * 9))
}

function withAnswers(rows: Prospect[]): Prospect[] {
  const tilt = mulberry32(ANSWER_SEEDS.tilt)
  const joyRand = mulberry32(ANSWER_SEEDS.joy)
  const confRand = mulberry32(ANSWER_SEEDS.confidence)
  return rows.map((p) => {
    if (p.kq === null) return p
    const c = p.clarity as number
    const i = p.intent as number
    // Drawn for every scored row, claimed or not, so the rows after it keep
    // the draws they had.
    const raw = Math.round((tilt() * 2 - 1) * TILT)
    // A positive trade lifts Clarity and lowers Intent; a claim closes off
    // whichever direction would argue with it.
    const claim = CLAIMS[p.topAction] ?? {}
    const lo = claim.clarity === 'high' || claim.intent === 'low' ? 0 : Math.max(1 - c, i - 100)
    const hi = claim.intent === 'high' || claim.clarity === 'low' ? 0 : Math.min(100 - c, i - 1)
    const d = Math.max(lo, Math.min(hi, raw))
    const clarity = c + d
    const intent = i - d
    const lean =
      p.tier === 'tier3'
        ? JOY_LEAN.nurture
        : clarity - intent >= LEAN_GAP
          ? JOY_LEAN.vision
          : intent - clarity >= LEAN_GAP
            ? JOY_LEAN.action
            : JOY_LEAN.even
    return {
      ...p,
      clarity,
      intent,
      joy: drawJoy(joyRand, lean),
      confidence: drawConfidence(confRand, p.kq),
    }
  })
}

export const prospects: Prospect[] = [
  ...featuredProspects,
  ...withAnswers(randomProspects(30, 0x5eed)),
]

// Pulse metrics for the dashboard, derived from the book so they can never
// drift from the table below them. Every tab that talks about the standing
// prospect book reads these, so the numbers agree everywhere.
const scored = prospects.filter((p) => p.kq !== null)
/* Scores are whole numbers wherever they are shown — averages included. */
const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)
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
