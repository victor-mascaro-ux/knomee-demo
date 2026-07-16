// Billing — usage-based "pay as you grow" model.
//   · Active clients are charged a flat annual fee, per client per year.
//   · Each prospect→client conversion is charged once (one-time).
export const CLIENT_ANNUAL_RATE = 50 // per active client, per year
export const CONVERSION_RATE = 200 // per prospect→client conversion, one-time

export const currency = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })

// The advisor's book, as it drives billing this year.
export const billingBook = {
  activeClients: 12,
  conversionsThisYear: 3,
  paymentMethod: 'Visa ···· 4242',
  nextInvoice: 'Aug 12, 2026',
  // Estimated next year (dimmed projection card).
  estClientsNextYear: 15,
  estRenews: 'Jan 2, 2027',
}

export interface BillingHistoryRow {
  date: string
  item: string
  qty: number
  rate: number
  amount: number
  status: 'open' | 'paid'
}

// History reconciles with the usage cards: this year's open items are
//   3 conversions × $200 = $600  and  12 client fees × $50 = $600  → $1,200 due.
export const billingHistory: BillingHistoryRow[] = [
  { date: 'Jul 12, 2026', item: 'Prospect conversions', qty: 3, rate: 200, amount: 600, status: 'open' },
  { date: 'Jan 2, 2026', item: 'Annual client fees', qty: 12, rate: 50, amount: 600, status: 'open' },
  { date: 'Jun 5, 2025', item: 'Prospect conversions', qty: 2, rate: 200, amount: 400, status: 'paid' },
  { date: 'Jan 2, 2025', item: 'Annual client fees', qty: 9, rate: 50, amount: 450, status: 'paid' },
]

// Lifetime rollup shown on the history table's footer row — sum of the rows above.
export const billingLifetime = {
  clients: 12,
  conversions: 5,
  total: 2050,
}
