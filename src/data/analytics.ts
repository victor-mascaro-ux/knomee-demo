// ── Conversion funnel (rendered as a sectored bar, like the tier distribution) ──
export interface FunnelStage {
  label: string
  count: number
  color: string
  desc: string
}

export const funnelStages: FunnelStage[] = [
  { label: 'Invited', count: 12, color: '#240446', desc: 'Prospects invited to complete the Knomee flow.' },
  { label: 'Signed up', count: 11, color: '#086375', desc: 'Started and saved the prospect questionnaire.' },
  { label: 'Scored', count: 11, color: '#6ba1ac', desc: 'Received a KQ score across Intent, Clarity & Receptivity.' },
  { label: 'Tier 1 ready', count: 3, color: '#b98ddc', desc: 'KQ 70–100 — ready for an advisor conversation.' },
  { label: 'Converted', count: 1, color: '#84cc16', desc: 'Became a paying client.' },
]

// ── UTM tracking (labels + keys per the Marketing settings) ──
export interface UtmKey {
  key: string
  label: string
}

export const utmKeys: UtmKey[] = [
  { key: 'utm_source', label: 'Where traffic came from' },
  { key: 'utm_medium', label: 'Marketing channel type' },
  { key: 'utm_campaign', label: 'Campaign name identifier' },
  { key: 'utm_term', label: 'Paid keyword targeted' },
  { key: 'utm_content', label: 'Ad creative variant' },
  { key: 'utm_id', label: 'Unique campaign ID' },
  { key: 'landing_page_url', label: 'First page visited' },
  { key: 'referrer_url', label: 'Referring website URL' },
  { key: 'first_touch_at', label: 'First visit timestamp' },
  { key: 'last_touch_at', label: 'Latest visit timestamp' },
]

// ── UTM breakdown (how prospects arrived) ──
export interface UtmBreakdown {
  key: string
  label: string
  values: { value: string; count: number }[]
}

export const utmBreakdowns: UtmBreakdown[] = [
  {
    key: 'utm_source',
    label: 'Where traffic came from',
    values: [
      { value: 'google', count: 4 },
      { value: 'linkedin', count: 3 },
      { value: 'referral', count: 3 },
      { value: 'direct', count: 2 },
    ],
  },
  {
    key: 'utm_medium',
    label: 'Marketing channel type',
    values: [
      { value: 'cpc', count: 4 },
      { value: 'social', count: 3 },
      { value: 'organic', count: 3 },
      { value: 'email', count: 2 },
    ],
  },
  {
    key: 'utm_campaign',
    label: 'Campaign name identifier',
    values: [
      { value: 'spring_growth', count: 5 },
      { value: 'legacy_2025', count: 4 },
      { value: 'brand_always_on', count: 3 },
    ],
  },
]
