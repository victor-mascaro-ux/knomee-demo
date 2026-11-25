/* The adoption demo's state: who is in Alex's book at each step, and what is
 * on screen when a step opens. A step always opens the same way, whichever
 * way you reach it (Next, Back, the timeline, a link), as the prototype does.
 */

import { prospects, type Prospect } from '../data/prospects'
import type { BookStats } from './kit'
import type { StepId } from './steps'

/** A row of Alex's book. `fresh` rows have just arrived and flash once. */
export interface DemoRow extends Prospect {
  id: string
  fresh?: boolean
}

/* Sarah is the product's own Sarah Mitchell (data/prospects.ts): her answers,
   her scores, her photo. The demo only moves her along the story — invited,
   halfway, finished — and dates her on its calendar. */
const SARAH = prospects.find((p) => p.name === 'Sarah Mitchell') as Prospect

const unscored = {
  kq: null,
  intent: null,
  clarity: null,
  receptivity: null,
  tier: 'incomplete' as const,
}

export function sarahInvited(email = SARAH.email): DemoRow {
  return {
    ...SARAH,
    ...unscored,
    id: 'sarah',
    email,
    signUpLabel: 'Invited',
    signUp: '11/30/2026',
    topAction: 'Invited',
    isNew: false,
  }
}

function sarahProgress(): DemoRow {
  return {
    ...SARAH,
    ...unscored,
    id: 'sarah',
    signUpLabel: 'Started',
    signUp: '12/01/2026',
    topAction: '2 of 5 done',
    isNew: false,
  }
}

function sarahDone(isNew: boolean): DemoRow {
  return { ...SARAH, id: 'sarah', signUpLabel: undefined, signUp: '12/03/2026', isNew }
}

/** Someone Alex invites later: invited today, nothing answered yet. */
export function invitedRow(id: string, name: string, email: string, date: string): DemoRow {
  return { id, name, email, ...unscored, signUpLabel: 'Invited', signUp: date, topAction: 'Invited' }
}

const DANIEL: DemoRow = {
  id: 'daniel',
  name: 'Daniel Ortiz',
  email: 'd.ortiz@example.com',
  kq: 62,
  intent: 70,
  clarity: 55,
  receptivity: 61,
  signUp: '12/09/2026',
  topAction: 'Ask what “enough” means',
  tier: 'tier2',
}

const PRIYA: DemoRow = {
  id: 'priya',
  name: 'Priya Nair',
  email: 'priya.nair@example.com',
  ...unscored,
  signUpLabel: 'Started',
  signUp: '12/11/2026',
  topAction: '3 of 5 done',
}

/** Who is in Alex's book when a step opens. */
export function rowsFor(id: StepId): DemoRow[] {
  switch (id) {
    case 'sarah-explores':
      return [sarahProgress()]
    case 'results-land':
      return [sarahDone(true)]
    case 'after-meeting':
      return [sarahDone(false)]
    case 'habit':
      return [
        sarahDone(false),
        { ...DANIEL },
        { ...PRIYA },
        invitedRow('sam', 'Sam Patel', 'sam.patel@example.com', '12/14/2026'),
      ]
    default:
      return []
  }
}

/** Top Line Metrics for the demo's book, worked out the way the product works
    out its own (data/prospects.ts). */
export function statsOf(rows: Prospect[]): BookStats {
  const scored = rows.filter((p) => p.kq !== null)
  const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)
  const tierKQ = (t: Prospect['tier']) => mean(rows.filter((p) => p.tier === t && p.kq !== null).map((p) => p.kq as number))
  const count = (t: Prospect['tier']) => rows.filter((p) => p.tier === t).length
  return {
    total: rows.length,
    scored: scored.length,
    avgKQ: mean(scored.map((p) => p.kq as number)),
    avgIntent: mean(scored.map((p) => p.intent as number)),
    avgClarity: mean(scored.map((p) => p.clarity as number)),
    avgReceptivity: mean(scored.map((p) => p.receptivity as number)),
    byTier: {
      tier1: count('tier1'),
      tier2: count('tier2'),
      tier3: count('tier3'),
      incomplete: count('incomplete'),
    },
    avgKQByTier: { tier1: tierKQ('tier1'), tier2: tierKQ('tier2'), tier3: tierKQ('tier3') },
  }
}

/** The person an invite is going to. */
export interface InviteTarget {
  name: string
  email: string
  /** Sarah is in the book already, so this is the next one. */
  next: boolean
}

/** What is on screen at a step, beyond the book itself. */
export interface Ui {
  /** Intercom's welcome banner (Day 0). */
  welcome: boolean
  /** Intercom's tip beside the Invite button. */
  tip: boolean
  /** The dashboard's modal: the invite, Alex's reminder email (Day 2), or
      the one question (Day 4). */
  modal: 'invite' | 'mail' | 'ask' | null
  invite: InviteTarget | null
  /** What arrives on its own, a moment after the step opens. */
  auto: 'mail' | 'ask' | 'notif' | null
  /** The advisor's app, or the Knomee team's chat (Day 7, or Day 4's "talk
      it through"). */
  view: 'app' | 'chat'
  chat: 'week' | 'help'
  /** The chat's desktop notification is up; once clicked, its message is
      highlighted. */
  notif: boolean
  notifOpen: boolean
  /** Day 4's question: the answer picked (-1: none yet), and the box for
      "Something else". */
  ask: { answer: number; text: string; sent: boolean }
  /** The step's story has played out: Next pulses. */
  done: boolean
}

export function freshUi(id: StepId): Ui {
  return {
    welcome: id === 'first-login',
    tip: id === 'first-send',
    modal: null,
    invite: null,
    auto: id === 'if-day2' ? 'mail' : id === 'if-day4' ? 'ask' : id === 'if-day7' ? 'notif' : null,
    view: id === 'if-day7' ? 'chat' : 'app',
    chat: 'week',
    notif: false,
    notifOpen: false,
    ask: { answer: -1, text: '', sent: false },
    done: false,
  }
}
