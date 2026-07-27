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
