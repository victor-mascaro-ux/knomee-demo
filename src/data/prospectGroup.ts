// My Prospects' Actionable Insights: the prospects as a GROUP. Each person's
// reading and next step is the table's job; this answers what only the whole
// book can: how the advisor's invitations are doing, and who they are reaching.
//
// Nothing here repeats Top Line Metrics (KQ, the count, the tier split) or a
// table column (KQ, Intent, Clarity, Receptivity, Top Action). Every number is
// computed from the prospect rows and their own answers, never typed, so the
// sentences stay true when the rows change. The only typed figures are the two
// link counts below, which Knomee cannot read off a row; the Knomee-wide
// figures the book is compared with are read from evidence.ts and
// analytics.ts, never retyped.

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
  reading: string
  action: string
  /** The action points at Prospect Analytics, not at the table. */
  toAnalytics: boolean
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
    { key: 'started', label: 'Started an Adventure', count: started, rate: pct(started, clicked), of: 'of clicks' },
    { key: 'completed', label: 'Completed', count: completed, rate: pct(completed, started), of: 'of starters' },
    { key: 'converted', label: 'Converted', count: converted, rate: pct(converted, completed), of: 'of completers' },
  ]

  /* Only the two steps where people walk away can leak. Not converting yet is
     not a drop: those people are still in the table, still prospects. */
  const beforeStart = clicked - started
  const midway = started - completed
  const finishRate = pct(completed, started)
  let leak: Leak | null = null
  if (beforeStart > 0 && beforeStart / clicked >= midway / started) {
    leak = {
      at: 'started',
      lost: beforeStart,
      headline: `${beforeStart} opened your link and never started.`,
      reading:
        finishRate >= 80
          ? `Once people start, ${finishRate}% finish, so the Adventures aren’t what loses them: the invite reaches people who don’t yet see why it’s for them.`
          : 'More are lost before they begin than part-way through, so look at who the invite reaches before the Adventures themselves.',
      action: 'See which invite templates bring people who start, and try a warmer message.',
      toAnalytics: true,
    }
  } else if (midway > 0) {
    leak = {
      at: 'completed',
      lost: midway,
      headline: `${midway} started an Adventure and stopped part-way.`,
      reading: 'Your invite gets people to start; something in the Adventures loses them before the end.',
      action: 'Nudge the ones who stopped: they are the Incomplete Profiles in the table below.',
      toAnalytics: false,
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
  /** Which adventure it comes from. */
  source: string
  headline: string
  split: SplitPart[]
  detail: string
  action: string
}

/** Running text with the parts worth bolding marked. */
export type Line = (string | { b: string })[]

export interface GroupProfile {
  size: number
  summary: Line
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

function joyThread(rows: Prospect[], scope: Scope): { thread: Thread; lead: string[] } | null {
  const fams = rows.map((p) => purposeFamily(p.joy)).filter((f): f is Exclude<PurposeFamily, 'Unstated'> => f !== 'Unstated')
  const n = fams.length
  if (!n) return null
  const ranked = (Object.keys(WANTS) as Exclude<PurposeFamily, 'Unstated'>[])
    .map((f) => ({ f, k: count(fams, (x) => x === f) }))
    .filter((x) => x.k > 0)
    .sort((a, b) => b.k - a.k)
  const [a, b] = ranked
  const twoCamps = !!b && a.k + b.k >= 0.6 * n && b.k >= 0.7 * a.k && a.k < 0.5 * n
  const lead = twoCamps ? [WANTS[a.f], WANTS[b.f]] : [WANTS[a.f]]
  const headline =
    a.k === n
      ? `All want money for ${WANTS[a.f]}`
      : twoCamps
        ? `Two camps: ${WANTS[a.f]} vs. ${WANTS[b.f]}`
        : a.k >= 0.45 * n
          ? `${share(a.k, n).text} want money for ${WANTS[a.f]}`
          : `Led by ${WANTS[a.f]}, then ${WANTS[b.f]}`
  return {
    lead,
    thread: {
      key: 'joy',
      source: 'Financial Joy',
      headline,
      split: ranked.map(({ f, k }) => ({ count: k, tone: FAMILY_TONE[f], label: WANTS[f] })),
      detail: ranked
        .slice(0, 3)
        .map(({ f, k }) => `${part(k, n)} ${WANTS[f]}`)
        .join(' · '),
      action:
        scope === 'book'
          ? twoCamps
            ? 'Write two invite messages, one for each camp, rather than one for both.'
            : `Lead your invite message with ${WANTS[a.f]}.`
          : twoCamps
            ? `Have two openers ready: ${WANTS[a.f]}, and ${WANTS[b.f]}.`
            : `Talk about ${WANTS[a.f]} first.`,
    },
  }
}

function postureThread(rows: Prospect[]): { thread: Thread; phrase: Line } | null {
  const ps = rows.map((p) => posture(p.confidence)).filter((x): x is Exclude<Posture, 'Unrated'> => x !== 'Unrated')
  const n = ps.length
  if (!n) return null
  const uneasy = count(ps, (x) => x === 'Uneasy')
  const building = count(ps, (x) => x === 'Working on it')
  const sure = count(ps, (x) => x === 'Assured')
  const notYet = uneasy + building
  const headline =
    uneasy === n
      ? `All ${n} are uneasy about money`
      : notYet === n
        ? 'None feel confident with money yet'
        : sure === n
          ? 'All feel confident with money'
          : uneasy === 0
            ? 'Nobody here is uneasy about money'
            : `${share(notYet, n).text} aren’t confident with money yet`
  const phrase: Line =
    uneasy * 2 >= n
      ? ['who are ', { b: 'uneasy about money' }]
      : sure * 2 >= n
        ? ['who feel ', { b: 'confident with money' }]
        : uneasy === 0
          ? ['who are ', { b: 'confident with money or getting there' }]
          : ['who ', { b: 'aren’t confident with money yet' }]
  return {
    phrase,
    thread: {
      key: 'posture',
      source: 'Confidence',
      headline,
      split: [
        { count: uneasy, tone: 'plum' as Tone, label: 'uneasy' },
        { count: building, tone: 'grape' as Tone, label: 'still building' },
        { count: sure, tone: 'teal' as Tone, label: 'confident' },
      ].filter((s) => s.count > 0),
      detail: [
        uneasy && `${uneasy} uneasy`,
        building && `${building} still building`,
        sure && `${sure} confident`,
      ]
        .filter(Boolean)
        .join(' · '),
      action:
        uneasy * 2 >= n
          ? 'Education before a sales call: start with the basics.'
          : notYet * 2 >= n && uneasy > 0
            ? 'Open with where they stand today: stability before growth.'
            : 'Skip the reassurance: talk plans and next steps.',
    },
  }
}

function advisorThread(rows: Prospect[]): { thread: Thread; phrase: Line | null } | null {
  const xs = rows.map((p) => p.confidence?.[ADVISOR]).filter((v): v is number => typeof v === 'number')
  const n = xs.length
  if (!n) return null
  const doubt = count(xs, (v) => v < LOW)
  const sure = count(xs, (v) => v >= HIGH)
  const s = share(doubt, n)
  const headline =
    doubt === 0
      ? sure === n
        ? 'All believe an advisor would help'
        : 'Nobody doubts an advisor would help'
      : doubt === n
        ? 'None believe an advisor would help'
        : `${s.text} ${s.one ? 'doubts' : 'doubt'} an advisor would help`
  return {
    phrase:
      doubt * 2 >= n
        ? ['and ', { b: 'doubt an advisor would help' }]
        : doubt === 0
          ? ['and are ', { b: 'open to an advisor' }]
          : null,
    thread: {
      key: 'advisor',
      source: 'Confidence',
      headline,
      split: [
        { count: doubt, tone: 'plum' as Tone, label: 'doubt it' },
        { count: n - doubt - sure, tone: 'mist' as Tone, label: 'unsure' },
        { count: sure, tone: 'teal' as Tone, label: 'sure it would' },
      ].filter((p) => p.count > 0),
      detail:
        doubt === 0
          ? `${sure} of ${n} are sure working with an advisor would raise their confidence`
          : doubt === n
            ? `None of the ${n} think working with an advisor would raise their confidence`
            : `${doubt} of ${n} don’t think working with an advisor would raise their confidence`,
      action:
        doubt * 2 >= n
          ? 'Don’t push for a meeting yet: let useful content build trust first.'
          : doubt > 0
            ? 'Share an insight from their Financial ID before asking for a meeting.'
            : 'Ask for the meeting directly.',
    },
  }
}

function resilienceThread(rows: Prospect[]): Thread | null {
  const answered = rows.filter((p) => typeof p.confidence?.[RESILIENCE] === 'number')
  const n = answered.length
  if (!n) return null
  const xs = answered.map((p) => p.confidence![RESILIENCE])
  const shaky = count(xs, (v) => v < LOW)
  /* Is it their weakest answer? Only said when it is. */
  const means = [0, 1, 2, 3, 4, 5].map((i) => mean(answered.map((p) => p.confidence?.[i] ?? 0)))
  const weakest = means.every((m, i) => i === RESILIENCE || m >= means[RESILIENCE])
  const s = share(shaky, n)
  return {
    key: 'resilience',
    source: 'Confidence',
    headline:
      shaky === 0
        ? 'All feel they could weather a setback'
        : shaky === n
          ? `All ${n} doubt they’d weather a setback`
          : `${s.text} couldn’t weather a setback`,
    split: [
      { count: shaky, tone: 'plum' as Tone, label: 'couldn’t' },
      { count: n - shaky, tone: 'mist' as Tone, label: 'could' },
    ].filter((p) => p.count > 0),
    detail:
      shaky === 0
        ? `None of the ${n} rate themselves below halfway`
        : `${shaky} of ${n} rate themselves below halfway${weakest ? ', their weakest confidence answer' : ''}`,
    action:
      shaky * 2 >= n
        ? 'Start with the basics: an emergency fund and a budget.'
        : shaky > 0
          ? 'A protection check is an easy first conversation.'
          : 'Protection isn’t the way in here: talk about what comes next.',
  }
}

/** Everything the "Who you're reaching" half says, read off the given rows:
    the whole scored book, or one tier of it. */
export function groupProfile(rows: Prospect[], scope: Scope = 'book'): GroupProfile {
  const scored = rows.filter((p) => p.kq !== null)
  const joy = joyThread(scored, scope)
  const pos = postureThread(scored)
  const adv = advisorThread(scored)
  const res = resilienceThread(scored)

  const summary: Line = []
  if (joy) {
    summary.push('Mostly people who want money for ', { b: joy.lead[0] })
    if (joy.lead[1]) summary.push(' or ', { b: joy.lead[1] })
  }
  if (pos) summary.push(summary.length ? ', ' : 'Mostly people ', ...pos.phrase)
  if (adv?.phrase) summary.push(summary.length ? ', ' : 'Mostly people who ', ...adv.phrase)
  if (summary.length) summary.push('.')

  return {
    size: scored.length,
    summary,
    threads: [joy?.thread, pos?.thread, adv?.thread, res].filter((t): t is Thread => !!t),
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
  verdict: Line
  action: string | null
  /** Who "everyone" is, for the help tip. */
  basis: string
}

/* A family must sit at least this many points off Knomee's share to be named. */
const FAMILY_GAP = 5
/* And a 1–5 average at least this far off. */
const SCORE_GAP = 0.2

/* The Confidence adventure's questions as the respondents were asked them
   (evidence.ts), each with its slider in the app's order and how it reads. */
const CONFIDENCE_ITEMS = [
  { asked: 'I can achieve my goals', slider: 2, label: 'Believe they’ll reach their goals', less: 'less confident about reaching their goals', more: 'more confident about reaching their goals' },
  { asked: 'I can weather a shock', slider: RESILIENCE, label: 'Could weather a setback', less: 'less sure they’d weather a setback', more: 'surer they’d weather a setback' },
  { asked: 'An advisor improves my confidence', slider: ADVISOR, label: 'Think an advisor would help', less: 'less sure an advisor would help', more: 'surer an advisor would help' },
]

const pctText = (x: number) => (x > 0 && x < 0.01 ? '<1%' : `${Math.round(x * 100)}%`)

/* "A", "A or B", "A, B or C", each bolded. */
function either(xs: string[]): Line {
  return xs.flatMap((x, i) => [
    ...(i === 0 ? [] : [i === xs.length - 1 ? ' or ' : ', ']),
    { b: x },
  ])
}
function both(xs: string[]): Line {
  return xs.flatMap((x, i) => [
    ...(i === 0 ? [] : [i === xs.length - 1 ? ' and ' : ', ']),
    { b: x },
  ])
}

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
    label: `Want money for ${WANTS[f]}`,
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

  /* The verdict says what the rows above show, and only that. */
  const over = families.filter((x) => x.gap > 0).sort((a, b) => b.gap - a.gap).map((x) => WANTS[x.f])
  const under = families.filter((x) => x.gap < 0).map((x) => WANTS[x.f])
  const less = items.filter((x) => x.gap <= -SCORE_GAP && x.slider !== RESILIENCE).map((x) => x.less)
  const more = items.filter((x) => x.gap >= SCORE_GAP && x.slider !== RESILIENCE).map((x) => x.more)
  const verdict: Line = []
  if (over.length || under.length) {
    verdict.push('Your link reaches ')
    if (over.length) verdict.push('more people who want money for ', ...either(over))
    if (under.length) verdict.push(over.length ? ', and fewer who want ' : 'fewer people who want money for ', ...either(under))
    verdict.push('. ')
  }
  const moods = [...less, ...more]
  if (moods.length) verdict.push(verdict.length ? 'They’re also ' : 'Your prospects are ', ...both(moods), '.')
  if (!verdict.length) verdict.push('Your prospects look much like everyone who takes Knomee.')

  const confidenceN = card?.n
  return {
    joy,
    confidence,
    verdict,
    action: under.length
      ? `To reach more people who want ${under[0]}, lead your invite with it.`
      : over.length
        ? `Your invite already draws people who want ${over[0]}; keep leading with it.`
        : null,
    basis: `Everyone on Knomee: ${model.n} Financial Joy${confidenceN ? ` and ${confidenceN} Confidence` : ''} respondents, anonymized, ${evidenceMeta.period}.`,
  }
}
