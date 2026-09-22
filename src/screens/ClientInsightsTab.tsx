/* Client Insights and Client Toolkit — the two advisor-facing tabs of a
 * client's page, split the way the prospect's are: the read on the
 * relationship, then the kit for the conversation it says to have.
 *
 * Insights is what to do now and how the relationship scores. Toolkit is what
 * to say, what she will ask, and how to say it. Both are built out of the cards
 * the Readiness and Toolkit tabs already own; nothing here re-implements one.
 * The only new panel is the one the client page adds — the adventures to put in
 * front of her next.
 *
 * The page runs in the client palette. `clientInsights.css` turns the `.rd`
 * accents over to the ocean/teal family under `.pp.cp`, the same way
 * `clientProfile.css` turns over the Financial ID's, so not one component knows
 * which side it is rendering on.
 */

import { useState } from 'react'
import './clientInsights.css'
import {
  CommunicationRail,
  QuestionsCard,
  ReadinessSnapshot,
  StartersCard,
} from './readinessParts'
import { clientInsights } from '../data/clientInsights'
import type { SuggestedAdventure } from '../data/clientInsights'
import icTopAction from '../assets/cards/top-action.svg'
import icAdventures from '../assets/adventures/award.svg'
import icAngelInvesting from '../assets/adventures/angel-investing.svg'
import icSubtracting from '../assets/adventures/subtracting.svg'
import icLegacy from '../assets/adventures/legacy.svg'
import icGiving from '../assets/adventures/giving.svg'
import icCare from '../assets/adventures/care.svg'
import icSimplifying from '../assets/adventures/simplifying.svg'

/* Each adventure wears its own artwork, the way the five on the Financial ID
   do: flat shapes on a white disc, drawn from the brand ramp. Mapped here
   rather than imported into the data, which is how every other page carrying
   this artwork does it. */
const ADVENTURE_ART: Record<string, string> = {
  'angel-investing': icAngelInvesting,
  subtracting: icSubtracting,
  legacy: icLegacy,
  giving: icGiving,
  care: icCare,
  simplifying: icSimplifying,
}

/* One adventure, as a row you could send: its symbol, its name, and the line
   that says what it asks of her. */
function AdventureRow({ a }: { a: SuggestedAdventure }) {
  return (
    <div className="ci-adv">
      <img className="ci-adv-ic" src={ADVENTURE_ART[a.art]} alt="" />
      <span className="ci-adv-body">
        <b>{a.name}</b>
        <i>{a.blurb}</i>
      </span>
    </div>
  )
}

function AdventuresCard() {
  /* Choosing one puts it on the list, where it reads exactly like the two that
     were suggested — an advisor adding an adventure is the same act as knomee
     suggesting one. */
  const [added, setAdded] = useState<SuggestedAdventure[]>([])
  const rows = [...clientInsights.adventures, ...added]
  const left = clientInsights.moreAdventures.filter((m) => !added.some((a) => a.name === m.name))

  return (
    <section className="pp-card rd-card ci-adv-card">
      <div className="pp-card-head">
        <span className="pp-card-title">
          <img className="pp-card-ic" src={icAdventures} alt="" />
          Suggested Knomee Adventures
        </span>
      </div>
      <div className="ci-advs">
        {rows.map((a) => (
          <AdventureRow a={a} key={a.name} />
        ))}
      </div>
      <label className="ci-adv-pick">
        Add an adventure:
        <select
          className="ci-adv-select"
          value=""
          disabled={left.length === 0}
          onChange={(e) => {
            const pick = left.find((m) => m.name === e.target.value)
            if (pick) setAdded((list) => [...list, pick])
          }}
        >
          <option value="">
            {left.length ? 'Choose a Knomee Adventure' : 'All adventures suggested'}
          </option>
          {left.map((m) => (
            <option value={m.name} key={m.name}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}

/* The read: the one thing to do next, and the score that says why. The top
   action sits here rather than over the toolkit — on this side it is the
   answer the snapshot leads to, and a line that appears on both tabs is a line
   nobody reads on either. */
export default function ClientInsightsTab() {
  const { snapshot, toolkit } = clientInsights
  return (
    <div className="rd ci">
      <div className="rd-top-action">
        <img className="pp-card-ic rd-top-ic" src={icTopAction} alt="" />
        <b>Top Action</b>
        <span className="rd-top-text">{toolkit.topAction}</span>
      </div>

      <ReadinessSnapshot s={snapshot} title="Relationship Snapshot" />
    </div>
  )
}

/* The kit: the same three columns the prospect's toolkit has, plus the rail's
   second panel. */
export function ClientToolkitTab() {
  const { toolkit } = clientInsights
  return (
    <div className="rd ci">
      <div className="rd-kit-cols">
        <div className="rd-kit-main">
          <StartersCard starters={toolkit.starters} keyRows={toolkit.key} />
          <QuestionsCard questions={toolkit.questions} note={toolkit.questionsNote} />
        </div>
        <div className="rd-kit-rail">
          <CommunicationRail d={toolkit} />
          <AdventuresCard />
        </div>
      </div>
    </div>
  )
}
