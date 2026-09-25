/* Future You on the client's mechanism.
 *
 * The client's Future You — the breathing orb, photograph picks, the road, the
 * detail chips, the postcard that is stamped and posted, the vision as a
 * poster — handed the advisor's questions instead of the client's: where the
 * practice is (one answer), what they are doing, who with, how far away,
 * what the practice includes, how clear the picture was, and the postcard.
 *
 * Wording, options and Marcus's samples are read out of `advisorFlow.ts`.
 * Photographs live in public/advisor/future-you/, named after the option;
 * until one is dropped in its slot is a tint, and the few that mean what a
 * client photograph already means borrow it.
 */

import { steps as flowSteps } from '../data/advisorFlow'
import type { Answers } from '../data/advisorAnswers'
import { CountUp } from './JoyResults'
import type { DetailGroup, FutureYouAnswers, FutureYouContent, Pick } from './FutureYouFlow'

const OTHER = 'Other'
const step = (id: string) => flowSteps.find((s) => s.id === id)
const options = (id: string) => (step(id)?.options ?? []).filter((o) => o !== OTHER)

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/* A client photograph that already says the same thing. */
const BORROWED: Record<string, string> = {
  'Running a business': './future-you/running-a-business.png',
  Family: './future-you/family.png',
  Solo: './future-you/solo.png',
  Partners: './future-you/business-partners.png',
}
const photos = (id: string): Pick[] =>
  options(id).map((label) => ({ label, src: BORROWED[label] ?? `./advisor/future-you/${slug(label)}.png` }))

/* What the practice includes, the flow's one long list, in four kinds. Anything
   the flow adds later that none of these name goes in the last. */
const KINDS: { group: string; icon: string; items: string[] }[] = [
  { group: 'What you own', icon: '◆', items: ['Equity I own', 'A brand with my name on it', 'An exit'] },
  { group: 'Your people', icon: '♥', items: ['A named successor', 'A team I built', 'Someone else running ops'] },
  {
    group: 'Your clients',
    icon: '✺',
    items: ['Fewer, better clients', 'More clients', 'A niche I’m known for', 'Predictable revenue'],
  },
  { group: 'Your time', icon: '✈', items: ['Time away from the desk', 'Board or industry work'] },
]
const includes = options('fy-q5')
const placed = new Set(KINDS.flatMap((k) => k.items))
const GROUPS: DetailGroup[] = KINDS.map((k, i) => ({
  ...k,
  items: [
    ...k.items.filter((it) => includes.includes(it)),
    ...(i === KINDS.length - 1 ? includes.filter((it) => !placed.has(it)) : []),
  ],
}))

/* An option said back to them: 'At a firm I joined' becomes 'at a firm you
   joined', 'My current team' becomes 'your current team'. */
const lower = (s: string) =>
  (s.charAt(0).toLowerCase() + s.slice(1)).replace(/\bmy\b/gi, 'your').replace(/\bI\b/g, 'you')

const q = (id: string, fallback = '') => step(id)?.title ?? fallback

