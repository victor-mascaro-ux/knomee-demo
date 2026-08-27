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
    { icon: '🎯', title: 'Core Values', text: 'Security, independence, simplicity, and connection' },
    { icon: '✨', title: 'Joy & Motivation', text: 'Time with her husband and cultural experiences like theater' },
    { icon: '⚠️', title: 'Biggest Concern', text: 'Preparing for future health outcomes for herself and Vic' },
    { icon: '🎯', title: 'Hopes', text: 'Having the strength to manage it all and seeing Vic’s health improve' },
    { icon: '🖼️', title: 'Lifestyle Aspiration', text: 'Living near family with the freedom to travel, connect, and enjoy meaningful experiences' },
    { icon: '⚡', title: 'Future Vision', text: 'Near loved ones, traveling, and staying active with family in the years ahead' },
  ],
  goals: [
    { title: 'Family Disney beach vacation to Oahu.', readiness: 4 },
    { title: 'Buy a house by the beach', readiness: 2 },
    { title: 'Save for a down payment on a second home', readiness: 3 },
    { title: 'Add alternatives to portfolio - angel invest', readiness: 1 },
    { title: 'Purchase a new car', readiness: 5 },
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
  badges: [
    { label: 'Financial Joy', icon: '💰', color: '#5ec2b7' },
    { label: 'Confidence', icon: '☀️', color: '#f5c451' },
    { label: 'Outlook', icon: '🔭', color: '#e0668a' },
    { label: 'Future You', icon: '🧭', color: '#8ec06b' },
    { label: 'Goals', icon: '🎯', color: '#48b0e0' },
  ],
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
