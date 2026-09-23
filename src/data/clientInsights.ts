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
  total: 'The KR is the average of the dimensions: (100 + 100 + 80 + 90 + 88) ÷ 5 = 92. Referenceability is left out while there is no referral signal either way.',
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
      calc: [{ label: 'Number of active goals', value: `${goalsLive.length}`, points: 100 }],
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
      calc: [{ label: 'How clear was the picture of Future You?', value: '5 of 5', points: 100 }],
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
      calc: [
        { label: '“I believe that working with a financial advisor improves my confidence.”', value: '3 of 5', points: 60, weight: '50%' },
        { label: 'Do you want support from your financial advisor on this goal?', value: 'Yes', points: 100, weight: '50%' },
      ],
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
      calc: [
        { label: 'Last meaningful activity', value: '31–60 days ago', points: 80 },
        { label: 'Meaningful actions in the last 90 days', value: '7 or more', points: 100 },
        { label: 'Completed adventures', value: '5 of 5', points: 100 },
        { label: 'Advisor requests', value: '73% done, in 4–7 days, decision-ready answers', points: 78 },
      ],
    },
    {
      key: 'Referenceability',
      question: 'Are they open to referring their advisor?',
      score: 0,
      caption: 'No referral signal yet',
      evidence: ['Nothing asked and nothing offered — the one dimension with no reading'],
      calc: [
        { label: 'Willingness to refer', value: 'No referrals offered', points: 0, weight: '40%' },
        { label: 'Actual referrals', value: 'None yet', points: 0, weight: '60%' },
      ],
    },
    {
      key: 'Household KR',
      question: "How engaged is the client's household?",
      score: 88,
      caption: 'Household is highly engaged',
      evidence: [`${cp.household}: ${cp.members.map((m) => m.name).join(' · ')}`],
      calc: [{ label: 'Household member (their own KR)', value: 'Sebastian Watson', points: 88 }],
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
  topActionSource:
    'Family and freedom are her core values; her biggest concern is balancing college, health and her aging parents; she is mid career change and separation.',
  topActionWhy:
    'Starting from the life she wants makes the hard choices read as steps toward it, not sacrifices — and one clear plan answers the weight of everything she is holding at once.',

  starters: [
    {
      quote:
        'You’ve described a future that feels really vivid — being near the water, traveling, spending time with family, and creating a home that feels warm and welcoming. Of everything in that picture, what feels most important for us to protect first?',
      why: 'Reconnect the conversation to Emily’s core values and use her lifestyle vision to guide planning priorities.',
      source: 'Future You and her vision board “Coastal Life Dreams” — near the water, travelling, family, and a home that feels warm and welcoming.',
      tags: ['Re-anchor to Values', 'Clarify Tradeoffs'],
    },
    {
      quote:
        'You shared that you worry about college for your two kids, while also thinking about your own health and your parents getting older. That’s a lot to hold at once. Where does it feel most important to create more clarity or relief right now?',
      why: 'Acknowledge the emotional weight of competing responsibilities, then help her sort them into manageable priorities.',
      source: 'Outlook · her biggest concern — balancing college costs for her kids with future health needs and aging-family responsibilities.',
      tags: ['Acknowledge and Validate', 'Clarify Tradeoffs'],
    },
    {
      quote:
        'You’re going through a separation, a career change, and at the same time thinking about what your next chapter could look like. Given all of that, what would feeling more secure and in control over the next year look like for you?',
      why: 'Recognize that this is a transition moment and position planning as a way to restore stability and confidence.',
      source: 'Life Events — a separation and a career change (laid off in March), both logged this year.',
      tags: ['Acknowledge and Validate', 'Re-anchor to Values'],
    },
    {
      quote:
        'You’ve already made meaningful progress on things that matter to you — travel, lifestyle goals, and giving back. As you look ahead, whether that’s a second home, a new business, or increasing philanthropy, what feels like the next step that would make the biggest difference in your life?',
      why: 'Reinforce Emily’s momentum and frame the advisor relationship as helping her build on progress, not start from scratch.',
      source: 'Goals — completed ones (her philanthropy gift) and open ones: a second home, a new company, more giving.',
      tags: ['Reinforce Progress', 'Re-anchor to Values'],
    },
  ],

  key: CLIENT_RECOMMENDATIONS_KEY,

  questions: [
    {
      quote: 'Can I afford college for my two kids and still take care of my own future?',
      guidance:
        'Lead with empathy and help her frame this as a prioritization question, not an all-or-nothing choice.',
      source: 'Her Questions — “Can I afford to go to college?” (05/03/2025), with her own health and future beside it in Outlook.',
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
      source: 'Her Questions — “Should I start a new company?” (04/18/2025), asked after being laid off in March.',
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
      source: 'Her Questions — “Can I afford this family vacation?” and “Is now the right time to buy the beach house?”',
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
      { word: 'Flexibility', hint: 'Joy & Motivation — the flexibility to live generously and on her own terms' },
      { word: 'Simplicity', hint: 'How she wants planning to feel with this much going on' },
      { word: 'Peace Of Mind', hint: 'College, health and her parents — every concern asks for relief' },
      { word: 'Health', hint: 'Her wellness board, and her parents — both are live' },
      { word: 'Travel', hint: 'Joy & Motivation — travel and enjoying the moment' },
      { word: 'Home', hint: 'The beach house and the home she wants people welcomed into' },
      { word: 'Security', hint: 'What she wants the next year to feel like, mid-transition' },
      { word: 'Next Chapter', hint: 'A separation and a career change — she is mid-transition' },
    ],
    avoid: [
      { word: 'Aggressive', hint: 'Nothing she wrote is about appetite for risk' },
      { word: 'High-Risk', hint: 'She wants stability through a transition, not a bet' },
      { word: 'Complex', hint: 'She asks for simplicity by name' },
      { word: 'Optimization', hint: 'She talks about a life, not about tuning numbers' },
      { word: 'Benchmarks', hint: 'Nothing she wants is measured against a market' },
      { word: 'Returns', hint: 'She is moved by family, freedom and giving back — not performance' },
      { word: 'Products', hint: 'Her answers are about people and places, never products' },
      { word: 'Jargon', hint: 'Simplicity is what she asked for' },
      { word: 'Obligations', hint: 'Her concerns are about people she loves, not liabilities' },
      { word: 'Pressure', hint: 'She is already holding college, health and a separation at once' },
    ],
  },
}

