// Real (anonymized) TypeForm respondent evidence, Sept 2025 – Apr 2026, from
// the five Knomee Adventures. Figures are the aggregate findings prepared in
// the analysis tabs of the source workbook — each Adventure is its own
// respondent population, so counts differ per card and don't join per-person.
// Percentages are the analysts' estimates (~) except TTM, which has exact counts.

export interface DistRow {
  label: string
  pct: number // bar width, 0–100
  display: string // value shown on the row
}

export interface EvidenceCard {
  key: string
  title: string
  adventure: string
  n: number
  informs: string // which segmentation model this Adventure feeds
  primary: { heading: string; rows: DistRow[] }
  secondary?: { heading: string; rows: DistRow[] }
  note?: string
}

export const evidenceMeta = {
  source: 'Anonymized TypeForm respondent evidence',
  period: 'Sep 2025 – Apr 2026',
}

const pctRow = (label: string, pct: number): DistRow => ({ label, pct, display: `${pct}%` })
const scoreRow = (label: string, score: number): DistRow => ({
  label,
  pct: Math.round((score / 5) * 100),
  display: score.toFixed(1),
})

export const evidence: EvidenceCard[] = [
  {
    key: 'ttm',
    title: 'Readiness to act',
    adventure: 'TTM Adventure',
    n: 434,
    informs: 'Vision × Readiness (C)',
    primary: {
      heading: 'Stage of change',
      rows: [
        { label: 'Contemplation', pct: 34, display: '34% · 147' },
        { label: 'Action', pct: 26, display: '26% · 113' },
        { label: 'Preparation', pct: 25, display: '25% · 108' },
        { label: 'Maintenance', pct: 12, display: '12% · 53' },
        { label: 'Pre-Contemplation', pct: 3, display: '3% · 13' },
      ],
    },
    note: 'Most prospects are still thinking, not yet acting — the readiness axis has real spread to sort on.',
  },
  {
    key: 'outlook',
    title: 'Concerns & hopes',
    adventure: 'Outlook Adventure',
    n: 382,
    informs: 'Context for every model',
    primary: {
      heading: 'Top concerns',
      rows: [
        pctRow('Retirement & running out of money', 65),
        pctRow('Personal or family health', 55),
        pctRow('Market volatility & the economy', 45),
        pctRow('Debt, cash flow & overspending', 40),
        pctRow('Job security & career', 35),
      ],
    },
    secondary: {
      heading: 'Top hopes',
      rows: [
        pctRow('Travel & new experiences', 70),
        pctRow('Retirement on their own terms', 60),
        pctRow('Family health & happiness', 55),
        pctRow('More quality time with family', 50),
        pctRow('Financial independence & security', 45),
      ],
    },
    note: '“Running out of money” is the loudest fear; travel and time with family are what they’re reaching for.',
  },
  {
    key: 'finjoy',
    title: 'What money is for',
    adventure: 'Financial Joy Adventure',
    n: 404,
    informs: 'Purpose × Posture (B)',
    primary: {
      heading: 'Money values (pick up to 3)',
      rows: [
        pctRow('Choice / Freedom', 72),
        pctRow('Security', 58),
        pctRow('Supporting my family', 55),
        pctRow('Comfort', 40),
        pctRow('Enjoying the moment', 35),
        pctRow('Status', 3),
      ],
    },
    secondary: {
      heading: 'Want MORE focus on…',
      rows: [
        pctRow('Family & relationships', 80),
        pctRow('Travel & adventure', 78),
        pctRow('Health & wellness', 70),
        pctRow('Work & career', 25),
      ],
    },
    note: 'Choice/Freedom dominates; Status is near-irrelevant (~3%). Work is the one area most want to dial down.',
  },
  {
    key: 'futureyou',
    title: 'Vision clarity',
    adventure: 'Future You Adventure',
    n: 400,
    informs: 'Life Domain (A) · Vision × Readiness (C)',
    primary: {
      heading: 'How clearly they see their future',
      rows: [
        pctRow('Fairly clear (4)', 45),
        pctRow('Moderately clear (3)', 25),
        pctRow('Crystal clear (5)', 22),
        pctRow('Somewhat unclear (2)', 6),
        pctRow('Very unclear (1)', 2),
      ],
    },
    secondary: {
      heading: 'Where “Future You” lives',
      rows: [
        pctRow('At the beach', 62),
        pctRow('In the mountains', 45),
        pctRow('Abroad', 42),
        pctRow('In the country', 35),
      ],
    },
    note: 'Average clarity 3.7/5 — most can picture the future but not the first step. The beach is the near-universal symbol.',
  },
  {
    key: 'confidence',
    title: 'Financial confidence',
    adventure: 'Confidence Adventure',
    n: 607,
    informs: 'Purpose × Posture (B) · Tension Tags (D)',
    primary: {
      heading: 'Overall confidence band',
      rows: [
        pctRow('Confident (20–22)', 33),
        pctRow('Moderately (17–19)', 30),
        pctRow('Below average (14–16)', 15),
        pctRow('Highly confident (23–25)', 12),
        pctRow('Low (10–13)', 8),
        pctRow('Very low (<10)', 2),
      ],
    },
    secondary: {
      heading: 'Average score by question (of 5)',
      rows: [
        scoreRow('An advisor improves my confidence', 4.2),
        scoreRow('I can achieve my goals', 3.9),
        scoreRow('I can weather a shock', 3.7),
        scoreRow('I spend on things that bring joy', 3.7),
        scoreRow('I regret / second-guess money moves', 3.1),
      ],
    },
    note: 'Belief in an advisor is the strongest signal (4.2); regret is the biggest hidden drag — even among the financially secure.',
  },
]
