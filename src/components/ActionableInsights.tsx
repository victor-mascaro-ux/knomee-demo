/* Actionable Insights: the card under Top Line Metrics on My Prospects, My
   Clients and My Candidates. It is one component because the three pages say
   the same three things about their book: who is in it, who to talk to this
   week, and the reasoning behind both. Each page passes in its own rows'
   readings, and the card lays them out.

   The tier bar that focuses it sits in the Top Line Metrics card above, so
   the page holds the focused tier and hands it to both cards. */

import { useState, type ReactNode } from 'react'
import CollapsibleCard from './CollapsibleCard'
import { BoltIcon, ChevronDown, ChevronRight } from './icons'

export interface TalkItem {
  /** Who it is, where a name can repeat; the name otherwise. */
  id?: string
  name: string
  /** "Tier 1" to "Tier 3". */
  tier: string
  score: number
  /** Their segment, or the firm's cluster. */
  segment: string
  /** What they said, in their own answers, and what follows from it. */
  said: string[]
}

export interface InsightItem {
  n: number
  title: string
  body: string
}

/** The dashboards' help affordance, the same glyph and bubble as theirs. */
function HelpTip({ text, side }: { text: string; side?: 'left' | 'right' }) {
  return (
    <span
      className={`help-tip tt${side === 'right' ? ' help-tip-right' : ''}`}
      data-tip={text}
      tabIndex={0}
      role="img"
      aria-label={text}
    >
      ?
    </span>
  )
}

