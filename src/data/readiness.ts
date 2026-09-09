/* The Readiness and Playbook tabs, as one shape two products fill in.
 *
 * The prospect side (Sarah Mitchell) and the firm side (Marcus Hale) are the
 * same instrument pointed at different decisions, so they are the same
 * components reading the same interfaces — a card added to one appears on the
 * other, and neither can quietly grow a panel the other lacks.
 *
 * Sarah's content is the Prospect Readiness / Prospect Playbook design.
 * Marcus's lives in `advisorProfile.ts`, which computes his from the flow.
 *
 * All figures and answers are placeholder demo data.
 */

import { confidenceAnswers, financialId } from './financialId'

/* ── the shape ──────────────────────────────────────────────────────────── */

export interface KqDimension {
  /** Intent · Clarity · Receptivity. */
  key: string
  /** The question the dimension answers, shown in italics under its name. */
  question: string
  score: number
  /** The one-line read under the number. */
  caption: string
  /** The answers the score was computed from. Shown on hover, so the number
      can always be traced back to something the person actually said. */
  evidence?: string[]
}

export interface Snapshot {
  /** "How ready is this prospect to convert?" — the ring's own subtitle. */
  question: string
  /** What this score is called where it is shown. The retail side scores a
      prospect's relationship with knomee — the Knomee Quotient. The enterprise
      side scores an advisor against a platform, which is a different question
      with a different name: the Enterprise Quotient. Same ring, same three
      dimensions, so the name travels with the data rather than being hard-coded
      into the component both tabs share. */
  score?: { name: string; abbr: string }
  kq: number
  dimensions: KqDimension[]
  tier: {
    n: 1 | 2 | 3
    /** "READY NOW" · "CONSIDERING" · "NURTURE" */
    name: string
    body: string
    /** Only the firm side carries this: what the score is NOT. */
    note?: string
  }
}

export interface Velocity {
  /** The card's own question — it differs by product. */
  title: string
  /** "HIGH VELOCITY" · "LOW VELOCITY, HIGH VALUE" */
  verdict: string
  points: string[]
  /** Firm side only: the next action the read implies. */
  action?: string
}

export interface Driver {
  title: string
  body: string
}

export interface ReadinessTab {
  snapshot: Snapshot
  velocity: Velocity
  motivators: Driver[]
  apprehensions: Driver[]
  /** Firm side only. */
  motivatorsAction?: string
  apprehensionsAction?: string
}

export type TagName =
  | 'Positive Talk'
  | 'Demonstrate Curiosity'
  | 'Self-Reinforcement'
  | 'Acknowledge and Validate'

export interface Starter {
  quote: string
  /** Why this line, in the rep's own interest. */
  why: string
  tags: TagName[]
}

export interface AskedQuestion {
  quote: string
  /** How to answer it. */
  guidance: string
  /** What the advisor or the firm could tackle using the question — three
      openings it creates, not a script for answering it. */
  points: string[]
}

/** A word the rep should reach for, or avoid. The firm side carries the reason
    it is on the list; the prospect side does not, and the pill renders the same
    either way. */
export interface Word {
  word: string
  hint?: string
}

export interface PlaybookTab {
  topAction: string
  starters: Starter[]
  key: { tag: TagName; meaning: string }[]
  questions: AskedQuestion[]
  words: { use: Word[]; avoid: Word[] }
  /** Sits under the Questions head. The firm side uses it to say the three are
      the ones the flow handed the candidate, so a rep knows they are coming. */
  questionsNote?: string
}

/* The four tags are conversation technique rather than domain knowledge, so
   both products explain them with the same words. */
export const RECOMMENDATIONS_KEY: { tag: TagName; meaning: string }[] = [
  {
    tag: 'Positive Talk',
    meaning:
      'Get the prospect talking positively about their financial life. Positive framing increases likelihood of engagement.',
  },
  {
    tag: 'Demonstrate Curiosity',
    meaning:
      'Likeability comes from follow-up questions and genuine interest. Asking to understand — not to sell — is the strongest predictor of interpersonal trust.',
  },
  {
    tag: 'Self-Reinforcement',
    meaning:
      'Get the prospect to articulate why financial planning matters — in their own words. When people convince themselves, commitment goes up.',
  },
  {
    tag: 'Acknowledge and Validate',
    meaning:
      'Reference what they shared to show you listened. Acknowledge nuance. Help them feel heard — this builds trust and opens the door to deeper conversation.',
  },
]

