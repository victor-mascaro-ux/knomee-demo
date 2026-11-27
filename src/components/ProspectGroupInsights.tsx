/* My Prospects' Actionable Insights: the prospects as a group. How the
   advisor's invitations are doing (a funnel, always the whole book), who they
   are reaching (read from the prospects' own answers, narrowed by the tier bar
   above), and how that compares with everyone on Knomee (the whole book
   again). One person's reading and next step is the table's job, so nobody is
   named here. Every figure comes from prospectGroup.ts.

   My Clients and My Candidates keep the shared ActionableInsights card. */

import { useMemo } from 'react'
import CollapsibleCard from './CollapsibleCard'
import { BoltIcon } from './icons'
import { prospects } from '../data/prospects'
import {
  groupProfile,
  invitationFunnel,
  knomeeComparison,
  type CompareRow,
  type SplitPart,
} from '../data/prospectGroup'
import './groupInsights.css'

function HelpTip({ text }: { text: string }) {
  return (
    <span className="help-tip tt help-tip-right" data-tip={text} tabIndex={0} role="img" aria-label={text}>
      ?
    </span>
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

/* One answer, side by side: the advisor's prospects over everyone on Knomee. */
function Compared({ kicker, rows }: { kicker: string; rows: CompareRow[] }) {
  return (
    <div className="gi-cmp-group">
      <span className="gi-kicker">{kicker}</span>
      {rows.map((r) => (
        <div className="gi-cmp-row" key={r.label}>
          <span className="gi-cmp-label">{r.label}</span>
          <span className="gi-cmp-bar is-you">
            <i style={{ width: `${Math.max(r.you * 100, 1)}%` }} />
            <b>{r.youText}</b>
          </span>
          <span className="gi-cmp-bar is-all">
            <i style={{ width: `${Math.max(r.all * 100, 1)}%` }} />
            <span>{r.allText}</span>
          </span>
        </div>
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
  const cmp = useMemo(() => knomeeComparison(), [])

  return (
    <CollapsibleCard
      className="insights-card gi-card"
      icon={<BoltIcon color="#7639a1" />}
      title="Actionable Insights"
      hint={
        <HelpTip text="Your prospects as a group. Each person is in the table below." />
      }
      bodyClassName="cmd-body gi-body"
      defaultOpen={false}
    >
      {/* 1 · The funnel. It always counts everyone: a tier only exists once
          someone completes, so the bar above cannot narrow it. */}
      <section className={`gi-sec${focus ? ' is-lensed' : ''}`}>
        <div className="gi-head">
          <h3 className="gi-title">Your invitations</h3>
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
                {s.rate == null ? 'All time' : `${s.rate}% ${s.of}`}
                {leak?.at === s.key && <span className="gi-leak-tag">Biggest drop</span>}
              </span>
            </li>
          ))}
        </ol>
        {leak && (
          <p className="gi-callout">
            <b>{leak.headline}</b> {leak.action}
            {leak.toAnalytics && onAnalytics && (
              <>
                {' '}
                <button type="button" className="gi-link" onClick={onAnalytics}>
                  Compare Templates →
                </button>
              </>
            )}
          </p>
        )}
        {focus && <p className="gi-note">Not filtered by tier.</p>}
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
            {group.size} {group.size === 1 ? 'prospect' : 'prospects'}
          </span>
        </div>
        <div className="gi-threads">
          {group.threads.map((t) => (
            <div className="gi-thread" key={t.key}>
              <span className="gi-thread-head">{t.headline}</span>
              <Split parts={t.split} />
              <span className="gi-thread-detail">{t.detail}</span>
              <span className="gi-thread-do">{t.action}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3 · Am I reaching the people I meant to? There is no stated target
          to score against, so the book is set beside everyone who takes the
          same Adventures. Whole book only: the respondents have no tiers. */}
      {cmp && (
        <section className={`gi-sec${focus ? ' is-lensed' : ''}`}>
          <div className="gi-head">
            <h3 className="gi-title">
              You vs. everyone on Knomee <HelpTip text={cmp.basis} />
            </h3>
            <span className="gi-legend" aria-hidden>
              <i className="is-you" /> You <i className="is-all" /> Knomee
            </span>
          </div>
          <div className="gi-compare">
            {cmp.joy.length > 0 && <Compared kicker="Want money for" rows={cmp.joy} />}
            {cmp.confidence.length > 0 && <Compared kicker="Confidence, of 5" rows={cmp.confidence} />}
          </div>
          <p className="gi-callout">
            <b>{cmp.finding}</b> {cmp.action}
          </p>
          {focus && <p className="gi-note">Not filtered by tier.</p>}
        </section>
      )}

    </CollapsibleCard>
  )
}
