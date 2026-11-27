// My Prospects' Actionable Insights: the prospects as a GROUP. Each person's
// reading and next step is the table's job; this answers what only the whole
// book can: how the advisor's invitations are doing, who they are reaching,
// and how that compares with everyone on Knomee.
//
// Nothing here repeats Top Line Metrics (KQ, the count, the tier split) or a
// table column (KQ, Intent, Clarity, Receptivity, Top Action). Every number is
// computed from the prospect rows and their own answers, never typed, so the
// sentences stay true when the rows change. The only typed figures are the two
// link counts below, which Knomee cannot read off a row; the Knomee-wide
// figures are read from evidence.ts and analytics.ts, never retyped.
//
// Copy is kept short on purpose: a bold finding and a few words of action.
// Anything a bar or a number already shows is not said again in a sentence.

import { prospects, type Prospect } from './prospects'
import { modelClusters, outcomes } from './analytics'
import { evidence, evidenceMeta } from './evidence'
import { posture, purposeFamily, type Posture, type PurposeFamily } from './prospectSegments'

/* ── How your invitations are doing ──────────────────────────────────────────
   Clicked your link → Started an Adventure → Completed → Converted.

   Nobody has a row until they leave an email, so a click and a start are link
   counts, not rows: placeholders until the link's own tracking is live. Every
   unfinished row in the table started, so `started` has to cover them.
   Completed is everyone with a KQ still in the table plus everyone already
   converted, and converted is the same 12 Prospect Analytics reports, plus
   whoever the advisor converts this session. */
export const linkActivity = { clicked: 68, started: 54 }

export type StepKey = 'clicked' | 'started' | 'completed' | 'converted'

export interface FunnelStep {
  key: StepKey
  label: string
  count: number
  /** Share of the step before it, as a whole percent; none on the first. */
  rate?: number
  /** "of clicks", "of starters", "of completers". */
  of?: string
}

export interface Leak {
  /** The step that loses the people. */
  at: StepKey
  lost: number
  headline: string
  action: string
}

const pct = (k: number, n: number) => (n ? Math.round((k / n) * 100) : 0)

export function invitationFunnel(convertedNow = 0): { steps: FunnelStep[]; leak: Leak | null } {
  const scored = prospects.filter((p) => p.kq !== null).length
  const unfinished = prospects.filter((p) => p.kq === null).length
  const converted = outcomes.converted + convertedNow
  const completed = scored + outcomes.converted
  const started = Math.max(linkActivity.started, completed + unfinished)
  const clicked = Math.max(linkActivity.clicked, started)

  const steps: FunnelStep[] = [
    { key: 'clicked', label: 'Clicked your link', count: clicked },
    { key: 'started', label: 'Started Adventures', count: started, rate: pct(started, clicked), of: 'of clicks' },
    { key: 'completed', label: 'Completed Adventures', count: completed, rate: pct(completed, started), of: 'of starters' },
    { key: 'converted', label: 'Converted to Client', count: converted, rate: pct(converted, completed), of: 'of completers' },
  ]

  /* Only the two steps where people walk away can leak. Not converting yet is
     not a drop: those people are still in the table, still prospects. */
  const beforeStart = clicked - started
  const midway = started - completed
  let leak: Leak | null = null
  if (beforeStart > 0 && beforeStart / clicked >= midway / started) {
    leak = {
      at: 'started',
      lost: beforeStart,
      headline: `${beforeStart} opened your link but never started.`,
      action: 'Try a warmer invite.',
    }
  } else if (midway > 0) {
    leak = {
      at: 'completed',
      lost: midway,
      headline: `${midway} stopped part-way through.`,
      action: 'Nudge the Incomplete Profiles below.',
    }
  }
  return { steps, leak }
}

/* ── Who you're reaching ─────────────────────────────────────────────────────
   Only what Knomee asks: why money matters to them (Financial Joy) and how
   they feel about it (the Confidence adventure). Intent and Clarity are table
   columns, and KQ is built from them, so they are left out here. */

export type Tone = 'plum' | 'grape' | 'bolt' | 'ocean' | 'teal' | 'mist'

export interface SplitPart {
  count: number
  tone: Tone
  label: string
}

export interface Thread {
  key: 'joy' | 'posture' | 'advisor' | 'resilience'
  headline: string
  split: SplitPart[]
  /** The split in numbers. */
  detail: string
  action: string
}

export interface GroupProfile {
  size: number
  threads: Thread[]
}

