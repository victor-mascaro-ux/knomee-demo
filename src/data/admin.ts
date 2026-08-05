export interface Advisor {
  name: string
  region: string
  invited: number
  completed: number
  clients: number
  active: boolean // opened Knomee in the last 30 days
  daysSinceActive: number
}

// Fabricated sample book for the manager (admin) view: 100 advisors under
// one practice group. Numbers roll up into `adminSummary` below.
export const advisors: Advisor[] = [
  { name: 'Alex Nakamura', region: 'Northeast', invited: 51, completed: 51, clients: 18, active: true, daysSinceActive: 2 },
  { name: 'Drew Abadi', region: 'Mountain', invited: 63, completed: 40, clients: 18, active: true, daysSinceActive: 3 },
  { name: 'Elliot Kim', region: 'Great Lakes', invited: 70, completed: 42, clients: 17, active: true, daysSinceActive: 2 },
  { name: 'Hayden Blanc', region: 'South Central', invited: 79, completed: 36, clients: 17, active: true, daysSinceActive: 4 },
  { name: 'Harlow Walsh', region: 'Pacific', invited: 35, completed: 34, clients: 17, active: true, daysSinceActive: 6 },
  { name: 'Frankie Okafor', region: 'Northeast', invited: 74, completed: 47, clients: 15, active: true, daysSinceActive: 3 },
  { name: 'Logan Karlsson', region: 'Northeast', invited: 68, completed: 40, clients: 14, active: true, daysSinceActive: 0 },
  { name: 'Avery Nakamura', region: 'Great Lakes', invited: 71, completed: 60, clients: 13, active: true, daysSinceActive: 3 },
  { name: 'Casey Grant', region: 'Midwest', invited: 45, completed: 45, clients: 13, active: true, daysSinceActive: 7 },
  { name: 'Ellis Flores', region: 'Northeast', invited: 35, completed: 35, clients: 13, active: true, daysSinceActive: 0 },
  { name: 'Tatum Mendez', region: 'Mountain', invited: 45, completed: 45, clients: 11, active: true, daysSinceActive: 3 },
  { name: 'Alex Adebayo', region: 'Southeast', invited: 41, completed: 41, clients: 11, active: true, daysSinceActive: 7 },
  { name: 'Tatum Popov', region: 'Northeast', invited: 72, completed: 41, clients: 11, active: true, daysSinceActive: 3 },
  { name: 'Wren Ivanov', region: 'South Central', invited: 41, completed: 25, clients: 10, active: true, daysSinceActive: 9 },
  { name: 'Morgan Kim', region: 'Great Lakes', invited: 39, completed: 39, clients: 9, active: true, daysSinceActive: 4 },
  { name: 'Peyton Yildiz', region: 'Mountain', invited: 70, completed: 55, clients: 8, active: true, daysSinceActive: 3 },
  { name: 'Noel Bruno', region: 'South Central', invited: 50, completed: 41, clients: 8, active: true, daysSinceActive: 1 },
  { name: 'Kai Tanaka', region: 'Southeast', invited: 67, completed: 36, clients: 8, active: true, daysSinceActive: 5 },
  { name: 'Indigo Lopez', region: 'Northeast', invited: 64, completed: 58, clients: 7, active: true, daysSinceActive: 6 },
  { name: 'Harper Nakamura', region: 'Midwest', invited: 62, completed: 56, clients: 7, active: true, daysSinceActive: 6 },
  { name: 'Nico Blanc', region: 'South Central', invited: 76, completed: 45, clients: 7, active: true, daysSinceActive: 4 },
  { name: 'Skyler Ivanov', region: 'Pacific', invited: 46, completed: 46, clients: 6, active: true, daysSinceActive: 2 },
  { name: 'Nico Cohen', region: 'South Central', invited: 38, completed: 38, clients: 6, active: true, daysSinceActive: 5 },
  { name: 'Noel Marino', region: 'Pacific', invited: 38, completed: 30, clients: 6, active: true, daysSinceActive: 6 },
  { name: 'Drew Marino', region: 'Midwest', invited: 39, completed: 26, clients: 6, active: true, daysSinceActive: 17 },
  { name: 'Emerson Fischer', region: 'Great Lakes', invited: 28, completed: 25, clients: 6, active: true, daysSinceActive: 10 },
  { name: 'Sage Sato', region: 'Northeast', invited: 26, completed: 21, clients: 6, active: true, daysSinceActive: 5 },
  { name: 'Brooke Patel', region: 'Great Lakes', invited: 31, completed: 18, clients: 6, active: true, daysSinceActive: 5 },
  { name: 'Parker Silva', region: 'Southeast', invited: 20, completed: 9, clients: 6, active: true, daysSinceActive: 17 },
  { name: 'Hayden Garcia', region: 'West', invited: 27, completed: 7, clients: 6, active: true, daysSinceActive: 10 },
  { name: 'Jamie Costa', region: 'South Central', invited: 35, completed: 19, clients: 5, active: true, daysSinceActive: 2 },
  { name: 'Avery Horvat', region: 'West', invited: 39, completed: 18, clients: 5, active: true, daysSinceActive: 18 },
  { name: 'Cameron Fischer', region: 'Mountain', invited: 18, completed: 18, clients: 5, active: true, daysSinceActive: 19 },
  { name: 'Emerson Ivanov', region: 'West', invited: 27, completed: 15, clients: 5, active: true, daysSinceActive: 20 },
  { name: 'Rowan Kim', region: 'Midwest', invited: 10, completed: 10, clients: 5, active: true, daysSinceActive: 21 },
  { name: 'Frankie Andersson', region: 'Great Lakes', invited: 32, completed: 23, clients: 4, active: true, daysSinceActive: 7 },
  { name: 'Micah Larsen', region: 'Midwest', invited: 38, completed: 22, clients: 4, active: true, daysSinceActive: 3 },
  { name: 'Toby Sato', region: 'Great Lakes', invited: 33, completed: 22, clients: 4, active: true, daysSinceActive: 17 },
  { name: 'Harlow Klein', region: 'West', invited: 14, completed: 14, clients: 4, active: true, daysSinceActive: 2 },
  { name: 'Reese Rossi', region: 'Midwest', invited: 31, completed: 13, clients: 4, active: true, daysSinceActive: 3 },
  { name: 'Oakley Costa', region: 'Great Lakes', invited: 12, completed: 12, clients: 4, active: true, daysSinceActive: 10 },
  { name: 'Cameron Patel', region: 'Northeast', invited: 17, completed: 10, clients: 4, active: true, daysSinceActive: 21 },
  { name: 'Peyton Novak', region: 'Great Lakes', invited: 40, completed: 26, clients: 3, active: true, daysSinceActive: 19 },
  { name: 'Lennon Jensen', region: 'Northeast', invited: 36, completed: 23, clients: 3, active: true, daysSinceActive: 0 },
  { name: 'Peyton Abadi', region: 'Mountain', invited: 21, completed: 20, clients: 3, active: true, daysSinceActive: 9 },
  { name: 'River Tanaka', region: 'Mountain', invited: 31, completed: 19, clients: 3, active: true, daysSinceActive: 12 },
  { name: 'Parker Klein', region: 'Pacific', invited: 19, completed: 19, clients: 3, active: true, daysSinceActive: 15 },
  { name: 'Brooke Fischer', region: 'Mountain', invited: 18, completed: 16, clients: 3, active: true, daysSinceActive: 19 },
  { name: 'Rowan Fischer', region: 'Southeast', invited: 20, completed: 13, clients: 3, active: true, daysSinceActive: 12 },
  { name: 'Wren Flores', region: 'Northeast', invited: 30, completed: 13, clients: 3, active: true, daysSinceActive: 14 },
  { name: 'Avery Bruno', region: 'South Central', invited: 27, completed: 11, clients: 3, active: true, daysSinceActive: 16 },
  { name: 'Oakley Fischer', region: 'Midwest', invited: 29, completed: 26, clients: 2, active: true, daysSinceActive: 17 },
  { name: 'Taylor Dupont', region: 'Northeast', invited: 39, completed: 22, clients: 2, active: true, daysSinceActive: 1 },
  { name: 'Casey Larsen', region: 'Mountain', invited: 37, completed: 20, clients: 2, active: true, daysSinceActive: 1 },
  { name: 'Greer Fischer', region: 'Northeast', invited: 18, completed: 17, clients: 2, active: true, daysSinceActive: 19 },
  { name: 'Elliot Okafor', region: 'Mountain', invited: 32, completed: 16, clients: 2, active: true, daysSinceActive: 21 },
  { name: 'Frankie Nguyen', region: 'Great Lakes', invited: 16, completed: 8, clients: 2, active: true, daysSinceActive: 13 },
  { name: 'Skyler Rossi', region: 'West', invited: 37, completed: 23, clients: 1, active: true, daysSinceActive: 1 },
  { name: 'Greer Kim', region: 'Pacific', invited: 23, completed: 17, clients: 1, active: true, daysSinceActive: 16 },
  { name: 'Emerson Jensen', region: 'Mountain', invited: 29, completed: 16, clients: 1, active: true, daysSinceActive: 7 },
  { name: 'Ellis Fischer', region: 'Pacific', invited: 14, completed: 14, clients: 1, active: true, daysSinceActive: 7 },
  { name: 'Kendall Dupont', region: 'Pacific', invited: 23, completed: 10, clients: 1, active: true, daysSinceActive: 9 },
  { name: 'Frankie Petrov', region: 'West', invited: 10, completed: 9, clients: 1, active: true, daysSinceActive: 4 },
  { name: 'Rowan Novak', region: 'South Central', invited: 18, completed: 7, clients: 1, active: true, daysSinceActive: 19 },
  { name: 'Marlow Garcia', region: 'Mountain', invited: 3, completed: 3, clients: 1, active: false, daysSinceActive: 78 },
  { name: 'Elliot Sato', region: 'Southeast', invited: 10, completed: 3, clients: 1, active: true, daysSinceActive: 61 },
  { name: 'Frankie Grant', region: 'Mountain', invited: 10, completed: 3, clients: 1, active: false, daysSinceActive: 31 },
  { name: 'Jordan Weber', region: 'Midwest', invited: 10, completed: 2, clients: 1, active: false, daysSinceActive: 49 },
  { name: 'Logan Cohen', region: 'Mountain', invited: 8, completed: 2, clients: 1, active: true, daysSinceActive: 73 },
  { name: 'Micah Schmidt', region: 'Southeast', invited: 4, completed: 1, clients: 1, active: true, daysSinceActive: 33 },
  { name: 'Frankie Haddad', region: 'Mountain', invited: 9, completed: 1, clients: 1, active: false, daysSinceActive: 20 },
  { name: 'Riley Andersson', region: 'Southeast', invited: 8, completed: 1, clients: 1, active: true, daysSinceActive: 88 },
  { name: 'Riley Moreau', region: 'Great Lakes', invited: 11, completed: 3, clients: 0, active: false, daysSinceActive: 55 },
  { name: 'Taylor Schmidt', region: 'Pacific', invited: 4, completed: 3, clients: 0, active: false, daysSinceActive: 87 },
  { name: 'Noel Garcia', region: 'Great Lakes', invited: 9, completed: 3, clients: 0, active: false, daysSinceActive: 68 },
  { name: 'Alex Bauer', region: 'South Central', invited: 9, completed: 3, clients: 0, active: false, daysSinceActive: 54 },
  { name: 'Elliot Rossi', region: 'Great Lakes', invited: 12, completed: 2, clients: 0, active: false, daysSinceActive: 70 },
  { name: 'Sam Bruno', region: 'Pacific', invited: 8, completed: 2, clients: 0, active: false, daysSinceActive: 55 },
  { name: 'Presley Okafor', region: 'South Central', invited: 8, completed: 2, clients: 0, active: true, daysSinceActive: 49 },
  { name: 'Parker Rossi', region: 'Midwest', invited: 12, completed: 1, clients: 0, active: true, daysSinceActive: 27 },
  { name: 'Marlow Petrov', region: 'Northeast', invited: 12, completed: 1, clients: 0, active: false, daysSinceActive: 58 },
  { name: 'Kai Silva', region: 'Midwest', invited: 2, completed: 0, clients: 0, active: false, daysSinceActive: 107 },
  { name: 'Avery Abadi', region: 'South Central', invited: 4, completed: 0, clients: 0, active: false, daysSinceActive: 67 },
  { name: 'Jordan Patel', region: 'West', invited: 1, completed: 0, clients: 0, active: false, daysSinceActive: 174 },
  { name: 'Elliot Costa', region: 'Pacific', invited: 8, completed: 0, clients: 0, active: true, daysSinceActive: 65 },
  { name: 'Jordan Bruno', region: 'Mountain', invited: 7, completed: 0, clients: 0, active: false, daysSinceActive: 68 },
  { name: 'Quinn Lopez', region: 'South Central', invited: 4, completed: 0, clients: 0, active: false, daysSinceActive: 112 },
  { name: 'Kendall Tanaka', region: 'Southeast', invited: 6, completed: 0, clients: 0, active: false, daysSinceActive: 28 },
  { name: 'Noel Andersson', region: 'South Central', invited: 3, completed: 0, clients: 0, active: false, daysSinceActive: 135 },
  { name: 'Harlow Karlsson', region: 'Pacific', invited: 0, completed: 0, clients: 0, active: false, daysSinceActive: 152 },
  { name: 'Finley Marino', region: 'Northeast', invited: 4, completed: 0, clients: 0, active: false, daysSinceActive: 32 },
  { name: 'Corey Farah', region: 'West', invited: 3, completed: 0, clients: 0, active: false, daysSinceActive: 25 },
  { name: 'Dakota Flores', region: 'Great Lakes', invited: 2, completed: 0, clients: 0, active: false, daysSinceActive: 86 },
  { name: 'Jordan Bauer', region: 'Southeast', invited: 6, completed: 0, clients: 0, active: false, daysSinceActive: 72 },
  { name: 'Kendall Popov', region: 'Northeast', invited: 2, completed: 0, clients: 0, active: false, daysSinceActive: 125 },
  { name: 'Parker Andersson', region: 'Great Lakes', invited: 0, completed: 0, clients: 0, active: false, daysSinceActive: 107 },
  { name: 'Jules Flores', region: 'South Central', invited: 3, completed: 0, clients: 0, active: false, daysSinceActive: 94 },
  { name: 'Brooke Klein', region: 'Great Lakes', invited: 3, completed: 0, clients: 0, active: true, daysSinceActive: 86 },
  { name: 'Casey Weber', region: 'Pacific', invited: 4, completed: 0, clients: 0, active: false, daysSinceActive: 58 },
  { name: 'Parker Larsen', region: 'Midwest', invited: 0, completed: 0, clients: 0, active: false, daysSinceActive: 52 },
]

