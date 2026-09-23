/* The Recruiting Quotient, as the scoring sheet computes it ("RQ Score
 * Calculator"). One place, so the advisor profile Marcus is authored with and
 * the one computed from anybody's answers score the same way — and so the
 * working a card opens onto is the arithmetic that made its number.
 *
 *   Intent       50% the readiness stage (TTM 1–5)
 *                50% "I'm confident my current firm gets me the practice I
 *                    want", reversed — not getting it is a reason to leave
 *   Clarity      "How clear was the picture of Future You?" (1–5)
 *   Receptivity  50% "I believe the right platform partner would improve my
 *                    confidence" (1–5)
 *                50% "Do you want support with this?" — a partner = 5, on my
 *                    own = capped at neutral (3), blank = no penalty
 *   RQ           the average of the three
 */

import type { CalcRow } from './readiness'

export const TTM_NAMES = ['Pre-Contemplation', 'Contemplation', 'Preparation', 'Action', 'Maintenance']

/* The sheet's ramps: raw 1–5 to 0–100. */
const TTM_RAMP = [20, 40, 60, 80, 90]
const LIKERT_RAMP = [25, 45, 65, 85, 95]
const SUPPORT = { yes: 98, no: 58 }

const likert = (raw: number) => LIKERT_RAMP[Math.min(5, Math.max(1, raw)) - 1]

export interface RqInputs {
  /** Readiness stage, 1 (Pre-Contemplation) to 5 (Maintenance). */
  ttm: number
  /** The current-firm statement, 1–5 as answered (before reversing). */
  firm?: number
  /** Future You clarity, 1–5. */
  clarity?: number
  /** The platform-partner statement, 1–5. */
  platform?: number
  /** Wants support: a partner, on their own, or not answered. */
  support?: 'yes' | 'no'
}

export function rqFromSheet(i: RqInputs) {
  const ttmPts = TTM_RAMP[Math.min(5, Math.max(1, i.ttm)) - 1]
  const firmPts = i.firm ? likert(6 - i.firm) : undefined
  const intent = Math.round(firmPts === undefined ? ttmPts : (ttmPts + firmPts) / 2)

  const clarity = i.clarity ? likert(i.clarity) : 0

  const platformPts = i.platform ? likert(i.platform) : 0
  const supportPts = i.support ? SUPPORT[i.support] : undefined
  const receptivity = Math.round(supportPts === undefined ? platformPts : (platformPts + supportPts) / 2)

  const rq = Math.round((intent + clarity + receptivity) / 3)

  const calc: Record<'Intent' | 'Clarity' | 'Receptivity', CalcRow[]> = {
    Intent: [
      {
        label: 'Readiness stage',
        value: TTM_NAMES[i.ttm - 1],
        points: ttmPts,
        weight: firmPts === undefined ? undefined : '50%',
      },
      ...(firmPts === undefined
        ? []
        : [
            {
              label: '“I’m confident my current firm gets me the practice I want.” (reversed)',
              value: `${i.firm} of 5`,
              points: firmPts,
              weight: '50%',
            },
          ]),
    ],
    Clarity: [
      {
        label: 'How clear was the picture of Future You?',
        value: i.clarity ? `${i.clarity} of 5` : 'Not answered',
        points: clarity,
      },
    ],
    Receptivity: [
      {
        label: '“I believe the right platform partner would improve my confidence.”',
        value: i.platform ? `${i.platform} of 5` : 'Not answered',
        points: platformPts,
        weight: supportPts === undefined ? undefined : '50%',
      },
      ...(supportPts === undefined
        ? []
        : [
            {
              label: 'Do you want support with this?',
              value: i.support === 'yes' ? 'Help from a platform partner' : 'On my own (capped at neutral)',
              points: supportPts,
              weight: '50%',
            },
          ]),
    ],
  }
  const total = `The RQ is the average of Intent, Clarity and Receptivity: (${intent} + ${clarity} + ${receptivity}) ÷ 3 = ${rq}.`
  return { intent, clarity, receptivity, rq, calc, total }
}
