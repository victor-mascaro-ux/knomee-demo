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

// Base book of business (before any prospect is converted this session).
export const baseClients: Client[] = [
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
