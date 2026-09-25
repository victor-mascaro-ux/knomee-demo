/* The advisors who have actually taken the flow, as rows of the firm's own
 * candidate table.
 *
 * There used to be a second page for them — a testing list beside the real
 * pipeline. They belong in the pipeline: each sitting is scored the way its
 * report scores it (`derive()` over its answers), so the row, its tier and the
 * report behind it can never disagree. What the flow does not ask — AUM as a
 * number, team size, where the lead came from — falls back to a neutral
 * value rather than being invented.
 */

import { derive, initials } from './advisorAnswers'
import type { Entry } from './advisorDirectory'
import type { Candidate, Stage, Tier } from './candidates'

export interface LiveCandidate extends Candidate {
  /** The sitting behind the row: opening it opens that report. */
  entryId: string
  /** How far through the flow they are, for a row still unfinished. */
  answered: number
  total: number
  /** The invite it came through, if any: removing the person removes it too. */
  token: string | null
  /** When it was last written — the newest one wears the "new" pill. */
  at: string
}

const STAGE: Record<string, Stage> = {
  'Pre-Contemplation': 'Pre-contemplation',
  Contemplation: 'Contemplation',
  Preparation: 'Preparation',
  Action: 'Action',
  Maintenance: 'Maintenance',
}

const tierOf = (rq: number): Tier => (rq >= 70 ? 'tier1' : rq >= 40 ? 'tier2' : 'tier3')

/** "$840M" or "200M" → 840 / 200; anything else → 0. */
const aumOf = (book: string) => {
  const m = book.replace(/[, ]/g, '').match(/\$?(\d+(?:\.\d+)?)\s*([MB])?/i)
  if (!m) return 0
  const n = parseFloat(m[1])
  return m[2]?.toUpperCase() === 'B' ? n * 1000 : n
}

export function candidateFromEntry(e: Entry): LiveCandidate {
  const done = e.answered >= e.total && e.total > 0
  const d = derive(e.answers)
  const scored = done && !d.empty
  return {
    entryId: e.id,
    answered: e.answered,
    total: e.total,
    token: e.token,
    at: e.at,
    // Shown as initials: the people who took the flow are not named on screen.
    name: initials(e.name) || 'Advisor',
    firm: [e.role, e.firm].filter(Boolean).join(' · ') || '—',
    kq: scored ? d.readiness.snapshot.kq : null,
    intent: scored ? d.scores.intent : null,
    clarity: scored ? d.scores.clarity : null,
    receptivity: scored ? d.scores.receptivity : null,
    stage: scored ? (STAGE[d.stage] ?? null) : null,
    aum: aumOf(e.book),
    team: 1,
    segment: 'Breakaway',
    source: e.token ? 'Go Independent link' : 'Outbound',
    apprehension: 'Nothing named',
    secondSeat: 'Nobody but me',
    change: 'Go independent with my team',
    vision: 'Unclear',
    progress: done ? 'completed' : 'started',
    topAction: scored ? d.toolkit.topAction : `Finish the flow — ${e.answered} of ${e.total} answered.`,
    tier: scored ? tierOf(d.readiness.snapshot.kq) : 'incomplete',
  }
}
