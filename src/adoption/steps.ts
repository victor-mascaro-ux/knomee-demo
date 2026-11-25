/* The adoption demo's story: its steps, its days, and the emails and alerts
 * the notes preview. Copy is the approved prototype's
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

export type ExtraKey =
  | 'sarahInvite'
  | 'alexNudge'
  | 'sarahReminder'
  | 'alexNudgeSent'
  | 'csDone'
  | 'csRoi'

export interface Step {
  id: StepId
  /** The day the notes' timeline files it under. */
  day: string
  title: string
  /** The side path: what happens only if Alex invites no one. */
  branch?: boolean
  /** Alex's effort on the main path, added up in the notes. */
  clicks: number
  mins: number
  what: string
  /** The emails and alerts this step previews in the notes. Sarah's
      reminder depends on whether Alex nudged her first. */
  extras: (nudged: boolean) => ExtraKey[]
  /** The hint under the step; <b> marks the control to click. */
  tryIt: string
}

export const STEPS: Step[] = [
  {
    id: 'first-login',
    day: 'Day 0',
    title: 'First login',
    clicks: 1,
    mins: 0,
    what: 'Alex, a new advisor at Acme, logs in for the first time. His dashboard is empty.',
    extras: () => [],
    tryIt: 'Click <b>Show me</b> on the banner.',
  },
  {
    id: 'first-send',
    day: 'Day 0',
    title: 'First invite',
    clicks: 2,
    mins: 1,
    what: 'Alex invites one person he’s meeting this week.',
    extras: () => ['sarahInvite'],
    tryIt: 'Click <b>Invite</b>, then <b>Send</b>.',
  },
  {
    id: 'if-day2',
    day: 'Day 2',
    title: 'No invite yet: a reminder',
    branch: true,
    clicks: 0,
    mins: 0,
    what: 'Alex hasn’t invited anyone since Monday.',
    extras: () => ['alexNudge'],
    tryIt: 'Wait for the email, then click <b>Invite a Prospect</b> or close it.',
  },
  {
    id: 'if-day4',
    day: 'Day 4',
    title: 'Still no invite: one question',
    branch: true,
    clicks: 0,
    mins: 0,
    what: 'Still no invites. Alex logs in.',
    extras: () => [],
    tryIt: 'Pick an answer.',
  },
  {
    id: 'if-day7',
    day: 'Day 7',
    title: 'A week, no invite: Gayathri calls',
    branch: true,
    clicks: 0,
    mins: 0,
    what: 'A week since Alex logged in, and still no invites.',
    extras: () => [],
    tryIt: 'Click the notification.',
  },
  {
    id: 'sarah-explores',
    day: 'Day 2',
    title: 'Sarah stops halfway',
    clicks: 0,
    mins: 0,
    what: 'Sarah started the check-in, then got busy.',
    extras: (nudged) => [nudged ? 'alexNudgeSent' : 'sarahReminder'],
    tryIt: 'Click <b>Nudge</b> on Sarah’s row, or do nothing.',
  },
  {
    id: 'results-land',
    day: 'Day 3',
    title: 'Sarah finishes',
    clicks: 1,
    mins: 3,
    what: 'Sarah finished. Alex needs to know before they meet.',
    extras: () => ['csDone'],
    tryIt: 'Click <b>Sarah Mitchell</b> in the table.',
  },
  {
    id: 'after-meeting',
    day: 'Day 4',
    title: 'How did it go?',
    clicks: 2,
    mins: 0.5,
    what: 'Alex is back. He read Sarah’s playbook yesterday.',
    extras: () => ['csRoi'],
    tryIt: 'Tap an answer, add a detail, then <b>Invite another prospect</b>.',
  },
  {
    id: 'habit',
    day: 'Week 3',
    title: 'Making it a habit',
    clicks: 2,
    mins: 0.5,
    what: 'Three weeks in. Alex has invited 4 people, each time because he remembered. Now his calendar does the remembering.',
    extras: () => [],
    tryIt: 'Click <b>Connect calendar</b>, then <b>Send Check-In</b>.',
  },
]

export const stepIndex = (id: string | null | undefined) => STEPS.findIndex((s) => s.id === id)

