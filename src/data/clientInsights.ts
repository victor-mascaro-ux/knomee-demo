/* Client Insights — the advisor's read on a client they already have.
 *
 * The prospect side asks "how ready is this person to convert?"; once they have
 * converted, that question is answered and a different one takes over: how
 * strong is the relationship, and what is the next conversation worth having.
 * So this fills the SAME shapes as `readiness.ts` — one snapshot, one toolkit —
 * with the client's own score (the Knomee Relationship, KR) and the client's
 * own four techniques. Nothing here is a new component; the page is the
 * Readiness and Toolkit cards pointed at Emily.
 *
 * Every line of evidence is read off her Financial ID rather than typed in
 * twice, so a tooltip cannot disagree with the page under the other tab.
 *
 * All figures and answers are placeholder demo data.
 */

import { clientProfile as cp } from './clientProfile'
import type { Snapshot, ToolkitTab } from './readiness'

/* ── what her profile already says ──────────────────────────────────────── */

const goalsLive = cp.goals.filter((g) => !g.completed)
const goalsDone = cp.goals.filter((g) => g.completed)
const goalsMoving = goalsLive.filter((g) => g.readiness >= 4)
const openQuestions = cp.questions.filter((q) => !q.resolved)
const recentEvents = cp.lifeEvents.slice(0, 3).map((e) => e.kind)

/* ── the snapshot ───────────────────────────────────────────────────────── */

export const clientSnapshot: Snapshot = {
  question: 'How strong the advisor–client relationship is.',
  score: { name: 'Knomee Relationship', abbr: 'KR' },
  kq: 92,
  dimensions: [
    {
      key: 'Intent',
      question: 'Are they actively working toward meaningful goals?',
      score: 100,
      caption: 'Multiple active goals',
      evidence: [
        `${goalsLive.length} goals open and ${goalsDone.length} completed`,
        `Furthest along: ${goalsMoving
          .slice(0, 2)
          .map((g) => g.title.replace(/\.$/, ''))
          .join(' · ')}`,
      ],
    },
    {
      key: 'Clarity',
      question: 'How clearly have they expressed what matters?',
      score: 100,
      caption: 'Needs, values, and goals are clear',
      evidence: [
        `Values: ${cp.financialJoy.chips.join(' · ')}`,
        `Wants more of: ${cp.attention.more.join(' · ')}`,
      ],
    },
    {
      key: 'Reliance',
      question: 'Do they trust and involve their advisor?',
      score: 80,
      caption: 'Trusted and open to guidance',
      evidence: [
        `${openQuestions.length} questions standing open for her advisor`,
        `Advisory team: ${cp.team.map((t) => `${t.name} (${t.role})`).join(' · ')}`,
      ],
    },
    {
      key: 'Word Count',
      question: 'Verbosity of text responses',
      score: 248,
      caption: 'Moderate verbosity',
      evidence: ['248 words across her written answers, including her vision boards'],
    },
    {
      key: 'Knomee Activity',
      question: 'How active and current is their knomee profile?',
      score: 90,
      caption: 'Frequently active and up to date',
      evidence: [
        `Last check-in ${cp.checkIn.date} — ${cp.checkIn.mood}`,
        `Recently logged: ${recentEvents.join(' · ')}`,
      ],
    },
    {
      key: 'Referenceability',
      question: 'Are they open to referring their advisor?',
      score: 0,
      caption: 'No referral signal yet',
      evidence: ['Nothing asked and nothing offered — the one dimension with no reading'],
    },
    {
      key: 'Household KR',
      question: "How engaged is the client's household?",
      score: 88,
      caption: 'Household is highly engaged',
      evidence: [`${cp.household}: ${cp.members.map((m) => m.name).join(' · ')}`],
    },
  ],
  tier: {
    n: 1,
    name: 'Engaged',
    body: 'Strong client relationship — high trust, active engagement, and rich client context.',
  },
}

/* ── the toolkit ────────────────────────────────────────────────────────── */

/* The client's four techniques. Where the prospect's key is about earning the
   first real conversation, these are about keeping advice tied to what she has
   already said — which is the whole advantage of advising someone whose
   Financial ID you can read. */
export const CLIENT_RECOMMENDATIONS_KEY: ToolkitTab['key'] = [
  {
    tag: 'Re-anchor to Values',
    meaning:
      'Bring the conversation back to what matters most to the client. Connecting decisions to their values, priorities, and desired life keeps advice relevant and personally meaningful.',
  },
  {
    tag: 'Clarify Tradeoffs',
    meaning:
      'Help the client weigh competing priorities with clarity. Making tradeoffs visible reduces overwhelm and supports better decisions without pressure or judgment.',
  },
  {
    tag: 'Reinforce Progress',
    meaning:
      'Highlight the progress the client has already made. Showing momentum builds confidence, increases satisfaction, and reinforces the value of the relationship.',
  },
  {
    tag: 'Acknowledge and Validate',
    meaning:
      'Reference what the client has shared to show you listened. Recognizing emotion, nuance, and life context helps the client feel understood and strengthens trust.',
  },
]

