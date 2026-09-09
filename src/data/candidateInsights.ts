// Actionable Insights for the firm: the pipeline clustered by where each
// advisor is in the decision, not by how big their book is.
//
// Segmenting advisors by AUM is something every recruiter already does.
// Segmenting them by where they stand — wants it but has not started, ready
// but blocked on one thing, succession-shaped rather than independence-shaped
// — is what nothing else can do, and each of those carries a different next
// action. A cluster that does not change what the rep does next is not here.
//
// Membership is DERIVED from the candidate rows by the rules below, and every
// figure on a card is computed from the members. Nothing in this file states a
// number that also appears in the table; they read the same array.

import {
  candidates,
  candidateStats,
  type Candidate,
} from './candidates'
import { MIN_SAMPLE } from './analytics'

export type ClusterKey =
  | 'ready-blocked'
  | 'wants-waiting'
  | 'unclear'
  | 'succession'
  | 'team-blocked'
  | 'no-fit'

/* ── the rules ──────────────────────────────────────────────────────────────
   Evaluated in order; the first match wins, so every advisor lands in exactly
   one cluster and the sizes add up. Order matters: someone who chose to change
   nothing is not a slow breakaway, and someone winding down is not a
   candidate for Connect however ready they look. */

const RULES: { key: ClusterKey; test: (c: Candidate) => boolean }[] = [
  {
    key: 'no-fit',
    test: (c) => c.change === 'Change nothing, but fix the parts that don’t work',
  },
  {
    key: 'succession',
    test: (c) =>
      c.vision === 'Winding down' ||
      c.vision === 'Exit' ||
      c.change === 'Sell or merge my book' ||
      c.change === 'Bring in a successor',
  },
  {
    // Their own intent clears the bar; the second seat does not.
    key: 'team-blocked',
    test: (c) => c.secondSeat === 'G2 not aligned' && (c.intent ?? 0) >= 55,
  },
  {
    key: 'ready-blocked',
    test: (c) => (c.intent ?? 0) >= 70 && (c.clarity ?? 0) >= 70,
  },
  {
    key: 'wants-waiting',
    test: (c) => (c.clarity ?? 0) >= 60 && (c.intent ?? 0) < 55,
  },
  {
    key: 'unclear',
    test: (c) => (c.clarity ?? 0) < 50,
  },
]

export function clusterOf(c: Candidate): ClusterKey | null {
  if (c.kq === null) return null
  return RULES.find((r) => r.test(c))?.key ?? null
}

/* ── what each cluster is for ───────────────────────────────────────────── */

interface Copy {
  key: ClusterKey
  n: number
  name: string
  /** The behaviour that defines it, in one line. */
  spine: string
  /** What the rep does about it. Different for every cluster, or the cluster
      would not be worth surfacing. */
  action: string
  /** Why that action and not the obvious one. */
  why: string
}