/* What each Model B family wants money for, in the words a person would use. */
const WANTS: Record<Exclude<PurposeFamily, 'Unstated'>, string> = {
  Protector: 'security and family',
  Experiencer: 'enjoying life now',
  Liberator: 'freedom and choice',
  Contributor: 'giving back',
  Achiever: 'status and recognition',
}
const FAMILY_TONE: Record<Exclude<PurposeFamily, 'Unstated'>, Tone> = {
  Protector: 'plum',
  Experiencer: 'grape',
  Liberator: 'ocean',
  Achiever: 'bolt',
  Contributor: 'teal',
}

/* The Confidence adventure's sliders, in its order (prospects.ts). */
const GOALS = 2
const RESILIENCE = 1
const ADVISOR = 5
const LOW = 50
const HIGH = 70

/** "1 in 3", "Half", "2 in 3", "All", or a percent, whichever is true to
    within a few points; in a group under ten, the count itself ("4 of 5").
    `one` is set where the verb that follows is singular. */
function share(k: number, n: number): { text: string; one: boolean } {
  if (k === n) return { text: 'All', one: false }
  if (n < 10) return { text: `${k} of ${n}`, one: false }
  const r = k / n
  if (Math.abs(r - 0.5) <= 0.04) return { text: 'Half', one: false }
  for (const m of [3, 4, 5]) if (Math.abs(r - 1 / m) <= 0.03) return { text: `1 in ${m}`, one: true }
  if (Math.abs(r - 2 / 3) <= 0.03) return { text: '2 in 3', one: false }
  if (Math.abs(r - 3 / 4) <= 0.03) return { text: '3 in 4', one: false }
  return { text: `${Math.round(r * 100)}%`, one: false }
}

/* A part of a small group is said as a count, of a larger one as a percent. */
const part = (k: number, n: number) => (n < 10 ? `${k}` : `${pct(k, n)}%`)

/* The whole book, or one tier of it. Invitations go out before anyone has a
   tier, so advice about the invite is only given for the whole book; a tier
   gets advice for the conversation. */
type Scope = 'book' | 'tier'

const count = <T,>(xs: T[], f: (x: T) => boolean) => xs.filter(f).length
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
/* "14 uneasy · 20 still building", leaving out the empty parts. */
const counts = (parts: SplitPart[]) => parts.map((p) => `${p.count} ${p.label}`).join(' · ')

function joyThread(rows: Prospect[], scope: Scope): Thread | null {
  const fams = rows
    .map((p) => purposeFamily(p.joy))
    .filter((f): f is Exclude<PurposeFamily, 'Unstated'> => f !== 'Unstated')
  const n = fams.length
  if (!n) return null
  const ranked = (Object.keys(WANTS) as Exclude<PurposeFamily, 'Unstated'>[])
    .map((f) => ({ f, k: count(fams, (x) => x === f) }))
    .filter((x) => x.k > 0)
    .sort((a, b) => b.k - a.k)
  const [a, b] = ranked
  const twoCamps = !!b && a.k + b.k >= 0.6 * n && b.k >= 0.7 * a.k && a.k < 0.5 * n
  return {
    key: 'joy',
    headline:
      a.k === n
        ? `All want money for ${WANTS[a.f]}`
        : twoCamps
          ? `Two camps: ${WANTS[a.f]} vs. ${WANTS[b.f]}`
          : a.k >= 0.45 * n
            ? `${share(a.k, n).text} want money for ${WANTS[a.f]}`
            : `Led by ${WANTS[a.f]}, then ${WANTS[b.f]}`,
    split: ranked.map(({ f, k }) => ({ count: k, tone: FAMILY_TONE[f], label: WANTS[f] })),
    detail: ranked
      .slice(0, 3)
      .map(({ f, k }) => `${part(k, n)} ${WANTS[f]}`)
      .join(' · '),
    action:
      scope === 'book'
        ? twoCamps
          ? 'Write one invite per camp.'
          : `Lead your invite with ${WANTS[a.f]}.`
        : twoCamps
          ? 'Have an opener for each camp.'
          : `Talk about ${WANTS[a.f]} first.`,
  }
}

