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
  profileOwner as MARCUS,
  statsOf,
  type Candidate,
  type Tier,
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
    action: 'Answer the valuation and succession questions, not the build-your-own-firm ones.',
    why: 'Pitching a firm they never intended to build is the most expensive mistake available: a quarter of rep time answering a question they did not ask.',
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
  avgRQ: number
  avgAUM: number
  /** The apprehension the most members named, and how many. */
  apprehension: { label: string; count: number; share: number }
  signed: number
  /** Conversion, or null when nobody has signed from the cluster yet. */
  conv: number | null
  /** True when the denominator is too small for the rate to be evidence. */
  thin: boolean
}

/* Scores are whole numbers wherever they are shown — averages included. */
const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)

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

/** The clusters among the given rows. My Candidates passes the pipeline it
    shows, so every count on its cards is a count of rows in its table. */
export function clustersOf(rows: Candidate[]): Cluster[] {
  const scored = rows.filter((c) => c.kq !== null).length
  return COPY.map((copy) => {
    const members = rows.filter((c) => clusterOf(c) === copy.key)
    const signed = members.filter((m) => m.progress === 'signed').length
    return {
      ...copy,
      members,
      size: members.length,
      share: scored ? Math.round((members.length / scored) * 100) : 0,
      avgRQ: mean(members.map((m) => m.kq as number)),
      avgAUM: Math.round(members.reduce((a, m) => a + m.aum, 0) / (members.length || 1)),
      apprehension: modeApprehension(members),
      signed,
      conv: members.length ? Math.round((signed / members.length) * 100) : null,
      thin: members.length <= MIN_SAMPLE,
    }
  }).sort((a, b) => a.n - b.n)
}

export const clusters: Cluster[] = clustersOf(candidates)

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

/* ── Actionable Insights ─────────────────────────────────────────────────
   My Candidates carries the same Actionable Insights card the advisor's My
   Prospects does: who the pipeline is made of, who to talk to this week, then
   the numbered reasoning behind it. These are the firm's versions of the
   reach strip, `talkTo` and `insights`, each a function of the rows the page
   shows, so they read the pipeline in the table and not an invented one. */

/** "Who you're reaching": the clusters among the rows, largest first. One
    advisor on their own is not a group, so a cluster needs two. */
export function reachOf(rows: Candidate[]): { name: string; count: number }[] {
  return clustersOf(rows)
    .filter((c) => c.size >= 2)
    .sort((a, b) => b.size - a.size || a.n - b.n)
    .map((c) => ({ name: c.name, count: c.size }))
}

/** A row's identity. Names repeat in a live pipeline (an unnamed sitting is
    "Advisor"), so a live sitting is told apart by its entry. */
export const rowId = (c: Candidate) => ('entryId' in c ? String(c.entryId) : c.name)

export interface FirmTalkTo {
  /** The row it reads (rowId). */
  id: string
  name: string
  tier: string
  kq: number
  /** The firm's equivalent of a segment: which cluster they landed in. */
  niche: string
  /** What they said, in their own answers. */
  said: string[]
}

const TIER_LABEL: Record<string, string> = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3',
}

const STAGE_CHIP: Record<string, string> = {
  'Pre-contemplation': 'Not thinking about it',
  Contemplation: 'Thought about it, no steps taken',
  Preparation: 'Knows the steps, starting',
  Action: 'Taking action now',
  Maintenance: 'Made changes, staying on track',
}

const SEAT_CHIP: Record<string, string> = {
  'G2 not aligned': 'The junior advisors are not aligned yet',
  Spouse: 'Spouse has a say',
  Partner: 'A business partner has a say',
  Aligned: 'Team already aligned',
  'Nobody but me': 'Nobody else has a say',
}

const money = (m: number) => (m >= 1000 ? `$${(m / 1000).toFixed(1)}B` : `$${m}M`)

function chips(c: Candidate): string[] {
  /* A live sitting holds only what the flow asked. The fields it did not ask
     are neutral fallbacks (liveCandidates.ts), and a chip must not read one
     back as if they had said it. */
  if ('entryId' in c)
    return [STAGE_CHIP[c.stage ?? ''] ?? '', c.aum ? `${money(c.aum)} book` : '', c.topAction].filter(
      Boolean,
    )
  return [
    c.change,
    STAGE_CHIP[c.stage ?? ''] ?? '',
    `Blocked on ${c.apprehension.toLowerCase()}`,
    SEAT_CHIP[c.secondSeat] ?? '',
    `${money(c.aum)} · team of ${c.team}`,
  ].filter(Boolean)
}

