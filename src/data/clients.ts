export type ClientTier = 'engaged' | 'attention' | 'reconnect' | 'incomplete'

export interface Client {
  name: string
  email: string
  household?: string
  sentiment: number | null // filled dots out of 5; null → not applicable
  warn?: boolean // amber caution marker on the sentiment
  status: 'complete' | 'incomplete' | 'pending'
  secondaryStatus?: string // e.g. "Incomplete" shown under a "pending" badge
  lastSignIn: string
  lastLabel?: string // e.g. "Last invited:"
  tier: ClientTier
  isNew?: boolean
}

export interface ClientTierGroup {
  id: ClientTier
  title: string
  range?: string
}

export const clientTierGroups: ClientTierGroup[] = [
  { id: 'engaged', title: 'TIER 1 – ENGAGED', range: '70–100 KR' },
  { id: 'attention', title: 'TIER 2 – ATTENTION', range: '40–69 KR' },
  // Client relationship scores use "KR" everywhere — the tier-3 label read
  // "KQ" in the source, which was inconsistent with the other tiers.
  { id: 'reconnect', title: 'TIER 3 – RECONNECT', range: '0–39 KR' },
  { id: 'incomplete', title: 'INCOMPLETE PROFILES' },
]

// Headline metric shown in the Clients "Top Line Metrics" card.
export const AVG_KR_SCORE = 65.6

// Overall client confidence breakdown (sums to 100).
export const confidenceScore = 33
export const confidenceSegments = [
  { label: 'Frustrated', color: '#ef4444', pct: 7 },
  { label: 'Concerned', color: '#f59e0b', pct: 21 },
  { label: 'Neutral', color: '#eab308', pct: 18 },
  { label: 'Positive', color: '#a3e635', pct: 26 },
  { label: 'Delighted', color: '#84cc16', pct: 28 },
]

// "Clients active this week" trend (percent of clients active per week).
export const activeThisWeek = 72
export const activeSeries = [
  { week: '04/14 – 04/20', value: 42 },
  { week: '04/21 – 04/27', value: 46 },
  { week: '04/28 – 05/04', value: 68 },
  { week: '05/05 – 05/11', value: 40 },
  { week: '05/12 – 05/18', value: 78 },
  { week: '05/19 – 05/25', value: 72 },
]

export interface ClientInsight {
  name: string
  lines: string[]
}

// Fixed the "Sophie Tran" reference — the only Sophie in the book is Sophie Dean.
export const clientInsights: ClientInsight[] = [
  { name: 'Emily Watson', lines: ['No login in 22 days.', '1/4 goals completed.'] },
  { name: 'Miles Dean', lines: ['Dropped engagement score (-20).', '0 adventures done.'] },
  { name: 'Sophie Dean', lines: ['High activity, low advisor reliance (10%).'] },
]

// Hand-authored, "featured" clients that lead each tier. The randomly
// distributed book below is appended to these.
const featuredClients: Client[] = [
  {
    name: 'Jennifer Martinez',
    email: 'jennifer.martinez@email.com',
    sentiment: 3,
    status: 'complete',
    lastSignIn: '06/05/2025',
    tier: 'engaged',
  },
  {
    name: 'Emily Watson',
    email: 'emily.watson@email.com',
    household: 'Watson Family',
    sentiment: 4,
    status: 'incomplete',
    lastSignIn: '05/30/2025',
    tier: 'engaged',
  },
  {
    name: 'Jorday Ray',
    email: 'jorday.ray@email.com',
    sentiment: 4,
    status: 'complete',
    lastSignIn: '05/30/2025',
    tier: 'engaged',
  },
  {
    name: 'Barbara Dean',
    email: 'barbara.dean@email.com',
    household: 'Dean Family',
    sentiment: 4,
    warn: true,
    status: 'complete',
    lastSignIn: '06/05/2025',
    tier: 'attention',
  },
  {
    name: 'Sophie Dean',
    email: 'sophie.dean@email.com',
    household: 'Dean Family',
    sentiment: 3,
    warn: true,
    status: 'complete',
    lastSignIn: '06/05/2025',
    tier: 'attention',
  },
  {
    name: 'Sebastian Watson',
    email: 'sebastian.watson@email.com',
    household: 'Watson Family',
    sentiment: 3,
    status: 'complete',
    lastSignIn: '05/22/2025',
    tier: 'attention',
  },
  {
    name: 'Miles Dean',
    email: 'miles.dean@email.com',
    household: 'Dean Family',
    sentiment: 4,
    status: 'complete',
    lastSignIn: '06/05/2025',
    tier: 'reconnect',
  },
  {
    name: 'Maya Gomez',
    email: 'maya.gomez@email.com',
    sentiment: 4,
    warn: true,
    status: 'complete',
    lastSignIn: '05/30/2025',
    tier: 'reconnect',
  },
  {
    name: 'Emma Rossi',
    email: 'emma.rossi@beaconplan.co',
    sentiment: null,
    status: 'pending',
    secondaryStatus: 'incomplete',
    lastSignIn: '06/05/2025',
    lastLabel: 'Last invited:',
    tier: 'incomplete',
  },
  {
    name: 'David Ray',
    email: 'david.ray@email.com',
    sentiment: 5,
    status: 'incomplete',
    lastSignIn: '05/30/2025',
    tier: 'incomplete',
  },
]

