// Who the advisor is reaching: the prospect book cut into segments read off
// each prospect's own answers, never typed in.
//
// Two of the segmentation engine's models, crossed. Model B, Purpose × Posture,
// says why money matters to them and how they feel about it; Model C, Vision ×
// Readiness, says how clearly they see where they are going and how close they
// are to acting. Either one alone is a demographic. Crossed, each segment
// carries its own opening line, and a segment that does not change what the
// advisor says first is not worth a chip.
//
// Membership is DERIVED from the prospect rows by the rules below (the rules
// segmentation.ts documents for the engine), and every count is computed from
// the members. Nothing in this file states a number that also appears in the
// table; they read the same array.

import { prospects, type Prospect } from './prospects'
import { segModels } from './segmentation'

export type PurposeFamily =
  | 'Protector'
  | 'Liberator'
  | 'Experiencer'
  | 'Contributor'
  | 'Achiever'
  | 'Unstated'

export type Posture = 'Assured' | 'Working on it' | 'Uneasy' | 'Unrated'

export type Quadrant =
  | 'Ready to Build'
  | 'Vivid but Stuck'
  | 'Moving Without a Map'
  | 'Not Yet Looking'

/* ── Purpose: which family the ranked Joy picks point at ─────────────────────
   Tie order is the engine's: on equal points the earlier family wins, so a
   prospect is never left between two. */
const FAMILIES: Exclude<PurposeFamily, 'Unstated'>[] = [
  'Protector',
  'Liberator',
  'Experiencer',
  'Contributor',
  'Achiever',
]

/* Option → family comes from Model B itself, so a pick re-filed there is
   re-filed here. The phone splits the engine's "Choice/Freedom" card down to
   "Choice", so both halves are accepted on their own. */
const FAMILY_OF = new Map<string, PurposeFamily>()
for (const seg of segModels.B.segments) {
  const family = FAMILIES.find((f) => f === seg.name)
  if (family) for (const option of seg.options) FAMILY_OF.set(option, family)
}
FAMILY_OF.set('Choice', 'Liberator')
FAMILY_OF.set('Freedom', 'Liberator')

/* First pick scores 3, second 2, third 1. The engine also weights each option
   by how rarely the whole cohort picks it; a book of a few dozen is too small
   for that weight to mean anything, so position alone decides here. */
export function purposeFamily(joy?: string[]): PurposeFamily {
  const points = new Map<PurposeFamily, number>()
  ;(joy ?? []).slice(0, 3).forEach((pick, i) => {
    const family = FAMILY_OF.get(pick)
    if (family) points.set(family, (points.get(family) ?? 0) + 3 - i)
  })
  let best: PurposeFamily = 'Unstated'
  let top = 0
  for (const f of FAMILIES) {
    const p = points.get(f) ?? 0
    if (p > top) {
      best = f
      top = p
    }
  }
  return best
}

/* ── Posture: how they feel about money ──────────────────────────────────────
   The Confidence adventure's six sliders, in its order: condition, resilience,
   goal belief, joy spend, never-regret, advisor value. Posture reads the four
   about their own footing; how they spend on joy and what they think of
   advisors are other questions. */
const POSTURE_ITEMS = [0, 1, 2, 4]

/** The engine's 1–5 scale: the mean of the four 0–100 answers, rescaled.
    Null when none of them was answered. */
export function postureMean(conf?: number[]): number | null {
  const xs = POSTURE_ITEMS.map((i) => conf?.[i]).filter((v): v is number => typeof v === 'number')
  if (!xs.length) return null
  return 1 + xs.reduce((a, b) => a + b, 0) / xs.length / 25
}

export function posture(conf?: number[]): Posture {
  const m = postureMean(conf)
  if (m === null) return 'Unrated'
  return m >= 4.2 ? 'Assured' : m >= 3.2 ? 'Working on it' : 'Uneasy'
}

/* ── Quadrant: vision × readiness ────────────────────────────────────────────
   Vision is the row's Clarity (the Future You reading) and readiness its
   Intent (the readiness stage). Each axis is cut at the book's own median: the
   adventures are built to draw out a vivid picture, so a fixed cut would file
   nearly everyone as vivid and the axis would say nothing. A book too small
   for a median to mean anything falls back to the engine's absolute cuts. */
