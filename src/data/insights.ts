export interface Insight {
  n: number
  title: string
  body: string
}

export const insights: Insight[] = [
  {
    n: 1,
    title: '27% Actionable Now',
    body: '3 of 11 scored prospects (27.3%) fall in Tier 1 (KQ 70–100). Prioritize these first for meetings in the next 2 weeks — they show the strongest near-term readiness.',
  },
  {
    n: 2,
    title: 'Intent and Clarity Are Fairly Balanced',
    body: 'Portfolio avg Intent is 56.3 and avg Clarity is 56.5. This suggests interest exists, but many prospects still need help turning general motivation into a more concrete plan.',
  },
  {
    n: 3,
    title: 'Receptivity Is the Softest Dimension',
    body: 'Avg Receptivity is 55.2 — slightly below Intent and Clarity. The biggest opportunity is not just explaining products, but showing why working with an advisor is useful right now.',
  },
  {
    n: 4,
    title: 'Verbal Engagement Still Signals Momentum',
    body: '7 of the 8 Tier 1 and Tier 2 prospects show Medium or High verbosity. The more engaged prospects are giving you more to work with — use that signal to prioritize outreach and tailor the first conversation.',
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
    body: '5 of 11 prospects (45.5%) sit in Tier 2 — the largest segment. These are the best “move next” candidates: interested enough to engage, but still needing reframing, confidence, or clearer next steps.',
  },
  {
    n: 8,
    title: 'Tier 3 Should Stay in a Low-Touch Nurture Track',
    body: '3 of 11 prospects (27.3%) fall in Tier 3. These prospects are better suited to education, periodic check-ins, and lighter nurture rather than high-effort advisor time.',
  },
]