export const ADVISOR_FUTURE: FutureYouContent = {
  intro: {
    image: './future-you/intro.png',
    title: q('fy-intro', 'Let’s materialize your vision for Future You'),
    body: step('fy-intro')?.body ?? '',
    minutes: 2,
  },
  breathe: {
    title: q('fy-breathe', 'This is your future.'),
    sub: 'Take a moment to visualize the practice you are building toward.',
    prompts: ['Where is your practice?', 'What are you doing?', 'Who are you with?', 'How does it feel to be there?'],
  },
  ask: {
    where: {
      title: 'Let’s materialize your vision!',
      sub: q('fy-q1'),
      options: photos('fy-q1'),
      otherPlaceholder: 'Teaching, writing, advising a few families',
      single: true,
    },
    doing: {
      title: 'Let’s materialize your vision!',
      sub: q('fy-q2'),
      options: photos('fy-q2'),
      otherPlaceholder: 'Speaking at conferences',
    },
    with: {
      title: 'Let’s materialize your vision!',
      sub: q('fy-q3'),
      options: photos('fy-q3'),
      otherPlaceholder: 'My daughter, joining the practice',
    },
  },
  when: { title: q('fy-q4'), sub: 'Pick the stretch of road it sits on.', stops: options('fy-q4') },
  detail: {
    title: q('fy-q5'),
    sub: 'Tap everything that belongs in it, or add your own.',
    groups: GROUPS,
  },
  clarity: {
    title: q('fy-clarity', 'How clear was the picture of Future You?'),
    low: step('fy-clarity')?.scale?.low ?? 'Very blurry',
    high: step('fy-clarity')?.scale?.high ?? 'Vividly clear',
  },
  postcard: {
    title: 'Now step into Future You’s shoes.',
    sub: step('fy-postcard')?.body ?? 'Write a postcard to yourself from Future You.',
    placeholder: 'Dear Me,',
  },
  sample: {
    where: step('fy-q1')?.chosen ?? [],
    doing: step('fy-q2')?.chosen ?? [],
    with: step('fy-q3')?.chosen ?? [],
    when: step('fy-q4')?.chosen?.[0] ?? null,
    detail: step('fy-q5')?.chosen ?? [],
    postcard: step('fy-postcard')?.answer ?? '',
    clarity: step('fy-clarity')?.scale?.value ?? null,
  },
  // An advisor answering for real skips what they leave blank.
  fill: false,
  results: {
    title: step('fy-unlock')?.title ?? 'Way to go, here’s Future You',
    sub: 'This is the practice you are building toward:',
    detailTitle: 'What your practice includes',
    postcardSub: 'Sent back from there:',
    line: (a) =>
      `${a.when ? `In ${a.when.toLowerCase()}, ` : ''}you see yourself ${
        a.where[0] ? lower(a.where[0]) : 'somewhere new'
      }${a.with[0] ? `, with ${lower(a.with[0])}` : ''}. The right partner should help you build exactly that.`,
    about: (a) => ({
      title: 'You visualized Future You!',
      share: 67,
      first: (
        <>
          <b>
            <CountUp to={67} />%
          </b>{' '}
          of advisors picture their Future You{' '}
          {a.clarity ? (
            <>
              as <b>clearly</b> as you do
            </>
          ) : (
            <>
              <b>clearly</b>
            </>
          )}
          .
        </>
      ),
      second: <p>{step('fy-intro')?.body}</p>,
    }),
  },
}

/* ── the sheet ────────────────────────────────────────────────────────── */

/** A list as the sheet keeps it: the flow's own options as picked, and
    anything else as "Other" with the words beside it. */
function asChoice(a: Answers, id: string, picked: string[]): Answers {
  const known = options(id)
  const own = picked.filter((p) => !known.includes(p))
  const choice = picked.filter((p) => known.includes(p))
  return {
    ...a,
    choice: { ...a.choice, [id]: own.length ? [...choice, OTHER] : choice },
    other: { ...a.other, [`${id}:other`]: own.join(', ') },
  }
}

/** The sheet with Future You's answers written onto it. */
export function sheetWithFuture(a: Answers, f: FutureYouAnswers): Answers {
  let out = asChoice(a, 'fy-q1', f.where.slice(0, 1))
  out = asChoice(out, 'fy-q2', f.doing)
  out = asChoice(out, 'fy-q3', f.with)
  out = asChoice(out, 'fy-q4', f.when ? [f.when] : [])
  out = asChoice(out, 'fy-q5', f.detail)
  const text = { ...out.text }
  if (f.postcard.trim()) text['fy-postcard'] = f.postcard.trim()
  else delete text['fy-postcard']
  const scale = { ...out.scale }
  if (f.clarity) scale['fy-clarity'] = f.clarity
  else delete scale['fy-clarity']
  return { ...out, text, scale }
}
