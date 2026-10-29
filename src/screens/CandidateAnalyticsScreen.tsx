/* Candidate Analytics — the page #/firm-analytics opens on.

   The recruiting side of the activation tracking, built like Prospect
   Analytics (its cards, KPI tiles, funnel steps, ROI card and trails are that
   page's) but on real data: the advisor directory, read each time the page
   opens. A recruiter sends a link from the Recruit Toolkit; the advisor opens
   it, starts answering, finishes, and is marked as joined. The two toolkit
   steps aren't counted until the toolkit's events can be written, and two
   steps are recorded from Oct 29, 2026 — each step's name says, on hover,
   what records it. The ROI card measures the firm against the Recruit
   Toolkit's Baseline. No names: counts, and initials on the trail of each
   advisor who joined. The older candidate page, with its placeholder pipeline, is one
   button away, opposite the title. */

import { Fragment, useCallback, useEffect, useState } from 'react'
import './activationAnalytics.css'
import {
  COLLECTING_SINCE,
  loadCandidateFunnel,
  recruitBaseline,
  type CandidateFunnel,
  type JoinedAdvisor,
} from '../data/candidateActivation'
import { HelpTip, pct, Reading, shortDate, Step, StepName } from './ActivationAnalyticsScreen'
import {
  CheckIcon,
  ChevronDown,
  ChevronUp,
  FunnelIcon,
  KnomeeMark,
  TargetIcon,
  TierBarsIcon,
  WarnIcon,
} from '../components/icons'
import KnomeeLoader from '../components/KnomeeLoader'

const MINUTES = 10
const SINCE = shortDate(COLLECTING_SINCE)

/** $M, as recruiters say it: $250M, $1.2B. */
const aum = (m: number) => (m >= 1000 ? `$${(m / 1000).toFixed(1).replace(/\.0$/, '')}B` : `$${Math.round(m)}M`)

/** What records each step, shown from the step's name. */
const RECORDED: Record<string, string> = {
  'Opened the toolkit': 'Recorded by the toolkit’s own “open” event, per firm link.\nCounts once the Firestore rule is in.',
  'Copied an invitation': 'Recorded by the toolkit’s “copy” event, from Copy Text.\nCounts once the Firestore rule is in.',
  'Template links opened': `Recorded by the link’s UTM tags, kept on the invite when it’s first opened.\nCounting since ${SINCE}.`,
  'Sent a link': 'Recorded by Invite, on Candidates.\nLive.',
  'Opened the link': 'Recorded by the flow, the first time the link opens.\nLive.',
  'Started answering': 'Recorded by the flow, on the first answer.\nLive.',
  'Finished the flow': 'Recorded by the flow, once every adventure is taken to its end.\nLive.',
  Joined: `Recorded by Mark as Joined, on Candidates, with the AUM if known.\nCounting since ${SINCE}.`,
}

type Status = 'since' | 'waiting'
const statusChip: Record<Status, { cls: string; label: string }> = {
  since: { cls: 'is-sending', label: `Since ${SINCE}` },
  waiting: { cls: 'is-opened', label: 'Needs the Firestore rule' },
}

function Chip({ status }: { status: Status }) {
  const c = statusChip[status]
  return (
    <span className={`act-status ${c.cls}`}>
      {status === 'waiting' ? <WarnIcon color="currentColor" /> : <CheckIcon />}
      {c.label}
    </span>
  )
}

/** A toolkit step: a count when there is one, otherwise an empty track that
    says it isn't counted yet. */
function ToolkitStep({ label, count, base, status }: { label: string; count: number | null; base: number; status: Status }) {
  const share = count != null ? pct(count, base) : 0
  return (
    <div className={`act-step ${count == null ? 'is-pending' : ''}`}>
      <span className="act-step-label">
        <StepName label={label} tip={RECORDED[label]} />
      </span>
      <span className="act-track">
        {count != null ? (
          <span
            className="act-bar tt"
            style={{ width: `${Math.max(share, 2)}%` }}
            data-tip={`${label}: ${count} of ${base} links`}
            tabIndex={0}
          />
        ) : (
          <span className="act-pending-text">Not counted yet</span>
        )}
      </span>
      <span className="act-step-num">{count != null ? <b>{count}</b> : <i>—</i>}</span>
      <span className="act-step-lost">
        <Chip status={status} />
      </span>
    </div>
  )
}

