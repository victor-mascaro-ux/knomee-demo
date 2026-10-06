// Actionable Insights for the client book: who the advisor is serving, who to
// talk to this week, and the reasoning behind both, read the same way as the
// prospect book's (prospectSegments.ts, insights.ts).
//
// A client's segment is a prospect's: Model B's Purpose × Posture crossed with
// Model C's Vision × Readiness, by the same rules. Client rows carry a
// relationship score and a mood rather than answers, so each scored client's
// answers are drawn here from their own row, as the generated prospect book's
// are: Clarity and Intent around their KR, the Confidence sliders around how
// they feel (their sentiment), and Joy picks leaning the way Clarity and Intent
// lean. The draws are seeded by name, so a client keeps theirs whatever else is
// in the book. Anyone with a built-out profile ranks Joy in their own words,
// and a prospect converted this session brings the answers they gave as one.
// No row is handed a segment: the labels come out of the rules.

import { baseClients, type Client, type ClientTier } from './clients'
import { drawJoy, JOY_LEAN, mulberry32, prospects } from './prospects'
import {
  answeredChips,
  crossedSegment,
  quadrantCuts,
  topSegments,
  type ProspectSegment,
  type SegmentCount,
} from './prospectSegments'
import { hasProfile, profileFor } from './memberProfiles'
import { segModels } from './segmentation'

type ScoredTier = Exclude<ClientTier, 'incomplete'>

interface Answers {
  clarity: number
  intent: number
  joy: string[]
  confidence: number[]
}

const clamp = (n: number) => Math.max(1, Math.min(100, Math.round(n)))

/* FNV-1a over the name: a seed of its own for every client. */
const seedOf = (name: string) => {
  let h = 0x811c9dc5
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x01000193) >>> 0
  return h
}

/* The prospect book's spread: Clarity and Intent each sit within 8 of the
   score, and trade up to 18 points between them, so the quadrants do not
   collapse onto the diagonal. */
const TILT = 18
const LEAN_GAP = 4

function answersOf(c: Client): Answers {
  const converted = !baseClients.some((b) => b.name === c.name)
  const asProspect = converted ? prospects.find((p) => p.name === c.name && p.kq !== null) : undefined
  if (asProspect)
    return {
      clarity: asProspect.clarity as number,
      intent: asProspect.intent as number,
      joy: asProspect.joy ?? [],
      confidence: asProspect.confidence ?? [],
    }
  const rand = mulberry32(seedOf(c.name))
  const kr = c.kr ?? 50
  const tilt = (rand() * 2 - 1) * TILT
  const clarity = clamp(kr + (rand() - 0.5) * 16 + tilt)
  const intent = clamp(kr + (rand() - 0.5) * 16 - tilt)
  const lean =
    c.tier === 'reconnect'
      ? JOY_LEAN.nurture
      : clarity - intent >= LEAN_GAP
        ? JOY_LEAN.vision
        : intent - clarity >= LEAN_GAP
          ? JOY_LEAN.action
          : JOY_LEAN.even
  const drawn = drawJoy(rand, lean)
  const own = hasProfile(c.name) ? profileFor(c.name).financialJoy.chips : undefined
  /* Sentiment 5 centres on 90 (Assured), 4 on 74 and 3 on 58 (Working on
     it), 2 and 1 below the Uneasy line. */
  const centre = 10 + 16 * (c.sentiment ?? 3) + (rand() * 2 - 1) * 6
  const confidence = Array.from({ length: 6 }, () => clamp(centre + (rand() * 2 - 1) * 9))
  return { clarity, intent, joy: own?.length ? [...own] : drawn, confidence }
}

interface Reading {
  c: Client
  a: Answers
  seg: ProspectSegment
}

/* Every scored client with their segment, read against their own book. */
function readingsOf(rows: Client[]): Reading[] {
  const scored = rows
    .filter((c) => c.tier !== 'incomplete' && c.kr != null)
    .map((c) => ({ c, a: answersOf(c) }))
  const cuts = quadrantCuts(scored.map(({ c, a }) => ({ kq: c.kr ?? null, clarity: a.clarity, intent: a.intent })))
  return scored.map(({ c, a }) => ({ c, a, seg: crossedSegment(a.joy, a.confidence, a, cuts) }))
}

/* ── Who to talk to this week ────────────────────────────────────────────────
   The relationships most at risk, worst first: a cooling tier, a sentiment
   caution, a low mood. The worst three in Reconnect, two in Attention and one
   in Engaged, so focusing any tier still names somebody, plus anyone else at
   risk who has a built-out profile, so the list always has a name that opens.
   Every chip is read off their row: what they want money for and how they
   feel about it, then why they are on the list. */

