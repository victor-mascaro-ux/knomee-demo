/* Outlook on the client's mechanism.
 *
 * The client's Outlook — concerns drifting in as clouds over a dusk sky, hopes
 * rising as lights at dawn, the whole sky on the ending, the reward — handed
 * the advisor's four questions instead of the client's two.
 *
 * The advisor asks the biggest concern, then any others; the biggest hope,
 * then any others. On the sky that is one list each: the first concern added
 * answers the first question, and once it is in, the heading turns to the
 * second one — "Any other big concerns…?" — so the follow-up is still asked,
 * in the flow's own words. On the sheet, the first of each list is the first
 * question and the rest, together, is the second.
 *
 * Prompts, wording and Marcus's samples are read out of `advisorFlow.ts`.
 */

import { steps as flowSteps } from '../data/advisorFlow'
import type { Answers } from '../data/advisorAnswers'
import { CountUp } from './JoyResults'
import type { OutlookAnswers, OutlookContent } from './OutlookFlow'

const step = (id: string) => flowSteps.find((s) => s.id === id)

/* A prompt as a chip: the flow writes them quoted, the sky wants them bare. */
const bare = (h: string) => h.replace(/^[“"]|[”"]$/g, '')
const chips = (...ids: string[]) => [...new Set(ids.flatMap((id) => step(id)?.hints ?? []).map(bare))]

const introBody = (step('ol-intro')?.body ?? '').split('\n\n')

/* A heading from the flow's own question, with its key words in bold the
   way the client's are. */
const titled = (text: string, bold: string) => {
  const at = text.indexOf(bold)
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <b>{bold}</b>
      {text.slice(at + bold.length)}
    </>
  )
}

export const ADVISOR_OUTLOOK: OutlookContent = {
  intro: {
    image: './outlook/intro.png',
    title: step('ol-intro')?.title ?? 'What’s on your mind?',
    body: introBody[0] ?? '',
    lead: introBody[1] ?? '',
    minutes: 2,
  },
  question: (kind, added) =>
    kind === 'concern'
      ? added === 0
        ? titled(step('ol-q1')?.title ?? '', 'biggest concern')
        : titled(step('ol-q2')?.title ?? '', 'other big concerns')
      : added === 0
        ? titled(step('ol-q3')?.title ?? '', 'hopeful')
        : titled(step('ol-q4')?.title ?? '', 'other hopes'),
  note: 'Use the prompts to help you start. Add as many as you like.',
  starts: { concern: chips('ol-q1', 'ol-q2'), hope: chips('ol-q3', 'ol-q4') },
  placeholder: {
    concern: 'Whether my clients come with me.',
    hope: 'Building something with my name on it.',
  },
  examples: {
    concerns: [step('ol-q1')?.answer, step('ol-q2')?.answer].filter((s): s is string => !!s),
    hopes: [step('ol-q3')?.answer, step('ol-q4')?.answer].filter((s): s is string => !!s),
  },
  // An advisor answering for real skips a screen they add nothing to.
  fill: false,
  reading: (c, h) =>
    h > c
      ? 'There is more light than cloud in your sky. You are looking ahead with more hope than worry — a good place to decide from.'
      : h < c
        ? 'The clouds are heavy right now. Naming them is how they start to lift — and they are the first thing any firm should answer.'
        : 'Your worries and your hopes are in balance. The right move is the one that tips it toward the hopes.',
  results: {
    title: step('ol-unlock')?.title ?? 'Your outlook',
    sub: 'This is what’s on your mind:',
    concernsSub: 'What weighs on you:',
    hopesSub: 'What you are reaching for:',
    line: (c, h) => `Any firm you talk to should start with “${c}” — and show you how they get you to “${h}”.`,
    about: {
      title: 'Your outlook matters',
      share: 80,
      first: (
        <>
          More than{' '}
          <b>
            <CountUp to={80} />%
          </b>{' '}
          of advisors share more than one <b>concern</b>, and over <b>95%</b> share two or more{' '}
          <b>hopes</b>.
        </>
      ),
      second: <p>{step('ol-unlock')?.body}</p>,
    },
  },
}

/* A list as one answer: each item a sentence of its own. */
const joined = (items: string[]) =>
  items
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (/[.?!…]$/.test(s) ? s : `${s}.`))
    .join(' ')

/** The sheet with Outlook's answers written onto it: the first concern and
    hope answer the first questions, the rest answer "any others". */
export function sheetWithOutlook(a: Answers, o: OutlookAnswers): Answers {
  const text = { ...a.text }
  const put = (id: string, v: string) => {
    if (v) text[id] = v
    else delete text[id]
  }
  put('ol-q1', joined(o.concerns.slice(0, 1)))
  put('ol-q2', joined(o.concerns.slice(1)))
  put('ol-q3', joined(o.hopes.slice(0, 1)))
  put('ol-q4', joined(o.hopes.slice(1)))
  return { ...a, text }
}
