// Client-side (mobile) experience — the app the *prospect* uses on their phone,
// which is what produces every number the advisor screens read.
//
// The Adventures list is the client's home screen: one unlocked adventure at a
// time, the rest greyed until the one before it is done. Copy and order are
// taken from the mobile design, not invented here.

export type TabId = 'adventures' | 'knomee' | 'finid'

export interface MobileTab {
  id: TabId
  label: string
  /** The centre tab is the raised knomee mark rather than a flat icon. */
  center?: boolean
}

// Order is deliberate: Adventures · Knomee · Financial ID, and nothing else.
export const mobileTabs: MobileTab[] = [
  { id: 'adventures', label: 'Adventures' },
  { id: 'knomee', label: 'Knomee', center: true },
  { id: 'finid', label: 'Financial ID' },
]

/** Keys map to the illustration drawn for each row. */
export type AdventureIcon =
  | 'joy'
  | 'confidence'
  | 'outlook'
  | 'future'
  | 'goals'
  | 'events'
  | 'people'
  | 'short'
  | 'values'
  | 'history'
  | 'risk'

export interface Adventure {
  title: string
  icon: AdventureIcon
  /** Only the current adventure is open; the rest are locked until it is done. */
  state: 'open' | 'locked' | 'done'
  blurb?: string
  minutes?: number
}

export const adventures: Adventure[] = [
  {
    title: 'Financial Joy',
    icon: 'joy',
    state: 'open',
    blurb: 'Discover what brings you joy.',
    minutes: 1,
  },
  { title: 'Confidence', icon: 'confidence', state: 'locked' },
  { title: 'Outlook', icon: 'outlook', state: 'locked' },
  { title: 'Future You', icon: 'future', state: 'locked' },
  { title: 'Goals', icon: 'goals', state: 'locked' },
  { title: 'Life Events', icon: 'events', state: 'locked' },
  { title: 'People', icon: 'people', state: 'locked' },
  { title: 'Short Term Goals', icon: 'short', state: 'locked' },
  { title: 'Values', icon: 'values', state: 'locked' },
  { title: 'Money History', icon: 'history', state: 'locked' },
  { title: 'Risk Tolerance', icon: 'risk', state: 'locked' },
]

// Progress counts the five adventures that make a complete Financial ID — the
// same five the advisor-side funnel counts as "Adv 1–5".
export const adventureProgress = { done: 0, required: 5 }

/** Signed-in client, shown as the avatar initial in the mobile top bar. */
export const clientInitial = 'D'