const PER_TIER: Record<ScoredTier, number> = { reconnect: 3, attention: 2, engaged: 1 }

function severity(c: Client): number {
  let s = 0
  if (c.tier === 'reconnect') s += 4
  else if (c.tier === 'attention') s += 2
  if (c.warn) s += 2
  if (c.sentiment !== null && c.sentiment <= 2) s += 2
  return s
}

function reasons(c: Client): string[] {
  return [
    c.tier === 'reconnect'
      ? 'In Reconnect, engagement has cooled'
      : c.tier === 'attention'
        ? 'Sliding toward Reconnect'
        : '',
    c.sentiment !== null && c.sentiment <= 2
      ? `Low sentiment, ${c.sentiment}/5`
      : c.warn
        ? 'Sentiment flagged for a caution'
        : '',
    `Last signed in ${c.lastSignIn}`,
  ].filter(Boolean)
}

const TIER_LABEL: Record<ScoredTier, string> = {
  engaged: 'Tier 1',
  attention: 'Tier 2',
  reconnect: 'Tier 3',
}

export interface ClientTalkTo {
  name: string
  tier: string
  tierId: ScoredTier
  kr: number
  segment: string
  said: string[]
}

function talkOf(read: Reading[]): ClientTalkTo[] {
  const atRisk = read
    .filter(({ c }) => severity(c) > 0)
    .sort(
      (x, y) =>
        severity(y.c) - severity(x.c) || (x.c.kr ?? 0) - (y.c.kr ?? 0) || x.c.name.localeCompare(y.c.name),
    )
  const taken = new Map<ScoredTier, number>()
  return atRisk
    .filter(({ c }) => {
      const t = c.tier as ScoredTier
      const n = taken.get(t) ?? 0
      if (n >= PER_TIER[t] && !hasProfile(c.name)) return false
      taken.set(t, n + 1)
      return true
    })
    .map(({ c, a, seg }) => ({
      name: c.name,
      tier: TIER_LABEL[c.tier as ScoredTier],
      tierId: c.tier as ScoredTier,
      kr: c.kr as number,
      segment: seg.name,
      said: [...answeredChips(a.joy, seg.posture), ...reasons(c)],
    }))
}

/* ── Why these numbers ───────────────────────────────────────────────────────
   Every body opens with a sentence that stands on its own: the dashboard
   peeks at a tier's card by it. */

export interface ClientInsight {
  n: number
  title: string
  body: string
  /** The tier whose "why" this card is, when the tier bar is focused. */
  tier?: ScoredTier
}

const quoted = (name: string) => `“${name}”`
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a')
const be = (n: number) => (n === 1 ? 'is' : 'are')
const listed = (xs: string[]) =>
  xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : (xs[0] ?? '')
/* Every segment level with the first. A tie is said as a tie. */
const leaders = (segs: SegmentCount[]) => segs.filter((s) => s.count === segs[0]?.count)

