/* The advisor flow, answered by whoever is holding the phone.
 *
 * `advisorFlow.ts` carries one worked example — Marcus Hale, pre-filled, there
 * to be clicked through. This module is the other half: somewhere to put YOUR
 * answers, and the rules that turn them into the three artefacts those eight
 * minutes are supposed to produce — a Business ID, a readiness read, and a
 * Recruiting Toolkit.
 *
 * Nothing here calls a model. Every line of the output is a rule over the
 * answers, which is the honest version for a prototype: the same answers always
 * produce the same page, and every sentence can be traced back to a question
 * someone actually answered.
 */

import {
  advisor,
  advisorAdventures,
  steps,
  type AdventureId,
  type BusinessId,
  type Step,
} from './advisorFlow'
import { RECOMMENDATIONS_KEY, type ReadinessTab, type TagName, type ToolkitTab } from './readiness'
import type { AdvisorProfileData } from './advisorProfile'

/* ── the answer sheet ───────────────────────────────────────────────────── */

export type Grade = 'More' | 'Same' | 'Less'

export interface Identity {
  name: string
  role: string
  book: string
  firm: string
}

/** One bucket per kind of question, keyed by step id. Flat on purpose: it is
    what a rule wants to read (`a.text['ol-q1']`) and what JSON wants to hold. */
export interface Answers {
  identity: Identity
  /** Single and multi choice. A single choice is a one-item list. */
  choice: Record<string, string[]>
  /** The words an "Other" option opens a field for, keyed `${stepId}:other`. */
  other: Record<string, string>
  grid: Record<string, Record<string, Grade>>
  text: Record<string, string>
  scale: Record<string, number>
  scaleSet: Record<string, number[]>
  /** The date the sheet was opened — the sitting every card is dated by. */
  completed: string
}

const OTHER = 'Other'

/** 09.09.2026 — the format the profile's Completed line already speaks. */
export function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export function emptyAnswers(): Answers {
  return {
    identity: { name: '', role: '', book: '', firm: '' },
    choice: {},
    other: {},
    grid: {},
    text: {},
    scale: {},
    scaleSet: {},
    completed: today(),
  }
}

/** Marcus's sheet, read out of the flow rather than retyped — so the worked
    example and an empty one are the same instrument, and the walkthrough is
    still one menu item away now that the flow can be answered. */
export function sampleAnswers(): Answers {
  const a = emptyAnswers()
  a.identity = { name: advisor.name, role: 'Lead advisor', book: advisor.book, firm: advisor.firm }
  a.completed = advisor.completedOn
  for (const s of steps) {
    if (s.chosen?.length) a.choice[s.id] = [...s.chosen]
    if (s.rows?.length) a.grid[s.id] = Object.fromEntries(s.rows.map((r) => [r.label, r.value]))
    if (s.answer) a.text[s.id] = s.answer
    if (s.scale) a.scale[s.id] = s.scale.value
    if (s.statements?.length) a.scaleSet[s.id] = s.statements.map((st) => st.value)
  }
  return a
}

/* ── where the sheet lives ──────────────────────────────────────────────── */

const KEY = 'knomee.advisor-answers.v1'

export function loadAnswers(): Answers {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return emptyAnswers()
    // Merged over a fresh sheet, so a copy stored under an older shape cannot
    // arrive missing a bucket every rule below assumes is there.
    return { ...emptyAnswers(), ...(JSON.parse(raw) as Partial<Answers>) }
  } catch {
    return emptyAnswers()
  }
}

export function saveAnswers(a: Answers) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(a))
  } catch {
    /* private window, or storage full — the sheet just does not survive reload */
  }
}

export function clearAnswers() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* nothing to undo */
  }
}

/* ── reading the sheet ──────────────────────────────────────────────────── */

const stepOf = (id: string) => steps.find((s) => s.id === id)

/** Which kinds are questions. The rest — intros, unlocks, the breath screen —
    have nothing to answer and never hold the flow up. */
const ASKS: Step['kind'][] = ['multi', 'single', 'grid', 'text', 'scale', 'scaleSet']

export const isQuestion = (s: Step) => ASKS.includes(s.kind)

export function isAnswered(s: Step, a: Answers): boolean {
  switch (s.kind) {
    case 'multi':
    case 'single':
      return (a.choice[s.id]?.length ?? 0) > 0
    case 'grid':
      return (s.rows ?? []).every((r) => !!a.grid[s.id]?.[r.label])
    case 'text':
      return (a.text[s.id] ?? '').trim().length > 0
    case 'scale':
      return !!a.scale[s.id]
    case 'scaleSet':
      return (s.statements ?? []).every((_, i) => !!a.scaleSet[s.id]?.[i])
    default:
      return true
  }
}

/** An adventure is behind you when every question in it has an answer. */
export function adventureDone(id: AdventureId, a: Answers): boolean {
  const qs = steps.filter((s) => s.adventure === id && isQuestion(s))
  return qs.length > 0 && qs.every((s) => isAnswered(s, a))
}

/** How far into an adventure you are, for the row's own count. */
export function adventureCount(id: AdventureId, a: Answers) {
  const qs = steps.filter((s) => s.adventure === id && isQuestion(s))
  return { done: qs.filter((s) => isAnswered(s, a)).length, total: qs.length }
}

/** The home screen's five rows, wearing the state the sheet puts them in:
    finished, open, or still to come — each carrying how far into it you are,
    so a row you left half-answered can say so. */
