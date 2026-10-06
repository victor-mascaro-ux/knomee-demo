import { prospectStats as ps, type Tier } from './prospects'
import { segmented, topSegments, type SegmentCount } from './prospectSegments'
import { segModels } from './segmentation'
import { byTier } from './analytics'

export interface Insight {
  n: number
  title: string
  body: string
}

// The insights read straight off the standing prospect book — prospectStats
// and the segments derived from its rows — so the numbers here can never drift
// from the Prospects table, the pulse or the strip above them.
const S = ps.scored
const pct = (n: number) => (S ? Math.round((n / S) * 100) : 0)
const t1 = ps.byTier.tier1
const t2 = ps.byTier.tier2
const t3 = ps.byTier.tier3

// The question this section answers is not "how are the scores distributed"
// but "am I reaching the people I set out to reach?" — so the cards say who the
// prospects are, in the same crossed segments as the "Who you're reaching"
// strip, and what each one needs said first. What a segment means comes from
// the segmentation models themselves; the cards only put it into sentences.
//
// The dashboard peeks at a tier's card by its first sentence (everything
// before the first ". "), so every body opens with a sentence that stands on
// its own.

const quoted = (name: string) => `“${name}”`
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
/* The models' text, a sentence at a time: split wherever a full stop meets a
   space, the stop kept. Not with a lookbehind — Safari before 16.4 cannot
   compile one, and this runs as the app loads. */
const sentences = (s = '') =>
  s
    .split(/\.\s+/)
    .map((x, i, all) => (i < all.length - 1 ? `${x}.` : x))
    .filter(Boolean)
const modelSeg = (model: 'B' | 'C', name: string) =>
  segModels[model].segments.find((s) => s.name === name)

/* "an Experiencer", "a Protector". */
const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a')
/* "5 of 39 scored prospects", and the verb that agrees with the 5. */
const scoredOf = (n: number) => `${n} of ${S} scored prospects`
const be = (n: number) => (n === 1 ? 'is' : 'are')
/* "A", "A and B", "A, B and C". */
const listed = (xs: string[]) =>
  xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : (xs[0] ?? '')

/* Every segment level with the first. A tie is said as a tie, never settled
   by the alphabet. */
const leaders = (segs: SegmentCount[]) => segs.filter((s) => s.count === segs[0]?.count)

const biggest = leaders(topSegments(segmented))

/* A tier's biggest group. Card 2 already names the book's largest segment, so
   when that segment leads a tier as well, the tier says how many of it sit
   there and names its next group, rather than repeating card 2. One person on
   their own is not a group. */
function tierLead(tier: Tier, size: number): string {
  const segs = topSegments(segmented.filter(({ p }) => p.tier === tier))
  const named = new Set(biggest.map((s) => s.name))
  const shared = leaders(segs).filter((s) => named.has(s.name))
  const rest = leaders(segs.filter((s) => !named.has(s.name)))
  const next = (rest[0]?.count ?? 0) >= 2 ? rest : []
  const names = listed(next.map((s) => quoted(s.name)))
  const n = next[0]?.count
  if (shared.length) {
    const k = shared.reduce((sum, s) => sum + s.count, 0)
    const lead = ` ${k} of them ${be(k)} in ${
      biggest.length === 1
        ? 'the book’s largest segment'
        : shared.length > 1
          ? 'the book’s largest segments'
          : 'one of the book’s largest segments'
    }`
    if (!next.length) return `${lead}.`
    if (n === shared[0].count) return `${lead}, and ${n} ${next.length > 1 ? 'each ' : ''}${be(n)} ${names}.`
    return next.length > 1
      ? `${lead}; the next groups, tied at ${n} of the ${size} each, are ${names}.`
      : `${lead}; the next biggest group is ${names}, ${n} of the ${size}.`
  }
  if (!next.length) return ''
  return next.length > 1
    ? ` The biggest groups among them, tied at ${n} of the ${size} each, are ${names}.`
    : ` The biggest group among them is ${names}, ${n} of the ${size}.`
}

/* The biggest segment, in Model B's words for why money matters to it and
   Model C's opening line for its quadrant — the hook the advisor can say, not
   the campaign note, since everyone counted here has finished the Adventure.
   On a tie, a sentence is said only where every tied segment shares it. */
