/* Family Insights — the advisor's read on a household rather than on a person.
 *
 * The client's Insights answer "how is this relationship, and what do I say to
 * her". A household's answer a different question: where do these two agree,
 * where do they not, and what does that mean for the conversation you have with
 * them TOGETHER. So the toolkit is the same shape — a top action, starters, a
 * key, words to use and avoid — with a household's own four techniques, and the
 * cards under it are the ones only a pair can have: what they share, what they
 * differ on, and the topics to tread carefully around.
 *
 * Everything reads against `familyId`, whose columns are the two members' own
 * answers, so nothing here can describe a household the Family ID does not show.
 *
 * All figures and answers are placeholder demo data.
 */

import { familyId } from './familyId'
import type { ToolkitTab } from './readiness'

const [her, him] = familyId.members

/** A statement both members answered, with where each of them landed. */
export interface SharedStatement {
  statement: string
  low: string
  high: string
  /** 0–100 per member, in the order the members are in. */
  marks: number[]
}

/* ── the toolkit ────────────────────────────────────────────────────────── */

export const FAMILY_RECOMMENDATIONS_KEY: ToolkitTab['key'] = [
  {
    tag: 'Finding Common Ground',
    meaning:
      'Surface the values and future hopes both household members already share. Starting with overlap creates momentum and lowers defensiveness.',
  },
  {
    tag: 'Clarify Shared Priorities',
    meaning:
      'Help the household weigh competing priorities with clarity. Making the tradeoffs visible reduces overwhelm and supports better decisions without pressure or judgment.',
  },
  {
    tag: 'Addressing Differences',
    meaning:
      'Name differences without judgment. When each person feels understood, it becomes easier to plan collaboratively.',
  },
  {
    tag: 'Aligning Tradeoffs',
    meaning:
      'Help the household weigh competing goals in a practical, fair sequence. Good household planning is usually about timing, not about choosing one person over the other.',
  },
]

export const familyToolkit: ToolkitTab = {
  topAction:
    'Anchor them in their shared family-centered future, then help them sequence college, retirement, lifestyle-property goals, and time freedom into one coordinated household plan.',

  starters: [
    {
      quote:
        'You both paint a future that is less about status and more about time together — family, nature, travel, and a place that helps everyone slow down. What part of that shared picture feels most important to protect first?',
      why: 'Start with the emotional overlap in their visions, so the conversation begins from shared meaning rather than from tradeoffs.',
      tags: ['Finding Common Ground', 'Clarify Shared Priorities'],
    },
    {
      quote:
        'You both care deeply about creating options for your kids, and you each have a strong picture of the life you want later. How should we think about balancing college, retirement and a future home in a way that feels responsible to both of you?',
      why: 'Frame the planning conversation around sequencing and tradeoffs, not either/or choices.',
      tags: ['Clarify Shared Priorities', 'Aligning Tradeoffs'],
    },
    {
      quote:
        'Emily, you’re navigating a lot of personal change right now; Sebastian, you seem very focused on stability and on being present for the family. Over the next twelve months, what would “more secure as a household” actually look like for each of you?',
      why: 'Name the difference in their present emotional context without making either person feel wrong.',
      tags: ['Addressing Differences', 'Aligning Tradeoffs'],
    },
    {
      quote:
        'Emily, your future vision feels coastal, restorative and open-ended; Sebastian, yours feels outdoorsy, rooted and tradition-oriented. What does the shared version of that life look like when you put the two pictures together?',
      why: 'Use the difference in their lifestyle imagery to help them articulate a joint vision rather than leaving it implied.',
      tags: ['Addressing Differences', 'Finding Common Ground'],
    },
  ],

  key: FAMILY_RECOMMENDATIONS_KEY,

  questions: [],

  words: {
    use: [
      { word: 'Family' },
      { word: 'Security' },
      { word: 'Freedom' },
      { word: 'Together', hint: 'The household is the client here, not either half of it' },
      { word: 'Options' },
      { word: 'Balance' },
      { word: 'Future' },
      { word: 'Flexibility' },
      { word: 'Peace Of Mind' },
      { word: 'Home' },
    ],
    avoid: [
      { word: 'Aggressive' },
      { word: 'Complex' },
      { word: 'High-risk' },
      { word: 'Pressure' },
      { word: 'Optimization' },
      { word: 'Benchmarks' },
      { word: 'Products' },
      { word: 'Returns' },
      { word: 'Abstract jargon' },
      {
        word: 'One-size-fits-all',
        hint: 'Two people with one plan is the opposite of one plan for everybody',
      },
    ],
  },
}

/* ── where they meet, and where they do not ─────────────────────────────── */

