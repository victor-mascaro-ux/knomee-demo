
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

export interface Goal {
  title: string
  readiness: number // 1–5 bars
  completed?: string // date if the goal is done
}

export interface LifeEvent {
  tag: string
  kind: string
  text: string
  date: string
}

export interface ProfileQuestion {
  q: string
  date?: string
  resolved?: string
}

export const financialId = {
  joined: 'March 2023',
  keyHighlights: [
    { icon: 'financial-joy', title: 'Core Values', text: 'Security, independence, simplicity, and connection' },
    { icon: 'financial-joy', title: 'Joy & Motivation', text: 'Time with her husband and cultural experiences like theater' },
    { icon: 'outlook', title: 'Biggest Concern', text: 'Preparing for future health outcomes for herself and Vic' },
    { icon: 'outlook', title: 'Hopes', text: 'Having the strength to manage it all and seeing Vic’s health improve' },
    { icon: 'future-you', title: 'Lifestyle Aspiration', text: 'Living near family with the freedom to travel, connect, and enjoy meaningful experiences' },
    { icon: 'future-you', title: 'Future Vision', text: 'Near loved ones, traveling, and staying active with family in the years ahead' },
  ],
  goals: [
    { title: 'Family Disney beach vacation to Oahu.', readiness: 4 },
    { title: 'Buy a house by the beach', readiness: 2 },
    { title: 'Save for a down payment on a second home', readiness: 3 },
    { title: 'Add alternatives to portfolio - angel invest', readiness: 1 },
    { title: 'Purchase a new car', readiness: 5 },
    { title: 'Build a year of living expenses in cash', readiness: 5 },
    { title: 'Set up a trust for the grandchildren', readiness: 3 },
    { title: 'Take a sabbatical in 2027', readiness: 1 },
    { title: 'Move the parents closer to us', readiness: 2 },
    { title: 'Fund a scholarship at my old school', readiness: 4 },
    { title: 'Buy a boat', readiness: 2, completed: '05/03/2025' },
    { title: 'Increase gift to my favorite philanthropy', readiness: 4, completed: '05/03/2025' },
    { title: 'Go on vacation with family to Mexico in 2025', readiness: 2, completed: '05/03/2025' },
  ] as Goal[],
  financialJoy: {
    prompt: 'I want money to help me with',
    chips: ['Enjoying the moment', 'Choice/Freedom', 'Philanthropy and giving'],
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
    { tag: 'Purchase', kind: 'Property purchase', text: 'Bought the beach house in Costa Rica', date: '05/03/2025' },
    { tag: 'Professional', kind: 'Career change', text: 'Laid off in March', date: '05/03/2025' },
    { tag: 'Personal', kind: 'Separation', text: 'Going through a separation', date: '05/03/2025' },
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
