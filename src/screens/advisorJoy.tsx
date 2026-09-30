/* Practice Joy on the client's mechanism.
 *
 * The client's Financial Joy — photo picks, the swipe deck, the reveal, the
 * reward — handed the advisor's questions instead of the client's. Nothing is
 * retyped: the wording, options, hints and Marcus's sample answers are read
 * out of `advisorFlow.ts`, so a question reworded there is reworded here.
 *
 * Photographs live in public/advisor/joy/ (the picks) and
 * public/advisor/joy/areas/ (the deck), named after the option. Until one is
 * dropped in its slot is a tint; the four that mean what a client photo
 * already means borrow the client's.
 *
 * The answers go back onto the advisor's own sheet, keyed the way every other
 * advisor screen reads them, so the Business ID, the three questions and the
 * privacy rules see no difference between this and the plain screens.
 */

import type { JoyPick, JoyStep } from '../data/joyFlow'
import bgJoyUntitled from '../assets/badges/joy-on-plum-untitled.svg'
import { steps as flowSteps, type Step } from '../data/advisorFlow'
import type { Answers, Grade } from '../data/advisorAnswers'
import type { JoyAnswers, JoyContent } from './JoyFlow'

const OTHER = 'Other'
const REFLECT_IDS = ['pj-q3', 'pj-q4'] as const

