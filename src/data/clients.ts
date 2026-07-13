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
  { id: 'reconnect', title: 'TIER 3 – RECONNECT', range: '0–39 KQ' },
  { id: 'incomplete', title: 'INCOMPLETE PROFILES' },
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
    secondaryStatus: 'Incomplete',
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