export const similarities = {
  statement: {
    statement: 'I believe I can achieve my financial goals.',
    low: 'not confident',
    high: 'very confident',
    /* One mark: they answered this the same, which is the point of the card. */
    marks: [72, 72],
  } as SharedStatement,
  points: [
    'Both are strongly family-centered, and both use money as a way to create security, choice and meaningful experiences together.',
    'Both hold a vivid future lifestyle vision: more time with family, less stress, and a home base near nature or water.',
    'Both seem motivated more by quality of life than by wealth for its own sake.',
    'Both are future-oriented and open to planning that builds toward that life deliberately — his college-and-retirement balancing, the lake place, the outdoors-first vision all say it.',
  ],
}

export const differences = {
  statements: [
    {
      statement: 'I’m confident in my current financial condition to live the life I want.',
      low: 'not confident',
      high: 'very confident',
      marks: [24, 52],
    },
    {
      statement: 'I regret or second-guess my financial decisions.',
      low: 'not confident',
      high: 'very confident',
      marks: [50, 78],
    },
    {
      statement: 'I believe I can achieve my financial goals.',
      low: 'not confident',
      high: 'very confident',
      marks: [38, 62],
    },
  ] as SharedStatement[],
  points: [
    `${her.name.split(' ')[0]} appears to be in an active phase of reinvention: a separation, a career change, wellness, freedom, and possibly a new venture.`,
    `${him.name.split(' ')[0]} appears more focused on structure, stability, family provision, and preserving time with the kids while managing college and retirement.`,
    `Her future picture leans coastal, restorative and flexible; his leans mountains, lakes, fishing and a rooted family retreat.`,
    `Her language is more emotionally expansive; his is more grounded in stewardship, clarity and long-term provision.`,
  ],
}

/* ── what each of them brings to the table ──────────────────────────────── */

/** Three lists, each a member to a column — the shape the Family ID's cards
    already use, so the two tabs read as one page. */
export interface MemberLists {
  concerns: string[]
  joy: string[]
  vision: string[]
}

export const byMember: Record<string, MemberLists> = {
  [her.name]: {
    concerns: [
      'College funding',
      'Future health uncertainty',
      'Aging-family responsibilities',
      'How to shape her next chapter during a period of transition',
      'Engaged and generally confident; needs help organising emotionally loaded decisions',
    ],
    joy: [
      'Family connection',
      'Travel',
      'Generosity',
      'Wellness',
      'Living a meaningful life near the water',
    ],
    vision: [
      'Freedom',
      'Travel',
      'Health',
      'Helping others',
      'A warm, welcoming home life — near the beach, or abroad',
    ],
  },
  [him.name]: {
    concerns: [
      'Staying on track for the kids’ college',
      'Saving for retirement',
      'Being more present for the kids despite a demanding job',
      'Overall strong confidence; looking for clarity on how to pace long-term goals',
    ],
    joy: [
      'Simple outdoor family moments, especially by the lake',
      'Fishing with the kids',
      'Being able to say yes to those experiences without financial stress',
    ],
    vision: [
      'Working less',
      'Spending more time outdoors',
      'Fishing with family',
      'Light consulting or mentoring',
      'A small place by the mountains or a lake',
    ],
  },
}

/* ── what to tread carefully around ─────────────────────────────────────── */

export interface SensitiveTopic {
  topic: string
  why: string
  how: string
}

export const sensitiveTopics: SensitiveTopic[] = [
  {
    topic: 'Emily’s transition period',
    why: 'A separation and a career change may change how she weighs security, independence and long-term planning.',
    how: 'Lead with empathy and optionality. Break decisions into near-term stability and long-term design.',
  },
  {
    topic: 'College vs. retirement vs. lifestyle goals',
    why: 'Both care deeply about the kids, and household resources may feel stretched across several meaningful priorities at once.',
    how: 'Frame it as sequencing rather than sacrifice. Show what can happen now, what can happen later, and what changes under different scenarios.',
  },
  {
    topic: 'Different future-life imagery',
    why: 'Her vision and his are compatible in spirit but not identical in form — coast and mountains are not the same picture.',
    how: 'Work from the shared values underneath the images first: family, nature, peace, and time together.',
  },
  {
    topic: 'Time, work and presence',
    why: 'He is concerned about being present with the kids; she appears to want more freedom and room for a fulfilling next chapter.',
    how: 'Help them define what a better-balanced household life means in practical terms over the next one to three years.',
  },
]

export const familyInsights = {
  toolkit: familyToolkit,
  similarities,
  differences,
  byMember,
  sensitiveTopics,
}