/* ── The days ──────────────────────────────────────────────────────────────
   Each new day opens with an intro screen: a timeline of the days, then what
   happens in this one. The main lane runs along the top; the side lane under
   it is what happens only if Alex invites no one. */

export const COLS: [string, string][] = [
  ['Day 0', 'Mon'],
  ['Day 2', 'Wed'],
  ['Day 3', 'Thu'],
  ['Day 4', 'Fri'],
  ['Day 7', 'Mon'],
  ['Week 3', 'Dec 14'],
]

export interface Day {
  lane: 'main' | 'side'
  col: number
  head: string
  pill: string
  /** The steps the day holds, by index. */
  steps: number[]
  /** When, then what happens. */
  items: [string, string][]
}

export const DAYS: Day[] = [
  {
    lane: 'main',
    col: 0,
    head: 'Monday',
    pill: 'Day 0',
    steps: [0, 1],
    items: [
      ['Morning', 'Alex, an advisor at Acme, logs in to Knomee for the first time. His dashboard is empty.'],
      ['A minute later', 'He invites Sarah, someone he’s meeting this week.'],
    ],
  },
  {
    lane: 'side',
    col: 1,
    head: 'Wednesday',
    pill: 'Day 2 · if Alex invites no one',
    steps: [2],
    items: [
      ['Morning', 'Alex hasn’t invited anyone since Monday.'],
      ['9 am', 'Knomee emails him a reminder.'],
    ],
  },
  {
    lane: 'side',
    col: 3,
    head: 'Friday',
    pill: 'Day 4 · if Alex still invites no one',
    steps: [3],
    items: [
      ['When he logs in', 'His dashboard asks what would help him send his first invite.'],
      ['Then', 'Depending on his answer, he sees the email, the Knomee team hears from him, or he tells us more.'],
    ],
  },
  {
    lane: 'side',
    col: 4,
    head: 'Monday',
    pill: 'Day 7 · if a week goes by',
    steps: [4],
    items: [
      ['9 am', 'Gayathri gets an alert in #acme-pilot.'],
      ['That day', 'She calls Alex.'],
    ],
  },
  {
    lane: 'main',
    col: 1,
    head: 'Wednesday',
    pill: 'Day 2',
    steps: [5],
    items: [
      ['Afternoon', 'Sarah starts her check-in, then gets busy.'],
      ['Right away', 'Alex can nudge her himself. If he doesn’t, Knomee sends her a reminder the next morning.'],
    ],
  },
  {
    lane: 'main',
    col: 2,
    head: 'Thursday',
    pill: 'Day 3',
    steps: [6],
    items: [
      ['Morning', 'Sarah finishes her check-in.'],
      ['Next login', 'Alex is shown where to find her playbook.'],
    ],
  },
  {
    lane: 'main',
    col: 3,
    head: 'Friday',
    pill: 'Day 4',
    steps: [7],
    items: [
      ['Next login', 'Alex read Sarah’s playbook yesterday. Knomee doesn’t know when they meet.'],
      ['Right away', 'One question about how it went, then an ask to invite the next prospect.'],
    ],
  },
  {
    lane: 'main',
    col: 5,
    head: 'Three weeks in',
    pill: 'Week 3',
    steps: [8],
    items: [
      ['Week 3', 'Alex has invited four prospects, each time because he remembered.'],
      ['Then', 'He connects his calendar. From now on, every meeting with someone new comes with a check-in ready to send.'],
    ],
  },
]

export const dayOf = (i: number) => DAYS.findIndex((d) => d.steps.includes(i))

/** The first step of the next day, when step i ends its day; else null. */
export function nextDayStart(i: number): number | null {
  const d = dayOf(i)
  if (d < 0 || d === DAYS.length - 1 || DAYS[d].steps[DAYS[d].steps.length - 1] !== i) return null
  return DAYS[d + 1].steps[0]
}

/** Alex's effort up to step i, on the main path. */
export function effortTo(i: number) {
  let clicks = 0
  let mins = 0
  for (let k = 0; k <= i; k++) {
    if (STEPS[k].branch) continue
    clicks += STEPS[k].clicks
    mins += STEPS[k].mins
  }
  return { clicks, mins: Math.max(1, Math.round(mins)) }
}