export function adventureStates(a: Answers) {
  let openTaken = false
  return advisorAdventures.map((row) => {
    const count = adventureCount(row.id, a)
    if (adventureDone(row.id, a)) return { ...row, count, state: 'done' as const }
    if (!openTaken) {
      openTaken = true
      return { ...row, count, state: 'open' as const }
    }
    return { ...row, count, state: 'locked' as const }
  })
}

/** A picked option, with the words typed into "Other" standing in for the word
    "Other" — nobody's Business ID should read "Other". */
function chosen(id: string, a: Answers): string[] {
  const picks = a.choice[id] ?? []
  const typed = (a.other[`${id}:other`] ?? '').trim()
  return picks.map((p) => (p === OTHER && typed ? typed : p)).filter((p) => p !== OTHER)
}

const picked = (id: string, a: Answers) => chosen(id, a).join(', ')
const said = (id: string, a: Answers) => (a.text[id] ?? '').trim()

/** Where a single choice sits in its own option list — the ordinal the
    readiness rules score, rather than the words. */
const rank = (id: string, a: Answers) => {
  const opts = stepOf(id)?.options ?? []
  const pick = (a.choice[id] ?? [])[0]
  return pick ? opts.indexOf(pick) : -1
}

const graded = (id: string, a: Answers, want: Grade) =>
  Object.entries(a.grid[id] ?? {})
    .filter(([, v]) => v === want)
    .map(([k]) => k)

/* ── words ──────────────────────────────────────────────────────────────── */

/** The opening of an answer, for the places a whole paragraph will not fit — a
    quote in a starter, a highlight on the Business ID.

    One sentence, unless the first one is a fragment: "The money." is a true
    first sentence and a useless quote, so sentences are taken until there is
    something worth reading. */
function firstSentence(text: string, cap = 180): string {
  const t = text.trim().replace(/\s+/g, ' ')
  if (!t) return ''
  const MIN = 45
  let end = 0
  while (end < t.length && end < MIN) {
    const cut = t.slice(end).search(/[.!?](\s|$)/)
    if (cut < 0) {
      end = t.length
      break
    }
    end += cut + 1
  }
  const one = t.slice(0, end || t.length)
  if (one.length <= cap) return one
  const space = one.lastIndexOf(' ', cap)
  return one.slice(0, space > 20 ? space : cap).replace(/[,;:]$/, '') + '…'
}

const trim = (text: string, cap: number) => {
  if (text.length <= cap) return text
  const space = text.lastIndexOf(' ', cap)
  return text.slice(0, space > 20 ? space : cap) + '…'
}

/** A list of picked options set mid-sentence: "equity I own, a team I built"
    rather than "Equity I own, A team I built". */
const lowerList = (items: string[], n = items.length) =>
  items
    .slice(0, n)
    .map((s, i) => (i === 0 ? s : s.charAt(0).toLowerCase() + s.slice(1)))
    .join(', ')

const sentence = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

/** The same list dropped INTO a sentence, so the first item loses its capital
    too. Only the first letter — lowercasing the whole string turns "Equity I
    own" into "equity i own". */
const midList = (items: string[], n = items.length) => {
  const list = lowerList(items, n)
  return list.charAt(0).toLowerCase() + list.slice(1)
}

/** Every free-text answer as one haystack — what the "they never said this
    word" rules read. */
const allProse = (a: Answers) => Object.values(a.text).join(' \n ').toLowerCase()

/* ── the six themes ─────────────────────────────────────────────────────────
   A decision this size has a small number of shapes, and which one a person is
   actually in decides both the three questions they should be asking and the
   sentence a rep should open with. So the shape is detected once, ranked by how
   much of what they wrote lands in each theme, and everything downstream reads
   that ranking rather than guessing again. */

export type ThemeKey = 'clients' | 'team' | 'economics' | 'transition' | 'brand' | 'family'

const THEME_WORDS: Record<ThemeKey, RegExp> = {
  clients:
    /\bclients?\b|attrition|\bbook\b|relationships?|come with me|follow me|stay with me|retention/i,
  team: /\bteam\b|juniors?\b|associates?\b|\bstaff\b|hiring|employees?|successor/i,
  economics:
    /\bcomp\b|compensation|deferred|payout|\bincome\b|revenue|\bmoney\b|\bcosts?\b|econom|salary|\bpay\b|capital|profit|valuation/i,
  transition:
    /transition|disrupt|operations?\b|\bops\b|\badmin\b|compliance|technology|paperwork|custodian|onboarding|\bmonths\b/i,
  brand: /\bbrand\b|my name|name on|reputation|marketing|new business|business development|\bgrowth\b/i,
  family: /\bwife\b|husband|spouse|\bfamily\b|\bkids\b|children|at home/i,
}

/** Practice Joy asks about motivation rather than worry, but what someone wants
    the practice to give them still points at the shape of their decision — so
    each pick lends its theme a lighter vote. */
const JOY_THEME: Record<string, ThemeKey> = {
  Ownership: 'brand',
  'Control over how I serve': 'brand',
  Independence: 'brand',
  'Enterprise value': 'brand',
  Reputation: 'brand',
  Legacy: 'brand',
  'My team’s future': 'team',
  Income: 'economics',
  Security: 'economics',
  Time: 'transition',
  Simplicity: 'transition',
}

