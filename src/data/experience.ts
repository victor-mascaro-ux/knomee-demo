// Client-side (mobile) experience — the app the *prospect* uses on their phone,
// which is what produces every number the advisor screens read.
//
// Content follows the "Adventures page redesign" handoff from Claude Design
// (My Adventures.html): the five core adventures are done, so the screen is no
// longer a list of locked cards. It shows what was completed and when, the two
// things worth adding next, and the rest still to come — with the knomee mark
// in the tab bar opening quick access, or voice capture on a long press.

export type TabId = 'adventures' | 'knomee' | 'finid'

export interface MobileTab {
  id: TabId
  label: string
  /** The centre tab is the knomee mark rather than a flat icon. */
  center?: boolean
}

// Order is deliberate: Adventures · Knomee · Financial ID, and nothing else.
export const mobileTabs: MobileTab[] = [
  { id: 'adventures', label: 'Adventures' },
  { id: 'knomee', label: 'Knomee', center: true },
  { id: 'finid', label: 'Financial ID' },
]

/** Keys map to the illustration imported for each row. */
export type ArtKey =
  | 'financial-joy'
  | 'confidence'
  | 'outlook'
  | 'future-you'
  | 'goals'
  | 'life-events'
  | 'questions'
  | 'vision'
  | 'divorce'

/* ── the adventures list ─────────────────────────────────────────────────── */

export interface CompletedAdventure {
  title: string
  art: ArtKey
  /** Shown as "Completed <on>". */
  on: string
}

export const completedAdventures: CompletedAdventure[] = [
  { title: 'Financial Joy', art: 'financial-joy', on: '08.04.2025' },
  { title: 'Confidence', art: 'confidence', on: '08.04.2025' },
  { title: 'Outlook', art: 'outlook', on: '08.04.2025' },
  { title: 'Future You', art: 'future-you', on: '08.04.2025' },
]

/** A row that asks for something rather than reporting it. */
export interface AdventureAction {
  title: string
  art: ArtKey
  blurb: string
  minutes: number
  label: string
  /** Outline pill instead of the filled one — the quieter of the two asks. */
  outline?: boolean
}

export const adventureActions: AdventureAction[] = [
  {
    title: 'Goals',
    art: 'goals',
    blurb: 'Add a new goal.',
    minutes: 3,
    label: 'Add goal',
    outline: true,
  },
  { title: 'Life Events', art: 'life-events', blurb: 'Add a new life event.', minutes: 3, label: 'Start' },
]

/** Still to come. No artwork exists for these in the design system yet. */
export const lockedAdventures = [
  'People',
  'Short Term Goals',
  'Values',
  'Money History',
  'Risk Tolerance',
]

// The five core adventures that make a complete Financial ID — the same five
// the advisor-side funnel counts as "Adv 1–5". All done in this state.
export const adventureProgress = { done: 5, required: 5 }

/* ── quick access (single tap on the knomee mark) ─────────────────────────── */

export interface QuickAction {
  label: string
  art: ArtKey
  /** Raster art carries no white disc of its own, so it is inset in the slot. */
  raster?: boolean
}

/** The adventure offered at the top of the sheet, above the grid. */
export const quickNext: AdventureAction = {
  title: 'Life Events',
  art: 'life-events',
  blurb: 'Next up · add a new life event.',
  minutes: 3,
  label: 'Start',
}

export const quickActions: QuickAction[] = [
  { label: 'Save a vision', art: 'vision' },
  { label: 'Add a new goal', art: 'goals' },
  { label: 'Add a life event', art: 'life-events' },
  { label: 'Ask a question', art: 'questions' },
]

export type MoodId = 'worried' | 'unsure' | 'neutral' | 'good' | 'great'

export const moodQuestion = 'How do you feel about your money today?'

/** Low to high — the --mood-1…--mood-5 ramp. */
export const moods: { id: MoodId; word: string }[] = [
  { id: 'worried', word: 'Worried' },
  { id: 'unsure', word: 'Unsure' },
  { id: 'neutral', word: 'Neutral' },
  { id: 'good', word: 'Good' },
  { id: 'great', word: 'Great' },
]

/** Faces sit on an arc: degrees from vertical, then the disc and face geometry. */
export const MOOD_ANGLES = [-40, -20, 0, 20, 40]
export const MOOD_ARC = { r: 250, faceR: 200, face: 46 }

/* ── voice capture (long press on the knomee mark) ────────────────────────── */

// A scripted demo: the words arrive one at a time, are offered for editing, and
// land as the thing they ask for. Three of them, one per long press in turn,
// so a room sees the one gesture become each of the three records it can make.
export const voiceTiming = {
  wordMs: 320,
  firstWordMs: 1100,
  settleMs: 520,
  hint: 'Say anything. Knomee turns it into the right next step.',
}

export interface VoiceScript {
  said: string[]
  /** The button that makes it: what will happen, in words. */
  action: string
  /** Said once it has. */
  done: string
  result: { tag: string; title: string; meta: string; art: ArtKey }
}

export const voices: VoiceScript[] = [
  {
    said: ['I', 'just', 'got', 'divorced'],
    action: 'Create a life event',
    done: 'Life event created',
    result: {
      tag: 'Personal',
      title: 'Divorce',
      meta: 'Added to Life Events · 3 min to finish',
      art: 'divorce',
    },
  },
  {
    said: ['Can', 'I', 'afford', 'to', 'retire', 'at', 'sixty?'],
    action: 'Ask a question',
    done: 'Question sent',
    result: {
      tag: 'Question',
      title: 'Can I afford to retire at 60?',
      meta: 'Sent to your advisor · Added to Questions',
      art: 'questions',
    },
  },
  {
    said: ['I', 'want', 'a', 'lake', 'house', 'in', 'five', 'years'],
    action: 'Add a goal',
    done: 'Goal added',
    result: {
      tag: 'Goal',
      title: 'Buy a lake house',
      meta: 'Added to Goals · 3–5 years',
      art: 'goals',
    },
  },
]

/** Signed-in client, shown as the avatar initial in the in-phone menu. */
export const clientInitial = 'D'

/* ── a new client's journey ───────────────────────────────────────────────
   Her phone starts where a new client starts: nothing done, Financial Joy
   open, the rest waiting in the order they are taken, ending at Life Events.
   Finishing one opens the next. Only Financial Joy is built, so the others
   open but go nowhere yet. */
export interface JourneyStep {
  id: string
  title: string
  art?: ArtKey
  blurb: string
  minutes: number
  /** One of the five that make a complete Financial ID. */
  core?: boolean
}

export const journey: JourneyStep[] = [
  { id: 'financial-joy', title: 'Financial Joy', art: 'financial-joy', blurb: 'Discover what brings you joy.', minutes: 1, core: true },
  { id: 'confidence', title: 'Confidence', art: 'confidence', blurb: 'See how sure you feel about money.', minutes: 3, core: true },
  { id: 'outlook', title: 'Outlook', art: 'outlook', blurb: 'Name what you hope for, and what worries you.', minutes: 3, core: true },
  { id: 'future-you', title: 'Future You', art: 'future-you', blurb: 'Picture where you want to be.', minutes: 3, core: true },
  { id: 'goals', title: 'Goals', art: 'goals', blurb: 'Set what you are working toward.', minutes: 3, core: true },
  { id: 'life-events', title: 'Life Events', art: 'life-events', blurb: 'Add what is changing in your life.', minutes: 3 },
]