export interface QuadrantCuts {
  vision: number
  readiness: number
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** Anyone with a Clarity and an Intent reading: a prospect's row, or a
    client's (clientSegments.ts). */
type Readings = Pick<Prospect, 'kq' | 'clarity' | 'intent'>

export function quadrantCuts(rows: Readings[]): QuadrantCuts {
  const scored = rows.filter((p) => p.kq !== null)
  if (scored.length < 6) return { vision: 55, readiness: 45 }
  return {
    vision: median(scored.map((p) => p.clarity ?? 0)),
    readiness: median(scored.map((p) => p.intent ?? 0)),
  }
}

/* A score on the cut counts as above it, as in the engine. */
export function quadrant(p: Pick<Readings, 'clarity' | 'intent'>, cuts: QuadrantCuts): Quadrant {
  const vivid = (p.clarity ?? 0) >= cuts.vision
  const ready = (p.intent ?? 0) >= cuts.readiness
  return vivid && ready
    ? 'Ready to Build'
    : vivid
      ? 'Vivid but Stuck'
      : ready
        ? 'Moving Without a Map'
        : 'Not Yet Looking'
}

/* ── The crossed segment ───────────────────────────────────────────────────── */

export interface ProspectSegment {
  family: PurposeFamily
  posture: Posture
  quadrant: Quadrant
  /** "Working on it Experiencer · Ready to Build" — Model B's name, then C's. */
  name: string
}

/** The crossed segment of anyone whose answers are in hand, read against
    their own book's cuts. */
export function crossedSegment(
  joy: string[] | undefined,
  confidence: number[] | undefined,
  readings: Pick<Readings, 'clarity' | 'intent'>,
  cuts: QuadrantCuts,
): ProspectSegment {
  const family = purposeFamily(joy)
  const pos = posture(confidence)
  const quad = quadrant(readings, cuts)
  return { family, posture: pos, quadrant: quad, name: `${pos} ${family} · ${quad}` }
}

const cuts = quadrantCuts(prospects)

/** Null for a profile that never finished: there is nothing to read yet. */
export function segmentOf(p: Prospect): ProspectSegment | null {
  if (p.kq === null) return null
  return crossedSegment(p.joy, p.confidence, p, cuts)
}

/* Every scored row with its segment, once, for everything below. */
export const segmented: { p: Prospect; seg: ProspectSegment }[] = prospects.flatMap((p) => {
  const seg = segmentOf(p)
  return seg ? [{ p, seg }] : []
})

export interface SegmentCount extends ProspectSegment {
  count: number
}

/** The crossed segments among the given rows, largest first (ties by name).
    A segment with half its name missing is a data gap, not an audience, so
    Unstated and Unrated never count as one. */
export function topSegments(rows: { seg: ProspectSegment }[]): SegmentCount[] {
  const counts = new Map<string, SegmentCount>()
  for (const { seg } of rows) {
    if (seg.family === 'Unstated' || seg.posture === 'Unrated') continue
    const c = counts.get(seg.name) ?? { ...seg, count: 0 }
    c.count++
    counts.set(seg.name, c)
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/** The "Who you're reaching" strip: the five biggest crossed segments. One
    person on their own is not an audience, so a segment needs two. */
export const reachSegments: { name: string; count: number }[] = topSegments(segmented)
  .filter((s) => s.count >= 2)
  .slice(0, 5)
  .map(({ name, count }) => ({ name, count }))

/* ── Who to talk to this week ─────────────────────────────────────────────────
   The six the advisor is flagged to call, strongest first. Who is on the list
   is a judgement; everything said about them is read off their row. Every
   chip but the last is something the prospect answered, and the last is the
   row's own next action — tracked behaviour (adventures completed, logins,
   scheduling state) is deliberately left out, because the point of the card
   is that the score shows its reasoning. */

export interface TalkTo {
  name: string
  tier: string
  kq: number
  /** Their crossed segment, where the firm side shows its cluster. */
  segment: string
  said: string[]
}

const FLAGGED = [
  'Emma Rossi',
  'Sarah Mitchell',
  'Jorday Ray',
  'Barbara Dean',
  'Sophie Dean',
  'Sebastian Watson',
]

const TIER_LABEL: Record<string, string> = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3',
}

const POSTURE_CHIP: Record<Posture, string> = {
  Assured: 'Confident in where they stand',
  'Working on it': 'Confidence still building',
  Uneasy: 'Uneasy about money right now',
  Unrated: '',
}

/* The Joy cards are worded in the first person ("Supporting my family"); the
   chip speaks about the prospect, so each is said in the third person. A card
   not listed here falls back to its own words, lower-cased. */
const WANTS_PHRASE: Record<string, string> = {
  'Supporting my family': 'supporting their family',
  'Choice/Freedom': 'freedom of choice',
  Choice: 'freedom of choice',
  Freedom: 'freedom',
  'Philanthropy and giving': 'giving',
  'Enjoying the moment': 'enjoying the moment',
  Security: 'security',
  Control: 'control',
  Comfort: 'comfort',
  Independence: 'independence',
  Simplicity: 'simplicity',
  Status: 'status',
}

/** The talk card's first two chips: what they want money for, and how they
    feel about it. Empty where they did not say. */
export function answeredChips(joy: string[] | undefined, pos: Posture): string[] {
  const wants = [...new Set((joy ?? []).slice(0, 2).map((w) => WANTS_PHRASE[w] ?? w.toLowerCase()))]
  return [wants.length ? `Wants money for ${wants.join(' and ')}` : '', POSTURE_CHIP[pos]].filter(Boolean)
}

/* No quadrant chip: the segment pill beside the name already says it, and a
   second wording of the same reading could only disagree with the action. */
function said(p: Prospect, seg: ProspectSegment): string[] {
  return [...answeredChips(p.joy, seg.posture), p.topAction].filter(Boolean)
}

export const talkTo: TalkTo[] = FLAGGED.flatMap((name) => {
  const row = segmented.find(({ p }) => p.name === name)
  if (!row) return []
  const { p, seg } = row
  return [
    {
      name: p.name,
      tier: TIER_LABEL[p.tier] ?? 'Tier 2',
      kq: p.kq as number,
      segment: seg.name,
      said: said(p, seg),
    },
  ]
})
