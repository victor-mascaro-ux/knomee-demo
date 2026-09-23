/* The Financial Joy adventure, as the client takes it.
 *
 * The advisor's flow already exists screen by screen in `advisorFlow.ts`; this
 * is the client's own first adventure, in the same shape: an intro that says
 * why it is worth three minutes, the questions, and a finish that hands back
 * what they said rather than a score.
 *
 * Three kinds of question, because Financial Joy asks three kinds:
 *  · `pick`    — what they want money to help them with, many at once
 *  · `split`   — one area of life at a time, less of it or more of it
 *  · `reflect` — a memory, in their own words, which nothing is computed from
 *
 * Everything here is the demo's content. What a client answers lands on their
 * Financial ID, which is why the options are worded the way that page reads
 * them back.
 */

export type JoyStep =
  | { kind: 'intro'; title: string; body: string; cta: string; minutes: number }
  | { kind: 'pick'; eyebrow: string; title: string; body: string; options: string[] }
  | { kind: 'split'; eyebrow: string; areas: string[] }
  | { kind: 'reflect'; eyebrow: string; title: string; body: string; placeholder: string }
  | { kind: 'done'; title: string; body: string; cta: string }
  | { kind: 'badge'; title: string; body: string; cta: string }

/* What money is for, in the words the Financial ID prints as chips. Ordered
   the way the phone shows them: the four most-chosen first. */
export const JOY_OPTIONS = [
  'Choice',
  'Comfort',
  'Freedom',
  'Security',
  'Enjoying the moment',
  'Supporting my family',
  'Independence',
  'Legacy',
  'Simplicity',
  'Philanthropy and giving',
  'Peace of mind',
  'Adventure',
]

/* The seven areas the attention question walks through, one screen each. The
   answer is a direction — less of it, or more — not a rating. */
export const JOY_AREAS = [
  'Work and career',
  'Financial planning and management',
  'Health and wellness',
  'Family and relationships',
  'Hobbies and interests',
  'Travel and adventure',
  'Home life',
]

export const joySteps: JoyStep[] = [
  {
    kind: 'intro',
    title: 'What brings you joy?',
    body:
      'Money is never just money. It is what it lets you do, and who it lets you do it with.\n\nThree minutes on what makes you happy, and your advisor stops guessing.',
    cta: 'Get started',
    minutes: 3,
  },
  {
    kind: 'pick',
    eyebrow: 'Money is a tool',
    title: 'I want money to help me with:',
    body: 'Choose as many as feel true. There is no wrong number.',
    options: JOY_OPTIONS,
  },
  { kind: 'split', eyebrow: 'Where your attention goes', areas: JOY_AREAS },
  {
    kind: 'reflect',
    eyebrow: 'Think back!',
    title: 'When did money last buy you something that brought you joy?',
    body: 'A day, a thing, a trip — whatever comes to mind first.',
    placeholder: 'Write as much or as little as you like.',
  },
  {
    kind: 'reflect',
    eyebrow: 'Think back!',
    title: 'When did money last get in the way of something you wanted?',
    body: 'Naming it is the part that helps. Nothing here is graded.',
    placeholder: 'Write as much or as little as you like.',
  },
  {
    kind: 'reflect',
    eyebrow: 'Think back!',
    title: 'What would you do tomorrow if money were taken care of?',
    body: 'The first answer is usually the honest one.',
    placeholder: 'Write as much or as little as you like.',
  },
  {
    kind: 'done',
    title: 'You found Financial Joy',
    body: 'Here is what you said. It is on your Financial ID now, and your advisor reads the same page you do.',
    cta: 'Claim badge',
  },
  {
    kind: 'badge',
    title: 'Financial Joy',
    body: 'Adventure complete. Four more to go, and each one tells your advisor something they cannot ask for.',
    cta: 'Continue',
  },
]