/** When the sheet says nothing either way, this is the order a recruiting
    conversation goes in anyway. It also breaks ties, which is why it is a list
    rather than a set. */
const THEME_ORDER: ThemeKey[] = ['clients', 'transition', 'team', 'economics', 'brand', 'family']

const hits = (text: string, key: ThemeKey) => (THEME_WORDS[key].test(text) ? 1 : 0)

function rankThemes(a: Answers): ThemeKey[] {
  const score = new Map<ThemeKey, number>(THEME_ORDER.map((k) => [k, 0]))
  const add = (k: ThemeKey, n: number) => score.set(k, (score.get(k) ?? 0) + n)
  // The first concern they named counts heaviest — it is the one they reached
  // for without being asked twice.
  const weighted: [string, number][] = [
    [said('ol-q1', a), 3],
    [said('ol-q2', a), 2],
    [said('mv-q9', a), 2],
    [said('mv-q10b', a), 1],
    [said('mv-q3', a), 1],
  ]
  for (const [text, w] of weighted) {
    if (!text) continue
    for (const k of THEME_ORDER) add(k, hits(text, k) * w)
  }
  for (const pick of chosen('pj-q1', a)) {
    const k = JOY_THEME[pick]
    if (k) add(k, 1)
  }
  // A stable sort leaves THEME_ORDER as the tie-break, which is what makes an
  // empty sheet still produce a sensible three.
  return [...THEME_ORDER].sort((x, y) => (score.get(y) ?? 0) - (score.get(x) ?? 0))
}

/* The three questions each theme hands the advisor, and what a rep should do
   when one arrives. One bank, read by both the phone (the questions screen)
   and the Toolkit — so the three the advisor is told to ask are provably the
   three the firm is told to expect. */
interface ThemeQuestion {
  /** How the top action names this theme, mid-sentence. */
  label: string
  question: string
  guidance: string
  points: string[]
}

const THEME_QUESTIONS: Record<ThemeKey, ThemeQuestion> = {
  clients: {
    label: 'the attrition question',
    question:
      'In the ten teams most like mine that you have moved, what share of the top 25 relationships came across — and what happened in the two that went worst?',
    guidance:
      'They are asking for evidence, not reassurance, and they have already named its shape: teams like theirs, the top relationships, and the ones that went badly. Answer with the page, not a figure.',
    points: [
      'Publish retention by team size and AUM band, and hand over the page rather than quoting a number',
      'Walk the two worst moves honestly — that is what makes the good number believable',
      'Offer an introduction to a lead advisor who moved a comparable book',
    ],
  },
  team: {
    label: 'what the team owns',
    question: 'What can the people on my team own on day one that they cannot own where I am now?',
    guidance:
      'This is the promise they cannot keep where they are. Answer with mechanics rather than intention — a grant, a schedule, a number.',
    points: [
      'Bring the equity terms to the first meeting: grant, vesting, and what it is worth',
      'Show what their team could own here that their current firm structurally cannot offer',
      'Help them plan how and when they tell the team — saying it too early is its own risk',
    ],
  },
  economics: {
    label: 'the economics of the first two years',
    question:
      'What do my first two years actually look like — what I walk away from, what I spend, and when the economics cross over?',
    guidance:
      'Answer with a model they can keep and check, not a headline number. The credibility is in the year-one costs, not the year-five upside.',
    points: [
      'Build the crossover model with their own revenue in it, and leave it with them',
      'Be specific about what they forfeit, and on what date they forfeit it',
      'Name every cost the first year carries, including the ones they have not thought of',
    ],
  },
  transition: {
    label: 'how long the transition takes',
    question:
      'How short can the transition actually be, and who carries operations while it is happening?',
    guidance:
      'They named the disruption itself as the hard part, so the honest answer is a dated plan with an owner against each part — not an average.',
    points: [
      'Put a transition calendar in front of them with names against every workstream',
      'Name who carries operations during the move, and for how long',
      'Say plainly what they have to do themselves in the first thirty days',
    ],
  },
  brand: {
    label: 'whose name is on the door',
    question: 'Whose name is on the door in year three — and what will it be worth when I am done with it?',
    guidance:
      'They are buying ownership rather than a platform. Answer about what they end up holding, and be exact about what the platform takes.',
    points: [
      'Show three firms who kept their own brand, and what the platform is visibly responsible for',
      'Walk an actual enterprise-value outcome, with the multiple and what drove it',
      'Be exact about what the platform owns, and what it does not',
    ],
  },
  family: {
    label: 'what the first year costs at home',
    question:
      'What does the first year cost the people at home, and what have other advisors told you afterwards?',
    guidance:
      'The hesitation here is not commercial, and a commercial answer will not touch it. Answer it as a person.',
    points: [
      'Be honest about the hours in months one to six, rather than optimistic',
      'Offer to include their partner in a conversation, on their terms',
      'Introduce them to someone who came out the other side of it',
    ],
  },
}

/* ── the three scores ───────────────────────────────────────────────────────
   Intent, Clarity, Receptivity — the same three dimensions the client side
   scores, asked of a business decision. Every ramp below is a straight read of
   one screen, so a number can always be walked back to a tap. */

const ramp = (i: number, ladder: number[]) => (i < 0 ? 0 : (ladder[i] ?? 0))