/* Marcus is the one candidate whose answers we hold verbatim, so his chips are
   his own words rather than a summary of his fields. */
const MARCUS_CHIPS = [
  'Wants ownership, control, his team’s future',
  '“Do the clients come with me”',
  'Two junior advisors moving with him, waiting on equity',
  'Asked for a platform partner outright',
  'Moving within 12 months, steps already taken',
]

const kqOf = (c: Candidate) => c.kq ?? 0
const aumOf = (c: Candidate) => c.aum

/** Who to talk to this week: the strongest of the groups whose next action is
    a conversation, plus the biggest books among the advisors who want it and
    have not started. The three clusters whose action is NOT a call this week
    (unclear, succession, no-fit) are deliberately absent. */
export function talkToOf(rows: Candidate[]): FirmTalkTo[] {
  const cls = clustersOf(rows)
  const topOf = (key: ClusterKey, by: (c: Candidate) => number, n: number) =>
    [...(cls.find((c) => c.key === key)?.members ?? [])].sort((a, b) => by(b) - by(a)).slice(0, n)
  const flagged: Candidate[] = [
    ...topOf('ready-blocked', kqOf, 2),
    ...topOf('team-blocked', kqOf, 1),
    ...topOf('wants-waiting', aumOf, 3),
  ]
  /* Marcus is on the list whatever his score, and he leads it. He is the
     worked example whose report the demo walks through, and in a demo the
     first row is the row somebody clicks. Everyone behind him is still
     ordered by score. */
  const marcus = rows.find((c) => c.name === MARCUS && c.kq !== null)
  const withMarcus = marcus && !flagged.some((c) => c.name === MARCUS) ? [marcus, ...flagged] : flagged
  return withMarcus
    .filter((c, i, xs) => xs.indexOf(c) === i)
    .map((c) => ({
      id: rowId(c),
      name: c.name,
      tier: TIER_LABEL[c.tier] ?? 'Tier 2',
      kq: c.kq as number,
      niche: cls.find((cl) => cl.key === clusterOf(c))?.name ?? '',
      said: c.name === MARCUS ? MARCUS_CHIPS : chips(c),
    }))
    .sort((a, b) => (a.name === MARCUS ? -1 : b.name === MARCUS ? 1 : b.kq - a.kq))
}

export interface Insight {
  n: number
  title: string
  body: string
  /** The tier whose "why" this card is, when the tier bar is focused. */
  tier?: Exclude<Tier, 'incomplete'>
}

/** The numbered reasoning, over the given rows. A card whose group is empty
    is left out rather than saying "0", and a conversion rate is said only
    where enough people have signed for it to be evidence. Every body opens
    with a sentence that stands on its own: the dashboard peeks at a tier's
    card by it. */