function biggestBody(segs: SegmentCount[]): string {
  const [first] = segs
  const names = listed(segs.map((s) => quoted(s.name)))
  const why = segs.every((s) => s.family === first.family)
    ? modelSeg('B', first.family)?.blurb
    : undefined
  const quad = segs.every((s) => s.quadrant === first.quadrant)
    ? modelSeg('C', first.quadrant)
    : undefined
  const [seen] = sentences(quad?.blurb)
  return [
    segs.length > 1
      ? `${names} are tied for the largest group in the book, ${first.count} of the ${S} scored prospects each.`
      : `${scoredOf(first.count)} ${be(first.count)} ${names} — the largest single group in the book.`,
    why ? `For ${article(first.family)} ${first.family}, ${lcFirst(why)}` : '',
    quad?.hook && seen
      ? `They are ${first.quadrant} (${lcFirst(seen.replace(/\.$/, ''))}), so open with ${quoted(quad.hook.replace(/'/g, '’'))}`
      : '',
  ]
    .filter(Boolean)
    .join(' ')
}

/* Vivid but Stuck across every family: Model C's reading of the quadrant —
   detailed future, no first step, blocked by how rather than whether, the best
   nurture audience — said as sentences rather than engine notes. */
const stuck = segmented.filter(({ seg }) => seg.quadrant === 'Vivid but Stuck')
function stuckBody(): string {
  const families = [...new Set(stuck.map(({ seg }) => seg.family))].filter((f) => f !== 'Unstated')
  // "Across" only when there is more than one family to be across; one family
  // is named only when it is everyone's.
  const onlyOne = families.length === 1 && stuck.every(({ seg }) => seg.family === families[0])
  const who =
    families.length > 1
      ? `, across ${listed(families.map((f) => `${f}s`))}`
      : onlyOne && stuck.length > 1
        ? `, all of them ${families[0]}s`
        : onlyOne
          ? `, ${article(families[0])} ${families[0]}`
          : ''
  return [
    `${scoredOf(stuck.length)} ${be(stuck.length)} Vivid but Stuck${who}.`,
    'They can picture the future in detail but have not taken a first step, held back by how to get there rather than whether to go.',
    'That makes them the best audience to nurture: lead with a concrete first step.',
  ].join(' ')
}

/* Conversion by tier, as the analytics page reports it. */
const conv = (tier: string) => byTier.find((t) => t.tier === tier)?.conv
const conv1 = conv('Tier 1')
const conv2 = conv('Tier 2')

export const insights: Insight[] = [
  {
    n: 1,
    title: `${pct(t1)}% Ready to Talk Now`,
    body: t1
      ? `${scoredOf(t1)} ${be(t1)} Tier 1, ready for a conversation now.${tierLead('tier1', t1)} Book them in the next two weeks.`
      : `None of the ${S} scored prospects is Tier 1 yet. When someone gets there, book them in the next two weeks.`,
  },
  {
    n: 2,
    title: !biggest.length
      ? 'No Segment Stands Out Yet'
      : biggest.length > 1
        ? `${biggest.length} Segments Tie for the Biggest`
        : `The Biggest Segment: ${biggest[0].name}`,
    body: biggest.length
      ? biggestBody(biggest)
      : `None of the ${S} scored prospects has answered enough yet to place in a segment.`,
  },
  {
    n: 3,
    title: stuck.length
      ? `${stuck.length} ${stuck.length === 1 ? 'Is' : 'Are'} Vivid but Stuck`
      : 'Nobody Is Vivid but Stuck',
    body: stuck.length
      ? stuckBody()
      : `None of the ${S} scored prospects is Vivid but Stuck — everyone who can picture the future is already moving on it. Whoever lands here later is the best audience to nurture: lead with a concrete first step.`,
  },
  {
    n: 4,
    title: !t2
      ? 'Nobody Is Waiting in Tier 2'
      : t2 >= t1 && t2 >= t3
        ? 'Tier 2 Is Where Most of Them Wait'
        : 'Tier 2 Needs a Clear Next Step',
    body: t2
      ? `${scoredOf(t2)} (${pct(t2)}%) ${be(t2)} Tier 2 — interested, but still weighing it.${tierLead('tier2', t2)} They need a clear next step rather than a pitch${
          conv1 && conv2 ? `: they convert at ${conv2} today against ${conv1} for Tier 1.` : '.'
        }`
      : `None of the ${S} scored prospects is Tier 2 right now. Everyone is either ready to talk or still early.`,
  },
  {
    n: 5,
    title: t3 ? 'Tier 3 Should Stay in a Low-Touch Nurture Track' : 'Nobody Needs the Nurture Track Yet',
    body: t3
      ? `${scoredOf(t3)} (${pct(t3)}%) ${t3 === 1 ? 'falls' : 'fall'} in Tier 3${pct(t3) <= 20 ? ' — a small tail' : ''}. They are better suited to education, periodic check-ins and lighter nurture than to high-effort advisor time.`
      : `None of the ${S} scored prospects is in Tier 3 right now. Nobody needs the low-touch track yet.`,
  },
]
