// The firm side of Marcus Hale's eight minutes — what a Dynasty rep reads
// after the advisor finishes the flow in `advisorFlow.ts`.
//
// Two tabs live here: Advisor Readiness (the Enterprise Quotient, the same
// three dimensions asked of an advisor) and the Recruiting Playbook. Independence ID needs
// nothing new — it renders `independenceId` straight out of the flow.
//
// Everything quotable is read back out of the flow rather than retyped, so the
// profile and the mobile experience cannot drift apart. Where a figure is a
// score rather than an answer it is authored ONCE here and derived everywhere
// after that.
//
// All figures and answers are invented. No real advisor or firm is represented.

import { advisor, independenceId, steps } from './advisorFlow'
import { RECOMMENDATIONS_KEY, type PlaybookTab, type ReadinessTab } from './readiness'

/* ── reading the flow back ──────────────────────────────────────────────── */

const step = (id: string) => steps.find((s) => s.id === id)
/** The option the advisor picked on a single/multi-choice screen. */
const picked = (id: string) => (step(id)?.chosen ?? []).join(', ')
/** A free-text answer, verbatim. */
const said = (id: string) => step(id)?.answer ?? ''
/** One statement out of the Confidence set, with where he left the slider. */
const statement = (i: number) => step('cf-q')?.statements?.[i]

/** His six Confidence statements, rescaled from the flow's 1-5 sliders onto the
    0-100 track the profile's dial already draws, so the firm-side page can use
    the same component as the client's rather than a second one that drifts. */
export const confidenceAnswers = (step('cf-q')?.statements ?? []).map((s) => ({
  statement: s.text,
  low: s.low,
  high: s.high,
  value: Math.round(((s.value - 1) / 4) * 100),
}))

/* ── the Enterprise Quotient ─────────────────────────────────────────────
   Same three dimensions as the client's Knomee Quotient; different questions
   feed them, because the question is not how close this person is to knomee
   but how ready they are to move onto a platform. The three dimension scores
   are the only authored numbers on the tab — the EQ, the tier and the tier
   band are all computed from them. */

export interface Dimension {
  key: 'Intent' | 'Clarity' | 'Receptivity'
  score: number
  /** The question the snapshot card asks under the dimension's name. The
      client version asks "Are they actively working toward a goal?"; an
      advisor's decision needs its own three. */
  question: string
  /** What the dimension means for an advisor, not a retail prospect. */
  measures: string
  /** Which screens of the flow feed it. */
  source: string
  /** The answers behind the score, in his words where he wrote them. */
  evidence: string[]
  /** The one-line read. */
  read: string
}

// Intent is weighted heaviest because it is the dimension that decides whether
// the other two are worth a meeting this quarter.
export const EQ_WEIGHTS: Record<Dimension['key'], number> = {
  Intent: 0.45,
  Clarity: 0.3,
  Receptivity: 0.25,
}

export const dimensions: Dimension[] = [
  {
    key: 'Intent',
    score: 45,
    question: 'Is this a live decision, or a recurring mood?',
    measures: 'Whether this is a live decision or a recurring mood.',
    source: 'The Move · Q5–Q7 (the readiness stage)',
    evidence: [
      `Thought about it: “${picked('mv-q5')}”`,
      `Knows the steps: “${picked('mv-q6')}”`,
      `Started acting: “${picked('mv-q7')}”`,
      `Timeline: ${picked('mv-q2')}`,
    ],
    read: 'Three years of weighing it and no step taken. Nothing is in motion.',
  },
  {
    key: 'Clarity',
    score: 78,
    question: 'Do they know what kind of independence they want?',
    measures: 'Whether he knows what kind of independence he wants.',
    source: 'Future You · the vision and its clarity rating (Q7)',
    evidence: [
      `Rated the picture of Future You ${step('fy-clarity')?.scale?.value} of 5 for clarity`,
      `Where: ${picked('fy-q1')}`,
      `Practice includes: ${picked('fy-q5')}`,
    ],
    read: 'He can name the firm he wants down to who runs operations.',
  },
  {
    key: 'Receptivity',
    score: 85,
    question: 'Would they let a platform help?',
    measures: 'Whether he would let a platform help, or insists on doing it alone.',
    source: 'Confidence · item 6, and The Move · Q4',
    evidence: [
      `“${statement(5)?.text}” — ${statement(5)?.value} of 5`,
      `Wants support: “${picked('mv-q4')}”`,
    ],
    read: 'Asked for a partner outright. The door is open before anyone knocks.',
  },
]

