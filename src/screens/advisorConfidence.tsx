/* Confidence on the client's mechanism.
 *
 * The client's Confidence — the sun slider, the statement cards sliding in,
 * the dial on its moving sky, the reward — handed the advisor's six statements
 * instead of the client's. The statements, their ends and Marcus's samples are
 * read out of `advisorFlow.ts`; the reading is the Business ID's own band, so
 * the word on this ending is the word on the Business ID.
 *
 * The slider runs 0–100 and the sheet keeps 1–5, so an answer is converted on
 * the way in: the five points of the scale sit at 0, 25, 50, 75 and 100.
 */

import { steps as flowSteps } from '../data/advisorFlow'
import { confidenceBandOf, type Answers } from '../data/advisorAnswers'
import { CountUp } from './JoyResults'
import type { ConfidenceAnswers, ConfidenceContent } from './ConfidenceFlow'

const flow = flowSteps.find((s) => s.id === 'cf-q')
const reflect = flowSteps.find((s) => s.id === 'cf-reflect')
const intro = flowSteps.find((s) => s.id === 'cf-intro')

/** 0–100 on the slider, to the sheet's 1–5. */
export const toScale = (v: number) => Math.min(5, Math.max(1, 1 + Math.round(v / 25)))
const fromScale = (n: number) => (n - 1) * 25

export const ADVISOR_CONFIDENCE: ConfidenceContent = {
  statements: (flow?.statements ?? []).map((s) => ({
    statement: s.text,
    low: s.low,
    high: s.high,
    sample: fromScale(s.value),
  })),
  intro: {
    image: './confidence/intro.png',
    quote: 'Confidence in your abilities directly influences your performance, motivation, and behavior.',
    source: intro?.cite ?? 'Albert Bandura, psychologist and self-efficacy pioneer',
    lead: 'Let’s explore how you feel about your practice, and about the decision in front of you.',
    minutes: 1,
  },
  // An advisor answering for real skips what they leave alone.
  samples: false,
  reading: (values) => confidenceBandOf(values.map(toScale)),
  means: {
    Strong: 'You feel sure of the practice you are building and where it is going. That is a strong place to decide from.',
    Balanced: 'You feel steady in some places and less so in others. The right partner starts where it feels least sure.',
    Weak: 'The practice is taking more out of you than it gives back right now. That is worth knowing before you decide anything.',
  },
  results: {
    title: 'You found your confidence',
    sub: 'This is how you feel about your practice today:',
    tag: 'Your confidence',
    line: (hi, lo) =>
      `You feel most sure that ${hi} You feel least sure that ${lo} That is where the right partner should start.`,
    about: {
      title: 'Confidence matters',
      share: 48,
      first: (
        <>
          <b>
            <CountUp to={48} />%
          </b>{' '}
          of advisors share a similar mix of <b>confidence</b> and <b>uncertainty</b> about their
          business.
        </>
      ),
      // The flow's own breath after Confidence, said here where it lands.
      second: (
        <>
          {(reflect?.body ?? '').split('\n\n').map((p) => (
            <p key={p}>{p}</p>
          ))}
        </>
      ),
    },
  },
}

/** The sheet with Confidence's answers written onto it. A statement left
    alone stays unanswered. */
export function sheetWithConfidence(a: Answers, c: ConfidenceAnswers): Answers {
  return {
    ...a,
    scaleSet: { ...a.scaleSet, 'cf-q': c.values.map((v) => (v === null ? 0 : toScale(v))) },
  }
}
