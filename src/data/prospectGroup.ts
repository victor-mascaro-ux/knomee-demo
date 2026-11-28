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

/* ── Who you're reaching: the insight rules ──────────────────────────────────
   Only what Knomee asks: why money matters to them (Financial Joy), how they
   feel about it (the Confidence adventure's six sliders), and how clearly
   they see the future and how close they are to acting (Future You's Clarity,
   the Goals adventure's Intent).

   Every insight is a RULE in INSIGHT_RULES below: what it reads, when it
   fires, how strongly, and the card it makes. Many can fire; four are shown.
   Which four is the selection rule, pickInsights(). The full catalogue, in
   words, is docs/prospect-insight-rules.md: change both together. */

export type Tone = 'plum' | 'grape' | 'bolt' | 'ocean' | 'teal' | 'mist'

export interface SplitPart {
  count: number
  tone: Tone
  label: string
}

/** One card's subject. At most one card per topic is shown. */
export type Topic =
  | 'purpose'
  | 'giving'
  | 'status'
  | 'posture'
  | 'advisor'
  | 'resilience'
  | 'goals'
  | 'gap'
  | 'permission'
  | 'joy'
  | 'regret'
  | 'vision'

/** What each card measures: its title. A card's title names the measure;
    its finding is in the split and the action, not in the title. */
export const TOPIC_TITLE: Record<Topic, string> = {
  purpose: 'What their money is for',
  giving: 'Wanting to give back',
  status: 'Wanting status',
  posture: 'Confidence with money',
  advisor: 'Belief an advisor would help',
  resilience: 'Ability to weather a setback',
  goals: 'Confidence in reaching their goals',
  gap: 'Goal confidence vs. today’s',
  permission: 'Permission to enjoy their money',
  joy: 'Spending on what brings joy',
  regret: 'Confidence in their money decisions',
  vision: 'Clarity about their future',
}

export interface Thread {
  /** The rule that made it. */
  key: string
  topic: Topic
  headline: string
  split: SplitPart[]
  /** The split in numbers. */
  detail: string
  action: string
  /** Share of the group the card is about, times the rule's weight. */
  score: number
}