const weighted = dimensions.reduce((sum, d) => sum + d.score * EQ_WEIGHTS[d.key], 0)

/** The composite score, computed from the three dimensions above. */
export const kq = Math.round(weighted)

/* Tier bands are the engine's, shared with the retail side: 70–100 ready now,
   40–69 considering, 0–39 nurture. */
export const EQ_TIERS = [
  { tier: 1, name: 'Ready Now', min: 70, max: 100 },
  { tier: 2, name: 'Considering', min: 40, max: 69 },
  { tier: 3, name: 'Nurture', min: 0, max: 39 },
] as const

export const tier = EQ_TIERS.find((t) => kq >= t.min && kq <= t.max)!

/** The banner under the ring: the score in a sentence, and what it is not. */
export const tierBanner = {
  headline: `Tier ${tier.tier} · ${tier.name}`,
  body: 'Wants it, has not started. High clarity and an open door sitting on top of an intent score that says nothing is moving — the common case, and the one a recruiting pipeline cannot see today.',
  note: 'Not a Tier 1. Treating him as one is how a rep spends a quarter chasing a meeting that was never going to be scheduled.',
}

/* ── the three columns ──────────────────────────────────────────────────── */

export const velocity = {
  read: 'Low velocity, high value.',
  body: `A ${advisor.book} team that will not move this quarter, and is worth staying with anyway. His own window says ${picked('mv-q2')}, and nothing behind it has started.`,
  reasons: [
    {
      label: 'No steps taken',
      detail: `“${picked('mv-q7')}” — and “${picked('mv-q6')}” on what the steps even are.`,
    },
    {
      label: 'No timeline',
      detail: `${picked('mv-q2')} is a range, not a date. Nothing in the flow anchors it.`,
    },
    { label: 'The spouse has stopped believing him', detail: said('mv-q10b') },
  ],
  action:
    'Work him on a two-quarter cadence, not a two-week one — and make the first meeting about the attrition question rather than a pitch.',
}

export interface Ranked {
  rank: number
  label: string
  detail: string
}

export const motivators: Ranked[] = [
  {
    rank: 1,
    label: 'Ownership',
    detail: 'Named first in Practice Joy, and again unprompted: “Everything we build belongs to someone else.”',
  },
  {
    rank: 2,
    label: 'Control over how I serve',
    detail: 'Wants no committee between him and a client.',
  },
  {
    rank: 3,
    label: 'His team’s future',
    detail: 'Hopes to hand Ana and Dev equity instead of a bonus.',
  },
]

export const apprehensions: Ranked[] = [
  { rank: 1, label: 'Client attrition', detail: said('ol-q1') },
  { rank: 2, label: 'What he owes the two juniors', detail: said('ol-q2') },
  {
    rank: 3,
    label: 'Eighteen months of disruption',
    detail: 'Named in what makes the move hard — the transition itself, not the destination.',
  },
  {
    rank: 4,
    label: 'Deferred comp he would walk away from',
    detail: `Named among what makes the move hard: “${said('mv-q9')}”`,
  },
]

export const columnActions = {
  motivators: 'Open on ownership and equity. Do not open on payout.',
  apprehensions: 'Bring published retention numbers to the first call — including the two worst cases.',
}

/* The flow names the team in words — "team of four" — so the numeral the
   pipeline's Team column sorts by lives here, once. */