export function insightsOf(rows: Candidate[]): Insight[] {
  const st = statsOf(rows)
  const S = st.scored
  if (!S) return []
  const share = (n: number) => Math.round((n / S) * 100)
  const of = (n: number) => `${n} of ${S} scored candidate${S === 1 ? '' : 's'}`
  const be = (n: number) => (n === 1 ? 'is' : 'are')
  const Be = (n: number) => (n === 1 ? 'Is' : 'Are')
  const { tier1: t1, tier2: t2, tier3: t3 } = st.byTier
  const cls = clustersOf(rows)
  const cl = (key: ClusterKey) => cls.find((c) => c.key === key)!
  const ready = cl('ready-blocked')
  const waiting = cl('wants-waiting')
  const succession = cl('succession')
  const team = cl('team-blocked')
  const unclear = cl('unclear')
  const noFit = cl('no-fit')
  const biggest = [...cls].sort((a, b) => b.size - a.size)[0]
  const converts = (c: Cluster) => (!c.thin && c.signed > 0 ? `, converting at ${c.conv}%` : '')
  const dims: [string, number][] = [
    ['Intent', st.avgIntent],
    ['Clarity', st.avgClarity],
    ['Receptivity', st.avgReceptivity],
  ]
  const softest = [...dims].sort((a, b) => a[1] - b[1])[0]
  const inTier = (c: Cluster, tier: Tier) => c.members.filter((m) => m.tier === tier).length
  const readyT1 = inTier(ready, 'tier1')
  const unclearT2 = inTier(unclear, 'tier2')

  const cards: (Omit<Insight, 'n'> | null)[] = [
    {
      tier: 'tier1',
      title: `${share(t1)}% Actionable Now`,
      body: t1
        ? `${of(t1)} ${be(t1)} in Tier 1 (RQ 70–100).${
            readyT1
              ? ` ${readyT1} of them ${be(readyT1)} “${ready.name.toLowerCase()}”: high intent, high clarity, one blocker left${converts(ready)}.`
              : ''
          } Answer that blocker with evidence and book the meeting; this is where the quarter is won.`
        : `None of the ${S} scored candidates is in Tier 1 yet. When someone gets there, answer their one blocker with evidence and book the meeting.`,
    },
    st.avgClarity === st.avgIntent
      ? null
      : st.avgClarity > st.avgIntent
        ? {
            title: 'Intent Is the Gap, Not Interest',
            body: `Pipeline avg Clarity is ${st.avgClarity} against avg Intent of ${st.avgIntent}. Advisors can describe the firm they want long before they take a step toward it, so the pipeline’s problem is movement rather than appetite. Sell the transition, not the destination.`,
          }
        : {
            title: 'Clarity Is the Gap, Not Will',
            body: `Pipeline avg Intent is ${st.avgIntent} against avg Clarity of ${st.avgClarity}. These advisors are ready to move before they can say what they are moving to, so the first conversation is about the firm they want, not the timeline.`,
          },
    {
      title: `${softest[0]} Is the Softest Dimension`,
      body: `Avg ${softest[0]} is ${softest[1]}, the lowest of the three. The work is not explaining the platform better; it is turning a standing preference into a dated decision with a named first step.`,
    },
    waiting.size
      ? {
          title: `${waiting.size} ${waiting.size === 1 ? 'Wants It and Hasn’t' : 'Want It and Haven’t'} Started`,
          body: `${waiting === biggest ? 'The largest group' : 'A group'} at ${waiting.share}% of the pipeline, avg RQ ${waiting.avgRQ}${converts(waiting)}.${
            waiting.apprehension.label !== 'Nothing named'
              ? ` ${waiting.apprehension.count} of ${waiting.size} name ${waiting.apprehension.label.toLowerCase()} as the blocker.`
              : ''
          } ${waiting.action} These are lost to inertia, not to a competitor.`,
        }
      : null,
    succession.size
      ? {
          title: `${succession.size} ${Be(succession.size)} Succession-Shaped, Not Independence-Shaped`,
          body: `Future You says winding down or an exit, or the named change is a sale or a successor. ${succession.action} Pitching a firm they never intended to build is the most expensive mistake available: a quarter of rep time answering a question they did not ask.`,
        }
      : null,
    team.size
      ? {
          title: `${team.size} ${Be(team.size)} Blocked on the Second Seat`,
          body: `Their own readiness is high, avg RQ ${team.avgRQ}, and the G2 advisors are not aligned. ${team.action} The blocker is a conversation the advisor has not had yet, usually because they cannot answer it.`,
        }
      : null,
    {
      tier: 'tier2',
      title: !t2
        ? 'Nobody Is Waiting in Tier 2'
        : t2 >= t1 && t2 >= t3
          ? 'Tier 2 Is the Biggest Opportunity Pool'
          : 'Tier 2 Needs a Clear Next Step',
      body: t2
        ? `${of(t2)} (${share(t2)}%) ${be(t2)} in Tier 2${t2 >= t1 && t2 >= t3 ? ', the largest tier' : ''}.${
            unclearT2
              ? ` ${unclearT2} of them ${be(unclearT2)} “${unclear.name.toLowerCase()}”: something is wrong and they cannot say what independence would fix. ${unclear.action} Pitching that group wastes the meeting, and they can tell.`
              : ' They need a dated next step, not another pitch.'
          }`
        : `None of the ${S} scored candidates is in Tier 2 right now. Everyone is either ready to talk or still early.`,
    },
    {
      tier: 'tier3',
      title: t3 ? 'Tier 3 Should Stay in a Low-Touch Nurture Track' : 'Nobody Needs the Nurture Track Yet',
      body: t3
        ? `${of(t3)} (${share(t3)}%) ${t3 === 1 ? 'falls' : 'fall'} in Tier 3.${
            noFit.size
              ? ` ${noFit.size} ${noFit.size === 1 ? 'advisor' : 'advisors'} chose “change nothing, but fix the parts that don’t work”. ${noFit.action} The instrument has to be able to reach this conclusion, or the whole thing reads as a funnel.`
              : ' Keep them on education and periodic check-ins rather than rep time.'
          }`
        : `None of the ${S} scored candidates is in Tier 3 right now. Nobody needs the low-touch track yet.`,
    },
  ]
  return cards
    .filter((c): c is Omit<Insight, 'n'> => c !== null)
    .map((c, i) => ({ ...c, n: i + 1 }))
}