function postureThread(rows: Prospect[]): Thread | null {
  const ps = rows.map((p) => posture(p.confidence)).filter((x): x is Exclude<Posture, 'Unrated'> => x !== 'Unrated')
  const n = ps.length
  if (!n) return null
  const uneasy = count(ps, (x) => x === 'Uneasy')
  const building = count(ps, (x) => x === 'Working on it')
  const sure = count(ps, (x) => x === 'Assured')
  const notYet = uneasy + building
  const split = [
    { count: uneasy, tone: 'plum' as Tone, label: 'uneasy' },
    { count: building, tone: 'grape' as Tone, label: 'building' },
    { count: sure, tone: 'teal' as Tone, label: 'confident' },
  ].filter((s) => s.count > 0)
  return {
    key: 'posture',
    headline:
      uneasy === n
        ? `All ${n} are uneasy about money`
        : notYet === n
          ? 'None feel confident with money yet'
          : sure === n
            ? 'All feel confident with money'
            : uneasy === 0
              ? 'Nobody is uneasy about money'
              : `${share(notYet, n).text} aren’t confident with money yet`,
    split,
    detail: counts(split),
    action:
      uneasy * 2 >= n
        ? 'Educate before you pitch.'
        : notYet * 2 >= n && uneasy > 0
          ? 'Lead with stability, not growth.'
          : 'Skip reassurance; talk next steps.',
  }
}

function advisorThread(rows: Prospect[]): Thread | null {
  const xs = rows.map((p) => p.confidence?.[ADVISOR]).filter((v): v is number => typeof v === 'number')
  const n = xs.length
  if (!n) return null
  const doubt = count(xs, (v) => v < LOW)
  const sure = count(xs, (v) => v >= HIGH)
  const s = share(doubt, n)
  const split = [
    { count: doubt, tone: 'plum' as Tone, label: 'doubt it' },
    { count: n - doubt - sure, tone: 'mist' as Tone, label: 'unsure' },
    { count: sure, tone: 'teal' as Tone, label: 'sure' },
  ].filter((p) => p.count > 0)
  return {
    key: 'advisor',
    headline:
      doubt === 0
        ? sure === n
          ? 'All believe an advisor would help'
          : 'Nobody doubts an advisor would help'
        : doubt === n
          ? 'None believe an advisor would help'
          : `${s.text} ${s.one ? 'doubts' : 'doubt'} an advisor would help`,
    split,
    detail: counts(split),
    action:
      doubt * 2 >= n
        ? 'Build trust before asking to meet.'
        : doubt > 0
          ? 'Share an insight before asking to meet.'
          : 'Ask for the meeting.',
  }
}

function resilienceThread(rows: Prospect[]): Thread | null {
  const xs = rows.map((p) => p.confidence?.[RESILIENCE]).filter((v): v is number => typeof v === 'number')
  const n = xs.length
  if (!n) return null
  const shaky = count(xs, (v) => v < LOW)
  const s = share(shaky, n)
  const split = [
    { count: shaky, tone: 'plum' as Tone, label: 'couldn’t' },
    { count: n - shaky, tone: 'mist' as Tone, label: 'could' },
  ].filter((p) => p.count > 0)
  return {
    key: 'resilience',
    headline:
      shaky === 0
        ? 'All could weather a setback'
        : shaky === n
          ? `All ${n} doubt they’d weather a setback`
          : `${s.text} couldn’t weather a setback`,
    split,
    detail: counts(split),
    action:
      shaky * 2 >= n
        ? 'Start with an emergency fund.'
        : shaky > 0
          ? 'Offer a protection check.'
          : 'Talk growth, not protection.',
  }
}

/** The "Who you're reaching" cards, read off the given rows: the whole scored
    book, or one tier of it. */
export function groupProfile(rows: Prospect[], scope: Scope = 'book'): GroupProfile {
  const scored = rows.filter((p) => p.kq !== null)
  return {
    size: scored.length,
    threads: [joyThread(scored, scope), postureThread(scored), advisorThread(scored), resilienceThread(scored)].filter(
      (t): t is Thread => !!t,
    ),
  }
}

/* ── Compared with everyone on Knomee ────────────────────────────────────────
   "Am I reaching the people I meant to?" has no target to score against: what
   an advisor says they enjoy working with (business owners, retirees…) is
   never asked of a prospect. What Knomee can say is how this book differs
   from everyone who takes the same Adventures: the anonymized respondents in
   evidence.ts and analytics.ts. Like for like only: each family's share of the
   book against its share of the 404 Financial Joy respondents, and the
   average of the same three Confidence questions against the 607 who answered
   them. Only the whole book is compared: the respondents have no tiers. */

