/* The adoption demo's story: its steps, and the copy of what happens in
 * them. Copy is the approved prototype's
 * (docs/adoption-demo/prototype.html), word for word, with two exceptions:
 * product and email buttons are Title Case, per the design system, and no
 * customer is named. Names and numbers are examples.
 */

export type StepId =
  | 'first-login'
  | 'first-send'
  | 'if-day2'
  | 'if-day4'
  | 'if-day7'
  | 'sarah-explores'
  | 'results-land'
  | 'after-meeting'
  | 'habit'

export interface Step {
  id: StepId
  /** The day the notes' timeline files it under. */
  day: string
  title: string
  /** The side path: what happens only if Alex invites no one. */
  branch?: boolean
  what: string
  /** The hint under the step; <b> marks the control to click. */
  tryIt: string
}

export const STEPS: Step[] = [
  {
    id: 'first-login',
    day: 'Day 0',
    title: 'First login',
    what: 'Alex, a new advisor at Acme, logs in for the first time. His dashboard is empty.',
    tryIt: 'Click <b>Show me</b> on the banner.',
  },
  {
    id: 'first-send',
    day: 'Day 0',
    title: 'First invite',
    what: 'Alex invites one person he’s meeting this week.',
    tryIt: 'Click <b>Invite</b>, <b>Copy</b> the link, then close the window.',
  },
  {
    id: 'if-day2',
    day: 'Day 2',
    title: 'No invite yet: a reminder',
    branch: true,
    what: 'Alex hasn’t invited anyone since Monday.',
    tryIt: 'Wait for the email, then click <b>Invite a Prospect</b> or close it.',
  },
  {
    id: 'if-day4',
    day: 'Day 4',
    title: 'Still no invite: one question',
    branch: true,
    what: 'Still no invites. Alex logs in.',
    tryIt: 'Pick an answer.',
  },
  {
    id: 'if-day7',
    day: 'Day 7',
    title: 'A week, no invite: Gayathri calls',
    branch: true,
    what: 'A week since Alex logged in, and still no invites.',
    tryIt: 'Click the notification.',
  },
  {
    id: 'sarah-explores',
    day: 'Day 2',
    title: 'Sarah stops halfway',
    what: 'Sarah started the check-in, then got busy.',
    tryIt: 'Click <b>Nudge</b> on Sarah’s row, or do nothing.',
  },
  {
    id: 'results-land',
    day: 'Day 3',
    title: 'Sarah finishes',
    what: 'Sarah finished. Alex needs to know before they meet.',
    tryIt: 'Click <b>Sarah Mitchell</b> in the table.',
  },
  {
    id: 'after-meeting',
    day: 'Day 4',
    title: 'How did it go?',
    what: 'Alex is back. He read Sarah’s playbook yesterday.',
    tryIt: 'Tap an answer, add a detail, then <b>Invite Another Prospect</b>.',
  },
  {
    id: 'habit',
    day: 'Week 3',
    title: 'Making it a habit',
    what: 'Three weeks in. Alex has invited 4 people, each time because he remembered. Now his calendar does the remembering.',
    tryIt: 'Click <b>Connect Calendar</b>, then <b>Send Check-In</b>.',
  },
]

export const stepIndex = (id: string | null | undefined) => STEPS.findIndex((s) => s.id === id)

/* ── Emails and alerts ─────────────────────────────────────────────────────
   Emails Alex sends come from his own address. Knomee's own come from
   notifications@knomee.com. Knomee never sends on Alex's behalf. */

export const ALEX = { name: 'Alex Advisor', address: 'alex@acmeadvisors.com', firm: 'Acme Advisors' }
export const KNOMEE = { name: 'Knomee', address: 'notifications@knomee.com' }

export interface DemoEmail {
  /** The window's title: whose inbox it lands in. */
  head: string
  from: string
  org: string
  /** Who sent it: Alex himself, or Knomee. */
  by: 'alex' | 'knomee'
  to: string
  toEmail: string
  time: string
  subj: string
  full: string
  cta: string
  sign: string
}

/** Day 2, if Alex has invited no one: Knomee's reminder, in his inbox. */
export const REMINDER: DemoEmail = {
  head: 'Alex’s inbox',
  from: KNOMEE.name,
  org: KNOMEE.address,
  by: 'knomee',
  to: ALEX.name,
  toEmail: ALEX.address,
  time: 'Wed, Dec 2, 9:00 AM',
  subj: 'Meeting a prospect this week?',
  full: 'Hi Alex,\n\nIf you’re meeting a prospect this week, send them a Knomee check-in first. They spend about 8 minutes on it, and before you meet you’ll see their goals, their worries, and the questions they want to ask you.',
  cta: 'Invite a Prospect',
  sign: 'The Knomee team',
}

/** Day 4's one question, and its four answers. */
export const ASK_QUESTION = 'What would help you send your first invite?'
export const ASK = [
  'See the email before it goes out',
  'Talk it through with someone',
  'I have no meetings coming up',
  'Something else',
]

/** Day 2: Alex's nudge to Sarah, as his draft starts. */
export const NUDGE = {
  subject: 'Your check-in',
  message:
    'Hi {{First Name}},\n\nI saw you started the check-in. It takes about 4 more minutes to finish, and I’d love to see your answers before we meet on Friday.',
  cta: 'Finish My Check-In',
  signoff: 'Alex',
}

/** Day 4: Intercom's survey, after Alex read Sarah's playbook. */
export const SURVEY_QUESTION = 'Did Knomee help with Sarah?'
export const SURVEY = ['Yes', 'A little', 'No']

/** Week 3: the meetings his calendar shows, once connected. */
export const CAL_MEETS = [
  { name: 'Jordan Lee', email: 'j.lee@example.com', when: 'Tue, Dec 15 · 10:00 AM' },
  { name: 'Nina Alvarez', email: 'nina.alvarez@example.com', when: 'Thu, Dec 17 · 3:30 PM' },
]
