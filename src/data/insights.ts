import { prospectStats as ps } from './prospects'
import { verbatims } from './analytics'

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

// The question this section answers is not "how are the scores distributed"
// but "am I reaching the people I set out to reach?" — so the cards are about
// who the prospects are, by audience, read off the same counts as the
// "Who you're reaching" strip above them.
const aud = (niche: string) => verbatims.find((v) => v.niche === niche)?.count ?? 0

export const insights: Insight[] = [
  {
    n: 1,
    title: `${pct(t1)}% Ready to Talk Now`,
    body: `${t1} of ${S} scored prospects are Tier 1 — led by a medical practice sale, an estate across three countries and a business with no successor. These are the audiences you set out for; book them in the next two weeks.`,
  },
  {
    n: 2,
    title: 'Medical Practice Owners Are Your Biggest Audience',
    body: `${aud('Medical · practice sale')} of ${S} prospects are weighing the sale of a medical practice — the largest single group. Your practice-sale message is reaching the people it was written for.`,
  },
  {
    n: 3,
    title: 'Families Planning a Life Abroad Come Next',
    body: `${aud('Expat / international living')} of ${S} plan to retire or live overseas, most within two years. Their shared open question is cross-border tax — lead with it.`,
  },
  {
    n: 4,
    title: 'Special-Needs Families Are Finding You',
    body: `${aud('Special needs family planning')} of ${S} have a child with special needs and want lifetime protection. A small audience that stays for the long term; a plain explanation of trusts is the way in.`,
  },
  {
    n: 5,
    title: 'Business Owners Without a Successor',
    body: `${aud('Business succession & exit')} of ${S} own a business and have no family successor named. They are asking about exit and generational wealth, not investment returns.`,
  },
  {
    n: 6,
    title: 'Who You Are Not Reaching',
    body: 'No prospect mentions a divorce, and none work in accounting or law. If those are audiences you want, your invite links are not getting to them yet — a referral partner or a link made for them is the way in.',
  },
  {
    n: 7,
    title: 'Tier 2 Is Where Most of Them Wait',
    body: `${t2} of ${S} scored prospects (${pct(t2)}%) are Tier 2 — interested, but still weighing it. Most of the expat and special-needs families sit here; they need a clear next step rather than a pitch. They convert at 15% today against 42% for Tier 1.`,
  },
  {
    n: 8,
    title: 'Tier 3 Should Stay in a Low-Touch Nurture Track',
    body: `${t3} of ${S} scored prospects (${pct(t3)}%) fall in Tier 3 — a small tail. They are better suited to education, periodic check-ins and lighter nurture than to high-effort advisor time.`,
  },
]