/* ── Randomly distributed book ──────────────────────────────────────────────
   The rest of the book is generated from a fixed seed so the distribution is
   stable across builds. Each client is assigned a tier at random, a sentiment,
   a status and a last-sign-in date. A slice of the ENGAGED tier is flagged as
   freshly converted (isNew) — this is what decides who converted from a
   prospect into a client in the database. */

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
  'Charlotte', 'Logan', 'Amelia', 'Elijah', 'Harper', 'James', 'Evelyn', 'Benjamin', 'Grace',
  'Alexander', 'Chloe', 'Daniel', 'Zoe', 'Matthew', 'Lily', 'Nora', 'Hazel', 'Aurora', 'Ruby',
  'Elena', 'Clara', 'Priya', 'Naomi', 'Diego', 'Freya', 'Leah', 'Sienna', 'Marcus', 'Aaron',
]
const LAST = [
  'Bennett', 'Carter', 'Nguyen', 'Patel', 'Reyes', 'Fischer', 'Okafor', 'Silva', 'Romano',
  'Bauer', 'Larsen', 'Costa', 'Mensah', 'Cohen', 'Wallace', 'Ferreira', 'Novak', 'Sato',
  'Blanc', 'Moreau', 'Klein', 'Vega', 'Hansen', 'Dubois', 'Serrano', 'Haddad', 'Kowalski',
]

function randomClientDate(rand: () => number): string {
  const start = Date.UTC(2025, 3, 20) // 20 Apr 2025
  const end = Date.UTC(2025, 5, 6) // 06 Jun 2025
  const d = new Date(start + rand() * (end - start))
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function randomClients(count: number, seed: number): Client[] {
  const rand = mulberry32(seed)
  const used = new Set(featuredClients.map((c) => c.name.toLowerCase()))
  const out: Client[] = []
  let guard = 0
  while (out.length < count && guard < count * 20) {
    guard++
    const first = FIRST[Math.floor(rand() * FIRST.length)]
    const last = LAST[Math.floor(rand() * LAST.length)]
    const name = `${first} ${last}`
    if (used.has(name.toLowerCase())) continue
    used.add(name.toLowerCase())

    const roll = rand()
    const tier: ClientTier =
      roll < 0.44 ? 'engaged' : roll < 0.74 ? 'attention' : roll < 0.9 ? 'reconnect' : 'incomplete'

    if (tier === 'incomplete') {
      const pending = rand() < 0.5
      out.push({
        name,
        email: `${first}.${last}@email.com`.toLowerCase(),
        sentiment: null,
        status: pending ? 'pending' : 'incomplete',
        secondaryStatus: pending ? 'incomplete' : undefined,
        lastSignIn: randomClientDate(rand),
        lastLabel: pending ? 'Last invited:' : undefined,
        tier,
      })
      continue
    }

    // Sentiment trends down as the tier cools; engaged clients occasionally
    // carry an amber caution, reconnect clients more often.
    const base = tier === 'engaged' ? 4 : tier === 'attention' ? 3 : 2
    const sentiment = Math.max(1, Math.min(5, base + (rand() < 0.35 ? 1 : 0) - (rand() < 0.25 ? 1 : 0)))
    const warn = rand() < (tier === 'engaged' ? 0.12 : tier === 'attention' ? 0.3 : 0.45)
    // A quarter of the engaged tier are freshly converted prospects.
    const isNew = tier === 'engaged' && rand() < 0.28
    // Occasionally attach a household label.
    const household = rand() < 0.28 ? `${last} Family` : undefined

    out.push({
      name,
      email: `${first}.${last}@email.com`.toLowerCase(),
      household,
      sentiment,
      warn: warn || undefined,
      status: rand() < 0.15 ? 'incomplete' : 'complete',
      lastSignIn: randomClientDate(rand),
      tier,
      isNew: isNew || undefined,
    })
  }
  return out
}

// Base book of business (before any prospect is converted this session).
export const baseClients: Client[] = [...featuredClients, ...randomClients(22, 0xc11e)]

// A converted prospect becomes a freshly-onboarded ENGAGED client.
export function convertedClient(name: string, email: string): Client {
  return {
    name,
    email,
    sentiment: 4,
    status: 'complete',
    lastSignIn: new Date()
      .toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    tier: 'engaged',
    isNew: true,
  }
}
