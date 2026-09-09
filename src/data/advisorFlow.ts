// The advisor-as-prospect flow — the same five adventures the client walks
// through, pointed at a different decision. This is the Dynasty case: the
// person answering is a breakaway advisor weighing independence, and the
// enterprise reading the output is the platform trying to recruit them.
//
// Content follows `Knomee Content: Adventures` screen for screen. Every answer
// below is pre-filled with a single believable respondent so the Independence
// ID at the end is coherent rather than a set of unrelated demo values.
//
// All figures and answers are invented. No real advisor is represented.

// The home-screen rows wear the client experience's own artwork — the same five
// illustrations, so the two mobile demos cannot drift apart.
import type { ArtKey } from './experience'

export type StepKind =
  | 'welcome'
  | 'home'
  | 'intro'
  | 'reflect'
  | 'multi'
  | 'grid'
  | 'text'
  | 'single'
  | 'scale'
  | 'scaleSet'
  | 'unlock'
  | 'stage'
  | 'summary'
  | 'questions'

export type AdventureId = 'practice-joy' | 'confidence' | 'outlook' | 'future-you' | 'the-move'

export interface Step {
  id: string
  kind: StepKind
  adventure?: AdventureId
  /** Small label above the heading — usually the adventure name. */
  eyebrow?: string
  title?: string
  body?: string
  /** Attribution line under an intro, as in the client spec. */
  cite?: string
  /** Multi/single choice options. */
  options?: string[]
  /** Pre-selected answers. */
  chosen?: string[]
  /** Grid rows for the attention question. */
  rows?: { label: string; value: 'More' | 'Same' | 'Less' }[]
  /** Free-text question: the prompt hints beside it, and the mocked answer. */
  hints?: string[]
  answer?: string
  /** Single 1–5 scale. */
  scale?: { low: string; high: string; value: number }
  /** A set of 1–5 statements on one screen. */
  statements?: { text: string; low: string; high: string; value: number }[]
  /** Unlock / stage / summary payloads. */
  lines?: { label: string; value: string }[]
  stat?: string
  cta?: string
}

/* ── the respondent ──────────────────────────────────────────────────────── */

export const advisor = {
  name: 'Marcus Hale',
  initial: 'M',
  role: 'Lead advisor · team of four',
  book: '$840M',
  firm: 'Wirehouse',
  completedOn: '09.09.2026',
}

/* ── the adventures list, as the advisor sees it on the home screen ────────
   Only the five, and the walkthrough opens where the flow does: Practice Joy
   is the one open adventure, the other four still locked. Nothing is behind
   him yet, so the meter reads 0/5. Every row opens its adventure whatever
   state it wears — the state is a look, not a gate. */

export interface AdvisorAdventure {
  id: AdventureId
  title: string
  art: ArtKey
  minutes: number
  blurb: string
  state: 'done' | 'open' | 'locked'
}

export const advisorAdventures: AdvisorAdventure[] = [
  {
    id: 'practice-joy',
    title: 'Practice Joy',
    art: 'financial-joy',
    minutes: 2,
    blurb: 'Get clear on what you want the practice to give you.',
    state: 'open',
  },
  {
    id: 'confidence',
    title: 'Confidence',
    art: 'confidence',
    minutes: 1,
    blurb: 'Check in on your relationship with the practice.',
    state: 'locked',
  },
  {
    id: 'outlook',
    title: 'Outlook',
    art: 'outlook',
    minutes: 2,
    blurb: 'Say what is on your mind about going independent.',
    state: 'locked',
  },
  {
    id: 'future-you',
    title: 'Future You',
    art: 'future-you',
    minutes: 2,
    blurb: 'Picture the practice you are building toward.',
    state: 'locked',
  },
  {
    id: 'the-move',
    title: 'The Move',
    art: 'goals',
    minutes: 3,
    blurb: 'Name the change you are weighing and where you stand.',
    state: 'locked',
  },
]