export interface GroupProfile {
  size: number
  /** The cards shown, in order: at most four. */
  threads: Thread[]
  /** Every rule that fired, best first, shown or not. */
  fired: Thread[]
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

/* The Confidence adventure's sliders, 0–100, in its order (prospects.ts). */
const CONDITION = 0
const RESILIENCE = 1
const GOALS = 2
const JOY_SPEND = 3
const NO_REGRET = 4
const ADVISOR = 5
/* Under halfway reads as a no; 70 and up as a clear yes. The tension rules
   use the engine's own cuts on its 1–5 scale: 4 and up is 75+, 3 and under
   is 50 and under (segmentation.ts, Model D). */
const LOW = 50
const HIGH = 70
const ENGINE_HIGH = 75
const ENGINE_LOW = 50

/** "1 in 3", "Half", "2 in 3", "All", or a percent, whichever is true to
    within a few points; in a group under ten, the count itself ("4 of 5").
    `one` is set where the verb that follows is singular. */
function share(k: number, n: number): { text: string; one: boolean } {
  if (k === n) return { text: 'All', one: false }
  if (n < 10) return { text: `${k} of ${n}`, one: false }
  const r = k / n
  if (Math.abs(r - 0.5) <= 0.04) return { text: 'Half', one: false }
  for (const m of [3, 4, 5, 6, 8]) if (Math.abs(r - 1 / m) <= 0.03) return { text: `1 in ${m}`, one: true }
  if (Math.abs(r - 2 / 3) <= 0.03) return { text: '2 in 3', one: false }
  if (Math.abs(r - 3 / 4) <= 0.03) return { text: '3 in 4', one: false }
  return { text: `${Math.round(r * 100)}%`, one: false }
}
/* "1 in 3 doubts", "Half doubt". */
const says = (k: number, n: number, one: string, many: string) => {
  const s = share(k, n)
  return `${s.text} ${s.one ? one : many}`
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
const splitOf = (parts: SplitPart[]) => parts.filter((p) => p.count > 0)

/* The rows that answered every slider a rule reads: an unanswered slider is
   never read as a low one. */
const answered = (rows: Prospect[], ...idx: number[]) =>
  rows.filter((p) => idx.every((i) => typeof p.confidence?.[i] === 'number'))
const at = (p: Prospect, i: number) => p.confidence?.[i] as number

/* A positive finding (nobody doubts, all could) is worth less than a problem
   of the same size: there is less to do about it. */
const POSITIVE = 0.8

/** What a rule hands back when it fires. */
type Fired = Omit<Thread, 'key' | 'topic' | 'score'> & {
  /** Share of the group the card is about, 0–1. */
  share: number
  /** 1 for a problem; POSITIVE for good news. */
  tone?: number
  /** The families the card names, so another card does not name them again. */
  names?: Exclude<PurposeFamily, 'Unstated'>[]
}

export interface InsightRule {
  id: string
  topic: Topic
  /** How much this kind of finding moves the advisor's next step, 0–1. */
  weight: number
  /** The least share of the group it needs, and at least two people. */
  min: number
  evaluate: (rows: Prospect[], scope: Scope, named: Set<string>) => Fired | null
}

/* A rule about some of the group fires only on two people or more, and on at
   least its share: one person on their own is the table's business. */
const enough = (k: number, n: number, min: number) => k >= 2 && k / n >= min

export const INSIGHT_RULES: InsightRule[] = [
  /* ── Financial Joy ── */
  {
    id: 'purpose',
    topic: 'purpose',
    weight: 1,
    min: 0,
    evaluate: (rows, scope) => {
      const fams = rows
        .map((p) => purposeFamily(p.joy))
        .filter((f): f is Exclude<PurposeFamily, 'Unstated'> => f !== 'Unstated')
      const n = fams.length
      if (n < 2) return null
      const ranked = (Object.keys(WANTS) as Exclude<PurposeFamily, 'Unstated'>[])
        .map((f) => ({ f, k: count(fams, (x) => x === f) }))
        .filter((x) => x.k > 0)
        .sort((a, b) => b.k - a.k)
      const [a, b] = ranked
      const twoCamps = !!b && a.k + b.k >= 0.6 * n && b.k >= 0.7 * a.k && a.k < 0.5 * n
      return {
        share: twoCamps ? (a.k + b.k) / n : a.k / n,
        names: twoCamps ? [a.f, b.f] : [a.f],
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
    },
  },
  {
    id: 'giving',
    topic: 'giving',
    weight: 0.7,
    min: 0.15,
    evaluate: (rows, scope, named) => {
      if (named.has('Contributor')) return null
      const n = rows.length
      const k = count(rows, (p) => !!p.joy?.includes('Philanthropy and giving'))
      if (!enough(k, n, 0.15)) return null
      return {
        share: k / n,
        headline: `${says(k, n, 'wants', 'want')} money to give back`,
        split: splitOf([
          { count: k, tone: 'teal', label: 'picked giving' },
          { count: n - k, tone: 'mist', label: 'didn’t' },
        ]),
        detail: `${k} picked giving`,
        action: scope === 'book' ? 'Mention giving in your invite.' : 'Ask what they’d like to give to.',
      }
    },
  },
  {
    id: 'status',
    topic: 'status',
    weight: 0.7,
    min: 0.1,
    evaluate: (rows, _scope, named) => {
      if (named.has('Achiever')) return null
      const n = rows.length
      const k = count(rows, (p) => !!p.joy?.includes('Status'))
      if (!enough(k, n, 0.1)) return null
      return {
        share: k / n,
        headline: `${says(k, n, 'wants', 'want')} money for status`,
        split: splitOf([
          { count: k, tone: 'bolt', label: 'picked status' },
          { count: n - k, tone: 'mist', label: 'didn’t' },
        ]),
        detail: `${k} picked status`,
        action: 'Show progress they can measure.',
      }
    },
  },

  /* ── Confidence ── */
  {
    id: 'posture',
    topic: 'posture',
    weight: 0.9,
    min: 0,
    evaluate: (rows) => {
      const ps = rows.map((p) => posture(p.confidence)).filter((x): x is Exclude<Posture, 'Unrated'> => x !== 'Unrated')
      const n = ps.length
      if (n < 2) return null
      const uneasy = count(ps, (x) => x === 'Uneasy')
      const building = count(ps, (x) => x === 'Working on it')
      const sure = count(ps, (x) => x === 'Assured')
      const notYet = uneasy + building
      const split = splitOf([
        { count: uneasy, tone: 'plum', label: 'uneasy' },
        { count: building, tone: 'grape', label: 'building' },
        { count: sure, tone: 'teal', label: 'confident' },
      ])
      const good = uneasy === 0 || sure * 2 >= n
      return {
        share: uneasy === n ? 1 : good ? (uneasy === 0 ? 1 : sure / n) : notYet / n,
        tone: good ? POSITIVE : 1,
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
    },
  },
  {
    id: 'advisor',
    topic: 'advisor',
    weight: 1,
    min: 0.2,
    evaluate: (rows) => {
      const xs = answered(rows, ADVISOR).map((p) => at(p, ADVISOR))
      const n = xs.length
      if (n < 2) return null
      const doubt = count(xs, (v) => v < LOW)
      const sure = count(xs, (v) => v >= HIGH)
      const split = splitOf([
        { count: doubt, tone: 'plum', label: 'doubt it' },
        { count: n - doubt - sure, tone: 'mist', label: 'unsure' },
        { count: sure, tone: 'teal', label: 'sure' },
      ])
      if (doubt === n || enough(doubt, n, 0.2))
        return {
          share: doubt / n,
          headline: doubt === n ? 'None believe an advisor would help' : `${says(doubt, n, 'doubts', 'doubt')} an advisor would help`,
          split,
          detail: counts(split),
          action: doubt * 2 >= n ? 'Build trust before asking to meet.' : 'Share an insight before asking to meet.',
        }
      if (sure / n >= 0.6)
        return {
          share: sure / n,
          tone: POSITIVE,
          headline: doubt === 0 ? (sure === n ? 'All believe an advisor would help' : 'Nobody doubts an advisor would help') : `${share(sure, n).text} are sure an advisor would help`,
          split,
          detail: counts(split),
          action: 'Ask for the meeting.',
        }
      return null
    },
  },
  {
    id: 'resilience',
    topic: 'resilience',
    weight: 0.8,
    min: 0.2,
    evaluate: (rows) => {
      const xs = answered(rows, RESILIENCE).map((p) => at(p, RESILIENCE))
      const n = xs.length
      if (n < 2) return null
      const shaky = count(xs, (v) => v < LOW)
      const split = splitOf([
        { count: shaky, tone: 'plum', label: 'couldn’t' },
        { count: n - shaky, tone: 'mist', label: 'could' },
      ])
      if (shaky === 0)
        return { share: 1, tone: POSITIVE, headline: 'All could weather a setback', split, detail: counts(split), action: 'Talk growth, not protection.' }
      if (!enough(shaky, n, 0.2)) return null
      return {
        share: shaky / n,
        headline: shaky === n ? `All ${n} doubt they’d weather a setback` : `${share(shaky, n).text} couldn’t weather a setback`,
        split,
        detail: counts(split),
        action: shaky * 2 >= n ? 'Start with an emergency fund.' : 'Offer a protection check.',
      }
    },
  },
  {
    id: 'goals',
    topic: 'goals',
    weight: 0.8,
    min: 0.2,
    evaluate: (rows) => {
      const xs = answered(rows, GOALS).map((p) => at(p, GOALS))
      const n = xs.length
      const low = count(xs, (v) => v < LOW)
      if (!(low === n && n >= 2) && !enough(low, n, 0.2)) return null
      const split = splitOf([
        { count: low, tone: 'plum', label: 'doubt it' },
        { count: n - low, tone: 'mist', label: 'believe it' },
      ])
      return {
        share: low / n,
        headline: low === n ? `All ${n} doubt they’ll reach their goals` : `${says(low, n, 'doubts', 'doubt')} they’ll reach their goals`,
        split,
        detail: counts(split),
        action: 'Start with one goal they can hit soon.',
      }
    },
  },
  {
    /* Model D's Confidence Gap: sure of the goal, shaky about today. */
    id: 'gap',
    topic: 'gap',
    weight: 0.85,
    min: 0.15,
    evaluate: (rows) => {
      const asked = answered(rows, GOALS, CONDITION, RESILIENCE)
      const n = asked.length
      const k = count(asked, (p) => at(p, GOALS) >= ENGINE_HIGH && Math.min(at(p, CONDITION), at(p, RESILIENCE)) <= ENGINE_LOW)
      if (!enough(k, n, 0.15)) return null
      return {
        share: k / n,
        headline: share(k, n).one
          ? `${share(k, n).text} believes in their goals but feels shaky today`
          : `${share(k, n).text} believe in their goals but feel shaky today`,
        split: splitOf([
          { count: k, tone: 'plum', label: 'shaky today' },
          { count: n - k, tone: 'mist', label: 'others' },
        ]),
        detail: `${k} of ${n}`,
        action: 'Show the path from today to the goal.',
      }
    },
  },
  {
    /* Model D's Permission Gap: secure, and still not spending on joy. */
    id: 'permission',
    topic: 'permission',
    weight: 0.8,
    min: 0.15,
    evaluate: (rows) => {
      const asked = answered(rows, CONDITION, RESILIENCE, JOY_SPEND)
      const n = asked.length
      const k = count(asked, (p) => Math.min(at(p, CONDITION), at(p, RESILIENCE)) >= ENGINE_HIGH && at(p, JOY_SPEND) <= ENGINE_LOW)
      if (!enough(k, n, 0.15)) return null
      return {
        share: k / n,
        headline: `${says(k, n, 'could', 'could')} enjoy their money but hold back`,
        split: splitOf([
          { count: k, tone: 'grape', label: 'holding back' },
          { count: n - k, tone: 'mist', label: 'others' },
        ]),
        detail: `${k} of ${n}`,
        action: 'Give them permission to spend on joy.',
      }
    },
  },
  {
    id: 'joy',
    topic: 'joy',
    weight: 0.7,
    min: 0.25,
    evaluate: (rows) => {
      const xs = answered(rows, JOY_SPEND).map((p) => at(p, JOY_SPEND))
      const n = xs.length
      const low = count(xs, (v) => v < LOW)
      if (!enough(low, n, 0.25)) return null
      const split = splitOf([
        { count: low, tone: 'grape', label: 'rarely' },
        { count: n - low, tone: 'mist', label: 'do' },
      ])
      return {
        share: low / n,
        headline: `${says(low, n, 'rarely spends', 'rarely spend')} on what brings joy`,
        split,
        detail: counts(split),
        action: 'Talk about joy, not just security.',
      }
    },
  },
  {
    /* Model D's Decision Fatigue, read at halfway rather than at the floor. */
    id: 'regret',
    topic: 'regret',
    weight: 0.75,
    min: 0.2,
    evaluate: (rows) => {
      const xs = answered(rows, NO_REGRET).map((p) => at(p, NO_REGRET))
      const n = xs.length
      const low = count(xs, (v) => v < LOW)
      if (!(low === n && n >= 2) && !enough(low, n, 0.2)) return null
      const split = splitOf([
        { count: low, tone: 'plum', label: 'second-guess' },
        { count: n - low, tone: 'mist', label: 'settled' },
      ])
      return {
        share: low / n,
        headline: `${says(low, n, 'second-guesses', 'second-guess')} their money moves`,
        split,
        detail: counts(split),
        action: 'Hand them a simple plan to follow.',
      }
    },
  },

  /* ── Future You (Clarity) × Goals (Intent) ──
     Fixed cuts, not the book's medians: half of any book sits under its own
     median, which would make every one of these fire. */
  {
    id: 'stuck',
    topic: 'vision',
    weight: 0.9,
    min: 0.15,
    evaluate: (rows) => {
      const n = rows.length
      const k = count(rows, (p) => (p.clarity ?? 0) >= 70 && (p.intent ?? 100) < 50)
      if (!enough(k, n, 0.15)) return null
      return {
        share: k / n,
        headline: share(k, n).one
          ? `${share(k, n).text} sees the future but hasn’t started`
          : `${share(k, n).text} see the future but haven’t started`,
        split: splitOf([
          { count: k, tone: 'grape', label: 'stuck' },
          { count: n - k, tone: 'mist', label: 'others' },
        ]),
        detail: `${k} of ${n}`,
        action: 'Offer one concrete first step.',
      }
    },
  },
  {
    id: 'fog',
    topic: 'vision',
    weight: 0.75,
    min: 0.15,
    evaluate: (rows) => {
      const n = rows.length
      const k = count(rows, (p) => (p.clarity ?? 100) < 40)
      if (!(k === n && n >= 2) && !enough(k, n, 0.15)) return null
      return {
        share: k / n,
        headline: k === n ? 'None can picture their future yet' : `${share(k, n).text} can’t picture their future yet`,
        split: splitOf([
          { count: k, tone: 'plum', label: 'foggy' },
          { count: n - k, tone: 'mist', label: 'clear' },
        ]),
        detail: `${k} of ${n}`,
        action: 'Start with a Future You session.',
      }
    },
  },
  {
    id: 'mapless',
    topic: 'vision',
    weight: 0.75,
    min: 0.15,
    evaluate: (rows) => {
      const n = rows.length
      const k = count(rows, (p) => (p.intent ?? 0) >= 70 && (p.clarity ?? 100) < 50)
      if (!enough(k, n, 0.15)) return null
      return {
        share: k / n,
        headline: `${says(k, n, 'is', 'are')} moving without a clear goal`,
        split: splitOf([
          { count: k, tone: 'ocean', label: 'no clear goal' },
          { count: n - k, tone: 'mist', label: 'others' },
        ]),
        detail: `${k} of ${n}`,
        action: 'Help them name the goal first.',
      }
    },
  },
]

/** How many cards the row has room for. */
export const SHOWN = 4

/** The selection rule. Every rule runs on the rows in view; each that fires
    scores its share of the group times its weight (times POSITIVE for good
    news). Then:
    1. The purpose card always leads: it answers "who are they?".
    2. One card per topic: the higher score wins its topic.
    3. The rest of the slots go to the highest scores; a tie goes to the
       higher weight, then to the rule listed first.
    4. Fewer than four fire, fewer show. */
export function pickInsights(rows: Prospect[], scope: Scope): { threads: Thread[]; fired: Thread[] } {
  const named = new Set<string>()
  const fired: (Thread & { weight: number; order: number })[] = []
  INSIGHT_RULES.forEach((rule, order) => {
    const f = rule.evaluate(rows, scope, named)
    if (!f) return
    f.names?.forEach((x) => named.add(x))
    const { share: s, tone = 1, names: _names, ...card } = f
    fired.push({ ...card, key: rule.id, topic: rule.topic, score: s * rule.weight * tone, weight: rule.weight, order })
  })
  const ranked = [...fired].sort((a, b) => b.score - a.score || b.weight - a.weight || a.order - b.order)
  const lead = ranked.find((t) => t.topic === 'purpose')
  const picked: Thread[] = lead ? [lead] : []
  for (const t of ranked) {
    if (picked.length >= SHOWN) break
    if (picked.some((p) => p.topic === t.topic)) continue
    picked.push(t)
  }
  const strip = ({ weight: _w, order: _o, ...t }: Thread & { weight: number; order: number }) => t
  return { threads: picked.map((t) => strip(t as Thread & { weight: number; order: number })), fired: ranked.map(strip) }
}

/** The "Who you're reaching" cards, read off the given rows: the whole scored
    book, or one tier of it. */
export function groupProfile(rows: Prospect[], scope: Scope = 'book'): GroupProfile {
  const scored = rows.filter((p) => p.kq !== null)
  const { threads, fired } = pickInsights(scored, scope)
  return { size: scored.length, threads, fired }
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