/** Have they done anything, or is this a recurring mood? */
function intentScore(a: Answers) {
  const thought = ramp(rank('mv-q5', a), [10, 45, 80, 95])
  const knows = ramp(rank('mv-q6', a), [10, 40, 80, 95])
  const acting = ramp(rank('mv-q7', a), [15, 55, 80, 100])
  const soon = ramp(rank('mv-q2', a), [100, 65, 40, 25, 15])
  return Math.round(thought * 0.3 + knows * 0.2 + acting * 0.3 + soon * 0.2)
}

/** Do they know what kind of independence they want? */
function clarityScore(a: Answers) {
  const rated = a.scale['fy-clarity'] ? ((a.scale['fy-clarity'] - 1) / 4) * 100 : 0
  // Breadth of the practice they described, against eight — about the point at
  // which a vision is specific rather than a shrug.
  const drawn = (Math.min(chosen('fy-q5', a).length, 8) / 8) * 100
  const placed = rank('fy-q1', a) >= 0 && rank('fy-q4', a) >= 0 ? 100 : 40
  return Math.round(rated * 0.5 + drawn * 0.3 + placed * 0.2)
}

/** Would they let a platform help, or do they insist on doing it alone? */
function receptivityScore(a: Answers) {
  const item6 = a.scaleSet['cf-q']?.[5] ?? 0
  const believes = item6 ? ((item6 - 1) / 4) * 100 : 0
  const wants = rank('mv-q4', a)
  const asks = wants === 1 ? 100 : wants === 0 ? 25 : 0
  return Math.round(believes * 0.5 + asks * 0.5)
}

export const EQ_WEIGHTS = { Intent: 0.45, Clarity: 0.3, Receptivity: 0.25 }

/* The engine's own bands, shared with the retail side: 70–100 ready now,
   40–69 considering, 0–39 nurture. */
const TIERS = [
  { tier: 1 as const, name: 'Ready Now', min: 70 },
  { tier: 2 as const, name: 'Considering', min: 40 },
  { tier: 3 as const, name: 'Nurture', min: 0 },
]

const TIER_BODY: Record<1 | 2 | 3, string> = {
  1: 'Ready now. Intent, clarity and an open door all reading high at once — the rarest of the three tiers, and the one a pipeline can already see.',
  2: 'Wants it, has not started. Clarity and an open door sitting on top of an intent score that says nothing is moving — the common case, and the one a recruiting pipeline cannot see today.',
  3: 'Nurture. Not enough intent to build a calendar around, and worth staying in touch with anyway — the sheet says what to talk about when you do.',
}

/** The five stages of change, read off The Move's three progress screens. */
const STAGES = ['Pre-Contemplation', 'Contemplation', 'Preparation', 'Action', 'Maintenance'] as const
type Stage = (typeof STAGES)[number]

function stageOf(a: Answers): Stage {
  const thought = rank('mv-q5', a)
  const knows = rank('mv-q6', a)
  const acting = rank('mv-q7', a)
  if (acting === 3) return 'Maintenance'
  if (acting >= 1 || thought >= 2) return 'Action'
  if (knows >= 2) return 'Preparation'
  if (thought >= 1 || knows >= 1) return 'Contemplation'
  return 'Pre-Contemplation'
}

const STAGE_NOTE: Record<Stage, string> = {
  'Pre-Contemplation': 'Not looking. Nothing on the sheet is in motion.',
  Contemplation: 'Wants it. Not moving on it yet.',
  Preparation: 'Knows the steps and is lining them up.',
  Action: 'Moving — steps taken, and more planned.',
  Maintenance: 'Already moved. Holding the new shape.',
}

/** Weak · Balanced · Strong, off the six Confidence sliders. */
function confidenceBand(a: Answers) {
  const set = (a.scaleSet['cf-q'] ?? []).filter(Boolean)
  if (!set.length) return 'Balanced'
  const avg = set.reduce((s, n) => s + n, 0) / set.length
  return avg < 2.5 ? 'Weak' : avg < 3.75 ? 'Balanced' : 'Strong'
}

/* ── the route ───────────────────────────────────────────────────────────
   Which of the platform's three destinations the answers point at. */

function routeOf(a: Answers) {
  const change = (a.choice['mv-q1'] ?? [])[0] ?? ''
  const where = (a.choice['fy-q1'] ?? [])[0] ?? ''
  const doing = (a.choice['fy-q2'] ?? []).join(' ')
  if (/sell or merge/i.test(change))
    return {
      pick: 'Investment Bank',
      why: 'They named selling or merging the book as the change they are weighing.',
    }
  if (/successor/i.test(change) || /winding down/i.test(doing) || /out of the business|semi-retired/i.test(where))
    return {
      pick: 'Optima',
      why: 'Succession rather than a build: what Future You describes is a practice being handed on.',
    }
  if (/change nothing/i.test(change))
    return {
      pick: 'Hold — no move named',
      why: 'They chose to fix what does not work rather than leave. Nothing on the sheet points at a transition.',
    }
  return {
    pick: 'Dynasty Connect',
    why: 'A build rather than an exit: their own firm, still advising, with a team around them.',
  }
}

/* ── the Business ID ────────────────────────────────────────────────────── */

