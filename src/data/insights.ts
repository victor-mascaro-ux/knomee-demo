import { prospectStats as ps } from './prospects'

export interface Insight {
  n: number
  title: string
  body: string
}

// The insights read straight off the standing prospect book (prospectStats), so
// the numbers here can never drift from the Prospects table or the pulse.
const S = ps.scored
const pct = (n: number) => Math.round((n / S) * 100)
const t1 = ps.byTier.tier1
const t2 = ps.byTier.tier2
const t3 = ps.byTier.tier3

// Name the softest of the three signal dimensions from the data itself.
const dims: [string, number][] = [
  ['Intent', ps.avgIntent],
  ['Clarity', ps.avgClarity],
  ['Receptivity', ps.avgReceptivity],
]
const softest = [...dims].sort((a, b) => a[1] - b[1])[0]

export const insights: Insight[] = [
  {
    n: 1,
    title: `${pct(t1)}% Actionable Now`,
    body: `${t1} of ${S} scored prospects (${pct(t1)}%) fall in Tier 1 (KQ 70–100). Prioritize these first for meetings in the next 2 weeks — they show the strongest near-term readiness.`,
  },
  {
    n: 2,
    title: 'Intent and Clarity Are Fairly Balanced',
    body: `Portfolio avg Intent is ${ps.avgIntent} and avg Clarity is ${ps.avgClarity}. This suggests interest exists, but many prospects still need help turning general motivation into a more concrete plan.`,
  },
  {
    n: 3,
    title: `${softest[0]} Is the Softest Dimension`,
    body: `Avg ${softest[0]} is ${softest[1]} — the lowest of the three signal dimensions. The biggest opportunity is not just explaining products, but showing why working with an advisor is useful right now.`,
  },
  {
    n: 4,
    title: 'Verbal Engagement Still Signals Momentum',
    body: `Most of the ${t1 + t2} Tier 1 and Tier 2 prospects show Medium or High verbosity. The more engaged prospects are giving you more to work with — use that signal to prioritize outreach and tailor the first conversation.`,
  },
  {
    n: 5,
    title: 'Family and Legacy Themes Are Strong Hooks',
    body: 'Several top actions center on family, caregiving, partner alignment, estate planning, or legacy. Lead with protection, continuity, and support-for-others themes when opening conversations.',
  },
  {
    n: 6,
    title: 'Lifestyle Goals Create Natural Entry Points',
    body: 'Travel, adventure, homeownership, and personal hobbies show up repeatedly across the list. These goals are effective conversation starters because they feel personal first, then connect naturally to planning.',
  },
  {
    n: 7,
    title: 'Tier 2 Is the Biggest Opportunity Pool',
    body: `${t2} of ${S} scored prospects (${pct(t2)}%) sit in Tier 2 — the largest segment. These are the best “move next” candidates: interested enough to engage, but still needing reframing, confidence, or clearer next steps. They convert at 15% today against 42% for Tier 1.`,
  },
  {
    n: 8,
    title: 'Tier 3 Should Stay in a Low-Touch Nurture Track',
    body: `${t3} of ${S} scored prospects (${pct(t3)}%) fall in Tier 3 — a small tail. Tier 3 prospects are better suited to education, periodic check-ins, and lighter nurture rather than high-effort advisor time.`,
  },
]