const stepOf = (id: string): Step => {
  const s = flowSteps.find((x) => x.id === id)
  if (!s) throw new Error(`advisorJoy: no step ${id}`)
  return s
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/* A client photograph that already says the same thing. */
const BORROWED: Record<string, string> = {
  Independence: './joy/independence.png',
  Security: './joy/security.png',
  Simplicity: './joy/simplicity.png',
  Control: './joy/control.png',
  // Renamed from Ownership; the key in the hand still says it.
  Equity: './advisor/joy/ownership.png',
}

const pick = (label: string): JoyPick => ({
  label,
  src: BORROWED[label] ?? `./advisor/joy/${slug(label)}.png`,
})

const PICKS: JoyPick[] = (stepOf('pj-q1').options ?? []).filter((o) => o !== OTHER).map(pick)
const AREAS: JoyPick[] = (stepOf('pj-q2').rows ?? []).map((r) => ({
  label: r.label,
  src: `./advisor/joy/areas/${slug(r.label)}.jpg`,
}))

const intro = stepOf('pj-intro')
const pause = stepOf('pj-reflect')
const q1 = stepOf('pj-q1')

const REFLECT_EYEBROW: Record<(typeof REFLECT_IDS)[number], string> = {
  'pj-q3': 'Think back!',
  'pj-q4': 'Why it mattered',
}

/* The memory screen's starters and ghost openings, per question. Where the
   flow already has prompts for a question, they are its starters. */
const MEMORY: Record<(typeof REFLECT_IDS)[number], { starters: string[]; ghosts: string[] }> = {
  'pj-q3': {
    starters: ['Last week…', 'A client who…', 'The day we…', 'When a family…'],
    ghosts: [
      'A client brought her daughter in to meet me…',
      'A widow called, just to say thank you…',
      'We got a family through the worst year of their lives…',
    ],
  },
  'pj-q4': {
    starters: ['It mattered because…', 'It reminded me…', 'Nobody else could…'],
    ghosts: [
      'It had nothing to do with whose name is on the wall…',
      'It was the whole point of doing this…',
    ],
  },
}

const reflect = (id: (typeof REFLECT_IDS)[number]): JoyStep => {
  const s = stepOf(id)
  return {
    kind: 'reflect',
    id,
    eyebrow: REFLECT_EYEBROW[id],
    /* The eyebrow already says 'Think back!', so the question does not open
       by saying it again. */
    title: (s.title ?? '').replace(/^Think back\s*[—–-]\s*(\w)/, (_m, c: string) => c.toUpperCase()),
    body: s.body ?? 'Write as much or as little as you like.',
    placeholder: 'Write it, or tap the mic and say it.',
    example: s.answer ?? '',
    starters: s.hints?.length ? s.hints : MEMORY[id].starters,
    ghosts: MEMORY[id].ghosts,
  }
}

const STEPS: JoyStep[] = [
  {
    kind: 'intro',
    image: './joy/intro.png',
    quote:
      'Aligning daily activity with what you actually value leads to greater satisfaction — in a business as much as a life.',
    source: intro.cite ?? '',
    title: intro.title ?? '',
    body: 'A practice is more than a P&L.',
    lead: 'Let’s get clear on what you want yours to give you.',
    cta: 'Get Started',
    minutes: 2,
    gets: {
      do: 'pick what you want your practice to give you, and sort where your attention goes.',
      get: 'What your practice is for — the first card on your Business ID.',
    },
  },
  {
    kind: 'pick',
    /* The question is the heading: "I want my practice to give me…" says it
       plainly, and a line over it only said it again. */
    eyebrow: q1.title ?? '',
    title: '',
    body: `Choose up to ${q1.max ?? 3}.`,
    options: PICKS,
    max: q1.max ?? 3,
    other: { label: 'Other', hint: 'Or write your answer.', placeholder: 'Freedom to choose my clients' },
  },
  {
    kind: 'pause',
    title: pause.title ?? '',
    body: pause.body ?? '',
    cta: pause.cta ?? 'Continue',
    image: './advisor/joy/pause-and-reflect.png',
  },
  { kind: 'split', eyebrow: 'Where your attention goes', areas: AREAS.map((a) => a.label) },
  ...REFLECT_IDS.map(reflect),
  {
    kind: 'done',
    title: 'What the work is for',
    body: 'Here is what you said. It is on your Business ID now.',
    cta: 'Claim badge',
  },
  /* The celebration every adventure ends on, under its own name: Practice
     Joy's lettering over the Joy art. */
  {
    kind: 'badge',
    title: 'Practice Joy',
    body: 'Adventure complete.',
    cta: 'Continue',
  },
]

export const ADVISOR_JOY: JoyContent = {
  steps: STEPS,
  badge: bgJoyUntitled,
  badgeName: 'Practice Joy',
  badgeArcTitle: 'Practice Joy',
  picks: PICKS,
  areas: AREAS,
  // No samples: an advisor answering for real skips what they leave blank.
  splitAsk: (
    <>
      Right now, would you direct <b className="is-more">more</b>, <b className="is-same">the same</b>, or{' '}
      <b className="is-less">less</b> of your attention to…
    </>
  ),
  results: {
    title: 'What the work is for',
    memoryLead: 'The last moment that reminded you why you do this:',
    memoryTag: 'Your moment',
    toolsTitle: 'You want your practice to represent…',
    toolsLead: '',
    prefLead: 'This is where you want your attention to go.',
    reading: (more, less) =>
      more && less
        ? `You want your attention to move toward ${more}, and away from ${less}.`
        : more
          ? `You want more of your attention on ${more}.`
          : less
            ? `You want less of your attention going to ${less}.`
            : 'You are happy with where your attention goes today.',
    about: {
      title: 'You found what the work is for',
      share: 61,
      want: 'want their practice to give them',
      why: [
        'Advisors who are clear about what their practice is for make better decisions.',
        'Knowing how you find fulfillment in your practice before exploring a move helps you evaluate options based on what matters most to you.',
      ],
    },
  },
}

/* ── the sheet, both ways ─────────────────────────────────────────────── */

const GRADE_OF = (n: number): Grade => (n > 0 ? 'More' : n < 0 ? 'Less' : 'Same')

/** The sheet with Practice Joy's answers written onto it. */
export function sheetWithJoy(a: Answers, j: JoyAnswers): Answers {
  const other = j.other.trim()
  const text = { ...a.text }
  REFLECT_IDS.forEach((id, i) => {
    const v = (j.notes[i] ?? '').trim()
    if (v) text[id] = v
    else delete text[id]
  })
  return {
    ...a,
    choice: { ...a.choice, 'pj-q1': other ? [...j.tools, OTHER] : [...j.tools] },
    other: { ...a.other, 'pj-q1:other': other },
    grid: {
      ...a.grid,
      'pj-q2': Object.fromEntries(Object.entries(j.attention).map(([k, n]) => [k, GRADE_OF(n)])),
    },
    text,
  }
}