function buildBusinessId(a: Answers, themes: ThemeKey[]): BusinessId {
  const joy = chosen('pj-q1', a)
  const stage = stageOf(a)
  const concerns = [said('ol-q1', a), said('ol-q2', a)].filter(Boolean)
  const hopes = [said('ol-q3', a), said('ol-q4', a)].filter(Boolean)
  const vision = chosen('fy-q5', a)

  const highlights: BusinessId['highlights'] = []
  if (joy.length)
    highlights.push({ icon: 'financial-joy', title: 'What the practice is for', text: lowerList(joy) })
  if (said('pj-q3', a))
    highlights.push({
      icon: 'financial-joy',
      title: 'What reminded me why',
      text: trim(firstSentence(said('pj-q3', a), 200), 200),
    })
  if (concerns.length)
    highlights.push({
      icon: 'outlook',
      title: 'Biggest concern',
      text: trim(firstSentence(concerns[0], 200), 200),
    })
  if (hopes.length)
    highlights.push({ icon: 'outlook', title: 'Hopes', text: trim(firstSentence(hopes[0], 200), 200) })
  if (vision.length)
    highlights.push({ icon: 'future-you', title: 'The practice I want', text: lowerList(vision, 4) })
  if (chosen('fy-q1', a).length)
    highlights.push({
      icon: 'future-you',
      title: 'Where I’m heading',
      text: [
        picked('fy-q1', a),
        chosen('fy-q4', a).length ? `in ${picked('fy-q4', a)}` : '',
        chosen('fy-q2', a).length ? `— ${lowerList(chosen('fy-q2', a), 3)}` : '',
      ]
        .filter(Boolean)
        .join(' '),
    })

  return {
    header: {
      name: a.identity.name.trim() || 'You',
      meta: [a.identity.role, a.identity.book, a.identity.firm].map((s) => s.trim()).filter(Boolean).join(' · '),
      completed: a.completed,
    },
    highlights,
    readiness: { stage, note: STAGE_NOTE[stage], confidence: confidenceBand(a) },
    practiceJoy: { prompt: 'I want my practice to give me', chips: joy },
    attention: { more: graded('pj-q2', a, 'More'), less: graded('pj-q2', a, 'Less') },
    futureYou: {
      where: chosen('fy-q1', a),
      what: chosen('fy-q2', a),
      who: chosen('fy-q3', a),
    },
    outlook: { concerns, hopes },
    move: {
      change: picked('mv-q1', a),
      when: picked('mv-q2', a),
      worthIt: said('mv-q8', a),
      challenging: said('mv-q9', a),
      stakeholders: chosen('mv-q10', a).join(' · '),
      hardest: said('mv-q10b', a),
    },
    badges: advisorAdventures.filter((r) => adventureDone(r.id, a)).map((r) => r.title),
    questions: themes.slice(0, 3).map((k) => THEME_QUESTIONS[k].question),
  }
}

/* ── the readiness read ─────────────────────────────────────────────────── */

/** Where a motivator can be evidenced from in their own prose — a pick is
    stronger when they wrote the same thing again unprompted. */
const JOY_ECHO: Record<string, RegExp> = {
  Ownership: /\bown\b|ownership|belongs? to|equity/i,
  'Control over how I serve': /control|committee|my own way|autonom/i,
  Independence: /independen|my own terms|nobody telling/i,
  'Enterprise value': /worth something|enterprise value|valuation|multiple/i,
  Security: /secur|stabil|\bsafe\b|predictable/i,
  Income: /income|\bearn\b|revenue|\bpay\b/i,
  Time: /\btime\b|hours|weeks off|vacation|away from the desk/i,
  'My team’s future': /\bteam\b|juniors?|associates?|equity for/i,
  Reputation: /reputation|known for|\bniche\b/i,
  Simplicity: /simpl|less admin|cleaner/i,
  Legacy: /legacy|leave behind|when I am done|my name/i,
}

function motivators(a: Answers) {
  const joy = chosen('pj-q1', a)
  const prose = [said('mv-q3', a), said('ol-q3', a), said('ol-q4', a), said('mv-q8', a)].filter(Boolean)
  return joy.map((label, i) => {
    const echo = JOY_ECHO[label]
    const found = echo ? prose.find((p) => echo.test(p)) : undefined
    const where = i === 0 ? 'Named first in Practice Joy' : `Picked in Practice Joy, ${i + 1} of ${joy.length}`
    return {
      title: label,
      body: found ? `${where}, and again unprompted: “${firstSentence(found, 150)}”` : `${where}.`,
    }
  })
}

const APPREHENSION_LABEL: Record<ThemeKey, string> = {
  clients: 'Whether the clients follow',
  team: 'What they owe the team',
  economics: 'The economics of moving',
  transition: 'The disruption of the move itself',
  brand: 'Building the name from scratch',
  family: 'The people at home',
}

