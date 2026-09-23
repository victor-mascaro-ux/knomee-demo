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

/* A thing money can be a tool for, with the photograph the phone shows it as.
   Photographs live in public/joy/ and are dropped in by hand; a missing one
   falls back to a tint, so the grid keeps its shape either way. */
export interface JoyPick {
  label: string
  src: string
}

export type JoyStep =
  | {
      kind: 'intro'
      /** The picture beside the quote: a portrait on the brand's teal disc. */
      image: string
      quote: string
      source: string
      title: string
      body: string
      /** The line under the body that says what happens next. */
      lead: string
      cta: string
      minutes: number
    }
  | {
      kind: 'pick'
      eyebrow: string
      title: string
      body: string
      options: JoyPick[]
      /** How many can be chosen at once. */
      max: number
      other: { label: string; hint: string; placeholder: string }
    }
  | { kind: 'split'; eyebrow: string; areas: string[] }
  | {
      kind: 'reflect'
      eyebrow: string
      title: string
      body: string
      placeholder: string
      /** A believable answer the demo can type in, so a room is not watching
          someone think of one. */
      example: string
    }
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

const joyPhoto = (label: string, file: string): JoyPick => ({ label, src: `./joy/${file}.png` })

/* The same seven areas as cards, each with its photograph, in
   public/joy/areas/ under the area's name. */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const JOY_AREA_CARDS: JoyPick[] = JOY_AREAS.map((label) => ({
  label,
  src: `./joy/areas/${slug(label)}.png`,
}))

/* The nine the phone shows, in the design's order. */
export const JOY_PICKS: JoyPick[] = [
  joyPhoto('Choice', 'choice'),
  joyPhoto('Comfort', 'comfort'),
  joyPhoto('Independence', 'independence'),
  joyPhoto('Enjoying the moment', 'enjoying-the-moment'),
  joyPhoto('Security', 'security'),
  joyPhoto('Supporting my family', 'supporting-my-family'),
  joyPhoto('Control', 'control'),
  joyPhoto('Status', 'status'),
  joyPhoto('Simplicity', 'simplicity'),
]

export const joySteps: JoyStep[] = [
  {
    kind: 'intro',
    image: './joy/intro.png',
    quote:
      'Aligning daily activities with core values and priorities leads to greater life satisfaction and wellbeing.',
    source: "From 'Build the Life You Want' by Arthur C. Brooks and Oprah Winfrey",
    title: 'What brings you joy?',
    body: 'Wealth is more than money—it’s about fulfillment, joy, and meaningful experiences.',
    lead: 'Let’s explore what makes you happy.',
    cta: 'Get Started',
    minutes: 1,
  },
  {
    kind: 'pick',
    eyebrow: 'Money is a tool!',
    title: 'I want money to help me with…',
    body: 'Choose up to 3.',
    options: JOY_PICKS,
    max: 3,
    other: { label: 'Other', hint: 'Or write your answer.', placeholder: 'Philanthropy and giving' },
  },
  { kind: 'split', eyebrow: 'Where your attention goes', areas: JOY_AREAS },
  {
    kind: 'reflect',
    eyebrow: 'Think back!',
    title: 'When did money last buy you something that brought you joy?',
    body: 'A day, a thing, a trip — whatever comes to mind first.',
    placeholder: 'Write as much or as little as you like.',
    example:
      'Taking the whole family to the coast last summer. A rented house, no plans, the kids in the water every day. It was the first trip we paid for without checking the account first.',
  },
  {
    kind: 'reflect',
    eyebrow: 'Think back!',
    title: 'What would you do tomorrow if money were taken care of?',
    body: 'The first answer is usually the honest one.',
    placeholder: 'Write as much or as little as you like.',
    example:
      'Move closer to my daughter, and spend the mornings painting. Travel with Vic while we both still can.',
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
