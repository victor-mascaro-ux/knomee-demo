
/* The five statements behind the Confidence dial. `value` is where the client
   left the slider, 0-100. They sit high because the dial reads Strong — a
   result and its answers cannot disagree. The last two are worded so that the
   right-hand end is the good end, which is why they read high too. */
export interface ConfidenceAnswer {
  statement: string
  value: number
  low: string
  high: string
}

export const confidenceAnswers: ConfidenceAnswer[] = [
  {
    statement: 'I’m confident in my current financial condition to live the life I want.',
    value: 82,
    low: 'not confident',
    high: 'very confident',
  },
  {
    statement: 'I feel confident that I can weather unexpected financial challenges and changes.',
    value: 74,
    low: 'not confident',
    high: 'very confident',
  },
  {
    statement: 'I believe I can achieve my financial goals.',
    value: 88,
    low: 'not confident',
    high: 'very confident',
  },
  {
    statement: 'I spend money on experiences, causes, services, and items that bring me joy.',
    value: 79,
    low: 'never',
    high: 'most of the time',
  },
  {
    statement: 'I regret or second-guess my financial decisions.',
    value: 71,
    low: 'often regret',
    high: 'never regret',
  },
]

// Demo content for a prospect's "Financial ID" profile page. All placeholder
// data — one rich profile stands in for whichever prospect is opened.

/** The demo's today — what a goal marked done from the panel is dated. */
export const DEMO_TODAY = '06/12/2025'

export interface Goal {
  /** "New" when just added, "Updated" when just saved — a pill on its row. */
  tags?: string[]
  title: string
  readiness: number // 1–5 bars
  completed?: string // date if the goal is done
  /* What the goal card opens onto. Every field is optional: a goal somebody
     named and never went back to is a title and a readiness, and the panel
     shows what there is rather than a row of blanks. */
  updated?: string
  timeline?: string
  pros?: string[]
  cons?: string[]
  /** The sentence they wrote about it, in their own words. */
  note?: string
  /** Rows only some goals have. An advisor's move carries who it involves and
      what is holding the decision, which no client's goal has a slot for and
      neither of which is "My goal". */
  extra?: { label: string; value: string }[]
}

export interface LifeEvent {
  /** "New" when just added, "Updated" when just saved — a pill on its row. */
  tags?: string[]
  /* The event the client picked — "Property purchase". The mobile picker files
     these under supercategories (Purchase / Professional / Personal), but those
     exist to help someone *find* the event in a long list; once one is chosen
     the supercategory says nothing the event does not. */
  kind: string
  text: string
  date: string
  /* Logged by the advisor rather than answered by the client. */
  advisorAdded?: boolean
  /* What the panel opens onto, all optional — an event somebody logged in a
     hurry is a kind and a line, and the panel shows what there is. */
  details?: string
  /** How they feel about it, on the app's own five faces. */
  sentiment?: number
  /** The date they marked it done. */
  completed?: string
}

export interface ProfileQuestion {
  /** "New" when just added, "Updated" when just saved — a pill on its row. */
  tags?: string[]
  q: string
  date?: string
  resolved?: string
}