export interface CompareRow {
  label: string
  /** Bar lengths, 0–1. */
  you: number
  all: number
  youText: string
  allText: string
}

export interface Comparison {
  joy: CompareRow[]
  confidence: CompareRow[]
  finding: string
  action: string | null
  /** Who "everyone" is, for the help tip. */
  basis: string
}

/* A family must sit at least this many points off Knomee's share to be named. */
const FAMILY_GAP = 5
/* And a 1–5 average at least this far off. */
const SCORE_GAP = 0.2

/* The Confidence questions as the respondents were asked them (evidence.ts),
   each with its slider in the app's order. */
const CONFIDENCE_ITEMS = [
  { asked: 'I can achieve my goals', slider: GOALS, label: 'Reaching their goals' },
  { asked: 'I can weather a shock', slider: RESILIENCE, label: 'Weathering a setback' },
  { asked: 'An advisor improves my confidence', slider: ADVISOR, label: 'An advisor would help' },
]

const pctText = (x: number) => (x > 0 && x < 0.01 ? '<1%' : `${Math.round(x * 100)}%`)
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function knomeeComparison(rows: Prospect[] = prospects): Comparison | null {
  const scored = rows.filter((p) => p.kq !== null)

  /* What they want money for: each family's share, here and across Knomee. */
  const model = modelClusters.B
  const fams = scored
    .map((p) => purposeFamily(p.joy))
    .filter((f): f is Exclude<PurposeFamily, 'Unstated'> => f !== 'Unstated')
  const families = (Object.keys(WANTS) as Exclude<PurposeFamily, 'Unstated'>[])
    .map((f) => {
      const knomee = model.segs.find((s) => s.name === f)?.scored
      if (knomee == null || !fams.length) return null
      const you = count(fams, (x) => x === f) / fams.length
      const all = knomee / model.n
      return { f, you, all, gap: (you - all) * 100 }
    })
    .filter((x): x is NonNullable<typeof x> => !!x && Math.abs(x.gap) >= FAMILY_GAP)
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
    .slice(0, 3)
  const top = Math.max(...families.flatMap((x) => [x.you, x.all]), 0.01)
  const joy: CompareRow[] = families.map(({ f, you, all }) => ({
    label: capFirst(WANTS[f]),
    you: you / top,
    all: all / top,
    youText: pctText(you),
    allText: pctText(all),
  }))

  /* How confident they are: the same questions' averages, on Knomee's 1–5. */
  const card = evidence.find((e) => e.key === 'confidence')
  const items = CONFIDENCE_ITEMS.flatMap((it) => {
    const row = card?.secondary?.rows.find((r) => r.label === it.asked)
    const xs = scored.map((p) => p.confidence?.[it.slider]).filter((v): v is number => typeof v === 'number')
    if (!row || !xs.length) return []
    const all = Number(row.display)
    const you = 1 + mean(xs) / 25
    return [{ ...it, you, all, gap: you - all }]
  })
  const confidence: CompareRow[] = items.map((it) => ({
    label: it.label,
    you: it.you / 5,
    all: it.all / 5,
    youText: it.you.toFixed(1),
    allText: it.all.toFixed(1),
  }))

  if (!joy.length && !confidence.length) return null

  /* One sentence, from the rows above: the biggest shortfall, the biggest
     excess, and confidence only where every question leans the same way. */
  const under = families.find((x) => x.gap < 0)
  const over = families.filter((x) => x.gap > 0).sort((a, b) => b.gap - a.gap)[0]
  const lower = items.length > 0 && items.every((x) => x.gap <= -SCORE_GAP)
  const higher = items.length > 0 && items.every((x) => x.gap >= SCORE_GAP)
  const mix = [under && `fewer want ${WANTS[under.f]}`, over && `more want ${WANTS[over.f]}`].filter(
    (c): c is string => !!c,
  )
  const finding =
    [
      mix.length ? `${capFirst(mix.join(', '))}.` : '',
      lower ? 'Less confident overall.' : higher ? 'More confident overall.' : '',
    ]
      .filter(Boolean)
      .join(' ') || 'Much like everyone on Knomee.'

  const confidenceN = card?.n
  return {
    joy,
    confidence,
    finding,
    action: under ? `Want more of them? Lead your invite with ${WANTS[under.f]}.` : null,
    basis: `Everyone on Knomee: ${model.n} Financial Joy${confidenceN ? ` and ${confidenceN} Confidence` : ''} respondents, anonymized, ${evidenceMeta.period}.`,
  }
}