/* ── Emails and alerts ─────────────────────────────────────────────────────
   Emails Alex sends come from his own address. Knomee's own come from
   notifications@knomee.com. Knomee never sends on Alex's behalf. */

export const ALEX = { name: 'Alex Advisor', address: 'alex@acmeadvisors.com', firm: 'Acme Advisors' }
export const KNOMEE = { name: 'Knomee', address: 'notifications@knomee.com' }

/** The note Alex sends with his first invite. {first} is the person's first name. */
export const NOTE_TEXT =
  'Hi {first},\n\nI’m looking forward to meeting you.\n\nBefore we do, take about 8 minutes for this short check-in. It helps you organize your thoughts and uncover your top three money questions, and you’ll get a personal summary to keep.\n\nWe’ll skip the basic fact-finding and spend our time on the questions and goals that matter most to you.'

export interface DemoEmail {
  kind: 'email'
  /** The window's title: whose inbox it lands in. */
  head: string
  from: string
  org: string
  /** Who sent it: Alex himself, or Knomee. */
  by: 'alex' | 'knomee'
  to: string
  toEmail: string
  time: string
  subj: string | null
  full: string | null
  cta: string
  sign: string
}

export interface DemoAlert {
  kind: 'slack'
  body: string
}

export const EXTRAS: Record<ExtraKey, DemoEmail | DemoAlert> = {
  sarahInvite: {
    kind: 'email',
    head: 'Sarah’s inbox',
    from: ALEX.name,
    org: ALEX.address,
    by: 'alex',
    to: 'Sarah Mitchell',
    toEmail: 'sara.mitchell@email.com',
    time: 'Mon, Nov 30, 9:41 AM',
    subj: 'Before we meet',
    full: null,
    cta: 'Start Your Check-In →',
    sign: `Best,\n${ALEX.name}\n${ALEX.firm}`,
  },
  alexNudge: {
    kind: 'email',
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
  },
  sarahReminder: {
    kind: 'email',
    head: 'Sarah’s inbox',
    from: KNOMEE.name,
    org: KNOMEE.address,
    by: 'knomee',
    to: 'Sarah Mitchell',
    toEmail: 'sara.mitchell@email.com',
    time: 'Thu, Dec 3, 8:00 AM',
    subj: 'Finish your check-in',
    full: 'Hi Sarah,\n\nYou’re partway through the check-in Alex Advisor sent you. It takes about 4 more minutes, and you’ll get your personal summary at the end. Alex will see your answers before you meet.',
    cta: 'Finish My Check-In',
    sign: 'The Knomee team',
  },
  alexNudgeSent: {
    kind: 'email',
    head: 'Sarah’s inbox',
    from: ALEX.name,
    org: ALEX.address,
    by: 'alex',
    to: 'Sarah Mitchell',
    toEmail: 'sara.mitchell@email.com',
    time: 'Wed, Dec 2, 2:14 PM',
    subj: null,
    full: null,
    cta: 'Finish My Check-In',
    sign: 'Alex',
  },
  csDone: { kind: 'slack', body: 'Sarah Mitchell finished (Alex).' },
  csRoi: { kind: 'slack', body: 'Alex: Knomee helped with Sarah.' },
}

/** What Alex actually sent, once he has: it replaces the sample in the notes. */
export interface SentEmail {
  first: string
  subject: string
  body: string
}

export const firstName = (n: string) => String(n || '').trim().split(/\s+/)[0] || 'there'

/** An email's subject and body as they stand now: what Alex wrote, where he
    wrote it. */
export function emailContent(
  key: ExtraKey,
  sent: SentEmail | null,
  nudge?: { subject: string; body: string } | null,
): { e: DemoEmail; subj: string; full: string } {
  const e = EXTRAS[key] as DemoEmail
  let subj = e.subj ?? ''
  let full = e.full ?? ''
  if (key === 'alexNudgeSent' && nudge) {
    subj = nudge.subject
    full = nudge.body
  }
  if (key === 'sarahInvite') {
    const mine = sent && sent.first === 'Sarah' ? sent : null
    subj = mine ? mine.subject : 'Before we meet'
    full = mine ? mine.body : NOTE_TEXT.replace('{first}', 'Sarah')
  }
  return { e, subj, full }
}
