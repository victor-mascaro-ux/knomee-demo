/* My Prospects' Actionable Insights: the prospects as a group. How the
   advisor's invitations are doing (a funnel, always the whole book), who they
   are reaching (read from the prospects' own answers, narrowed by the tier bar
   above), and how that compares with everyone on Knomee (the whole book
   again). One person's reading and next step is the table's job, so nobody is
   named here. Every figure comes from prospectGroup.ts.

   It arrives when it is opened, not when the page loads (the card starts
   folded): the CSS animates under `.collapse.open`, and the funnel's numbers
   count up once they come into view. Motion in groupInsights.css.

   My Clients and My Candidates keep the shared ActionableInsights card. */

import { useEffect, useMemo, useRef, useState } from 'react'
import CollapsibleCard from './CollapsibleCard'
import PieChart from './PieChart'
import { BoltIcon, KnomeeMark, PeopleIcon } from './icons'
import { prospects } from '../data/prospects'
import {
  groupProfile,
  invitationFunnel,
  knomeeComparison,
  TOPIC_TITLE,
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

/* A number that counts up to itself each time the card opens onto it. It
   counts when it comes into view, and goes back to 0 only when the card is
   folded away, so scrolling past it does not replay it. */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(to)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const folded = () => !el.closest('.collapse.open')
    let raf = 0
    let counted = false
    if (folded()) setN(0)
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !counted) {
        counted = true
        const start = performance.now()
        const tick = (t: number) => {
          const k = Math.min(1, (t - start) / 900)
          setN(Math.round(to * (1 - Math.pow(1 - k, 3))))
          if (k < 1) raf = requestAnimationFrame(tick)
        }
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(tick)
      } else if (!e.isIntersecting && folded()) {
        counted = false
        cancelAnimationFrame(raf)
        setN(0)
      }
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to])
  return <span ref={ref}>{n}</span>
}

/* The tones as the pie’s fills: the light steps of knomee’s main colours
   (README, "Pie charts are one style"). Plum, grape and ocean themselves
   are too dark to fill a 168px pie. */
const TONE_FILL: Record<SplitPart['tone'], string> = {
  plum: 'var(--k-lilac)',
  grape: '#dcc6ee',
  bolt: 'var(--k-violet-new)',
  ocean: 'var(--k-steel)',
  teal: 'var(--k-aqua)',
  mist: 'var(--k-pearl)',
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
}: {
  /** The tier the bar above is focused on: its people, its label. */
  focus: { tierId: 'tier1' | 'tier2' | 'tier3'; label: string } | null
  /** Prospects converted to clients this session, on top of the book's own. */
  convertedNow?: number
}) {
  const { steps, leak } = useMemo(() => invitationFunnel(convertedNow), [convertedNow])
  const tierId = focus?.tierId
  const group = useMemo(
    () => groupProfile(tierId ? prospects.filter((p) => p.tier === tierId) : prospects, tierId ? 'tier' : 'book'),
    [tierId],
  )
  const cmp = useMemo(() => knomeeComparison(), [])

  return (
    <CollapsibleCard
      className="insights-card gi-card"
      icon={<BoltIcon color="#7639a1" />}
      title="Actionable Insights"
      hint={<HelpTip text="Your prospects as a group. Each person is in the table below." />}
      bodyClassName="cmd-body gi-body"
      defaultOpen={false}
    >
      {/* 1 · The funnel. It always counts everyone: a tier only exists once
          someone completes, so the bar above cannot narrow it. Each step's
          pill is its share of the step before. */}
      <section className={`gi-sec${focus ? ' is-lensed' : ''}`}>
        <ol className="gi-funnel">
          {steps.map((s, i) => (
            <li
              key={s.key}
              className={`gi-step gi-step-${i + 1}${leak?.at === s.key ? ' is-leak' : ''}${
                s.key === 'converted' ? ' is-won' : ''
              }`}
            >
              <span className="gi-step-label">{s.label}</span>
              {/* The number and the biggest drop's pill share a row, the pill's
                  foot on the digits' baseline. */}
              <span className="gi-step-row">
                <span className="gi-step-num">
                  <CountUp to={s.count} />
                </span>
                {leak?.at === s.key && <span className="gi-leak-tag">Biggest drop</span>}
              </span>
              {s.rate != null && (
                <span className="gi-step-pill tt" data-tip={`${s.rate}% ${s.of}`}>
                  {s.rate}%
                </span>
              )}
            </li>
          ))}
        </ol>
        {leak && (
          <p className="gi-callout">
            <KnomeeMark size={18} color="var(--k-grape)" />
            <span>
              <b>{leak.headline}</b> {leak.action}
            </span>
          </p>
        )}
        {focus && <p className="gi-note">Not filtered by tier.</p>}
      </section>

      {/* 2 · Who they are, from their own answers. Keyed by tier, so the
          cards arrive again when the tier bar changes them. */}
      <section className="gi-sec">
        <div className="gi-head">
          <h3 className="gi-title has-icon">
            <PeopleIcon color="var(--k-grape)" />
            <span>
              Who you’re reaching
              {focus && (
                <>
                  {' '}in <span className="gi-title-tier">{focus.label}</span>
                </>
              )}
            </span>
          </h3>
          <span className="gi-sub">
            {group.size} {group.size === 1 ? 'prospect' : 'prospects'}
          </span>
        </div>
        <div className="gi-threads" key={tierId ?? 'all'}>
          {group.threads.map((t) => (
            <div className="gi-thread" key={t.key}>
              {/* Named for what it measures; the split and the action say
                  what was found. */}
              <span className="gi-thread-head">{TOPIC_TITLE[t.topic]}</span>
              <PieChart
                label={`${TOPIC_TITLE[t.topic]}: ${t.split.map((p) => `${p.count} ${p.label}`).join(', ')}`}
                slices={t.split.map((p) => ({ label: p.label, value: p.count, color: TONE_FILL[p.tone] }))}
              />
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
            <KnomeeMark size={18} color="var(--k-grape)" />
            <span>
              <b>{cmp.finding}</b> {cmp.action}
            </span>
          </p>
          {focus && <p className="gi-note">Not filtered by tier.</p>}
        </section>
      )}
    </CollapsibleCard>
  )
}
