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
// - joined: Mark as Joined on Candidates, with the AUM if known (since Oct 29, 2026)
// Sittings started from the demo itself rather than from a link are the team
// showing the flow, so they are left out.

import { advisorAdventures } from './advisorFlow'
import { initials, journeyProgress, journeyStates, type Answers } from './advisorAnswers'
import { listEntries, listInvites, listJoined, type Entry, type Trouble } from './advisorDirectory'
import { funnelSteps, type FunnelStep } from './activation'

/** The day the steps the directory didn't hold before began to be recorded. */
export const COLLECTING_SINCE = '2026-10-29'

/* The firm's recruiting before Knomee: the Recruit Toolkit's Baseline section,
   entered at onboarding (ACME's numbers, from firms/acme.json in
   activation-playbook). The same three numbers the ROI card measures. */
export const recruitBaseline = {
  joinedRate: 0.15, // first conversation to joined
  daysToDecision: 150, // first conversation to joined
  aumPerAdvisor: 250, // $M per joined advisor
}

/** One advisor marked as joined, and the path that brought them. Initials
    only: the page names nobody. */
export interface JoinedAdvisor {
  key: string
  who: string
  /** The toolkit template the link was copied from, if it carried one. */
  template: string | null
  sent: string
  opened: string | null
  /** When their finished sitting was last written. */
  finished: string | null
  joined: string
  aum: number | null
  days: number
}

/** What Knomee brought, against the baseline. Null where nothing is counted yet. */
export interface CandidateRoi {
  /** Advisors who finished the flow since joining began to be recorded: the
      ones a joined rate can fairly be read against. */
  finishedSince: number
  joinedRate: number | null
  daysToDecision: number | null
  aumPerAdvisor: number | null
  /** AUM entered, plus your average for each advisor joined without it ($M). */
  aumTotal: number
  expectedAtBaseline: number
  extraJoined: number | null
}

export interface CandidateFunnel {
  /** The first invite's day: how far back the funnel reaches. */
  since: string | null
  invited: number
  opened: number
  started: number
  finished: number
  joined: number
  /** The AUM entered when they were joined, in $M, and how many it covers. */
  joinedAum: number
  joinedWithAum: number
  /** Links opened from an activation toolkit template (its UTM tags). */
  fromToolkit: number
  steps: FunnelStep[]
  /** The step that loses the most people. Joined is left out: it has only
      been recorded since Oct 29, 2026. */
  biggestLoss: FunnelStep | null
  /** Advisors who started and didn't finish, by where they stopped: the name
      screen, or the adventure still open. */
  stopped: { where: string; count: number }[]
  /** Sittings started from the demo rather than a link — left out. */
  unlinked: number
  joinedAdvisors: JoinedAdvisor[]
  roi: CandidateRoi
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
  const [inv, ent, sig] = await Promise.all([listInvites(), listEntries(), listJoined()])
  const invites = inv.values
  const joinedBy = new Map(sig.values.map((v) => [v.id, v]))
  const byToken = new Map<string, Entry[]>()
  for (const e of ent.values) {
    if (!e.token) continue
    byToken.set(e.token, [...(byToken.get(e.token) ?? []), e])
  }

  let opened = 0
  let started = 0
  let finished = 0
  let joined = 0
  let joinedAum = 0
  let joinedWithAum = 0
  let fromToolkit = 0
  let finishedSince = 0
  /* Of those, the ones joined: the rate's own numerator, so an advisor who
     finished before joining was recorded can't push it past 100%. */
  let joinedOfSince = 0
  const joinedAdvisors: JoinedAdvisor[] = []
  const stops = new Map<string, number>()
  const days = (from: string, to: string) => Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 864e5))
  for (const i of invites) {
    /* Starting counts from the first thing they give, their name included;
       a sitting with no question answered stopped on the name screen. */
    const sittings = (byToken.get(i.token) ?? []).filter((e) => e.answered > 0)
    const didStart = !!i.answeredAt || sittings.length > 0
    const done = sittings.find(isFinished)
    const didFinish = !!done
    if (i.openedAt || didStart) opened++
    if (didStart) started++
    if (didFinish) finished++
    const finishedLately = !!done && done.at >= COLLECTING_SINCE
    if (finishedLately) finishedSince++
    const mark = sittings.map((e) => joinedBy.get(e.id)).find(Boolean)
    if (mark) {
      joined++
      if (finishedLately) joinedOfSince++
      if (mark.aum) {
        joinedAum += mark.aum
        joinedWithAum++
      }
      const furthest = sittings.reduce((a, b) => (b.answered > a.answered ? b : a))
      joinedAdvisors.push({
        key: mark.id,
        who: initials(furthest.name || i.name) || 'Advisor',
        template: i.openedVia?.source === 'knomee-toolkit' ? (i.openedVia.content ?? null) : null,
        sent: i.createdAt,
        opened: i.openedAt,
        finished: done?.at ?? null,
        joined: mark.at,
        aum: mark.aum,
        days: days(i.createdAt, mark.at),
      })
    }
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
    { label: 'Joined', count: joined, lostLabel: 'finished, not joined yet' },
  ])
  const measured = steps.slice(1, 4)
  const biggestLoss = measured.reduce<FunnelStep | null>(
    (a, b) => ((b.lost ?? 0) > (a?.lost ?? 0) ? b : a),
    null,
  )
  const expectedAtBaseline = Math.round(finishedSince * recruitBaseline.joinedRate)
  const roi: CandidateRoi = {
    finishedSince,
    joinedRate: joinedOfSince && finishedSince ? joinedOfSince / finishedSince : null,
    daysToDecision: joined ? Math.round(joinedAdvisors.reduce((a, s) => a + s.days, 0) / joined) : null,
    aumPerAdvisor: joinedWithAum ? joinedAum / joinedWithAum : null,
    aumTotal: joinedAum + (joined - joinedWithAum) * recruitBaseline.aumPerAdvisor,
    expectedAtBaseline,
    extraJoined: joinedOfSince ? joinedOfSince - expectedAtBaseline : null,
  }
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
    joined,
    joinedAum,
    joinedWithAum,
    fromToolkit,
    steps,
    biggestLoss,
    stopped: [IDENTITY, ...advisorAdventures.map((a) => a.title)].map((where) => ({
      where,
      count: stops.get(where) ?? 0,
    })),
    unlinked: ent.values.filter((e) => !e.token && e.answered > 0).length,
    joinedAdvisors: joinedAdvisors.sort((a, b) => (a.joined < b.joined ? 1 : -1)),
    roi,
    trouble: inv.trouble ?? ent.trouble ?? sig.trouble,
  }
}