export const teamSize = 4

/* ── the route ───────────────────────────────────────────────────────────
   Which of the three destinations the answers point at. The Readiness tab is
   the design's and has no card for this, so it reads in the sidebar and in
   the pipeline's Route column. */

export interface RouteOption {
  key: 'connect' | 'ib' | 'optima'
  name: string
  forWhom: string
  matched: boolean
  why: string
}

export const route = {
  pick: 'Dynasty Connect',
  why: 'Future You says his own firm, still advising, mentoring the next generation — he is building, not exiting. Nothing in the flow points at a sale or a succession.',
  action: 'Route to Connect. Send the breakaway team pack, not the valuation deck.',
  options: [
    {
      key: 'connect',
      name: 'Dynasty Connect',
      forWhom: 'Breakaway teams building their own firm',
      matched: true,
      why: `“${picked('mv-q1')}” — and, asked whether he wants support: “${picked('mv-q4')}”`,
    },
    {
      key: 'ib',
      name: 'Investment Bank',
      forWhom: 'Advisors selling or merging a book',
      matched: false,
      why: 'He picked neither “Sell or merge my book” nor an exit in Future You.',
    },
    {
      key: 'optima',
      name: 'Optima',
      forWhom: 'Succession and continuity for advisors winding down',
      matched: false,
      why: 'A named successor is something he wants to give, not to receive. Not winding down.',
    },
  ] as RouteOption[],
}

/* ── the Recruiting Playbook ────────────────────────────────────────────── */

export const topAction = {
  title: 'Answer the attrition question with evidence, in the first ten minutes.',
  body: `He wrote it himself: “${said('ol-q1')}” Nothing else on this page moves until that is answered, and a rep who opens anywhere else has spent the meeting.`,
}

export type StarterTag =
  | 'Positive Talk'
  | 'Demonstrate Curiosity'
  | 'Self-Reinforcement'
  | 'Acknowledge and Validate'

export interface Starter {
  tag: StarterTag
  line: string
  why: string
}

export const starters: Starter[] = [
  {
    tag: 'Acknowledge and Validate',
    line: 'You said the only question that matters is whether the clients come. Let’s start there, and not move off it until you’re satisfied.',
    why: 'Uses his own sentence back. It makes the meeting his agenda before it is Dynasty’s.',
  },
  {
    tag: 'Demonstrate Curiosity',
    line: 'What did Ana and Dev say the last time you talked about equity — or has that conversation not happened yet?',
    why: 'The second seat is the blocker he has not tested. His answer tells you which meeting you are actually in.',
  },
  {
    tag: 'Self-Reinforcement',
    line: 'A client of eleven years brought her daughter in to meet you. That relationship isn’t with the letterhead.',
    why: 'His own evidence against the thing he is most afraid of. He is more persuasive on it than you are.',
  },
  {
    tag: 'Positive Talk',
    line: 'You already know what you want it to look like — equity you own, a team you built, someone else running ops. Most people at this stage don’t.',
    why: 'Clarity is his strongest dimension. Naming it moves the conversation off whether and onto when.',
  },
]

export interface AskedQuestion {
  q: string
  /** How to answer it, before the talking points. */
  guidance: string
  points: string[]
}

/** What he will ask, because the flow told him to ask it. Each one is his
    question verbatim, how to answer it, and three things Dynasty could tackle
    using it — a question a candidate arrives holding is an opening, not an
    objection. */
