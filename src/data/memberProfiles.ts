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
import { familyId } from './familyId'

const him = familyId.members[1]

/* What a profile page needs that a Family ID column does not: the prompt over
   the joy chips, and where he wants his attention to go. Everything else is
   shared with the household (the members, the advisory team) or read off his
   column. */
const sebastian: typeof clientProfile = {
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
  financialJoy: { ...clientProfile.financialJoy, chips: him.joy },
  attention: {
    more: ['Family time', 'Time outdoors', 'Saving steadily for the long term'],
    less: ['Market noise', 'Work that spills into the weekend'],
  },
  futureYou: him.futureYou,
  outlook: him.outlook,
  badges: him.badges,
  confidence: him.confidence,
  /* He has logged none of these, so his cards show the trays his column shows. */
  lifeEvents: him.lifeEvents,
  questions: him.questions,
  boards: him.boards,
}

const BY_NAME: Record<string, typeof clientProfile> = {
  [clientProfile.owner]: clientProfile,
  [sebastian.owner]: sebastian,
}

/** True where that person has answers of their own. Their name is a link in
    the Clients table, and their row in the household opens their page. */
export const hasProfile = (name: string) => name in BY_NAME

/** The profile to render for a client. Anyone the demo carries no answers for
    still opens the one built-out page, exactly as before — the prototype shows
    a real page rather than an apology. */
export const profileFor = (name: string) => BY_NAME[name] ?? clientProfile