/** How the progress meter reads on the home screen: one of the five behind him. */
export const advisorProgress = {
  done: advisorAdventures.filter((a) => a.state === 'done').length,
  required: advisorAdventures.length,
}

/* ── the flow ────────────────────────────────────────────────────────────── */

export const steps: Step[] = [
  {
    id: 'welcome',
    kind: 'welcome',
    title: 'Welcome',
    body: 'Going independent is a business decision that is mostly an emotional one.\n\nTake a few minutes to get clear on what you actually want from your practice — and what would have to be true for you to change anything.',
    lines: [
      { label: '1', value: 'Discover what matters most. A guided experience that clarifies what you want the practice to give you.' },
      { label: '2', value: 'See your personal insights. A personalized summary of what is driving your thinking.' },
      { label: '3', value: 'Get your 3 most important questions. The three questions to put to any platform you are considering.' },
    ],
    stat: 'Est time: 8 min',
    cta: 'Get started',
  },

  { id: 'home', kind: 'home' },

  /* ── 1. Practice Joy ── */
  {
    id: 'pj-intro',
    kind: 'intro',
    adventure: 'practice-joy',
    eyebrow: 'Practice Joy',
    title: 'What is the work for?',
    body: 'A practice is more than a P&L. Aligning daily activity with what you actually value leads to greater satisfaction — in a business as much as a life.',
    cite: 'From “Build the Life You Want” by Arthur C. Brooks and Oprah Winfrey',
    cta: 'Get started',
  },
  {
    id: 'pj-q1',
    kind: 'multi',
    adventure: 'practice-joy',
    eyebrow: 'Practice Joy · 1 of 4',
    title: 'I want my practice to give me…',
    body: 'Choose what feels most relevant today. Make between 1 and 3 choices.',
    options: [
      'Ownership',
      'Control over how I serve',
      'Independence',
      'Enterprise value',
      'Security',
      'Income',
      'Time',
      'My team’s future',
      'Reputation',
      'Simplicity',
      'Legacy',
      'Other',
    ],
    chosen: ['Ownership', 'Control over how I serve', 'My team’s future'],
  },
  {
    id: 'pj-reflect',
    kind: 'reflect',
    adventure: 'practice-joy',
    title: 'What if you saw the firm as a tool for the practice you want, rather than the thing you belong to?',
    body: 'Pause and reflect — what do you actually need a firm for?',
    cta: 'Reflect & continue',
  },
  {
    id: 'pj-q2',
    kind: 'grid',
    adventure: 'practice-joy',
    eyebrow: 'Practice Joy · 2 of 4',
    title: 'Right now, how would you like to direct attention to these areas…',
    rows: [
      { label: 'Client relationships', value: 'Same' },
      { label: 'Business development', value: 'More' },
      { label: 'Investment management', value: 'Same' },
      { label: 'Operations and admin', value: 'Less' },
      { label: 'Compliance', value: 'Less' },
      { label: 'Team and hiring', value: 'More' },
      { label: 'Strategy and growth', value: 'More' },
      { label: 'Life outside the practice', value: 'More' },
    ],
  },
  {
    id: 'pj-q3',
    kind: 'text',
    adventure: 'practice-joy',
    eyebrow: 'Practice Joy · 3 of 4',
    title: 'Think back — what was a recent moment in your work that reminded you why you do this?',
    body: '(Sometimes it has nothing to do with money.)',
    answer:
      'A client I have had for eleven years brought her daughter in to meet me. She said she wanted her to hear it from the person who actually knows the family.',
  },
  {
    id: 'pj-q4',
    kind: 'text',
    adventure: 'practice-joy',
    eyebrow: 'Practice Joy · 4 of 4',
    title: 'Thinking about that moment — what made it matter?',
    answer:
      'It was the whole point of doing this for eleven years. And it had nothing to do with whose name is on the wall.',
  },
  {
    id: 'pj-unlock',
    kind: 'unlock',
    adventure: 'practice-joy',
    title: 'What the work is for',
    body: 'Identifying what the practice is for helps align how you spend your days with what matters most.',
    lines: [
      { label: 'My practice is a tool. It gives me', value: 'Ownership, Control over how I serve, My team’s future' },
      {
        label: 'The last thing that reminded me why I do this',
        value: '“A client I have had for eleven years brought her daughter in to meet me.”',
      },
    ],
    stat: 'Did you know? 3 in 4 advisors who complete this want to spend less time on operations and compliance.',
  },

  /* ── 2. Confidence ── */
  {
    id: 'cf-intro',
    kind: 'intro',
    adventure: 'confidence',
    eyebrow: 'Confidence',
    title: 'How do you feel about where you are?',
    body: 'Confidence strengthens as you gain clarity, trust your decisions, and feel in control of the business you are running. Confidence in your abilities directly influences your performance, motivation, and behavior.',
    cite: 'Albert Bandura, psychologist and self-efficacy pioneer',
    cta: 'Get started',
  },
  {
    id: 'cf-q',
    kind: 'scaleSet',
    adventure: 'confidence',
    eyebrow: 'Confidence · 1 of 1',
    title: 'How much do you agree?',
    statements: [
      { text: 'I’m confident my current firm gets me the practice I want.', low: 'Not confident', high: 'Very confident', value: 2 },
      { text: 'I feel confident I could weather a disrupted transition.', low: 'Not confident', high: 'Very confident', value: 3 },
      { text: 'I believe I can build the practice I have in mind.', low: 'Not confident', high: 'Very confident', value: 5 },
      { text: 'I spend my time on the work that brings me joy.', low: 'Never', high: 'Most of the time', value: 2 },
      { text: 'I second-guess big decisions about my business.', low: 'Often regret', high: 'Never regret', value: 2 },
      { text: 'I believe the right platform partner would improve my confidence.', low: 'No, I don’t', high: 'Yes, I do', value: 4 },
    ],
  },
  {
    id: 'cf-unlock',
    kind: 'unlock',
    adventure: 'confidence',
    title: 'Your relationship with your practice is balanced.',
    body: 'It creates some strain, and you find resilience. Knowing your current level of confidence is a powerful insight.',
    lines: [
      { label: 'Highest', value: 'Belief you can build the practice you have in mind' },
      { label: 'Lowest', value: 'That your current firm gets you there — and time spent on work you enjoy' },
    ],
    stat: 'Did you know? Nearly 1 in 2 share a similar mix of confidence and uncertainty about their business.',
  },

  /* ── 3. Outlook ── */
  {
    id: 'ol-intro',
    kind: 'intro',
    adventure: 'outlook',
    eyebrow: 'Outlook',
    title: 'What’s on your mind?',
    body: 'What are your biggest concerns? Your hopes for the practice? Sharing what is on your mind informs support and guidance that aligns with what you actually want.',
    cta: 'Get started',
  },
  {
    id: 'ol-q1',
    kind: 'text',
    adventure: 'outlook',
    eyebrow: 'Outlook · 1 of 4',
    title: 'What’s the biggest concern on your mind right now?',
    body: 'What keeps you up at night?',
    hints: [
      '“What I’d hate to get wrong is…”',
      '“If I moved, the thing that keeps me up is…”',
      '“I don’t know how to…”',
      '“What happens to my team if…”',
      '“I’ve been telling myself…”',
      '“What if my clients…”',
    ],
    answer:
      'If I move, do the clients come with me. That is the only question that actually matters and nobody can answer it for me.',
  },
  {
    id: 'ol-q2',
    kind: 'text',
    adventure: 'outlook',
    eyebrow: 'Outlook · 2 of 4',
    title: 'Any other big concerns on your mind right now?',
    hints: [
      '“What happens to my team if…”',
      '“I’ve been telling myself…”',
      '“I’m struggling with…”',
    ],
    answer:
      'I have two junior advisors who have stayed six years on the promise of something I cannot actually give them here.',
  },
  {
    id: 'ol-q3',
    kind: 'text',
    adventure: 'outlook',
    eyebrow: 'Outlook · 3 of 4',
    title: 'What are you hopeful about right now?',
    body: 'What do you daydream about?',
    hints: [
      '“One day I want the firm to…”',
      '“If I could design the practice from scratch it would…”',
      '“The thing I’d finally have time for is…”',
      '“What I want to leave behind is…”',
    ],
    answer: 'Building something my name is actually on, that is worth something when I am done with it.',
  },
  {
    id: 'ol-q4',
    kind: 'text',
    adventure: 'outlook',
    eyebrow: 'Outlook · 4 of 4',
    title: 'Any other hopes or optimistic outlooks on your mind?',
    hints: ['“What I want to leave behind is…”', '“If I stopped worrying about X, I would…”'],
    answer: 'Handing Ana and Dev equity instead of a bonus.',
  },
  {
    id: 'ol-unlock',
    kind: 'unlock',
    adventure: 'outlook',
    title: 'Your outlook matters',
    body: 'By sharing your perspective, you gain clarity around what matters most to you. More clarity leads to better decisions.',
    lines: [
      { label: 'Concerns', value: 'Client attrition · what you owe two junior advisors' },
      { label: 'Hopes', value: 'A firm with your name on it · equity for the team' },
    ],
    stat: 'Did you know? More than 80% of respondents shared multiple concerns and over 95% shared two or more hopes.',
  },

  /* ── 4. Future You ── */
  {
    id: 'fy-intro',
    kind: 'intro',
    adventure: 'future-you',
    eyebrow: 'Future You',
    title: 'Let’s materialize your vision for Future You',
    body: 'The clearer your vision, the more likely you are to achieve it. Visualizing your future self inspires positive decisions and behavior change.',
    cite: 'Hal Hershfield PhD, behavioral scientist',
    cta: 'Get started',
  },
  {
    id: 'fy-breathe',
    kind: 'reflect',
    adventure: 'future-you',
    title: 'This is your future.',
    body: 'Take a moment to visualize what it looks like for you.\n\nINHALE — EXHALE',
    cta: 'Continue',
  },
  {
    id: 'fy-q1',
    kind: 'single',
    adventure: 'future-you',
    eyebrow: 'Future You · 1 of 5',
    title: 'Where is Future You?',
    options: [
      'At my own firm',
      'At a firm I joined',
      'Still where I am',
      'Semi-retired',
      'Out of the business',
      'Somewhere new',
      'Other',
    ],
    chosen: ['At my own firm'],
  },
  {
    id: 'fy-q2',
    kind: 'multi',
    adventure: 'future-you',
    eyebrow: 'Future You · 2 of 5',
    title: 'What is Future You doing?',
    body: 'Choose as many as you like.',
    options: [
      'Advising clients',
      'Running a business',
      'Leading a team',
      'Building something new',
      'Mentoring the next generation',
      'Winding down',
      'Other',
    ],
    chosen: ['Advising clients', 'Running a business', 'Mentoring the next generation'],
  },
  {
    id: 'fy-q3',
    kind: 'multi',
    adventure: 'future-you',
    eyebrow: 'Future You · 3 of 5',
    title: 'Who is Future You with?',
    body: 'Choose as many as you like.',
    options: ['My current team', 'A bigger team', 'Partners', 'Clients I chose', 'Family', 'Solo', 'Other'],
    chosen: ['My current team', 'Clients I chose'],
  },
  {
    id: 'fy-q4',
    kind: 'single',
    adventure: 'future-you',
    eyebrow: 'Future You · 4 of 5',
    title: 'How far in the future is your vision?',
    options: ['a few years', '5–10 years', '10–15 years', '15–20 years', 'over 20 years', 'Other'],
    chosen: ['5–10 years'],
  },
  {
    id: 'fy-q5',
    kind: 'multi',
    adventure: 'future-you',
    eyebrow: 'Future You · 5 of 5',
    title: 'What will Future You’s practice include?',
    body: 'Choose as many as you like.',
    options: [
      'Equity I own',
      'A named successor',
      'A niche I’m known for',
      'A team I built',
      'Fewer, better clients',
      'More clients',
      'Predictable revenue',
      'Someone else running ops',
      'A brand with my name on it',
      'Time away from the desk',
      'Board or industry work',
      'An exit',
      'Other',
    ],
    chosen: [
      'Equity I own',
      'A named successor',
      'A team I built',
      'Fewer, better clients',
      'Someone else running ops',
      'A brand with my name on it',
    ],
  },
  {
    id: 'fy-postcard',
    kind: 'text',
    adventure: 'future-you',
    eyebrow: 'Future You',
    title: 'Now step into Future You’s shoes. Write a postcard to yourself from Future You.',
    body: 'How is Future You feeling? What advice does Future You have for you today?',
    answer:
      'You were right that the clients came. Not all of them — you lost four, and two of those still sting. But the ones who came, came because of you and not the letterhead, and that turned out to be the thing worth knowing. The office is smaller than you pictured. Ana runs it better than you ever did. Take the two weeks in July this year. Last year you didn’t.',
  },
  {
    id: 'fy-clarity',
    kind: 'scale',
    adventure: 'future-you',
    eyebrow: 'Future You',
    title: 'How clear was the picture of Future You?',
    scale: { low: 'Very blurry', high: 'Vividly clear', value: 4 },
  },
  {
    id: 'fy-unlock',
    kind: 'unlock',
    adventure: 'future-you',
    title: 'Way to go, here’s Future You',
    lines: [
      { label: 'In the future I am', value: 'At my own firm' },
      { label: 'I see myself', value: 'Advising clients, running a business, mentoring the next generation' },
      {
        label: 'I envision my practice to include',
        value: 'Equity I own, a named successor, a team I built, fewer better clients, someone else running ops, a brand with my name on it',
      },
    ],
    stat: 'Did you know? 67% of people picture their Future You just as clearly as you do.',
  },

  /* ── 5. The Move ── */
  {
    id: 'mv-intro',
    kind: 'intro',
    adventure: 'the-move',
    eyebrow: 'The Move',
    title: 'Let’s name the change you’re weighing',
    body: 'Turning a vague intention into something written down is what makes it moveable. People who write down their goals are 42% more likely to achieve them.',
    cite: 'Dr. Gail Matthews, Dominican University',
    cta: 'Start',
  },
  {
    id: 'mv-q1',
    kind: 'single',
    adventure: 'the-move',
    eyebrow: 'The Move · 1 of 10',
    title: 'Name the change you’re weighing.',
    body: 'Start with one and you can add more later.',
    options: [
      'Go independent with my team',
      'Join an existing RIA',
      'Buy another practice',
      'Sell or merge my book',
      'Bring in a successor',
      'Change nothing, but fix the parts that don’t work',
    ],
    chosen: ['Go independent with my team'],
  },
  {
    id: 'mv-q2',
    kind: 'single',
    adventure: 'the-move',
    eyebrow: 'The Move · 2 of 10',
    title: 'When do you want to do this?',
    options: ['< 12 months from now', '1–5 years from now', '6–10 years from now', '11–14 years from now', '15+ years from now'],
    chosen: ['1–5 years from now'],
  },
  {
    id: 'mv-q3',
    kind: 'text',
    adventure: 'the-move',
    eyebrow: 'The Move · 3 of 10',
    title: 'Why do you want to do this?',
    body: 'What’s driving you toward it?',
    answer:
      'Everything we build belongs to someone else. I want it to belong to us — including to the two people who have carried me for six years.',
  },
  {
    id: 'mv-q4',
    kind: 'single',
    adventure: 'the-move',
    eyebrow: 'The Move · 4 of 10',
    title: 'Do you want support with this?',
    options: ['I want to do it on my own.', 'I want help from a platform partner.'],
    chosen: ['I want help from a platform partner.'],
  },
  {
    id: 'mv-q5',
    kind: 'single',
    adventure: 'the-move',
    eyebrow: 'The Move · 5 of 10',
    title: 'Have you actively thought about making this change?',
    options: [
      'Not thinking/worried about it',
      'I’ve thought about it, but no plans yet',
      'I am making changes to tackle it',
      'I have made changes and am staying on track',
    ],
    chosen: ['I’ve thought about it, but no plans yet'],
  },
  {
    id: 'mv-q6',
    kind: 'single',
    adventure: 'the-move',
    eyebrow: 'The Move · 6 of 10',
    title: 'Do you know what steps to take?',
    options: ['No idea', 'Some ideas, but unsure', 'I know what to do and I’ve started making changes', 'I have already made changes'],
    chosen: ['Some ideas, but unsure'],
  },
  {
    id: 'mv-q7',
    kind: 'single',
    adventure: 'the-move',
    eyebrow: 'The Move · 7 of 10',
    title: 'Have you started to take action?',
    options: ['Not yet.', 'Yes, I’ve taken steps.', 'Yes, I am taking action and want to keep it up.', 'I’ve already made changes. It’s done!'],
    chosen: ['Not yet.'],
  },
  {
    id: 'mv-q8',
    kind: 'text',
    adventure: 'the-move',
    eyebrow: 'The Move · 8 of 10',
    title: 'Why might this be worth it?',
    body: 'List a few benefits, separated by commas.',
    answer: 'Ownership, my name on it, equity for Ana and Dev, choosing who we take on, no committee between me and a client',
  },
  {
    id: 'mv-q9',
    kind: 'text',
    adventure: 'the-move',
    eyebrow: 'The Move · 9 of 10',
    title: 'What might make this challenging?',
    body: 'List a few potential drawbacks or obstacles, separated by commas.',
    answer:
      'Client attrition, eighteen months of disruption, the deferred comp I would walk away from, telling my team before I am sure',
  },
  {
    id: 'mv-q10',
    kind: 'multi',
    adventure: 'the-move',
    eyebrow: 'The Move · 10 of 10',
    title: 'Who else has a say in this?',
    body: 'Choose as many as apply.',
    options: ['My team', 'A business partner', 'My spouse or family', 'My clients', 'Nobody but me', 'Other'],
    chosen: ['My team', 'My spouse or family'],
  },
  {
    id: 'mv-q10b',
    kind: 'text',
    adventure: 'the-move',
    eyebrow: 'The Move · 10 of 10',
    title: 'Which of them is hardest to bring along?',
    answer:
      'My wife. She has watched me talk about this for three years and she has stopped believing I will actually do it.',
  },
  {
    id: 'mv-stage',
    kind: 'stage',
    adventure: 'the-move',
    title: 'CONTEMPLATION',
    body: 'I feel like some changes are needed, but I’m not actually planning on doing anything anytime soon.',
    lines: [
      { label: 'What this means', value: 'You’re not ready to act just yet, and that’s completely normal.' },
      { label: 'Where you stand', value: 'Awareness is a powerful first step.' },
    ],
    stat: '34% of respondents are also in this stage.',
  },

  /* ── end screens ── */
  { id: 'end-summary', kind: 'summary' },
  { id: 'end-questions', kind: 'questions' },
]

