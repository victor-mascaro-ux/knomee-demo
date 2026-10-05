/* The API store: what a firm can pull out of knomee into its own systems.
   Six read-only products, each a handful of GET endpoints with a sample
   response. Every id and figure is placeholder data. */

export const API_BASE = 'https://d9ex5bnx5k.execute-api.us-east-2.amazonaws.com'
export const API_DOCS = `${API_BASE}/v1/docs`

export type ApiEndpoint = { path: string; note: string; sample: unknown }

export type ApiProduct = {
  id: string
  name: string
  fields: string
  blurb: string
  subscribed: boolean
  endpoints: ApiEndpoint[]
}

export const apiProducts: ApiProduct[] = [
  {
    id: 'engagement',
    name: 'KnomeeEngagement',
    fields: 'Advisor Reliance, Activity, Referrals, Keywords',
    blurb: 'How often a client returns to knomee, what they lean on their advisor for, and who they refer.',
    subscribed: false,
    endpoints: [
      { path: '/v1/engagement/advisor-reliance', note: 'How much the client leans on their advisor', sample: { clientId: 'cl_8213', advisorReliance: 'high', score: 78, lastReviewedAt: '2026-08-14' } },
      { path: '/v1/engagement/activity', note: 'Sessions and adventures completed', sample: { clientId: 'cl_8213', sessions30d: 6, adventuresCompleted: 4, lastSeenAt: '2026-09-02' } },
      { path: '/v1/engagement/referrals', note: 'Referrals made and received', sample: { clientId: 'cl_8213', referralsMade: 2, referralsReceived: 0, referredBy: 'cl_7740' } },
      { path: '/v1/engagement/keywords', note: 'Words the client uses most', sample: { clientId: 'cl_8213', keywords: ['security', 'grandkids', 'travel'], source: 'Financial Joy' } },
    ],
  },
  {
    id: 'values',
    name: 'KnomeeValues',
    fields: 'Impact, Beliefs, Interests, Keywords',
    blurb: 'Values inclusive of ESG, Religion, Interests',
    subscribed: true,
    endpoints: [
      { path: '/v1/values/impact', note: 'ESG and impact investing preferences', sample: { clientId: 'cl_8213', esg: true, themes: ['clean energy', 'water'], excludes: ['tobacco'] } },
      { path: '/v1/values/beliefs', note: 'Religious and ethical positions', sample: { clientId: 'cl_8213', faithAligned: false, ethicalScreens: ['weapons'] } },
      { path: '/v1/values/interests', note: 'Declared interests and causes', sample: { clientId: 'cl_8213', interests: ['hiking', 'classical music', 'volunteering'] } },
      { path: '/v1/values/keywords', note: 'Value keywords pulled from answers', sample: { clientId: 'cl_8213', keywords: ['legacy', 'fairness'], confidence: 0.82 } },
    ],
  },
  {
    id: 'demographics',
    name: 'KnomeeDemographics',
    fields: 'Household, Gender, Location, Age',
    blurb: 'Numbers of household members, life events, geographic locations, age',
    subscribed: true,
    endpoints: [
      { path: '/v1/demographics/household', note: 'Household members and structure', sample: { clientId: 'cl_8213', householdSize: 4, members: [{ relation: 'partner', age: 54 }, { relation: 'child', age: 19 }] } },
      { path: '/v1/demographics/gender', note: 'Reported gender', sample: { clientId: 'cl_8213', gender: 'female', selfDescribed: null } },
      { path: '/v1/demographics/location', note: 'Geographic location', sample: { clientId: 'cl_8213', city: 'Austin', state: 'TX', country: 'US' } },
      { path: '/v1/demographics/age', note: 'Age and age band', sample: { clientId: 'cl_8213', age: 56, ageBand: '55-64' } },
      { path: '/v1/demographics/life-events', note: 'Recorded and expected life events', sample: { clientId: 'cl_8213', events: [{ type: 'retirement', expectedYear: 2031 }, { type: 'child_graduation', year: 2026 }] } },
    ],
  },
  {
    id: 'behaviors',
    name: 'KnomeeBehaviors',
    fields: 'Intent Audit, Next Gen Transitions, Plan Relevance',
    blurb: 'Aligned transactions, new behaviors, transitions',
    subscribed: false,
    endpoints: [
      { path: '/v1/behaviors/intent-audit', note: 'Stated intent against actual transactions', sample: { clientId: 'cl_8213', statedIntent: 'increase savings', observed: 'spending flat', aligned: false } },
      { path: '/v1/behaviors/next-gen-transitions', note: 'Wealth moving to the next generation', sample: { clientId: 'cl_8213', transitionExpected: true, beneficiaries: 2, horizonYears: 9 } },
      { path: '/v1/behaviors/plan-relevance', note: 'Whether the current plan still fits', sample: { clientId: 'cl_8213', planRelevance: 'drifting', lastPlanUpdate: '2024-11-02' } },
    ],
  },
  {
    id: 'goals',
    name: 'Goals',
    fields: 'Types, Changes, Readiness',
    blurb: 'Time Horizon, Short Term, Long Term, Retirement, Readiness',
    subscribed: true,
    endpoints: [
      { path: '/v1/goals', note: 'Every goal on file for a client', sample: { clientId: 'cl_8213', goals: [{ goalId: 'gl_31', type: 'retirement', readiness: 'ready' }, { goalId: 'gl_44', type: 'travel', readiness: 'exploring' }] } },
      { path: '/v1/goals/{goalId}', note: 'A single goal in full', sample: { goalId: 'gl_31', type: 'retirement', targetYear: 2031, targetAmount: 1400000, readiness: 'ready', drivenBy: 'partner' } },
      { path: '/v1/goals/readiness', note: 'Readiness to act on each goal', sample: { clientId: 'cl_8213', readiness: [{ goalId: 'gl_31', score: 81 }, { goalId: 'gl_44', score: 42 }] } },
      { path: '/v1/goals/time-horizon', note: 'Short term, long term and retirement horizons', sample: { clientId: 'cl_8213', shortTerm: 2, longTerm: 3, retirementYear: 2031 } },
    ],
  },
  {
    id: 'profile',
    name: 'KnomeeProfile',
    fields: 'Life Stage, Engagement',
    blurb: 'Deep level of detail into concrete financial life goals',
    subscribed: false,
    endpoints: [
      { path: '/v1/profile/{clientId}', note: 'The full Financial ID', sample: { clientId: 'cl_8213', financialId: { intent: 72, clarity: 64, receptivity: 58 }, kq: 64, lifeStage: 'pre-retirement' } },
      { path: '/v1/profile/{clientId}/life-stage', note: 'Current life stage', sample: { clientId: 'cl_8213', lifeStage: 'pre-retirement', since: '2025-03' } },
      { path: '/v1/profile/{clientId}/engagement', note: 'Engagement summary', sample: { clientId: 'cl_8213', engagementTier: 2, adventuresCompleted: 4, lastSeenAt: '2026-09-02' } },
    ],
  },
]

