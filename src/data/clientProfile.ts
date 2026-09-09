// Demo content for a client's profile page — the converted counterpart to
// `financialId.ts`, which serves the prospect side. Same Financial ID spine, so
// the two pages read as one family; what a client adds is a household, an
// advisory team, a check-in mood, and a vision board.
//
// All placeholder data: one rich profile stands in for whichever client is
// opened, exactly as the prospect page does.

import type { Goal, LifeEvent, ProfileQuestion } from './financialId'

/** A goal on the client page can also carry status tags. */
export interface ClientGoal extends Goal {
  tags?: string[]
}

export interface HouseholdMember {
  name: string
  role: string
  /** The member whose profile is open. */
  current?: boolean
}

export interface TeamMember {
  name: string
  role: string
}

/** Photos are dropped into public/avatars/ by hand; see the README there. A
    person with no file keeps their initial, which is what the design shows for
    the members without a portrait. */
export const avatarFor = (name: string) =>
  `./avatars/${name.toLowerCase().replace(/[^a-z]+/g, '-')}.jpg`

/** One tile on a vision board: a photograph, or a note the client wrote. */
export type BoardTile =
  /* A photograph takes one cell, or claims a second one — `tall` for a second
     row, `wide` for a second column. A landscape photograph must never take
     `tall`: a wide scene in a 1-wide, 2-high cell is cropped to a slot it was
     never shot for. It is `wide` or it is the plain square cell. BoardPhoto
     enforces that from the file's own dimensions, so a landscape image dropped
     into public/vision/ later cannot break the rule either. */
  | { kind: 'photo'; src: string; alt: string; tall?: boolean; wide?: boolean }
  | { kind: 'note'; title?: string; text?: string; items?: string[]; tone?: 'mint' | 'lilac' }

export interface VisionBoard {
  title: string
  blurb: string
  tiles: BoardTile[]
}

const photo = (src: string, alt: string, tall?: boolean): BoardTile => ({
  kind: 'photo',
  src: `./vision/${src}.png`,
  alt,
  tall,
})

/* The landscape ones: a full row of their own rather than a square crop. */
const widePhoto = (src: string, alt: string): BoardTile => ({
  kind: 'photo',
  src: `./vision/${src}.png`,
  alt,
  wide: true,
})