/** One baseline measure: the firm before Knomee against the same measure
    since, each bar against the larger of the two (Prospect Analytics' LiftRow).
    Until something is counted, the Knomee line says so instead of drawing 0. */
function LiftRow({
  label,
  before,
  after,
  show,
  better,
}: {
  label: string
  before: number
  after: number | null
  show: (n: number) => string
  /** How the change reads, when there is one: words and whether it is good. */
  better: (before: number, after: number) => { words: string; good: boolean }
}) {
  const max = Math.max(before, after ?? 0)
  const change = after != null ? better(before, after) : null
  return (
    <div className="act-lift-row">
      <span className="act-lift-label">{label}</span>
      <span className="act-lift-bars">
        <span className="act-lift-line">
          <span className="act-track">
            <span
              className="act-bar is-before tt"
              style={{ width: `${(before / max) * 100}%` }}
              data-tip={`Before Knomee: ${show(before)}`}
              tabIndex={0}
            />
          </span>
          <span className="act-lift-num is-before">{show(before)}</span>
        </span>
        <span className="act-lift-line">
          {after != null ? (
            <span className="act-track">
              <span
                className="act-bar tt"
                style={{ width: `${Math.max((after / max) * 100, 2)}%` }}
                data-tip={`With Knomee: ${show(after)}`}
                tabIndex={0}
              />
            </span>
          ) : (
            <span className="act-track act-track-empty">
              <span className="act-pending-text">Not counted yet</span>
            </span>
          )}
          <span className="act-lift-num">{after != null ? show(after) : '—'}</span>
        </span>
      </span>
      {change ? (
        <span className={`act-lift-change ${change.good ? '' : 'is-worse'}`}>
          {change.good ? <CheckIcon /> : <WarnIcon color="currentColor" />}
          {change.words}
        </span>
      ) : (
        <span className="act-lift-wait">Counting since {SINCE}</span>
      )}
    </div>
  )
}

/** An advisor's path, from the link that started it to joining the firm. */
function Trail({ a }: { a: JoinedAdvisor }) {
  return (
    <ol className="act-trail">
      <li>
        <b>Link sent</b>
        <span>{shortDate(a.sent)}</span>
        <i>{a.template ? `from the “${a.template}” template` : 'a link without a template tag'}</i>
      </li>
      <li>
        <b>Opened</b>
        <span>{a.opened ? shortDate(a.opened) : '—'}</span>
      </li>
      <li>
        <b>Finished the flow</b>
        <span>{a.finished ? shortDate(a.finished) : '—'}</span>
      </li>
      <li className="is-client">
        <b>Joined</b>
        <span>{shortDate(a.joined)}</span>
        <i>
          {a.aum != null
            ? `${aum(a.aum)} in AUM`
            : `AUM not entered · ≈ ${aum(recruitBaseline.aumPerAdvisor)}, your average`}
        </i>
      </li>
    </ol>
  )
}