function insightsOf(rows: Client[], read: Reading[]): ClientInsight[] {
  const S = read.length
  if (!S) return []
  const pct = (n: number) => Math.round((n / S) * 100)
  const of = (n: number) => `${n} of ${S} scored client${S === 1 ? '' : 's'}`
  const inTier = (t: ScoredTier) => read.filter(({ c }) => c.tier === t)
  const e = inTier('engaged').length
  const at = inTier('attention').length
  const r = inTier('reconnect').length

  /* A tier's biggest group. One person on their own is not a group. */
  const tierLead = (t: ScoredTier, size: number) => {
    const top = leaders(topSegments(inTier(t)))
    const n = top[0]?.count ?? 0
    if (n < 2) return ''
    const names = listed(top.map((s) => quoted(s.name)))
    return top.length > 1
      ? ` The biggest groups among them, tied at ${n} of the ${size} each, are ${names}.`
      : ` The biggest group among them is ${names}, ${n} of the ${size}.`
  }

  const biggest = leaders(topSegments(read))
  const biggestBody = () => {
    const [first] = biggest
    const why = biggest.every((s) => s.family === first.family)
      ? segModels.B.segments.find((s) => s.name === first.family)?.blurb
      : undefined
    return [
      biggest.length > 1
        ? `${listed(biggest.map((s) => quoted(s.name)))} are tied for the largest group in the book, ${first.count} of the ${S} scored clients each.`
        : `${of(first.count)} ${be(first.count)} ${quoted(first.name)}, the largest single group in the book.`,
      why ? `For ${article(first.family)} ${first.family}, ${lcFirst(why)}` : '',
      'Reviews and check-ins with this group land best when they start from that.',
    ]
      .filter(Boolean)
      .join(' ')
  }

  const warned = read.filter(({ c }) => c.warn).length
  const warnedIn = (t: ScoredTier) => inTier(t).filter(({ c }) => c.warn).length
  const low = inTier('reconnect').filter(({ c }) => c.sentiment !== null && c.sentiment <= 2).length
  const incomplete = rows.filter((c) => c.tier === 'incomplete')
  const pending = incomplete.filter((c) => c.status === 'pending').length
  const inc = incomplete.length

  const cards: (Omit<ClientInsight, 'n'> | null)[] = [
    {
      tier: 'engaged',
      title: `${pct(e)}% Engaged`,
      body: e
        ? `${of(e)} ${be(e)} Tier 1 · Engaged (KR 70–100).${tierLead('engaged', e)}${
            warnedIn('engaged')
              ? ` ${warnedIn('engaged')} of them ${warnedIn('engaged') === 1 ? 'carries' : 'carry'} a sentiment caution, worth a word at the next touchpoint.`
              : ''
          } Keep the cadence they are used to: an engaged client notices a missed check-in before anything else.`
        : `None of the ${S} scored clients is Tier 1 · Engaged right now. The first to get there sets the cadence the rest of the book is measured against.`,
    },
    biggest.length
      ? {
          title:
            biggest.length > 1
              ? `${biggest.length} Segments Tie for the Biggest`
              : `The Biggest Segment: ${biggest[0].name}`,
          body: biggestBody(),
        }
      : null,
    warned
      ? {
          title: `${warned} ${warned === 1 ? 'Carries' : 'Carry'} a Sentiment Caution`,
          body: `${of(warned)} ${warned === 1 ? 'carries' : 'carry'} a sentiment caution${
            warnedIn('attention') ? `, ${warnedIn('attention')} of them in Tier 2 · Attention` : ''
          }. A caution is the earliest sign a relationship is slipping: call before the next review, not at it.`,
        }
      : null,
    {
      tier: 'attention',
      title: at ? 'Tier 2 Needs a Check-In' : 'Nobody Is Drifting in Tier 2',
      body: at
        ? `${of(at)} (${pct(at)}%) ${be(at)} Tier 2 · Attention (KR 40–69): the relationship holds, but it is drifting.${tierLead('attention', at)} A short, specific check-in now costs less than winning them back from Tier 3.`
        : `None of the ${S} scored clients is in Tier 2 right now. Nobody is drifting toward Reconnect.`,
    },
    {
      tier: 'reconnect',
      title: r ? 'Tier 3 Needs a Personal Reconnect' : 'Nobody Needs Reconnecting',
      body: r
        ? `${of(r)} (${pct(r)}%) ${be(r)} Tier 3 · Reconnect (KR 0–39): engagement has cooled.${tierLead('reconnect', r)}${
            low ? ` ${low} of them rate${low === 1 ? 's' : ''} their sentiment 2/5 or lower.` : ''
          } Reach out personally, around one of their own goals or life events, rather than with another newsletter.`
        : `None of the ${S} scored clients is in Tier 3 right now. No relationship has cooled off.`,
    },
    inc
      ? {
          title: `${inc} ${inc === 1 ? 'Profile Is' : 'Profiles Are'} Still Incomplete`,
          body: `${inc} client${inc === 1 ? ' hasn’t' : 's haven’t'} finished their profile${
            pending ? `, ${pending} of them still on a pending invite` : ''
          }. Until they do there is no KR to read, so a nudge to finish onboarding is the whole next step.`,
        }
      : null,
  ]
  return cards
    .filter((c): c is Omit<ClientInsight, 'n'> => c !== null)
    .map((c, i) => ({ ...c, n: i + 1 }))
}

/** The Clients page's Actionable Insights, over the book it shows: converted
    prospects included, since they are rows in its table. */
export function clientReadings(rows: Client[]) {
  const read = readingsOf(rows)
  return {
    reach: topSegments(read)
      .filter((s) => s.count >= 2)
      .slice(0, 5)
      .map(({ name, count }) => ({ name, count })),
    talk: talkOf(read),
    insights: insightsOf(rows, read),
  }
}