/* ── the Independence ID (the Financial ID, one rung up) ─────────────────── */

export const independenceId = {
  header: {
    name: advisor.name,
    meta: `${advisor.role} · ${advisor.book} · ${advisor.firm}`,
    completed: advisor.completedOn,
  },
  // `icon` names the ADVENTURE each highlight is distilled from, so the desktop
  // profile can reuse the shared HighlightIcon: Practice Joy wears the Financial
  // Joy artwork, concerns and hopes come out of Outlook, the rest Future You.
  highlights: [
    { icon: 'financial-joy', title: 'What the practice is for', text: 'Ownership, control over how I serve, my team’s future' },
    {
      icon: 'financial-joy',
      title: 'What reminded me why',
      text: 'A client of eleven years bringing her daughter in — “because she wanted her to hear it from the person who actually knows the family”',
    },
    { icon: 'outlook', title: 'Biggest concern', text: 'Whether the clients follow. Then what he owes two junior advisors.' },
    { icon: 'outlook', title: 'Hopes', text: 'A firm with his name on it, and equity for the team instead of a bonus' },
    { icon: 'future-you', title: 'The practice I want', text: 'Equity I own, a team I built, fewer better clients, someone else running ops' },
    { icon: 'future-you', title: 'Where I’m heading', text: 'His own firm in 5–10 years, still advising, mentoring the next generation' },
  ],
  readiness: {
    stage: 'Contemplation',
    note: 'Wants it. Not moving on it yet. 34% of respondents sit here.',
    confidence: 'Balanced',
  },
  practiceJoy: {
    prompt: 'I want my practice to give me',
    chips: ['Ownership', 'Control over how I serve', 'My team’s future'],
  },
  attention: {
    more: ['Business development', 'Team and hiring', 'Strategy and growth', 'Life outside the practice'],
    less: ['Operations and admin', 'Compliance'],
  },
  futureYou: {
    where: ['At my own firm'],
    what: ['Advising clients', 'Running a business', 'Mentoring the next generation'],
    who: ['My current team', 'Clients I chose'],
  },
  outlook: {
    concerns: [
      'If I move, do the clients come with me. That is the only question that actually matters and nobody can answer it for me.',
      'I have two junior advisors who have stayed six years on the promise of something I cannot actually give them here.',
    ],
    hopes: [
      'Building something my name is actually on, that is worth something when I am done with it.',
      'Handing Ana and Dev equity instead of a bonus.',
    ],
  },
  move: {
    change: 'Go independent with my team',
    when: '1–5 years from now',
    worthIt: 'Ownership, my name on it, equity for Ana and Dev, choosing who we take on',
    challenging: 'Client attrition, eighteen months of disruption, deferred comp, telling the team before he is sure',
    stakeholders: 'My team · My spouse or family',
    hardest: 'His wife. Three years of talking about it without moving.',
  },
  badges: ['Practice Joy', 'Confidence', 'Outlook', 'Future You', 'The Move'],
  questions: [
    'In the ten teams most like mine that you have moved, what share of the top 25 relationships came across — and what happened in the two that went worst?',
    'What can my two junior advisors own on day one that they cannot own where I am now?',
    'How short can the transition actually be, and who carries operations while it is happening?',
  ],
}

/* What the enterprise reads from the same eight minutes. Kept short on purpose:
   the conversion video does this in three lines, and a rep about to dial needs
   three, not nine. */
export const conversionSnapshot = [
  { k: 'Who', v: 'Lead advisor, team of four, $840M, wirehouse. Breakaway — building, not exiting.' },
  { k: 'Readiness', v: 'Contemplation. High intent, low tolerance for disruption.' },
  { k: 'Driving', v: 'Ownership and control. Income ranked low — do not lead with payout.' },
  { k: 'Blocking', v: 'Client attrition, then obligation to two junior advisors.' },
  { k: 'Open with', v: '“You said the only question that matters is whether the clients come. Let’s start there.”' },
  { k: 'Avoid', v: 'Technology, custodians, the desktop. He named none of them.' },
  { k: 'Second seat', v: 'The two juniors. Bring an answer on their equity to the first meeting.' },
  { k: 'Route', v: 'Dynasty Connect. Not the investment bank.' },
]