export default function CandidateAnalyticsScreen({ onOlderVersion }: { onOlderVersion: () => void }) {
  const [f, setF] = useState<CandidateFunnel | null>(null)
  const load = useCallback(async () => {
    setF(await loadCandidateFunnel())
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  /* One advisor's trail open at a time; the newest is open so the card shows what a trail is. */
  const [openKey, setOpenKey] = useState<string | null>(null)
  useEffect(() => {
    if (f?.joinedAdvisors[0]) setOpenKey(f.joinedAdvisors[0].key)
  }, [f])

  const loss = f?.biggestLoss ?? null
  const unfinished = f ? f.started - f.finished : 0
  const topStop = f?.stopped.reduce((a, b) => (b.count > a.count ? b : a), f.stopped[0])
  const stoppedMax = f ? Math.max(...f.stopped.map((s) => s.count), 1) : 1
  const num = (n: number | undefined) => (f ? n : '…')
  const r = f?.roi
  const withoutAum = f ? f.joined - f.joinedWithAum : 0
  const base = recruitBaseline

  const titleRow = (
    <div className="page-title-row">
      <h1 className="page-title">Candidate Analytics</h1>
      <button className="btn btn-outline" type="button" onClick={onOlderVersion}>
        Older Version
      </button>
    </div>
  )

  /* Until the directory has been read, the page is waiting, as Candidates
     does — the knomee mark turning, not cards of dots. */
  if (!f)
    return (
      <>
        {titleRow}
        <KnomeeLoader title="Hold tight!" note="Gathering your analytics…" />
      </>
    )

  return (
    <>
      {titleRow}

      {/* 1 ── the header: are advisors taking the flow */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <TargetIcon />
            <span>Are Advisors Taking the Flow?</span>
            <HelpTip side="right" text="Live: every invite link made on Candidates, and what happened to it." />
          </div>
        </header>
        <div className="analytics-body">
          <div className="impact-grid act-kpis">
            <div className="impact-card">
              <div className="analytics-lbl">Links sent</div>
              <div className="impact-num">{num(f?.invited)}</div>
              <div className="impact-compare">{f?.since ? `Since ${shortDate(f.since)}` : ' '}</div>
              <div className="impact-detail">Every invite made on Candidates</div>
            </div>
            <div className="impact-card">
              <div className="analytics-lbl">Opened the link</div>
              <div className="impact-num">{f ? `${pct(f.opened, f.invited)}%` : '…'}</div>
              <div className="impact-compare">{f ? `${f.opened} of ${f.invited} links` : ' '}</div>
              <div className="impact-detail">
                {loss?.label === 'Opened the link' ? 'The step that loses the most people' : f ? `${f.invited - f.opened} never opened` : ' '}
              </div>
            </div>
            <div className="impact-card">
              <div className="analytics-lbl">Started answering</div>
              <div className="impact-num">{f ? `${pct(f.started, f.opened)}%` : '…'}</div>
              <div className="impact-compare">{f ? `${f.started} of the ${f.opened} who opened it` : ' '}</div>
              <div className="impact-detail">
                {loss?.label === 'Started answering' ? 'The step that loses the most people' : f ? `${f.opened - f.started} answered nothing` : ' '}
              </div>
            </div>
            <div className="impact-card">
              <div className="analytics-lbl">Finished the flow</div>
              <div className="impact-num">{f ? `${pct(f.finished, f.started)}%` : '…'}</div>
              <div className="impact-compare">{f ? `${f.finished} of the ${f.started} who started` : ' '}</div>
              <div className="impact-detail">
                {loss?.label === 'Finished the flow' ? 'The step that loses the most people' : f ? `${unfinished} stopped partway` : ' '}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 ── ROI: what Knomee brought, against the firm's recruiting from before */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <TierBarsIcon />
            <span>What Knomee Brought Your Firm</span>
            <HelpTip
              side="right"
              text="AUM from the advisors marked as joined, against your recruiting numbers from before Knomee."
            />
          </div>
        </header>
        <div className="analytics-body">
          <div className="act-roi">
            <div className="act-roi-stat">
              <div className="analytics-lbl">AUM from Knomee advisors</div>
              <div className="act-roi-num">{f && f.joined ? aum(r!.aumTotal) : '—'}</div>
              <div className="act-roi-sub">
                {!f
                  ? ' '
                  : f.joined
                    ? `${aum(f.joinedAum)} entered for ${f.joinedWithAum} who joined${withoutAum ? `, plus ${withoutAum} at your ${aum(base.aumPerAdvisor)} average` : ''}`
                    : `No advisor marked as joined yet. Mark as Joined on Candidates counts here from ${SINCE}.`}
              </div>
            </div>
            <div className="act-roi-stat">
              <div className="analytics-lbl">Above your baseline</div>
              <div className="act-roi-num">
                {r?.extraJoined != null ? `${r.extraJoined >= 0 ? '+' : '−'}${Math.abs(r.extraJoined)} joined` : '—'}
              </div>
              <div className="act-roi-sub">
                {!r
                  ? ' '
                  : r.finishedSince
                    ? `${r.finishedSince} finished the flow since ${SINCE}; at your ${Math.round(base.joinedRate * 100)}% that’s ${r.expectedAtBaseline} joined.${r.extraJoined && r.extraJoined > 0 ? ` The extra ${r.extraJoined} ≈ ${aum(r.extraJoined * base.aumPerAdvisor)} in AUM.` : ''}`
                    : `Read against the advisors who finish the flow from ${SINCE} on, at your ${Math.round(base.joinedRate * 100)}%.`}
              </div>
            </div>
            <div className="act-roi-stat">
              <div className="analytics-lbl">Advisors joined</div>
              <div className="act-roi-num">{f ? f.joined : '…'}</div>
              <div className="act-roi-sub">
                {f ? `Of the ${f.finished} who finished the flow and the ${f.invited} links sent` : ' '}
              </div>
            </div>
          </div>

          <div className="act-group-head">
            <span className="analytics-sub-head">Before Knomee, and since</span>
            <span className="act-legend">
              <span>
                <i className="act-swatch is-before" /> Your baseline
              </span>
              <span>
                <i className="act-swatch" /> With Knomee
              </span>
            </span>
          </div>
          <LiftRow
            label="Finished the flow → joined"
            before={base.joinedRate * 100}
            after={r?.joinedRate != null ? r.joinedRate * 100 : null}
            show={(n) => `${Math.round(n)}%`}
            better={(b, a) => {
              const d = Math.round(a - b)
              return { words: `${d >= 0 ? '+' : '−'}${Math.abs(d)} points`, good: d >= 0 }
            }}
          />
          <LiftRow
            label="Days to a decision"
            before={base.daysToDecision}
            after={r?.daysToDecision ?? null}
            show={(n) => `${Math.round(n)} days`}
            better={(b, a) => ({ words: b >= a ? `${b - a} days sooner` : `${a - b} days later`, good: b >= a })}
          />
          <LiftRow
            label="AUM per advisor who joined"
            before={base.aumPerAdvisor}
            after={r?.aumPerAdvisor ?? null}
            show={aum}
            better={(b, a) => {
              const d = pct(a - b, b)
              return { words: `${d >= 0 ? '+' : '−'}${Math.abs(d)}%`, good: d >= 0 }
            }}
          />
          <p className="analytics-note">
            Your baseline is the three numbers in the Recruit Toolkit’s Baseline, from onboarding: first conversation to
            joining, the days it takes, and AUM per advisor who joined. With Knomee, finishing the flow stands in for the first
            conversation, and only advisors who finished it since {SINCE}, when joining began to be recorded, count.
            Days run from the link sent to Mark as Joined.
          </p>
          {withoutAum > 0 && (
            <Reading>
              {withoutAum} of the {f!.joined} who joined were marked without their AUM, so theirs is your average. Ask
              recruiters to fill in the one field when they mark someone as joined.
            </Reading>
          )}
        </div>
      </section>

      {/* 3 ── the funnel: the recruiter's toolkit, then the advisor's flow */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <FunnelIcon />
            <span>From Toolkit to Candidate</span>
            <HelpTip
              side="right"
              text="Counted per invite link. Hover a step's name to see what records it."
            />
          </div>
        </header>
        <div className="analytics-body">
          {!f ? (
            <p className="analytics-note">Reading the directory…</p>
          ) : (
            <>
              <div className="act-group-head">
                <span className="analytics-sub-head">The Recruit Toolkit</span>
                <span className="act-period">Recruiters at your firm</span>
              </div>
              <ToolkitStep label="Opened the toolkit" count={null} base={f.invited} status="waiting" />
              <ToolkitStep label="Copied an invitation" count={null} base={f.invited} status="waiting" />
              <ToolkitStep label="Template links opened" count={f.fromToolkit} base={f.invited} status="since" />

              <div className="act-group-head">
                <span className="analytics-sub-head">The advisors they invited</span>
                <span className="act-period">{f.since ? `Since ${shortDate(f.since)} · live` : 'Live'}</span>
              </div>
              {f.steps.map((s) => (
                <Step
                  s={s}
                  unit="advisors"
                  flag={s === loss && (s.lost ?? 0) > 0}
                  tip={RECORDED[s.label]}
                  key={s.label}
                />
              ))}

              {unfinished > 0 && (
                <div className="act-stopped">
                  <div className="act-stopped-head">
                    Where the {unfinished} who started and didn’t finish stopped
                  </div>
                  {f.stopped.map((w) => (
                    <div className="act-stopped-row" key={w.where}>
                      <span>{w.where}</span>
                      <span className="act-mini-track">
                        <span className="act-mini-bar" style={{ width: `${pct(w.count, stoppedMax)}%` }} />
                      </span>
                      <b>{w.count}</b>
                    </div>
                  ))}
                </div>
              )}

              {loss && (loss.lost ?? 0) > 0 && (
                <Reading>
                  {loss.label === 'Opened the link'
                    ? `${loss.lost} links were never opened. Send the link inside one of the Recruit Toolkit’s invitations, from the recruiter’s own address, rather than on its own.`
                    : loss.label === 'Started answering'
                      ? `${loss.lost} opened the link and answered nothing. The welcome screen is where they leave: say there what they get, and that it takes ${MINUTES} minutes.`
                      : `${loss.lost} started and stopped partway${topStop?.count ? `, most at “${topStop.where}”` : ''}. Remind them a day later where they left off${topStop?.count ? `, and look at what “${topStop.where}” asks` : ''}.`}
                </Reading>
              )}
              <p className="analytics-note">
                Real data, read from the directory each time this page opens: counts only, no names. Links marked as a
                test when they were made are left out{f.tests ? ` (${f.tests} so far)` : ''}; links the team made to try
                the flow before that box was there still count
                {f.unlinked ? `, and the ${f.unlinked} sittings started from the demo itself, not from a link, are left out` : ''}.
                The toolkit steps count once the toolkit’s events can be written to Firestore.
              </p>
              {f.trouble && (
                <p className="analytics-note">
                  {f.trouble}{' '}
                  <button className="act-remind" type="button" onClick={() => void load()}>
                    Try again
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* 4 ── the trail of each advisor who joined: the record that says it was Knomee */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <KnomeeMark size={18} />
            <span>Advisors Knomee Brought In</span>
            <HelpTip side="right" text="The path of each advisor who joined, from the link that started it — open one to see it." />
          </div>
        </header>
        <div className="analytics-body">
          {f && f.joinedAdvisors.length ? (
            <>
              <div className="act-table-wrap">
                <table className="act-table act-clients">
                  <thead>
                    <tr>
                      <th>Advisor</th>
                      <th>Came in through</th>
                      <th className="num">Days to a decision</th>
                      <th className="num">AUM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.joinedAdvisors.map((a) => {
                      const open = openKey === a.key
                      return (
                        <Fragment key={a.key}>
                          <tr className={open ? 'is-open' : ''}>
                            <td>
                              <button
                                className="act-client-btn"
                                type="button"
                                aria-expanded={open}
                                onClick={() => setOpenKey(open ? null : a.key)}
                              >
                                {open ? <ChevronUp /> : <ChevronDown />}
                                {a.who}
                              </button>
                            </td>
                            <td>{a.template ? `“${a.template}”` : <i className="act-muted">Link without a template tag</i>}</td>
                            <td className="num">{a.days}</td>
                            <td className="num">
                              {a.aum != null ? (
                                <b>{aum(a.aum)}</b>
                              ) : (
                                <span className="act-est">≈ {aum(base.aumPerAdvisor)}</span>
                              )}
                            </td>
                          </tr>
                          {open && (
                            <tr className="act-trail-row">
                              <td colSpan={4}>
                                <Trail a={a} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="analytics-note">
                Every advisor here came in on a Knomee link and was marked with Mark as Joined. Initials only. AUM with ≈
                is your average: none was entered when they were marked as joined.
              </p>
            </>
          ) : (
            <p className="analytics-note">
              {f
                ? `No advisor marked as joined yet. Each one marked with Mark as Joined on Candidates shows here, initials only, with the path from the link that brought them.`
                : 'Reading the directory…'}
            </p>
          )}
        </div>
      </section>
    </>
  )
}
