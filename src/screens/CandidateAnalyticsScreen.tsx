/* Candidate Analytics — the page #/firm-analytics opens on.

   The recruiting side of the activation tracking, built like Prospect
   Analytics (its cards, KPI tiles and funnel steps are that page's) but on
   real data: the advisor directory, read each time the page opens. A
   recruiter sends a link from the Recruit Toolkit; the advisor opens it,
   starts answering, finishes, and is added to the Network. The two toolkit
   steps aren't counted until the toolkit's events can be written, and two
   steps are recorded from Oct 29, 2026 — each step says where it comes from.
   Counts only: no name, firm or answer is shown. The older candidate page,
   with its placeholder pipeline, is one button away, opposite the title. */

import { useCallback, useEffect, useState } from 'react'
import './activationAnalytics.css'
import { COLLECTING_SINCE, loadCandidateFunnel, type CandidateFunnel } from '../data/candidateActivation'
import { HelpTip, pct, Reading, shortDate, Step } from './ActivationAnalyticsScreen'
import { ChartIcon, CheckIcon, FunnelIcon, TargetIcon, WarnIcon } from '../components/icons'

const MINUTES = 10

type Status = 'live' | 'since' | 'waiting'
const statusChip: Record<Status, { cls: string; label: string }> = {
  live: { cls: 'is-sending', label: 'Live' },
  since: { cls: 'is-sending', label: `Since ${shortDate(COLLECTING_SINCE)}` },
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
      <span className="act-step-label">{label}</span>
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

/** The sources, step by step: what records it, and whether it is counting. */
const SOURCES: { step: string; by: string; status: Status }[] = [
  { step: 'Opened the Recruit Toolkit', by: 'The toolkit’s own “open” event, per firm link', status: 'waiting' },
  { step: 'Copied an invitation', by: 'The toolkit’s “copy” event, from Copy Text', status: 'waiting' },
  { step: 'Opened a link from a template', by: 'The link’s UTM tags, kept on the invite when it’s first opened', status: 'since' },
  { step: 'Sent a link', by: 'Invite, on Candidates', status: 'live' },
  { step: 'Opened the link', by: 'The flow, the first time the link opens', status: 'live' },
  { step: 'Started answering', by: 'The flow, on the first answer', status: 'live' },
  { step: 'Finished the flow', by: 'The flow, once every adventure is taken to its end', status: 'live' },
  { step: 'Added to Network', by: 'Add to Network, on Candidates', status: 'since' },
]

export default function CandidateAnalyticsScreen({ onOlderVersion }: { onOlderVersion: () => void }) {
  const [f, setF] = useState<CandidateFunnel | null>(null)
  const load = useCallback(async () => {
    setF(await loadCandidateFunnel())
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const loss = f?.biggestLoss ?? null
  const unfinished = f ? f.started - f.finished : 0
  const topStop = f?.stopped.reduce((a, b) => (b.count > a.count ? b : a), f.stopped[0])
  const stoppedMax = f ? Math.max(...f.stopped.map((s) => s.count), 1) : 1
  const num = (n: number | undefined) => (f ? n : '…')

  return (
    <>
      <div className="page-title-row">
        <h1 className="page-title">Candidate Analytics</h1>
        <button className="btn btn-outline" type="button" onClick={onOlderVersion}>
          Older Version
        </button>
      </div>

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

      {/* 2 ── the funnel: the recruiter's toolkit, then the advisor's flow */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <FunnelIcon />
            <span>From Toolkit to Candidate</span>
            <HelpTip side="right" text="Counted per invite link, so the step to fix is the one that loses the most people." />
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
                <Step s={s} unit="advisors" flag={s === loss && (s.lost ?? 0) > 0} key={s.label} />
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

      {/* 3 ── where each number comes from */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <ChartIcon />
            <span>Where Each Number Comes From</span>
            <HelpTip side="right" text="What records each step, and whether it is counting yet." />
          </div>
        </header>
        <div className="analytics-body">
          <div className="act-table-wrap">
            <table className="act-table">
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Recorded by</th>
                  <th>Counting</th>
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((s) => (
                  <tr key={s.step}>
                    <td className="act-adv-name">{s.step}</td>
                    <td>{s.by}</td>
                    <td>
                      <Chip status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="analytics-note">
            Real data, read from the directory each time this page opens: counts only, no names. It includes links
            the team made to try the flow{f && f.unlinked ? `; the ${f.unlinked} sittings started from the demo itself, not from a link, are left out` : ''}.
            The toolkit steps count once the toolkit’s events can be written to Firestore.
          </p>
        </div>
      </section>
    </>
  )
}
