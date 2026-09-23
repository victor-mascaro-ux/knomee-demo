/* Whose page you are looking at.
 *
 * The client page was written around one built-out profile — Emily's — and
 * showed it whichever client you opened, which was fine while she was the only
 * one with answers. The household changed that: Sebastian answers the same
 * adventures in the Family ID's second column, so his name has to open HIS
 * page and not hers.
 *
 * His answers are not restated here. They are the ones `familyId` already
 * carries, poured into the shape the client page reads, so his profile and his
 * column of the Family ID cannot disagree.
 */

import { clientProfile } from './clientProfile'
import { financialId } from './financialId'
import { familyId } from './familyId'
import { differences, similarities } from './familyInsights'

/** A client page's content. The one built-out profile plus, where the person
    has answers of their own, the statements behind their confidence dial. */
export type MemberProfile = typeof clientProfile & {
  confidenceAnswers?: { statement: string; value: number; low: string; high: string }[]
}

const him = familyId.members[1]
/* Index of his mark on a statement the household answered together. */
const HIS = 1

/* His confidence answers are the statements the Family Insights already carries
   marks for — the one the household answered the same way, then the three they
   did not — read at his mark. The statement asked twice in that data is asked
   once here. */
const hisConfidence = [similarities.statement, ...differences.statements]
  .filter((s, i, all) => all.findIndex((o) => o.statement === s.statement) === i)
  .map((s) => ({ statement: s.statement, value: s.marks[HIS], low: s.low, high: s.high }))

/* Everything on his page is what his column of the Family ID says, or the
   household's own (the members, the advisory team). Nothing is invented for
   him: a card the family data has no answer for shows the tray or the gap it
   would show anywhere else. */
const sebastian: MemberProfile = {
  ...clientProfile,
  joined: 'May 2025',
  owner: him.name,
  checkIn: him.checkIn,
  /* The same six questions, answered by him. */
  keyHighlights: clientProfile.keyHighlights.map((h) => ({
    ...h,
    text: him.highlights[h.title] ?? h.text,
  })),
  goals: him.goals,
  /* His, not hers: the lake place, the four-day week, the two he mentors. */
  suggestedGoals: [
    'Put a number on the place by the lake',
    'Agree the four-day week with my partners',
    'Hand one of my teams to someone I mentor',
  ],
  financialJoy: { ...clientProfile.financialJoy, chips: him.joy },
  /* The second half of the Joy adventure is not among his answers, so the card
     carries the chips and stops rather than putting words in his mouth. */
  attention: { more: [], less: [] },
  futureYou: him.futureYou,
  postcard: him.postcard ?? '',
  outlook: him.outlook,
  badges: him.badges,
  confidence: him.confidence,
  /* He has logged none of these, so his cards show the trays his column shows. */
  lifeEvents: him.lifeEvents,
  questions: him.questions,
  boards: him.boards,
  confidenceAnswers: hisConfidence,
}

/* Sarah once she is converted: the client page, carrying her own Financial ID
   answers — the same ones her prospect page shows — and no household yet, so
   her rail offers to start one. The advisory team is the practice's. */
const sarah: MemberProfile = {
  ...clientProfile,
  joined: financialId.joined,
  owner: financialId.owner,
  household: '',
  members: [],
  keyHighlights: financialId.keyHighlights,
  suggestedGoals: financialId.suggestedGoals,
  goals: financialId.goals,
  financialJoy: financialId.financialJoy,
  attention: financialId.attention,
  futureYou: financialId.futureYou,
  postcard: financialId.postcard,
  outlook: financialId.outlook,
  badges: financialId.badges,
  confidence: financialId.confidence,
  lifeEvents: financialId.lifeEvents,
  questions: financialId.questions,
  boards: [],
}

const BY_NAME: Record<string, MemberProfile> = {
  [clientProfile.owner]: clientProfile,
  [sebastian.owner]: sebastian,
  [sarah.owner]: sarah,
}

/** True where that person has answers of their own. Their name is a link in
    the Clients table, and their row in the household opens their page. */
export const hasProfile = (name: string) => name in BY_NAME

/** The profile to render for a client. Anyone the demo carries no answers for
    still opens the one built-out page, exactly as before — the prototype shows
    a real page rather than an apology. */
export const profileFor = (name: string) => BY_NAME[name] ?? clientProfile
