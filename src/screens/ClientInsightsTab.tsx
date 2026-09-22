/* Client Insights — the second tab of a client's page.
 *
 * Built out of the cards the Readiness and Toolkit tabs already own, in the
 * order the advisor reads them: what to do now, how the relationship scores,
 * what to say, what she will ask, and how to say it. Nothing here re-implements
 * a card; the only new panel is the one the client page adds — the adventures
 * to put in front of her next.
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

/* One adventure, as a row you could send. The glyph says what it asks of her:
   an adventure that adds something to the plan, or one that takes something
   away — which is the whole difference between Angel Investing and
   Subtracting, and the only thing a two-line row has room to say. */
function AdventureRow({ a }: { a: SuggestedAdventure }) {
  return (
    <div className={`ci-adv ci-adv-${a.tone}`}>
      <span className="ci-adv-glyph" aria-hidden>
        <svg viewBox="0 0 20 20" width="18" height="18">
          <circle cx="10" cy="10" r="9" fill="currentColor" />
          <path
            d={a.tone === 'add' ? 'M10 5.6v8.8M5.6 10h8.8' : 'M5.6 10h8.8'}
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
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
      <label className="ci-adv-add">
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
