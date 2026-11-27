/* My Prospects' Actionable Insights: the prospects as a group. Two halves —
   how the advisor's invitations are doing (a funnel, always the whole book),
   and who they are reaching (read from the prospects' own answers, narrowed
   by the tier bar above). One person's reading and next step is the table's
   job, so nobody is named here. Every figure comes from prospectGroup.ts.

   My Clients and My Candidates keep the shared ActionableInsights card. */

import { useMemo } from 'react'
import CollapsibleCard from './CollapsibleCard'
import { BoltIcon } from './icons'
import { prospects } from '../data/prospects'
import { groupProfile, invitationFunnel, type Line, type SplitPart } from '../data/prospectGroup'
import './groupInsights.css'

function HelpTip({ text }: { text: string }) {
  return (
    <span className="help-tip tt help-tip-right" data-tip={text} tabIndex={0} role="img" aria-label={text}>
      ?
    </span>
  )
}

function Said({ line }: { line: Line }) {
  return (
    <>
      {line.map((x, i) => (typeof x === 'string' ? <span key={i}>{x}</span> : <b key={i}>{x.b}</b>))}
    </>
  )
}

/* A thread's split, one segment per answer group, each naming itself on
   hover. */
function Split({ parts }: { parts: SplitPart[] }) {
  return (
    <div className="gi-split" aria-hidden>
      {parts.map((p) => (
        <i
          key={p.label}
          className={`gi-tone-${p.tone} tt`}
          style={{ flex: p.count }}
          data-tip={`${p.count} ${p.label}`}
        />
      ))}
    </div>
  )
}

export default function ProspectGroupInsights({
  focus,
  convertedNow = 0,
  onAnalytics,
}: {
  /** The tier the bar above is focused on: its people, its label. */
  focus: { tierId: 'tier1' | 'tier2' | 'tier3'; label: string } | null
  /** Prospects converted to clients this session, on top of the book's own. */
  convertedNow?: number
  /** Opens Prospect Analytics, where invite templates are compared. */
  onAnalytics?: () => void
}) {
  const { steps, leak } = useMemo(() => invitationFunnel(convertedNow), [convertedNow])
  const group = useMemo(
    () =>
      groupProfile(
        focus ? prospects.filter((p) => p.tier === focus.tierId) : prospects,
        focus ? 'tier' : 'book',
      ),
    [focus],
  )

  return (
    <CollapsibleCard
      className="insights-card gi-card"
      icon={<BoltIcon color="#7639a1" />}
      title="Actionable Insights"
      hint={
        <HelpTip text="Your prospects as a group: how your invitations are doing, and who they reach. Each person’s next step is in the table below." />
      }
      bodyClassName="cmd-body gi-body"
      defaultOpen={false}
    >
      {/* 1 · The funnel. It always counts everyone: a tier only exists once
          someone completes, so the bar above cannot narrow it. */}
      <section className={`gi-sec${focus ? ' is-lensed' : ''}`}>
        <div className="gi-head">
          <h3 className="gi-title">How your invitations are doing</h3>
          <span className="gi-sub">All time · everyone who opened your link</span>
        </div>
        <ol className="gi-funnel">
          {steps.map((s) => (
            <li
              key={s.key}
              className={`gi-step${leak?.at === s.key ? ' is-leak' : ''}${s.key === 'converted' ? ' is-won' : ''}`}
            >
              <span className="gi-step-label">{s.label}</span>
              <span className="gi-step-num">{s.count}</span>
              <span className="gi-step-rate">
                {s.rate == null ? 'Your link, all time' : `${s.rate}% ${s.of}`}
                {leak?.at === s.key && <span className="gi-leak-tag">Biggest drop</span>}
              </span>
            </li>
          ))}
        </ol>
        {leak && (
          <div className="gi-callout">
            <p>
              <b>{leak.headline}</b> {leak.reading}
            </p>
            <p className="gi-do">
              {leak.action}
              {leak.toAnalytics && onAnalytics && (
                <>
                  {' '}
                  <button type="button" className="gi-link" onClick={onAnalytics}>
                    Open Prospect Analytics →
                  </button>
                </>
              )}
            </p>
          </div>
        )}
        {focus && (
          <p className="gi-note">The funnel always counts everyone: tiers are only given once someone completes.</p>
        )}
      </section>

      {/* 2 · Who they are, from their own answers. */}
      <section className="gi-sec">
        <div className="gi-head">
          <h3 className="gi-title">
            Who you’re reaching
            {focus && (
              <>
                {' '}in <span className="gi-title-tier">{focus.label}</span>
              </>
            )}
          </h3>
          <span className="gi-sub">
            {group.size} completed {group.size === 1 ? 'prospect' : 'prospects'} · from their own answers
          </span>
        </div>
        {group.summary.length > 0 && (
          <p className="gi-summary">
            <span className="gi-kicker">In one line</span>
            <Said line={group.summary} />
          </p>
        )}
        <div className="gi-threads">
          {group.threads.map((t) => (
            <div className="gi-thread" key={t.key}>
              <span className="gi-kicker">{t.source}</span>
              <span className="gi-thread-head">{t.headline}</span>
              <Split parts={t.split} />
              <span className="gi-thread-detail">{t.detail}</span>
              <span className="gi-thread-do">{t.action}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="gi-foot">Each person’s reading and next step is in the table below.</p>
    </CollapsibleCard>
  )
}