// ── Derived roll-ups (computed so the tiles can never drift from the list) ──
const sum = (f: (a: Advisor) => number) => advisors.reduce((t, a) => t + f(a), 0)

export const adminSummary = {
  seats: advisors.length,
  activated: advisors.filter((a) => a.invited > 0).length, // invited >=1 prospect
  active30: advisors.filter((a) => a.active).length, // opened Knomee in last 30d
  producing: advisors.filter((a) => a.clients > 0).length, // converted >=1 client
  invited: sum((a) => a.invited),
  completed: sum((a) => a.completed),
  clients: sum((a) => a.clients),
  get convRate() {
    return Math.round((this.clients / this.completed) * 100)
  },
}

// Adoption funnel — where advisors fall out of using the product at all.
// This is about the *advisors*, not their prospects.
export const adoptionStages: { stage: string; count: number; note: string }[] = [
  { stage: 'Seats assigned', count: adminSummary.seats, note: 'Licences provisioned' },
  { stage: 'Activated', count: adminSummary.activated, note: 'Invited at least one prospect' },
  { stage: 'Active this month', count: adminSummary.active30, note: 'Opened Knomee in last 30 days' },
  { stage: 'Producing clients', count: adminSummary.producing, note: 'Converted at least one client' },
]

// Conversion-rate distribution across advisors who have completed profiles to
// judge on — the spread is the story, not the average.
export interface ConvBucket {
  label: string
  lo: number
  hi: number
  count: number
}

const RATED = advisors.filter((a) => a.completed > 0)
const rate = (a: Advisor) => (a.clients / a.completed) * 100
export const convDistribution: ConvBucket[] = [
  { label: '0%', lo: 0, hi: 0.001, count: 0 },
  { label: '1–15%', lo: 0.001, hi: 15, count: 0 },
  { label: '15–25%', lo: 15, hi: 25, count: 0 },
  { label: '25–40%', lo: 25, hi: 40, count: 0 },
  { label: '40%+', lo: 40, hi: 1000, count: 0 },
].map((b) => ({ ...b, count: RATED.filter((a) => rate(a) >= b.lo && rate(a) < b.hi).length }))

export const unactivated = advisors.filter((a) => a.invited === 0)