export const financialId = {
  joined: 'March 2023',
  /* Whose profile this is. One prospect page is built out and it is hers, so
     only her name in the Prospects table opens it — the same rule the Clients
     table follows for Emily Watson. */
  owner: 'Sarah Mitchell',

  keyHighlights: [
    { icon: 'financial-joy', title: 'Core Values', text: 'Security, independence, simplicity, and connection' },
    { icon: 'financial-joy', title: 'Joy & Motivation', text: 'Time with her husband and cultural experiences like theater' },
    { icon: 'outlook', title: 'Biggest Concern', text: 'Preparing for future health outcomes for herself and Vic' },
    { icon: 'outlook', title: 'Hopes', text: 'Having the strength to manage it all and seeing Vic’s health improve' },
    { icon: 'future-you', title: 'Lifestyle Aspiration', text: 'Living near family with the freedom to travel, connect, and enjoy meaningful experiences' },
    { icon: 'future-you', title: 'Future Vision', text: 'Near loved ones, traveling, and staying active with family in the years ahead' },
  ],
  /* The three the app puts in front of her when she adds a goal, drawn from
     what her adventures already say she is weighing. */
  suggestedGoals: [
    'Plan a family beach vacation',
    'Spend more time with my mom as she goes through treatments',
    'Contribute more to cancer-related philanthropy',
  ],
  goals: [
    {
      title: 'Family Disney beach vacation to Oahu.',
      readiness: 4,
      updated: '05/06/2025',
      timeline: '<6 months',
      pros: ['Freedom', 'Adventure', 'Quality time with family and friends'],
      cons: ['High cost', 'Scheduling'],
      note: 'Family Disney beach vacation to Oahu.',
    },
    {
      title: 'Buy a house by the beach',
      readiness: 2,
      updated: '04/18/2025',
      timeline: '5–10 years',
      pros: ['Somewhere the family gathers', 'A base for the next chapter'],
      cons: ['Ties up capital', 'Upkeep from a distance'],
      note: 'Somewhere near the water that the whole family comes back to.',
    },
    {
      title: 'Save for a down payment on a second home',
      readiness: 3,
      updated: '04/18/2025',
      timeline: '1–3 years',
      pros: ['Makes the beach house possible', 'Forces a savings habit'],
      cons: ['Competes with college funding'],
    },
    {
      title: 'Add alternatives to portfolio - angel invest',
      readiness: 1,
      timeline: '1–3 years',
      pros: ['Backing people I believe in', 'Something outside the market'],
      cons: ['Illiquid', 'Most of them fail'],
      updated: '02/09/2025',
    },
    {
      title: 'Purchase a new car',
      readiness: 5,
      timeline: '<6 months',
      pros: ['Safer for the kids', 'Nothing left to decide'],
      cons: ['Depreciates the moment it moves'],
      updated: '05/06/2025',
    },
    {
      title: 'Build a year of living expenses in cash',
      readiness: 5,
      timeline: 'Ongoing',
      pros: ['Sleep at night', 'A year of anything changes nothing'],
      cons: ['Cash earns little'],
      updated: '03/22/2025',
    },
    {
      title: 'Set up a trust for the grandchildren',
      readiness: 3,
      timeline: '1–3 years',
      pros: ['Certainty for the kids', 'Decided while everyone agrees'],
      cons: ['Legal work', 'Locks money away'],
      updated: '03/22/2025',
    },
    {
      title: 'Take a sabbatical in 2027',
      readiness: 1,
      timeline: '3–5 years',
      pros: ['Time before the next chapter', 'Something to look forward to'],
      cons: ['A year without income', 'Hard to plan around the kids'],
      note: 'Three months away, somewhere near water.',
      updated: '02/09/2025',
    },
    {
      title: 'Move the parents closer to us',
      readiness: 2,
      timeline: '1–3 years',
      pros: ['Easier to help', 'The kids see them weekly'],
      cons: ['Cost of the move', 'They may not want to'],
      updated: '03/10/2025',
    },
    {
      title: 'Fund a scholarship at my old school',
      readiness: 4,
      timeline: '5–10 years',
      pros: ['Giving where it was given to me', 'Something with our name on it'],
      cons: ['Needs the rest of the plan settled first'],
      updated: '01/15/2025',
    },
    {
      title: 'Buy a boat',
      readiness: 2,
      completed: '05/03/2025',
      timeline: 'Done',
      pros: ['Weekends on the water'],
      cons: ['Upkeep'],
      updated: '05/03/2025',
    },
    {
      title: 'Increase gift to my favorite philanthropy',
      readiness: 4,
      completed: '05/03/2025',
      timeline: 'Done',
      pros: ['Giving while we can see it work'],
      cons: ['Less for the other goals'],
      updated: '05/03/2025',
    },
    {
      title: 'Go on vacation with family to Mexico in 2025',
      readiness: 2,
      completed: '05/03/2025',
      timeline: 'Done',
      pros: ['Everyone in one place'],
      cons: ['Booked late'],
      updated: '05/03/2025',
    },
  ] as Goal[],
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
  /* Her own words, written to herself from ten years out. */
  postcard:
    'The house is close enough to the water that I can hear it with the windows open. ' +
    'The business runs without me in the room, which took longer than I wanted and was worth every ' +
    'bit of it. Both kids finished school with no debt between them. I still check the numbers on a ' +
    'Sunday, but it is a habit now, not a worry. Stop bracing for the bad year — you got through it.',
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
      text: 'Bought the beach house in Costa Rica',
      date: '05/03/2025',
      advisorAdded: true,
      sentiment: 5,
    },
    /* How she feels about each, on the five faces her phone offers. */
    { kind: 'Career change', text: 'Laid off in March', date: '05/03/2025', sentiment: 1 },
    { kind: 'Separation', text: 'Going through a separation', date: '05/03/2025', sentiment: 2, completed: '05/03/2025' },
    { kind: 'New baby', text: 'First grandchild due in October', date: '04/02/2025', sentiment: 5 },
    { kind: 'Retirement', text: 'Targeting a wind-down from 2028', date: '02/17/2025', sentiment: 4, advisorAdded: true },
  ] as LifeEvent[],
  questions: [
    { q: 'Can I afford to go to college?', date: '05/03/2025' },
    { q: 'Can I afford this family vacation?', date: '05/03/2025' },
    { q: 'Should I start a new company?', date: '05/03/2025' },
    { q: 'Can I afford to go to college?', resolved: '05/03/2025' },
    { q: 'Can I afford this family vacation?', resolved: '05/03/2025' },
    { q: 'Should I start a new company?', resolved: '05/03/2025' },
  ] as ProfileQuestion[],
}