/* ── suggested adventures ───────────────────────────────────────────────── */

/** An adventure the advisor can put in front of this client next. `art` names
    the file in ../assets/adventures; the screen maps it, the way every other
    page carrying this artwork does, so the data stays free of imports. */
export interface SuggestedAdventure {
  name: string
  blurb: string
  art: string
}

export const suggestedAdventures: SuggestedAdventure[] = [
  {
    name: 'Angel Investing',
    blurb: 'Consider the risks and rewards of funding innovation.',
    art: 'angel-investing',
  },
  {
    name: 'Subtracting',
    blurb: 'Focus on less to create space for what truly matters.',
    art: 'subtracting',
  },
]

/** What is left to choose from in the picker under the list. */
export const moreAdventures: SuggestedAdventure[] = [
  { name: 'Legacy', blurb: 'What you want to leave, and to whom.', art: 'legacy' },
  {
    name: 'Giving',
    blurb: 'Make generosity part of the plan, not an afterthought.',
    art: 'giving',
  },
  {
    name: 'Care',
    blurb: 'Plan for the people who may come to depend on you.',
    art: 'care',
  },
  {
    name: 'Simplifying',
    blurb: 'Fewer accounts, fewer decisions, less to hold in your head.',
    art: 'simplifying',
  },
]

export const clientInsights = {
  snapshot: clientSnapshot,
  toolkit: clientToolkit,
  adventures: suggestedAdventures,
  moreAdventures,
}