export default function ActionableInsights({
  hint,
  icon,
  tone,
  reach,
  noun,
  scoreLabel,
  talk,
  focus,
  insights,
  tierInsight,
  empty,
  opens,
  onOpen,
}: {
  hint: string
  icon?: ReactNode
  /** The client side's teal pills, where the other two pages are plum. */
  tone?: 'client'
  /** The book by segment, largest first. Left off when nobody groups yet. */
  reach?: { label: string; tip: string; chips: { name: string; count: number }[] }
  /** "prospects", "clients", "candidates". */
  noun: string
  /** "KQ", "KR", "RQ". */
  scoreLabel: string
  /** Who to talk to this week, already narrowed to the focused tier. */
  talk: TalkItem[]
  /** The tier the bar above is focused on. */
  focus: { label: string; name: string } | null
  insights: InsightItem[]
  /** The focused tier's own card, peeked at and listed first. */
  tierInsight?: InsightItem
  /** What the call-list says when the focused tier has nobody on it. */
  empty: string
  /** Whose name is a link: only someone with a page behind it. Both take a
      talk item's id, or its name where it has none. */
  opens?: (id: string) => boolean
  onOpen?: (id: string) => void
}) {
  const [listOpen, setListOpen] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)
  /* Focusing a tier opens its people; clearing the focus folds them away. The
     tier is picked in the card above, so the card follows it here. */
  const focusKey = focus?.label ?? null
  const [seenFocus, setSeenFocus] = useState(focusKey)
  if (seenFocus !== focusKey) {
    setSeenFocus(focusKey)
    setListOpen(focusKey !== null)
  }

  const lead = talk[0]
  const ordered = tierInsight ? [tierInsight, ...insights.filter((i) => i !== tierInsight)] : insights
  const pill = (tier: string) => `talk-tier ${tone === 'client' ? 'c' : 't'}${tier.slice(-1)}`

  return (
    <CollapsibleCard
      className={`insights-card${tone === 'client' ? ' is-client' : ''}`}
      icon={icon ?? <BoltIcon color="#7639a1" />}
      title="Actionable Insights"
      hint={<HelpTip text={hint} />}
      bodyClassName="cmd-body"
    >
      {/* Who the book is made of. The question is "am I reaching the people
          I set out to reach?", so the answer comes before who to call. */}
      {reach && reach.chips.length > 0 && (
        <div className="cmd-reach">
          <span className="cmd-reach-label">
            {reach.label}
            <HelpTip side="right" text={reach.tip} />
          </span>
          <div className="cmd-reach-list">
            {reach.chips.map((s) => (
              <span className="cmd-reach-chip" key={s.name}>
                {s.name}
                <b>{s.count}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Layer 0: the one next action */}
      <div className="cmd-focus">
        <p className="cmd-focus-line">
          {focus ? (
            <>
              <b>{focus.label}</b> — {talk.length} flagged to talk to this week.
            </>
          ) : (
            <>
              <b>
                {talk.length} {talk.length === 1 ? noun.replace(/s$/, '') : noun}
              </b>{' '}
              flagged to talk to this week.
            </>
          )}
        </p>
        {lead ? (
          <button
            className="cmd-lead"
            type="button"
            onClick={() => setListOpen((o) => !o)}
            aria-expanded={listOpen}
          >
            <span className="cmd-lead-tag">Start with</span>
            <span className="cmd-lead-name">{lead.name}</span>
            <span className={pill(lead.tier)}>{lead.tier}</span>
            <span className="cmd-lead-kq">
              {scoreLabel} {lead.score}
            </span>
            {lead.segment && <span className="cmd-lead-niche">{lead.segment}</span>}
            <span className="cmd-lead-more">
              {listOpen ? 'Hide' : `See All ${talk.length}`}
              <ChevronDown />
            </span>
          </button>
        ) : (
          <p className="cmd-empty">{empty}</p>
        )}
      </div>

      {/* Layer 1: the full call-list */}
      <div className={`collapse ${listOpen && talk.length ? 'open' : ''}`}>
        <div className="collapse-inner">
          <div className="talk-list cmd-talk-list">
            {talk.map((t) => (
              <div className="talk-card" key={t.id ?? t.name}>
                <div className="talk-head">
                  {opens?.(t.id ?? t.name) && onOpen ? (
                    <button
                      type="button"
                      className="talk-name name-link-btn"
                      onClick={() => onOpen(t.id ?? t.name)}
                    >
                      {t.name}
                    </button>
                  ) : (
                    <span className="talk-name">{t.name}</span>
                  )}
                  {t.segment && <span className="talk-niche">{t.segment}</span>}
                  <span className={pill(t.tier)}>{t.tier}</span>
                  <span className="talk-kq">
                    {scoreLabel} {t.score}
                  </span>
                </div>
                <div className="talk-chips">
                  {t.said.map((s, i) => (
                    <span className="talk-chip-wrap" key={s}>
                      <span className="talk-chip">{s}</span>
                      {i < t.said.length - 1 && <ChevronRight />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Layer 1: the evidence */}
      {insights.length > 0 && (
        <div className="cmd-why">
          <button
            className={`invite-preview-toggle cmd-why-toggle ${whyOpen ? 'is-open' : ''}`}
            type="button"
            aria-expanded={whyOpen}
            onClick={() => setWhyOpen((o) => !o)}
          >
            {focus ? `Why — ${focus.name}` : 'Why these numbers'} <ChevronDown />
          </button>
          {focus && tierInsight && !whyOpen && (
            <button className="cmd-why-peek" type="button" onClick={() => setWhyOpen(true)}>
              <b>{tierInsight.title}.</b> {tierInsight.body.split('. ')[0].replace(/\.$/, '')}.{' '}
              <span className="cmd-why-peek-more">Read More →</span>
            </button>
          )}
          <div className={`collapse ${whyOpen ? 'open' : ''}`}>
            <div className="collapse-inner">
              <div className="cmd-insights">
                {ordered.map((ins) => (
                  <div className={`insight ${ins === tierInsight ? 'is-flagged' : ''}`} key={ins.n}>
                    <div className="insight-num">{ins.n}</div>
                    <div className="insight-text">
                      <div className="insight-title">{ins.title}</div>
                      <p className="insight-body">{ins.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </CollapsibleCard>
  )
}
