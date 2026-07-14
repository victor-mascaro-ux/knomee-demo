// Billing — "how much do I owe".
// Prospects are charged once (a higher, 4× rate); when a prospect becomes a
// client they're billed the standard rate annually from the next year.
export const CLIENT_ANNUAL_RATE = 60 // standard, per client per year
export const PROSPECT_ONE_TIME_RATE = CLIENT_ANNUAL_RATE * 4 // 4× the standard, once

export interface BillingLine {
  name: string
  email: string
  type: 'prospect' | 'client'
  cadence: 'one-time' | 'annual'
  amount: number
  invoice: string // invoice number
}

export const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