/* ── Sarah Mitchell — the prospect side ───────────────────────────────────
   Her scores show their working the same way the candidate's do: each
   dimension card names the adventure that feeds it and the answers behind
   it, and each word in the Communication rail says why it is on the list.
   Where the evidence is a figure, it is read off her Financial ID rather
   than typed in here, so a tooltip cannot disagree with the card it came
   from. */

/* Goals carry the readiness stage; the ones already at the top of the scale
   are what makes her Intent read high. */
const goalsAtTop = financialId.goals.filter((g) => !g.completed && g.readiness === 5)
const goalsDone = financialId.goals.filter((g) => g.completed).length
const conf = (needle: string) => confidenceAnswers.find((a) => a.statement.includes(needle))
const believesInGoals = conf('achieve my financial goals')
const spendsOnJoy = conf('bring me joy')


export const prospectReadiness: ReadinessTab = {
  snapshot: {
    question: 'How ready is this prospect to convert?',
    score: { name: 'Knomee Quotient', abbr: 'KQ' },
    kq: 81,
    dimensions: [
      {
        key: 'Intent',
        question: 'Are they actively working toward a goal?',
        score: 83,
        caption: 'Actively pursuing a meaningful goal',
        evidence: [
          'Goals · the readiness stage she set on each one',
          `At the top of the scale: ${goalsAtTop.map((g) => g.title.replace(/\.$/, '')).join(' · ')}`,
          `${goalsDone} goals already finished and logged`,
          'Her lead goal — the Oahu family trip — sits one stage off the top',
        ],
      },
      {
        key: 'Clarity',
        question: 'Can they articulate what they want?',
        score: 62,
        caption: 'Vision present, not fully formed',
        evidence: [
          'Future You · where, what and who',
          `Where: ${financialId.futureYou.where.join(', ')}`,
          `Doing: ${financialId.futureYou.what.join(', ')}`,
          'Four things at once and two places — the picture is there, the edges are not',
        ],
      },
      {
        key: 'Receptivity',
        question: 'Are they open to guidance?',
        score: 100,
        caption: 'Explicitly open, support-seeking',
        evidence: [
          `Confidence · the ${confidenceAnswers.length} statements behind the dial`,
          `“${believesInGoals?.statement}” — ${believesInGoals?.value} of 100`,
          `“${spendsOnJoy?.statement}” — ${spendsOnJoy?.value} of 100`,
          'She says outright that working with an advisor improves her confidence',
        ],
      },
    ],
    tier: {
      n: 1,
      name: 'Ready Now',
      body: 'High-readiness prospect — actively seeking guidance and ready to engage.',
    },
  },
  velocity: {
    title: 'How Quickly Will This Prospect Move?',
    verdict: 'High velocity',
    points: [
      'Sarah Mitchell is primed to move quickly.',
      'Her primary goal has a <12 month timeline.',
      'She has already taken initial steps.',
      'Has ideas but lacks a concrete plan.',
    ],
  },
  motivators: [
    {
      title: 'Family as anchor',
      body: 'Her children are her primary source of joy and purpose. Every financial decision connects back to being present for them and leaving a legacy.',
    },
    {
      title: 'Values alignment',
      body: 'She wants her money to reflect who she is — humble, generous, intentional. She is motivated by meaning, not just returns.',
    },
    {
      title: 'Early retirement vision',
      body: 'Retiring at 55 is a clear, compelling north star that gives urgency and structure to planning.',
    },
  ],
  apprehensions: [
    {
      title: 'Spending guilt',
      body: 'Sarah Mitchell worries she spends too much and feels guilty enjoying things she has earned. This emotional blocker can create decision paralysis and delay commitment if not addressed early.',
    },
    {
      title: 'Lack of concrete plan',
      body: 'She has ideas but is unsure of specific steps. Without a clear path forward, motivation may stall.',
    },
    {
      title: 'Discipline concern',
      body: 'She identifies daily practice and discipline as her biggest challenge. She may fear that a financial plan requires perfection she cannot sustain.',
    },
  ],
}