export const questionsTheyAsk: AskedQuestion[] = [
  {
    q: independenceId.questions[0],
    guidance:
      'He is asking for evidence, not reassurance, and he has already named the shape of it: teams like his, the top relationships, and the two that went worst. Answer with the page, not a figure.',
    points: [
      'Publish retention by team size and AUM band, and hand him the page rather than quoting a number at him',
      'Walk the two worst moves honestly — that is what makes the good number believable',
      'Offer an introduction to a lead advisor who moved a comparable book',
    ],
  },
  {
    q: independenceId.questions[1],
    guidance:
      'This is the promise he cannot keep where he is — he has two junior advisors who stayed six years on it. Answer with mechanics rather than intention.',
    points: [
      'Bring the G2 equity terms to the first meeting: grant, vesting, and what it is worth',
      'Show what Ana and Dev could own at Dynasty that a wirehouse cannot offer them',
      'Help him plan how and when he tells them — he named telling the team before he is sure as one of the hard parts',
    ],
  },
  {
    q: independenceId.questions[2],
    guidance:
      'He named eighteen months of disruption as what makes the move hard, so the honest answer is a dated plan with an owner against each part, not an average.',
    points: [
      'Put a transition calendar in front of him with names against every workstream',
      'Name who carries operations during the move — his Future You has someone else running ops',
      'Say plainly what he has to do himself in the first thirty days',
    ],
  },
]

/* ── the communication rail ─────────────────────────────────────────────── */

export const words = {
  use: [
    { word: 'ownership', why: 'His first pick in Practice Joy, and the word he reaches for unprompted.' },
    { word: 'equity', why: 'What he wants to hand his juniors. The hope, in one word.' },
    { word: 'control', why: '“Control over how I serve” — his second pick.' },
    { word: 'your team', why: 'Ana and Dev are in every answer that matters.' },
    { word: 'what you’d own', why: 'Turns the abstraction into the thing he pictured in Future You.' },
  ],
  avoid: [
    {
      word: 'payout',
      why: 'Income was there to pick in Practice Joy and he did not pick it. Payout language reads as a misread of him.',
    },
    { word: 'technology', why: 'Named nowhere in eight minutes of answers.' },
    { word: 'custodian', why: 'Named nowhere. He has no custodial relationship of his own.' },
    { word: 'comp grid', why: 'The vocabulary of the firm he is leaving.' },
  ],
}

/* ── the same two tabs the prospect page renders ─────────────────────────
   Marcus's answers poured into the Prospect Readiness / Prospect Playbook
   shape, so the candidate page IS that page rather than a lookalike. The four
   enterprise-only cards — route, second seat, book, comp clock — are passed to
   the view as extras, since the client version has no slot for them. */

export const readinessTab: ReadinessTab = {
  snapshot: {
    question: 'How ready is this advisor to move?',
    score: { name: 'Enterprise Quotient', abbr: 'EQ' },
    kq,
    dimensions: dimensions.map((d) => ({
      key: d.key,
      question: d.question,
      score: d.score,
      caption: d.read,
      // The answers behind the number, so hovering it shows its own working.
      evidence: [d.source, ...d.evidence],
    })),
    tier: {
      n: tier.tier,
      name: tier.name,
      body: tierBanner.body,
      note: tierBanner.note,
    },
  },
  velocity: {
    title: 'How Quickly Will This Advisor Move?',
    verdict: velocity.read.replace(/\.$/, ''),
    points: [velocity.body, ...velocity.reasons.map((r) => `${r.label} — ${r.detail}`)],
    action: velocity.action,
  },
  motivators: motivators.map((m) => ({ title: m.label, body: m.detail })),
  apprehensions: apprehensions.map((a) => ({ title: a.label, body: a.detail })),
  motivatorsAction: columnActions.motivators,
  apprehensionsAction: columnActions.apprehensions,
}

export const playbookTab: PlaybookTab = {
  topAction: topAction.title,
  starters: starters.map((s) => ({ quote: s.line, why: s.why, tags: [s.tag] })),
  key: RECOMMENDATIONS_KEY,
  questions: questionsTheyAsk.map((q) => ({
    quote: q.q,
    guidance: q.guidance,
    points: q.points,
  })),
  words: {
    use: words.use.map((w) => ({ word: w.word, hint: w.why })),
    avoid: words.avoid.map((w) => ({ word: w.word, hint: w.why })),
  },
  questionsNote: 'The three the flow told him to ask — they are on his phone',
}