/* The left rail's filters. Ticking any item narrows the catalog to the
   product it belongs to. */
export const apiFacetGroups: { title: string; product: string; items: string[] }[] = [
  { title: 'Engagement', product: 'engagement', items: ['Advisor reliance', 'Knomee activity', 'Referrals', 'Keywords'] },
  { title: 'Knomee Values', product: 'values', items: ['Impact investments', 'Beliefs', 'Interests'] },
  { title: 'Knomee Demographics', product: 'demographics', items: ['Household', 'Gender', 'Location', 'Age', 'Life events'] },
  { title: 'Knomee Behaviors', product: 'behaviors', items: ['Intent vs. behavior audit', 'Next gen transitions', 'Plan relevance'] },
  { title: 'Goals', product: 'goals', items: ['Goal type', 'Readiness', 'Time horizon'] },
  { title: 'Knomee Profile', product: 'profile', items: ['Life stage', 'Engagement depth'] },
]

export function curlFor(path: string) {
  const hasPathParam = path.includes('{')
  const resolved = path.replace('{clientId}', 'cl_8213').replace('{goalId}', 'gl_31')
  const url = API_BASE + resolved + (hasPathParam ? '' : '?clientId=cl_8213')
  return `curl -X GET "${url}" \\\n  -H "Authorization: Bearer $KNOMEE_API_KEY"`
}