export const prospectPlaybook: PlaybookTab = {
  topAction: '“Worked since 13, ready for adventures”; lead with Future You vision.',
  starters: [
    {
      quote:
        'You mentioned wanting to leave a lasting legacy for your child. I’d love to hear more about what that means to you — is it financial security, values you want to pass on, or something else entirely?',
      why: 'Get Sarah talking positively about her future and what’s possible.',
      tags: ['Positive Talk'],
    },
    {
      quote:
        'I noticed you said you sometimes feel guilty enjoying things, even though you know you’ve earned them. That tension is more common than you might think, and it tells me you care deeply about doing the right thing. What if we built a plan that gave you full permission to enjoy life — because you’d know the important things are covered?',
      why: 'Show genuine interest through follow-up questions. Curiosity is a predictor of likeability.',
      tags: ['Demonstrate Curiosity', 'Acknowledge and Validate'],
    },
    {
      quote:
        'You mentioned that you want to be wise with your income and that working with an advisor improves your confidence. Can you tell me more about what that confidence would look like for you day-to-day? What would change?',
      why: 'Get Sarah to convince herself that financial planning and a long-term advisor relationship matter.',
      tags: ['Self-Reinforcement', 'Positive Talk'],
    },
    {
      quote:
        'You wrote that your greatest financial joy was seeing the smiles on your kids’ faces and how hard they worked. That’s a beautiful way to think about what money can do. What other moments like that do you want to create?',
      why: 'Use what Sarah shared to make her feel heard, and help her see the value of advice.',
      tags: ['Acknowledge and Validate'],
    },
  ],
  key: RECOMMENDATIONS_KEY,
  questions: [
    {
      quote: 'Can you show me how I can realistically work less in the next 1–5 years?',
      guidance:
        'Lead with her desired lifestyle outcome, then translate it into timelines, tradeoffs, and what would need to be true financially to make that possible.',
      points: [
        'Talk about work-optional planning and phased retirement',
        'Explore cash flow, savings, and income replacement needs',
        'Introduce long-term planning as a tool for freedom, not restriction',
      ],
    },
    {
      quote: 'How would keeping two homes fit into a long-term plan like mine?',
      guidance:
        'Frame the second home as part of the life she wants to build, then help her evaluate how it fits alongside family, health, and future priorities.',
      points: [
        'Talk about goal prioritization and tradeoffs',
        'Explore how real estate fits into her broader wealth picture',
        'Introduce tax-aware planning and ongoing cost considerations',
      ],
    },
    {
      quote: 'Can we afford private school tuition?',
      guidance:
        'Answer with empathy and clarity, treating this as a family-values question as much as a financial one.',
      points: [
        'Talk about education funding and family priorities',
        'Explore what affordability means across multiple goals',
        'Introduce planning around near-term and long-term obligations',
      ],
    },
  ],
  words: {
    /* Each word says why it is on the list, in her own answers. The reasons
       for the avoid list are absences, which are as readable as anything she
       did say: she wrote about people and places, never about mechanics. */
    use: [
      { word: 'Security', hint: 'Named first among her core values.' },
      { word: 'Independence', hint: 'A core value, in her own words.' },
      { word: 'Simplicity', hint: 'A core value — which is also why the avoid list is what it is.' },
      { word: 'Confidence', hint: 'She says working with an advisor improves it.' },
      { word: 'Enjoy', hint: '“I spend money on things that bring me joy” — 79 of 100.' },
      { word: 'Future', hint: 'Future You: near loved ones, travelling, staying active.' },
      { word: 'Health', hint: 'Her biggest concern is future health outcomes, hers and Vic’s.' },
      { word: 'Family', hint: 'Connection is a core value; her hopes are about her kids.' },
      { word: 'Travel', hint: 'In her perfect day and in her Future You.' },
      { word: 'Strength', hint: 'Her stated hope: having the strength to manage it all.' },
    ],
    avoid: [
      { word: 'Complex', hint: 'Simplicity is a core value. This is its opposite.' },
      { word: 'Aggressive', hint: 'Nothing she wrote is about appetite for risk.' },
      { word: 'Risk-Taking', hint: 'She never framed any goal as a risk to take.' },
      { word: 'Portfolio Optimization', hint: 'She named no mechanics anywhere in the flow.' },
      { word: 'Returns', hint: 'She is moved by meaning, not by performance.' },
      { word: 'Benchmarks', hint: 'Never mentioned. Nothing she wants is measured against a market.' },
      { word: 'Products', hint: 'Never mentioned. Her answers are about people and places.' },
      { word: 'Abstract Jargon', hint: 'Simplicity again — she asked for a trust explained plainly.' },
      { word: 'Obligations', hint: 'Her concerns are about people she loves, not liabilities.' },
    ],
  },
}