function apprehensions(a: Answers) {
  const out: { title: string; body: string }[] = []
  const themed = (text: string) => {
    const k = THEME_ORDER.find((key) => hits(text, key))
    return k ? APPREHENSION_LABEL[k] : 'What they wrote down'
  }
  for (const id of ['ol-q1', 'ol-q2'] as const) {
    const text = said(id, a)
    if (text) out.push({ title: themed(text), body: text })
  }
  // What makes it hard is asked as a list, so each fragment is its own worry.
  const hard = said('mv-q9', a)
    .split(/[,;]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
  for (const fragment of hard.slice(0, Math.max(0, 4 - out.length))) {
    out.push({ title: sentence(fragment), body: 'Named among what makes the move hard.' })
  }
  const hardest = said('mv-q10b', a)
  if (hardest && out.length < 4) out.push({ title: 'The person hardest to bring along', body: hardest })
  return out
}

function velocity(a: Answers, intent: number, id: BusinessId) {
  const verdict =
    intent >= 70
      ? 'High velocity'
      : intent >= 40
        ? 'Moving, but not this quarter'
        : id.header.meta
          ? 'Low velocity, high value'
          : 'Low velocity'
  const points: string[] = []
  if (id.move.when)
    points.push(
      `Their own window says ${id.move.when}${intent < 40 ? ', and nothing behind it has started' : ''}.`,
    )
  if (picked('mv-q7', a)) points.push(`Action taken so far: “${picked('mv-q7', a)}”`)
  if (picked('mv-q6', a)) points.push(`On what the steps even are: “${picked('mv-q6', a)}”`)
  if (id.move.hardest) points.push(`Hardest to bring along — ${firstSentence(id.move.hardest, 160)}`)
  return {
    title: 'How Quickly Will This Advisor Move?',
    verdict,
    points,
    action:
      intent >= 70
        ? 'Move now. Put the transition plan and the paperwork in front of them this month.'
        : intent >= 40
          ? 'Work them this quarter, on their timeline rather than the pipeline’s.'
          : 'Work them on a two-quarter cadence, not a two-week one — and make the first meeting about their own first question rather than a pitch.',
  }
}

/* ── the Toolkit ────────────────────────────────────────────────────────── */

const JOY_WORD: Record<string, string> = {
  Ownership: 'ownership',
  'Control over how I serve': 'control',
  Independence: 'independence',
  'Enterprise value': 'what it’s worth',
  Security: 'stability',
  Income: 'income',
  Time: 'your time',
  'My team’s future': 'your team',
  Reputation: 'your reputation',
  Simplicity: 'simplicity',
  Legacy: 'legacy',
}

/** Vocabulary a rep reaches for by habit, each with the answer that would have
    earned it. If nothing on the sheet does, the word goes on the other list. */
const HABIT_WORDS: { word: string; test: RegExp; hint: string }[] = [
  {
    word: 'payout',
    test: /payout|income|\bpay\b|\bearn/i,
    hint: 'Income was there to pick in Practice Joy and they did not pick it. Payout language reads as a misread of them.',
  },
  {
    word: 'technology',
    test: /technolog|\btech\b|software|desktop|\btools?\b/i,
    hint: 'Named nowhere in eight minutes of answers.',
  },
  {
    word: 'custodian',
    test: /custodian|custody|clearing/i,
    hint: 'Named nowhere. They have no custodial relationship of their own.',
  },
  {
    word: 'comp grid',
    test: /\bcomp\b|\bgrid\b|compensation/i,
    hint: 'The vocabulary of the firm they are leaving.',
  },
]

function starters(a: Answers, themes: ThemeKey[], clarity: number) {
  const out: { quote: string; why: string; tags: TagName[] }[] = []
  // The card these land on sets a starter inside double quotes, so anything
  // quoted back to the advisor INSIDE one takes single ones. Nested doubles
  // read as a typo, and a rep is meant to say this line out loud.
  const quoted = (text: string, cap: number) => `‘${firstSentence(text, cap)}’`
  const concern = said('ol-q1', a)
  if (concern)
    out.push({
      quote: `You told us the thing that matters most is this — ${quoted(concern, 150)} Let’s start there, and not move off it until you’re satisfied.`,
      why: 'Their own sentence, back. It makes the meeting their agenda before it is the firm’s.',
      tags: ['Acknowledge and Validate'],
    })
  const hardest = said('mv-q10b', a)
  if (hardest)
    out.push({
      quote: `You said the hardest person to bring along is this — ${quoted(hardest, 130)} What would they need to see?`,
      why: 'The blocker they have not tested. Their answer tells you which meeting you are actually in.',
      tags: ['Demonstrate Curiosity'],
    })
  else if (themes[0])
    out.push({
      quote: `Before we talk about us — where has ${THEME_QUESTIONS[themes[0]].label} landed for you so far?`,
      why: 'Opens on their first question rather than the firm’s pitch, and tells you what they already believe.',
      tags: ['Demonstrate Curiosity'],
    })
  const why = said('pj-q3', a)
  if (why)
    out.push({
      quote: `${quoted(why, 160)} That happened because of you, not the name on the wall.`,
      why: 'Their own evidence against the thing they are most afraid of. They are more persuasive on it than you are.',
      tags: ['Self-Reinforcement'],
    })
  const vision = chosen('fy-q5', a)
  if (vision.length)
    out.push({
      quote: `You already know what you want it to look like — ${midList(vision, 3)}. Most people at this stage don’t.`,
      why:
        clarity >= 70
          ? 'Clarity is their strongest dimension. Naming it moves the conversation off whether and onto when.'
          : 'Says back the part of the picture they were sure about, and gives them somewhere firm to stand.',
      tags: ['Positive Talk'],
    })
  return out
}

function buildToolkit(a: Answers, themes: ThemeKey[], clarity: number): ToolkitTab {
  const top = themes[0]
  const prose = allProse(a)
  const joy = chosen('pj-q1', a)
  return {
    topAction: said('ol-q1', a)
      ? `Answer ${THEME_QUESTIONS[top].label} with evidence, in the first ten minutes.`
      : 'Open by asking what they want the practice to give them. The sheet does not say yet.',
    starters: starters(a, themes, clarity),
    key: RECOMMENDATIONS_KEY,
    questions: themes.slice(0, 3).map((k) => ({
      quote: THEME_QUESTIONS[k].question,
      guidance: THEME_QUESTIONS[k].guidance,
      points: THEME_QUESTIONS[k].points,
    })),
    words: {
      use: [
        ...joy.map((j, i) => ({
          word: JOY_WORD[j] ?? j.toLowerCase(),
          hint:
            i === 0 ? 'Their first pick in Practice Joy.' : `Picked in Practice Joy, ${i + 1} of ${joy.length}.`,
        })),
        ...(chosen('fy-q5', a).includes('Equity I own')
          ? [{ word: 'equity', hint: 'In the practice they described in Future You.' }]
          : []),
      ],
      avoid: HABIT_WORDS.filter(
        (w) => !w.test.test(prose) && !joy.some((j) => w.test.test(j)),
      ).map((w) => ({ word: w.word, hint: w.hint })),
    },
    questionsNote: said('ol-q1', a)
      ? 'The three the flow handed them — they are on their phone'
      : 'The three a decision of this shape usually turns on',
  }
}

/* ── everything, from one sheet ─────────────────────────────────────────── */

export interface Derived extends AdvisorProfileData {
  /** How much of the flow is behind you: three of five adventures, say. */
  progress: { done: number; required: number }
  /** Nothing answered yet, so there is nothing for the profile to draw. */
  empty: boolean
  themes: ThemeKey[]
  scores: { intent: number; clarity: number; receptivity: number }
  stage: Stage
}

export function derive(a: Answers): Derived {
  const themes = rankThemes(a)
  const intent = intentScore(a)
  const clarity = clarityScore(a)
  const receptivity = receptivityScore(a)
  const kq = Math.round(
    intent * EQ_WEIGHTS.Intent + clarity * EQ_WEIGHTS.Clarity + receptivity * EQ_WEIGHTS.Receptivity,
  )
  const tier = TIERS.find((t) => kq >= t.min)!
  const id = buildBusinessId(a, themes)
  const route = routeOf(a)
  const stage = stageOf(a)
  const done = advisorAdventures.filter((r) => adventureDone(r.id, a)).length

  const statements = stepOf('cf-q')?.statements ?? []
  const confidence = statements.map((s, i) => ({
    statement: s.text,
    low: s.low,
    high: s.high,
    // The flow's 1–5 sliders on the 0–100 track the profile's dial draws.
    value: a.scaleSet['cf-q']?.[i] ? Math.round(((a.scaleSet['cf-q'][i] - 1) / 4) * 100) : 0,
  }))

  const readiness: ReadinessTab = {
    snapshot: {
      question: 'How ready is this advisor to move?',
      score: { name: 'Enterprise Quotient', abbr: 'EQ' },
      kq,
      dimensions: [
        {
          key: 'Intent',
          question: 'Is this a live decision, or a recurring mood?',
          score: intent,
          caption:
            intent >= 70
              ? 'Something is already in motion.'
              : intent >= 40
                ? 'Thinking has turned into looking. Nothing is committed.'
                : 'Weighed, and not acted on. Nothing is in motion.',
          evidence: [
            'The Move · Q5–Q7 (the readiness stage)',
            `Thought about it: “${picked('mv-q5', a) || '—'}”`,
            `Knows the steps: “${picked('mv-q6', a) || '—'}”`,
            `Started acting: “${picked('mv-q7', a) || '—'}”`,
            `Timeline: ${picked('mv-q2', a) || '—'}`,
          ],
        },
        {
          key: 'Clarity',
          question: 'Do they know what kind of independence they want?',
          score: clarity,
          caption:
            clarity >= 70
              ? 'They can name the firm they want down to who runs it.'
              : clarity >= 40
                ? 'A shape, not yet a plan.'
                : 'The picture is still blurry.',
          evidence: [
            'Future You · the vision and its clarity rating',
            `Rated the picture of Future You ${a.scale['fy-clarity'] ?? '—'} of 5 for clarity`,
            `Where: ${picked('fy-q1', a) || '—'}`,
            `Practice includes: ${picked('fy-q5', a) || '—'}`,
          ],
        },
        {
          key: 'Receptivity',
          question: 'Would they let a platform help?',
          score: receptivity,
          caption:
            receptivity >= 70
              ? 'Asked for a partner outright. The door is open before anyone knocks.'
              : receptivity >= 40
                ? 'Open to help, on their own terms.'
                : 'Intends to do this alone.',
          evidence: [
            'Confidence · item 6, and The Move · Q4',
            `“${statements[5]?.text ?? '—'}” — ${a.scaleSet['cf-q']?.[5] ?? '—'} of 5`,
            `Wants support: “${picked('mv-q4', a) || '—'}”`,
          ],
        },
      ],
      tier: { n: tier.tier, name: tier.name, body: TIER_BODY[tier.tier] },
    },
    velocity: velocity(a, intent, id),
    motivators: motivators(a),
    apprehensions: apprehensions(a),
    motivatorsAction: id.practiceJoy.chips.length
      ? `Open on ${midList(id.practiceJoy.chips, 2)}.${
          id.practiceJoy.chips.includes('Income') ? '' : ' Do not open on payout.'
        }`
      : undefined,
    apprehensionsAction: said('ol-q1', a)
      ? `Bring evidence on ${THEME_QUESTIONS[themes[0]].label} to the first call — including the cases that went worst.`
      : undefined,
  }

  return {
    who: {
      name: id.header.name,
      initial: (id.header.name.trim()[0] ?? 'Y').toUpperCase(),
      // Only Marcus has a portrait in the demo. Your own sheet wears an initial,
      // which is the rule the rest of the app uses for a name without a face.
      photo: a.identity.name.trim() === advisor.name ? advisor.photo : undefined,
    },
    id,
    confidence,
    kq,
    tier: { tier: tier.tier, name: tier.name },
    routePick: route.pick,
    routeWhy: route.why,
    readiness,
    toolkit: buildToolkit(a, themes, clarity),
    progress: { done, required: advisorAdventures.length },
    empty: done === 0,
    themes,
    scores: { intent, clarity, receptivity },
    stage,
  }
}

/* ── the screens that read your answers back ─────────────────────────────
   Each adventure ends on a card that says what you just told it, and The Move
   ends on a stage. Those screens are authored in `advisorFlow.ts` around one
   worked example, so here is the same card computed from whoever's sheet is
   open. An unanswered line reads as a dash rather than disappearing — the
   shape of the card is the point, and a gap in it is information. */

const DASH = '—'

const STAGE_BODY: Record<Stage, string> = {
  'Pre-Contemplation': 'I’m not thinking about changing anything right now.',
  Contemplation:
    'I feel like some changes are needed, but I’m not actually planning on doing anything anytime soon.',
  Preparation: 'I know what needs to change, and I’m getting ready to do something about it.',
  Action: 'I’ve started making changes, and I mean to keep going.',
  Maintenance: 'I’ve made the change. Now I’m keeping it on track.',
}

/* Invented demo shares — how much company each stage has. */
const STAGE_SHARE: Record<Stage, string> = {
  'Pre-Contemplation': '11% of respondents are also in this stage.',
  Contemplation: '34% of respondents are also in this stage.',
  Preparation: '27% of respondents are also in this stage.',
  Action: '19% of respondents are also in this stage.',
  Maintenance: '9% of respondents are also in this stage.',
}

const CONFIDENCE_TITLE: Record<string, string> = {
  Weak: 'Your relationship with your practice is under strain.',
  Balanced: 'Your relationship with your practice is balanced.',
  Strong: 'Your relationship with your practice is strong.',
}

export interface UnlockView {
  title?: string
  body?: string
  lines?: { label: string; value: string }[]
  stat?: string
}

export function unlockView(id: string, a: Answers): UnlockView {
  const set = a.scaleSet['cf-q'] ?? []
  switch (id) {
    case 'pj-unlock':
      return {
        lines: [
          { label: 'My practice is a tool. It gives me', value: picked('pj-q1', a) || DASH },
          {
            label: 'The last thing that reminded me why I do this',
            value: said('pj-q3', a) ? `“${firstSentence(said('pj-q3', a), 200)}”` : DASH,
          },
          {
            label: 'Where I want my days to go',
            value: graded('pj-q2', a, 'More').join(', ') || DASH,
          },
        ],
      }
    case 'cf-unlock': {
      const band = confidenceBand(a)
      const statements = stepOf('cf-q')?.statements ?? []
      const answered = set.map((v, i) => ({ v, i })).filter((x) => !!x.v)
      const high = answered.reduce<{ v: number; i: number } | null>(
        (best, x) => (!best || x.v > best.v ? x : best),
        null,
      )
      const low = answered.reduce<{ v: number; i: number } | null>(
        (worst, x) => (!worst || x.v < worst.v ? x : worst),
        null,
      )
      return {
        title: CONFIDENCE_TITLE[band],
        lines: [
          { label: 'Highest', value: high ? statements[high.i]?.text ?? DASH : DASH },
          { label: 'Lowest', value: low ? statements[low.i]?.text ?? DASH : DASH },
        ],
      }
    }
    case 'ol-unlock':
      return {
        lines: [
          {
            label: 'Concerns',
            value:
              [said('ol-q1', a), said('ol-q2', a)]
                .filter(Boolean)
                .map((t) => firstSentence(t, 130))
                .join(' · ') || DASH,
          },
          {
            label: 'Hopes',
            value:
              [said('ol-q3', a), said('ol-q4', a)]
                .filter(Boolean)
                .map((t) => firstSentence(t, 130))
                .join(' · ') || DASH,
          },
        ],
      }
    case 'fy-unlock':
      return {
        lines: [
          { label: 'In the future I am', value: picked('fy-q1', a) || DASH },
          { label: 'I see myself', value: picked('fy-q2', a) || DASH },
          { label: 'I envision my practice to include', value: picked('fy-q5', a) || DASH },
        ],
      }
    case 'mv-stage': {
      const stage = stageOf(a)
      return {
        title: stage.toUpperCase(),
        body: STAGE_BODY[stage],
        lines: [
          { label: 'The change I’m weighing', value: picked('mv-q1', a) || DASH },
          { label: 'When', value: picked('mv-q2', a) || DASH },
          { label: 'Who else has a say', value: chosen('mv-q10', a).join(' · ') || DASH },
        ],
        stat: STAGE_SHARE[stage],
      }
    }
    default:
      return {}
  }
}