const COPY: Copy[] = [
  {
    key: 'ready-blocked',
    n: 1,
    name: 'Ready, blocked on one thing',
    spine: 'High intent and high clarity, with one dominant apprehension left standing.',
    action: 'Answer that one thing with evidence — this week, in writing.',
    why: 'Nothing else is missing. The highest-yield group in the pipeline, and the one where a vague reassurance costs the deal.',
  },
  {
    key: 'wants-waiting',
    n: 2,
    name: 'Wants it, hasn’t started',
    spine: 'High clarity, low intent — Contemplation. They can describe the firm they want and have taken no step toward it.',
    action: 'Shorten the perceived transition: a dated timeline with names on it, not a pitch.',
    why: 'The largest group, and the one lost to inertia rather than to a competitor. What they are avoiding is the disruption, so the offer has to be about the disruption.',
  },
  {
    key: 'unclear',
    n: 3,
    name: 'Unhappy but unclear',
    spine: 'Low clarity, moderate intent. Something is wrong and they cannot say what independence would fix.',
    action: 'A diagnostic conversation, not a platform conversation.',
    why: 'Pitching this group wastes the meeting — and they can tell. Find the actual complaint first; some of them do not have an independence problem at all.',
  },
  {
    key: 'succession',
    n: 4,
    name: 'Succession-shaped, not independence-shaped',
    spine: 'Future You is winding down or out of the business, or the named change is a sale or a successor.',
    action: 'Route to the investment bank and Optima, not to Connect.',
    why: 'Sending these to Connect is the most expensive routing error available: a quarter of rep time on a firm they never intended to build.',
  },
  {
    key: 'team-blocked',
    n: 5,
    name: 'Team-blocked',
    spine: 'Their own readiness is high. The second seat — the G2 advisors — is not aligned.',
    action: 'Bring the G2 equity answer to the first meeting.',
    why: 'The blocker is a conversation the advisor has not had yet, usually because they cannot answer it. Answering it for them is the whole intervention.',
  },
  {
    key: 'no-fit',
    n: 6,
    name: 'Not a fit, or not this year',
    spine: 'Chose “change nothing, but fix the parts that don’t work”.',
    action: 'Low-touch nurture, and say so plainly on the internal note.',
    why: 'The instrument has to be able to reach this conclusion. A pipeline where nobody is a no is a funnel, not an assessment — and advisors are marketed to often enough to notice the difference.',
  },
]

/* ── the derived cluster ────────────────────────────────────────────────── */

export interface Cluster extends Copy {
  members: Candidate[]
  size: number
  /** Share of the scored pipeline. */
  share: number
  avgKQ: number
  avgAUM: number
  /** The apprehension the most members named, and how many. */
  apprehension: { label: string; count: number; share: number }
  signed: number
  /** Conversion, or null when nobody has signed from the cluster yet. */
  conv: number | null
  /** True when the denominator is too small for the rate to be evidence. */
  thin: boolean
}

const round1 = (n: number) => Math.round(n * 10) / 10
const mean = (xs: number[]) => (xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)

function modeApprehension(members: Candidate[]) {
  const counts = new Map<string, number>()
  for (const m of members) counts.set(m.apprehension, (counts.get(m.apprehension) ?? 0) + 1)
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['Nothing named', 0]
  return {
    label: top[0],
    count: top[1],
    share: members.length ? Math.round((top[1] / members.length) * 100) : 0,
  }
}

export const clusters: Cluster[] = COPY.map((copy) => {
  const members = candidates.filter((c) => clusterOf(c) === copy.key)
  const signed = members.filter((m) => m.progress === 'signed').length
  return {
    ...copy,
    members,
    size: members.length,
    share: Math.round((members.length / candidateStats.scored) * 100),
    avgKQ: mean(members.map((m) => m.kq as number)),
    avgAUM: Math.round(members.reduce((a, m) => a + m.aum, 0) / (members.length || 1)),
    apprehension: modeApprehension(members),
    signed,
    conv: members.length ? Math.round((signed / members.length) * 100) : null,
    thin: members.length <= MIN_SAMPLE,
  }
}).sort((a, b) => a.n - b.n)

/** Scored advisors no rule claimed. Shown rather than swallowed — if this is
    ever large, the rules are wrong. */
export const unclustered = candidates.filter((c) => c.kq !== null && clusterOf(c) === null)

export { MIN_SAMPLE }

/* ── the one line above the cluster grid ────────────────────────────────── */

const largest = [...clusters].sort((a, b) => b.size - a.size)[0]
const best = [...clusters]
  .filter((c) => !c.thin && c.conv !== null)
  .sort((a, b) => (b.conv as number) - (a.conv as number))[0]

export const clusterLead = `${largest.size} of ${candidateStats.scored} advisors — the largest group in the pipeline — can describe the firm they want and have taken no step toward it.${
  best ? ` The group that actually converts is “${best.name}”: ${best.signed} of ${best.size}.` : ''
} Two different conversations, and today they get the same one.`