export const clientToolkit: ToolkitTab = {
  topAction:
    'Lead with her family-and-freedom vision, then help her prioritize college, health, and next-chapter decisions into one clear plan.',

  starters: [
    {
      quote:
        'You’ve described a future that feels really vivid — being near the water, traveling, spending time with family, and creating a home that feels warm and welcoming. Of everything in that picture, what feels most important for us to protect first?',
      why: 'Reconnect the conversation to Emily’s core values and use her lifestyle vision to guide planning priorities.',
      tags: ['Re-anchor to Values', 'Clarify Tradeoffs'],
    },
    {
      quote:
        'You shared that you worry about college for your two kids, while also thinking about your own health and your parents getting older. That’s a lot to hold at once. Where does it feel most important to create more clarity or relief right now?',
      why: 'Acknowledge the emotional weight of competing responsibilities, then help her sort them into manageable priorities.',
      tags: ['Acknowledge and Validate', 'Clarify Tradeoffs'],
    },
    {
      quote:
        'You’re going through a separation, a career change, and at the same time thinking about what your next chapter could look like. Given all of that, what would feeling more secure and in control over the next year look like for you?',
      why: 'Recognize that this is a transition moment and position planning as a way to restore stability and confidence.',
      tags: ['Acknowledge and Validate', 'Re-anchor to Values'],
    },
    {
      quote:
        'You’ve already made meaningful progress on things that matter to you — travel, lifestyle goals, and giving back. As you look ahead, whether that’s a second home, a new business, or increasing philanthropy, what feels like the next step that would make the biggest difference in your life?',
      why: 'Reinforce Emily’s momentum and frame the advisor relationship as helping her build on progress, not start from scratch.',
      tags: ['Reinforce Progress', 'Re-anchor to Values'],
    },
  ],

  key: CLIENT_RECOMMENDATIONS_KEY,

  questions: [
    {
      quote: 'Can I afford college for my two kids and still take care of my own future?',
      guidance:
        'Lead with empathy and help her frame this as a prioritization question, not an all-or-nothing choice.',
      points: [
        'Talk about education funding alongside her own long-term security',
        'Explore tradeoffs across college, health planning, and lifestyle goals',
        'Introduce a phased plan that protects both family priorities and future flexibility',
      ],
    },
    {
      quote: 'Should I start a new company, or focus on stability first?',
      guidance:
        'Acknowledge the career transition, then help her evaluate this decision through the lens of freedom, security, and timing.',
      points: [
        'Explore what financial stability would need to look like before making the leap',
        'Discuss how entrepreneurship fits into her desired next chapter',
        'Break the decision into near-term readiness, runway, and long-term optionality',
      ],
    },
    {
      quote:
        'How can I enjoy the life I want — travel, family time, maybe another home — without creating stress later?',
      guidance:
        'Anchor the conversation in the lifestyle she wants to build, then translate it into priorities, tradeoffs, and a sustainable plan.',
      points: [
        'Connect travel and home goals to the bigger picture of family, freedom, and peace of mind',
        'Clarify what needs to be financially supported to make those choices confidently',
        'Reframe planning as a way to enjoy life more fully, not restrict it',
      ],
    },
  ],
  questionsNote: 'The three she has asked most recently',

  words: {
    use: [
      { word: 'Family', hint: 'Her first value, and the frame every goal on her list sits inside' },
      { word: 'Freedom', hint: 'Her own word for what she wants money to buy' },
      { word: 'Flexibility' },
      { word: 'Simplicity' },
      { word: 'Peace Of Mind' },
      { word: 'Health', hint: 'Her wellness board, and her parents — both are live' },
      { word: 'Travel' },
      { word: 'Home', hint: 'The beach house and the home she wants people welcomed into' },
      { word: 'Security' },
      { word: 'Next Chapter', hint: 'A separation and a career change — she is mid-transition' },
    ],
    avoid: [
      { word: 'Aggressive' },
      { word: 'High-Risk' },
      { word: 'Complex', hint: 'She asks for simplicity by name' },
      { word: 'Optimization' },
      { word: 'Benchmarks' },
      { word: 'Returns' },
      { word: 'Products' },
      { word: 'Jargon' },
      { word: 'Obligations' },
      { word: 'Pressure', hint: 'She is already holding college, health and a separation at once' },
    ],
  },

  verbosity: {
    level: 'high',
    words: 248,
    engagement: 'Moderately expressive respondent',
    takeaway: 'A direct, purposeful communication style will likely resonate with her',
  },
}

/* ── suggested adventures ───────────────────────────────────────────────── */

/** An adventure the advisor can put in front of this client next. `tone` is
    what it asks of her — one adds something to the plan, the other takes
    something away — and the rail's glyph reads off it. */
export interface SuggestedAdventure {
  name: string
  blurb: string
  tone: 'add' | 'subtract'
}

export const suggestedAdventures: SuggestedAdventure[] = [
  {
    name: 'Angel Investing',
    blurb: 'Consider the risks and rewards of funding innovation.',
    tone: 'add',
  },
  {
    name: 'Subtracting',
    blurb: 'Focus on less to create space for what truly matters.',
    tone: 'subtract',
  },
]

/** What is left to choose from in the picker under the list. */
export const moreAdventures: SuggestedAdventure[] = [
  { name: 'Legacy', blurb: 'What you want to leave, and to whom.', tone: 'add' },
  { name: 'Giving', blurb: 'Make generosity part of the plan, not an afterthought.', tone: 'add' },
  {
    name: 'Care',
    blurb: 'Plan for the people who may come to depend on you.',
    tone: 'add',
  },
  {
    name: 'Simplifying',
    blurb: 'Fewer accounts, fewer decisions, less to hold in your head.',
    tone: 'subtract',
  },
]

export const clientInsights = {
  snapshot: clientSnapshot,
  toolkit: clientToolkit,
  adventures: suggestedAdventures,
  moreAdventures,
}
