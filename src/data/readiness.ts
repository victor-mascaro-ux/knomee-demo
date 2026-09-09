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

/* ── the shape ──────────────────────────────────────────────────────────── */

export interface KqDimension {
  /** Intent · Clarity · Receptivity. */
  key: string
  /** The question the dimension answers, shown in italics under its name. */
  question: string
  score: number
  /** The one-line read under the number. */
  caption: string
}

export interface Snapshot {
  /** "How ready is this prospect to convert?" — the ring's own subtitle. */
  question: string
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
  verbosity: { level: string; words: number }
  engagement: string
  /** "Advisor takeaway" on the prospect side, "Rep takeaway" on the firm's. */
  takeawayLabel: string
  takeaway: string
  /** Firm side only: the three questions the flow handed the candidate. */
  theirQuestions?: { note: string; items: string[] }
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

/* ── Sarah Mitchell — the prospect side ─────────────────────────────────── */

export const prospectReadiness: ReadinessTab = {
  snapshot: {
    question: 'How ready is this prospect to convert?',
    kq: 81,
    dimensions: [
      {
        key: 'Intent',
        question: 'Are they actively working toward a goal?',
        score: 83,
        caption: 'Actively pursuing a meaningful goal',
      },
      {
        key: 'Clarity',
        question: 'Can they articulate what they want?',
        score: 62,
        caption: 'Vision present, not fully formed',
      },
      {
        key: 'Receptivity',
        question: 'Are they open to guidance?',
        score: 100,
        caption: 'Explicitly open, support-seeking',
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
    use: [
      'Security',
      'Independence',
      'Simplicity',
      'Confidence',
      'Enjoy',
      'Future',
      'Health',
      'Family',
      'Travel',
      'Strength',
    ].map((word) => ({ word })),
    avoid: [
      'Complex',
      'Aggressive',
      'Risk-Taking',
      'Portfolio Optimization',
      'Returns',
      'Benchmarks',
      'Products',
      'Abstract Jargon',
      'Obligations',
    ].map((word) => ({ word })),
  },
  verbosity: { level: 'high', words: 248 },
  engagement: 'Moderately expressive respondent',
  takeawayLabel: 'Advisor takeaway',
  takeaway: 'A direct, purposeful communication style will likely resonate with her',
}
