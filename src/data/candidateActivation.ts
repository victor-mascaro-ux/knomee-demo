// Candidate Analytics — the recruiting side of the activation tracking, and
// the one analytics page in the demo built on real data. It reads the advisor
// directory (advisorDirectory.ts) each time it opens: every invite link made
// on Candidates, whether it was opened, whether anybody answered, and whether
// they finished. Counted per invite, so a link answered on two phones is one
// advisor. Only counts leave this file — no name, firm or answer is shown.
//
// Where each step comes from:
// - Recruit Toolkit opened, invite template copied: the toolkit's own events
//   (toolkit-events, kit "recruit"), not counted until the Firestore rule is in
// - link opened from a toolkit template: the UTM tags the toolkit adds to the
//   link, stamped on the invite the first time it is opened (since Oct 29, 2026)
// - invited: the Invite button on Candidates
// - opened: the flow, the first time the link is opened
// - started: the first answer that reaches the directory
// - finished: every adventure taken to its end
// - added to the Network: the Add to Network button (since Oct 29, 2026)
// Sittings started from the demo itself rather than from a link are the team
// showing the flow, so they are left out.

import { advisorAdventures } from './advisorFlow'
import { journeyProgress, journeyStates, type Answers } from './advisorAnswers'
import { listAdded, listEntries, listInvites, type Entry, type Trouble } from './advisorDirectory'
import { funnelSteps, type FunnelStep } from './activation'

/** The day the steps the directory didn't hold before began to be recorded. */
export const COLLECTING_SINCE = '2026-10-29'

export interface CandidateFunnel {
  /** The first invite's day: how far back the funnel reaches. */
  since: string | null
  invited: number
  opened: number
  started: number
  finished: number
  added: number
  /** Links opened from an activation toolkit template (its UTM tags). */
  fromToolkit: number
  steps: FunnelStep[]
  /** The step that loses the most people. Added to the Network is left out:
      it has only been recorded since Oct 29, 2026. */
  biggestLoss: FunnelStep | null
  /** Advisors who started and didn't finish, by where they stopped: the name
      screen, or the adventure still open. */
  stopped: { where: string; count: number }[]
  /** Sittings started from the demo rather than a link — left out. */
  unlinked: number
  trouble: Trouble
}

/** A sitting is finished once every adventure has been taken to its end, as the
    journey counts it, or every question has an answer. */
function isFinished(e: Entry): boolean {
  if (e.total > 0 && e.answered >= e.total) return true
  try {
    const p = journeyProgress(e.answers as Answers)
    return p.done >= p.required
  } catch {
    return false
  }
}

/** The screen before the adventures, where an advisor gives their name (its title). */
const IDENTITY = 'A little about you'

/** The adventure an unfinished sitting stopped in: the first one still open. */
function stoppedIn(e: Entry): string {
  try {
    return journeyStates(e.answers as Answers).find((r) => r.state !== 'done')?.title ?? advisorAdventures[0].title
  } catch {
    return advisorAdventures[0].title
  }
}

export async function loadCandidateFunnel(): Promise<CandidateFunnel> {
  const [inv, ent, add] = await Promise.all([listInvites(), listEntries(), listAdded()])
  const invites = inv.values
  const added = new Set(add.values.map((a) => a.id))
  const byToken = new Map<string, Entry[]>()
  for (const e of ent.values) {
    if (!e.token) continue
    byToken.set(e.token, [...(byToken.get(e.token) ?? []), e])
  }

  let opened = 0
  let started = 0
  let finished = 0
  let addedCount = 0
  let fromToolkit = 0
  const stops = new Map<string, number>()
  for (const i of invites) {
    /* Starting counts from the first thing they give, their name included;
       a sitting with no question answered stopped on the name screen. */
    const sittings = (byToken.get(i.token) ?? []).filter((e) => e.answered > 0)
    const didStart = !!i.answeredAt || sittings.length > 0
    const didFinish = sittings.some(isFinished)
    if (i.openedAt || didStart) opened++
    if (didStart) started++
    if (didFinish) finished++
    if (sittings.some((e) => added.has(e.id))) addedCount++
    if (i.openedVia?.source === 'knomee-toolkit') fromToolkit++
    if (didStart && !didFinish) {
      const where = sittings.length
        ? stoppedIn(sittings.reduce((a, b) => (b.answered > a.answered ? b : a)))
        : IDENTITY
      stops.set(where, (stops.get(where) ?? 0) + 1)
    }
  }

  const steps = funnelSteps([
    { label: 'Sent a link', count: invites.length },
    { label: 'Opened the link', count: opened, lostLabel: 'never opened it' },
    { label: 'Started answering', count: started, lostLabel: 'opened, answered nothing' },
    { label: 'Finished the flow', count: finished, lostLabel: 'stopped partway' },
    { label: 'Added to Network', count: addedCount, lostLabel: 'finished, not added yet' },
  ])
  const measured = steps.slice(1, 4)
  const biggestLoss = measured.reduce<FunnelStep | null>(
    (a, b) => ((b.lost ?? 0) > (a?.lost ?? 0) ? b : a),
    null,
  )
  const since = invites.reduce<string | null>(
    (a, i) => (i.createdAt && (!a || i.createdAt < a) ? i.createdAt : a),
    null,
  )

  return {
    since,
    invited: invites.length,
    opened,
    started,
    finished,
    added: addedCount,
    fromToolkit,
    steps,
    biggestLoss,
    stopped: [IDENTITY, ...advisorAdventures.map((a) => a.title)].map((where) => ({
      where,
      count: stops.get(where) ?? 0,
    })),
    unlinked: ent.values.filter((e) => !e.token && e.answered > 0).length,
    trouble: inv.trouble ?? ent.trouble ?? add.trouble,
  }
}
