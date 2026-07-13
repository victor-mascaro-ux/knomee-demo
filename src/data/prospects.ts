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

export const prospects: Prospect[] = [
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
    name: 'Soiphie Dean',
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
