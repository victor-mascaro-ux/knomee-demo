/* The Family ID — the household's Financial ID, read a member at a time.
 *
 * It is not a new artefact: it is the same adventures, answered by two people,
 * laid side by side so an advisor can see where a household agrees and where it
 * does not. Emily's column IS her Financial ID — read straight off
 * `clientProfile`, never restated — and Sebastian's is his own.
 *
 * Only the second member's answers live here. Anything shown for Emily that
 * disagreed with her own page would be a second source of truth for the same
 * person.
 *
 * All figures and answers are placeholder demo data.
 */

import { clientProfile } from './clientProfile'
import type { ClientGoal } from './clientProfile'
import type { VisionBoard } from './clientProfile'
import type { LifeEvent, ProfileQuestion } from './financialId'

export interface FamilyMemberId {
  name: string
  /** What they are to the household, as the member list has it. */
  role: string
  checkIn: { mood: string; level: number; date: string }
  /** Keyed by the highlight's title, so the two columns of a highlight tile are
      the same question answered twice rather than two unrelated lines. */
  highlights: Record<string, string>
  goals: ClientGoal[]
  confidence: string
  lifeEvents: LifeEvent[]
  questions: ProfileQuestion[]
  joy: string[]
  futureYou: { where: string[]; what: string[]; who: string[] }
  /* The letter Future You writes back, where the member wrote one. */
  postcard?: string
  outlook: { concerns: string[]; hopes: string[] }
  badges: string[]
  /* The one card a member can have several of, or none. */
  boards: VisionBoard[]
}

/* ── Emily, off her own page ─────────────────────────────────────────────── */

const emily: FamilyMemberId = {
  name: clientProfile.owner,
  role: 'Client',
  checkIn: clientProfile.checkIn,
  highlights: Object.fromEntries(clientProfile.keyHighlights.map((h) => [h.title, h.text])),
  goals: clientProfile.goals,
  confidence: clientProfile.confidence,
  lifeEvents: clientProfile.lifeEvents,
  questions: clientProfile.questions,
  joy: clientProfile.financialJoy.chips,
  futureYou: clientProfile.futureYou,
  postcard: clientProfile.postcard,
  outlook: clientProfile.outlook,
  badges: clientProfile.badges,
  boards: clientProfile.boards,
}

/* ── Sebastian, the second seat ──────────────────────────────────────────── */

/* He has answered the same adventures and answered them differently: the same
   beach house reads as the kids' education to her and as their own retirement
   to him. Where he has answered nothing — life events, questions — the card
   shows its empty state rather than borrowing hers. */
const sebastian: FamilyMemberId = {
  name: 'Sebastian Watson',
  role: 'Spouse',
  checkIn: { mood: 'Good', level: 4, date: '05/03/2025' },
  highlights: {
    'Core Values': 'Family, stability, and keeping his word — to the kids and to her.',
    'Joy & Motivation':
      'Time outdoors, fishing with the kids, and work that leaves room for the rest of his life.',
    'Biggest Concern':
      'Staying on track for the kids’ college without giving up their own retirement.',
    Hopes: 'Coming out of a demanding stretch at work with the family still close.',
    'Lifestyle Aspiration': 'Fewer hours, more of them spent near water and out of the city.',
    'Future Vision': 'A place by a lake, part-time consulting, and grandchildren in the summer.',
  },
  goals: [
    { title: 'Buy a house by the beach', readiness: 3 },
    { title: 'Add alternatives to portfolio – angel invest', readiness: 2 },
    { title: 'Increase gift to my favorite philanthropy', readiness: 4, completed: '05/03/2025' },
  ],
  confidence: 'Strong',
  lifeEvents: [],
  questions: [],
  joy: ['Enjoying the moment', 'Security', 'Supporting my family'],
  postcard:
    'Four days a week now, and the two I keep are the ones I actually like. ' +
    'We got the place by the lake — smaller than we talked about, close enough to drive up on a ' +
    'Friday. I taught the youngest to read the water this summer, badly, and she caught more than ' +
    'I did. Two of the people I mentor have their own teams. Stop counting the years to it.',
  futureYou: {
    where: ['In the mountains', 'By a lake', 'Outdoors'],
    what: ['Working less', 'Spending more time outside', 'Fishing with family', 'Mentoring'],
    who: ['Emily', 'Children', 'Future grandkids', 'Close friends'],
  },
  outlook: {
    concerns: [
      'Making sure we are on track for the kids’ college while still saving enough for our own retirement.',
      'Balancing a demanding job with being truly present for the kids as they grow up.',
    ],
    hopes: [
      'I am hopeful that the foundation we are building now will give our kids real choices in school, careers, and where they want to live.',
      'I picture us having a small place near mountains or a lake where we spend summers fishing and having family visit.',
    ],
  },
  badges: ['Financial Joy', 'Confidence', 'Outlook', 'Future You', 'Goals'],
  /* He has not made one. The card says so in his column rather than showing
     hers twice. */
  boards: [],
}

export const familyId = {
  household: clientProfile.household,
  /* The order the member list is in, so the columns do not swap between the two
     tabs of the same page. */
  members: [emily, sebastian] as FamilyMemberId[],
  /* Every highlight the household answers, in the order Emily's page asks them
     — one tile per question, two columns inside it. */
  highlights: clientProfile.keyHighlights.map((h) => ({ icon: h.icon, title: h.title })),
}