export const clientProfile = {
  joined: 'March 2025',
  household: 'Watson Family',
  checkIn: { mood: 'Good', level: 4, date: '05/03/2025' },

  members: [
    { name: 'Emily Watson', role: 'Spouse', current: true },
    { name: 'Sebastian Watson', role: 'Spouse' },
  ] as HouseholdMember[],

  /* Whose profile this is. There is one built-out client page and it is hers —
     her household, her advisory team, her vision board — so only her name in
     the Clients table opens it. Opening it from another client's row put their
     name above the Watson family. */

  owner: 'Emily Watson',

  team: [
    { name: 'Jennifer Martinez', role: 'Advisor' },
    { name: 'David Chen', role: 'Support' },
  ] as TeamMember[],

  keyHighlights: [
    {
      icon: 'financial-joy',
      title: 'Core Values',
      text: 'Family, freedom, meaningful connection, and a life that feels grounded and joyful.',
    },
    {
      icon: 'financial-joy',
      title: 'Joy & Motivation',
      text: 'Travel, enjoying the moment, and having the flexibility to live generously and on her own terms.',
    },
    {
      icon: 'outlook',
      title: 'Biggest Concern',
      text: 'Balancing college costs for her kids with future health needs and aging-family responsibilities.',
    },
    {
      icon: 'outlook',
      title: 'Hopes',
      text: 'Navigating major change, including a separation and a career shift, while rethinking what comes next.',
    },
    {
      icon: 'future-you',
      title: 'Lifestyle Aspiration',
      text: 'Navigating major change, including a separation and a career shift, while rethinking what comes next.',
    },
    {
      icon: 'future-you',
      title: 'Future Vision',
      text: 'Living by the beach or abroad, possibly running a business, helping others, building a warm home life.',
    },
  ],

  // Rendered in two columns, filled column-first the way the design lays them
  // out: the live goals first, the completed ones beneath.
  goals: [
    { title: 'Family Disney beach vacation to Oahu.', readiness: 4, tags: ['New'] },
    {
      title: 'Save for a down payment on a second home',
      readiness: 3,
      tags: ['New', 'Sensitive'],
    },
    { title: 'Purchase a new car', readiness: 5, tags: ['Updated'] },
    { title: 'Build a year of living expenses in cash', readiness: 5 },
    { title: 'Set up a trust for the grandchildren', readiness: 3 },
    { title: 'Take a sabbatical in 2027', readiness: 1, tags: ['New'] },
    { title: 'Move the parents closer to us', readiness: 2, tags: ['Sensitive'] },
    { title: 'Fund a scholarship at my old school', readiness: 4 },
    { title: 'Buy a boat', readiness: 2, completed: '05/03/2025' },
    { title: 'Go on vacation with family to Mexico in 2025', readiness: 3, completed: '05/03/2025' },
    { title: 'Buy a house by the beach', readiness: 2 },
    { title: 'Add alternatives to portfolio - angel invest', readiness: 1 },
    { title: 'Increase gift to my favorite philanthropy', readiness: 4, completed: '05/03/2025' },
  ] as ClientGoal[],

  financialJoy: {
    prompt: 'I want money to help me with',
    chips: ['Enjoying the moment', 'Choice/Freedom', 'Philanthropy and giving'],
  },

  /* The second half of the same adventure: where she wants her attention to
     go, and where she would rather it did not. It rides in this card rather
     than a new one — the advisor's Practice Joy carries the same pair. */
  attention: {
    more: ['Family time', 'Health and wellbeing', 'Travel and experiences', 'Giving and philanthropy'],
    less: ['Day-to-day money admin', 'Worrying about the market'],
  },

  futureYou: {
    where: ['At the beach', 'Abroad'],
    what: ['Relaxing', 'Running a business', 'Helping others', 'Traveling'],
    who: ['Family', 'Friends', 'Romantic partner'],
  },

  outlook: {
    concerns: [
      'I worry about affording college for my two kids.',
      'What happens if I get sick and my parents are also starting to age?',
    ],
    hopes: [
      'I dream of my kids being successful in their careers.',
      'My perfect day includes travel, family, and fun – near the water, hopefully involving a boat.',
    ],
  },

  badges: ['Financial Joy', 'Confidence', 'Outlook', 'Future You', 'Goals'],
  confidence: 'Strong',

  lifeEvents: [
    {
      kind: 'Property purchase',
      text: 'Bought the beach house in Costa Rica for our wedding …',
      date: '05/03/2025',
      advisorAdded: true,
    },
    { kind: 'Career change', text: 'Laid off in March', date: '05/03/2025' },
    { kind: 'Separation', text: 'Going through a separation', date: 'Completed: 05/03/2025' },
    { kind: 'New baby', text: 'First grandchild due in October', date: '04/02/2025' },
    { kind: 'Health issues', text: "Vic's treatment continues through the summer", date: '03/10/2025' },
  ] as LifeEvent[],

  questions: [
    { q: 'Can I afford to go to college?', date: '05/03/2025' },
    { q: 'Can I afford this family vacation?', date: '05/03/2025' },
    { q: 'Should I start a new company?', date: '04/18/2025' },
    { q: 'How much should we keep liquid for Vic’s care?', date: '03/22/2025' },
    { q: 'Is now the right time to buy the beach house?', date: '02/09/2025' },
    { q: 'Should I take the severance or negotiate?', resolved: '01/15/2025' },
    { q: 'Can we help the kids with a deposit without hurting our plan?', resolved: '11/30/2024' },
  ] as ProfileQuestion[],

  boards: [
    {
      title: 'Coastal Life Dreams',
      blurb: 'A coastal lifestyle anchored in family, freedom, and giving back',
      tiles: [
        photo('dream-beach-house', 'Cliffs meeting the sea', true),
        {
          kind: 'note',
          title: 'My Morning Affirmation',
          text: 'Wake up to ocean waves. Feel the salt air. Live where vacation meets everyday life.',
        },
        widePhoto('family-gatherings', 'Family together outdoors'),
        photo('sunset-walks', 'Sun low over the water', true),
        photo('coastal-interior', 'Looking out to the coast', true),
        photo('peaceful-mornings', 'Silhouettes against a sunset'),
        {
          kind: 'note',
          tone: 'mint',
          text: 'Create a home where people feel welcomed, loved, and inspired. Where Sunday dinners are sacred and laughter echoes through the halls.',
        },
        {
          kind: 'note',
          tone: 'lilac',
          title: 'Ocean Mantra',
          text: 'By the sea, I find my peace. By the sea, I find myself.',
        },
      ],
    },
    {
      title: 'Wellness Journey',
      blurb: 'Building a healthy lifestyle through mindful movement and nutrition',
      tiles: [
        photo('morning-yoga-ritual', 'Yoga in morning light', true),
        {
          kind: 'note',
          tone: 'lilac',
          title: 'Daily Affirmations',
          text: 'I am strong, I am capable. I honor my body with movement and rest.',
        },
        photo('mindful-moments', 'Still water, misty and quiet'),
        photo('nourishing-meals', 'A colourful bowl of whole food', true),
        {
          kind: 'note',
          tone: 'mint',
          title: 'Wellness Goals',
          items: [
            '30 min movement daily',
            '8 hours sleep',
            'Whole foods',
            'Nature walks',
            'Meditation practice',
          ],
        },
        widePhoto('strength-balance', 'Strength training'),
        photo('peaceful-sanctuary', 'Trees and a path to walk'),
      ],
    },
  ] as VisionBoard[],
}
