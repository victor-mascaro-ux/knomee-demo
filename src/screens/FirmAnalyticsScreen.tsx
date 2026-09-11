/* The firm's Analytics — the pipeline in aggregate.

   The advisor's analytics tells them who to call. This one tells Dynasty what
   to change about the offer, so every section ends in a fix rather than a
   finding: published retention data instead of a better talk track, a G2
   equity one-pager instead of a promise, a same-week call rule instead of a
   reminder. Card structure and bar treatments come from the advisor analytics
   sheet; every number is computed in `firmAnalytics.ts`. */

import './firmAnalytics.css'
import {
  apprehensionReadings,
  apprehensionsRanked,
  aumNote,
  byAum,
  bySegment,
  bySource,
  clusterPerformance,
  clusterReadings,
  dropReadings,
  funnel,
  kpis,
  MIN_SAMPLE,
  segmentReadings,
  stageReading,
  byStage,
  type FirmSegment,
} from '../data/firmAnalytics'
import { candidateStats } from '../data/candidates'
import {
  ChartIcon,
  FunnelIcon,
  MegaphoneIcon,
  TargetIcon,
  TierBarsIcon,
  WarnIcon,
} from '../components/icons'

/* Under this share, a bar is narrower than the label it would have to hold,
   so the label steps outside it instead of going white on a pale track. */
const THR_INSIDE = 18

/** A rate on five or fewer people is a direction, not a finding. */
function Thin({ n }: { n: number }) {
  return (
    <span className="fa-thin">
      <WarnIcon /> n={n}, too small to read as a rate
    </span>
  )
}

function Reading({ children }: { children: React.ReactNode }) {
  return (
    <p className="fa-reading">
      <span className="fa-fix">Fix</span>
      {children}
    </p>
  )
}

/** One row of a segment view: how many came in, and how much of that bar
    actually signed. */
function SegRow({ s, max }: { s: FirmSegment; max: number }) {
  return (
    <div className={`fa-seg-row ${s.thin ? 'is-thin' : ''}`}>
      <span className="fa-seg-name">{s.name}</span>
      <span className="fa-seg-track">
        <span className="fa-seg-bar" style={{ width: `${(s.invited / max) * 100}%` }}>
          <span
            className="fa-seg-signed"
            style={{ width: `${s.invited ? (s.signed / s.invited) * 100 : 0}%` }}
          />
        </span>
      </span>
      <span className="fa-seg-meta">
        {s.invited} in · {s.completed} completed · {s.meetings} met · <b>{s.signed} signed</b>
        {s.thin ? '' : ` · ${s.conv}%`}
      </span>
    </div>
  )
}

function SegmentView({ title, rows, note }: { title: string; rows: FirmSegment[]; note?: string }) {
  const max = Math.max(...rows.map((r) => r.invited), 1)
  return (
    <div className="fa-seg-block">
      <div className="analytics-sub-head">{title}</div>
      {rows.map((s) => (
        <SegRow s={s} max={max} key={s.name} />
      ))}
      {note && <p className="analytics-note">{note}</p>}
    </div>
  )
}

export default function FirmAnalyticsScreen() {
  return (
    <>
      <h1 className="page-title">Analytics</h1>

      {/* 1 ── the header */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <TargetIcon />
            <span>The Pipeline, In Aggregate</span>
          </div>
        </header>
        <div className="analytics-body">
          <div className="impact-grid fa-kpis">
            {kpis.map((k) => (
              <div className="impact-card" key={k.label}>
                <div className="analytics-lbl">{k.label}</div>
                <div className="impact-num">{k.value}</div>
                <div className="impact-compare">{k.compare}</div>
                <div className={`impact-detail ${k.good ? 'good' : ''}`}>{k.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2 ── the funnel */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <FunnelIcon />
            <span>Invited to Signed</span>
          </div>
        </header>
        <div className="analytics-body">
          <div className="sector-bar fa-funnel">
            {funnel.map((f) => (
              <span
                key={f.stage}
                className={`sector-seg ${f.pct < 8 ? 'sector-seg-narrow' : ''}`}
                style={{ flex: f.pct || 0.001, background: f.fill, color: f.ink }}
              >
                <span className="sector-lbl">{f.count}</span>
              </span>
            ))}
          </div>
          <div className="sector-legend fa-funnel-legend">
            {funnel.map((f) => (
              <span key={f.stage}>
                <i className="swatch" style={{ background: f.fill }} />
                {f.stage} · {f.count} · {f.pct}%
              </span>
            ))}
          </div>

          <div className="fa-drops">
            {dropReadings.map((d, i) => (
              <div className="fa-drop" key={d.where}>
                <span className="fa-drop-where">
                  {d.where}
                  {funnel[i + 1] && <b> −{funnel[i + 1].drop}</b>}
                </span>
                <span className="fa-drop-read">{d.reading}</span>
                <Reading>{d.fix}</Reading>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 ── cluster performance */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <ChartIcon />
            <span>Which Clusters Convert, and Which Absorb the Quarter</span>
          </div>
        </header>
        <div className="analytics-body">
          <div className="fa-table-wrap">
            <table className="fa-table">
              <thead>
                <tr>
                  <th>Cluster</th>
                  <th>Advisors</th>
                  <th>Met</th>
                  <th>Signed</th>
                  <th>Converts</th>
                  <th>Meetings without a signing</th>
                  <th>What changes</th>
                </tr>
              </thead>
              <tbody>
                {clusterPerformance.map((c) => (
                  <tr className={c.thin ? 'is-thin' : ''} key={c.n}>
                    <td>
                      <span className="fa-cn">{c.n}</span>
                      {c.name}
                    </td>
                    <td>{c.size}</td>
                    <td>{c.meetings}</td>
                    <td>{c.signed}</td>
                    <td>
                      <b>{c.conv}%</b>
                      {c.thin && <i> n≤{MIN_SAMPLE}</i>}
                    </td>
                    <td>{c.absorbed}</td>
                    <td className="fa-td-action">{c.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clusterReadings.map((r) => (
            <p className="fa-lead" key={r}>
              {r}
            </p>
          ))}
        </div>
      </section>

      {/* 4 ── the apprehensions. The section that is an argument for selling to
              the firm rather than to advisors one at a time. */}
      <section className="card analytics-card fa-appr-card">
        <header className="card-head">
          <div className="card-title">
            <MegaphoneIcon />
            <span>What Is Actually Stopping Them — Ranked</span>
          </div>
        </header>
        <div className="analytics-body">
          <p className="fa-lead">
            One rep hears these one advisor at a time. Ranked across the pipeline, they stop being
            objections to handle and become things to build.
          </p>
          <div className="fa-apprs">
            {apprehensionsRanked.map((a, i) => (
              <div className="fa-appr" key={a.label}>
                <div className="fa-appr-head">
                  <span className="fa-appr-rank">{i + 1}</span>
                  <span className="fa-appr-name">{a.label}</span>
                  <span className="fa-appr-count">
                    {a.count} of {candidateStats.scored} · {a.share}%
                  </span>
                </div>
                <span className="fa-appr-track">
                  <span className="fa-appr-bar" style={{ width: `${a.share}%` }} />
                </span>
                <span className="fa-appr-conv">
                  Converts {a.conv}% ({a.signed}/{a.count}){a.thin ? ` · n≤${MIN_SAMPLE}` : ''}
                </span>
                <Reading>{a.fix}</Reading>
              </div>
            ))}
          </div>
          <div className="fa-worked">
            {apprehensionReadings.map((r) => (
              <p key={r}>{r}</p>
            ))}
          </div>
        </div>
      </section>

      {/* 5 ── segments */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <FunnelIcon />
            <span>Where the Good Ones Come From</span>
          </div>
        </header>
        <div className="analytics-body">
          <SegmentView title="By source" rows={bySource} />
          <SegmentView title="By segment" rows={bySegment} />
          <SegmentView title="By book size" rows={byAum} note={aumNote} />
          {segmentReadings.map((r) => (
            <p className="fa-lead" key={r}>
              {r}
            </p>
          ))}
        </div>
      </section>

      {/* 6 ── stage distribution */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <TierBarsIcon />
            <span>Where the Pipeline Actually Stands</span>
          </div>
        </header>
        <div className="analytics-body">
          <div className="tier-hero fa-stages">
            {byStage.map((s) => (
              <div className={`tier-hero-row ${s.thin ? 'thin' : ''}`} key={s.stage}>
                <span className="thr-name">{s.stage}</span>
                <span className="thr-track" style={{ ['--thr-w' as string]: `${s.share}%` }}>
                  <span className="thr-fill" style={{ width: `${s.share}%` }} />
                  <b className={`thr-conv ${s.share < THR_INSIDE ? 'is-outside' : ''}`}>
                    {s.share}%
                  </b>
                </span>
                <span className="thr-meta">
                  <b>n={s.count}</b> · {s.signed} signed · converts {s.conv}%
                </span>
                {s.thin && <Thin n={s.count} />}
              </div>
            ))}
          </div>
          <p className="fa-lead">{stageReading}</p>
          <p className="analytics-note">
            Shares are of the {candidateStats.scored} advisors who completed the flow. The{' '}
            {candidateStats.byTier.incomplete} incomplete profiles have no stage and are excluded.
          </p>
        </div>
      </section>

      <p className="analytics-note fa-foot">
        All figures are placeholder demo data computed from the candidate pipeline. No real advisor
        or firm is represented.
      </p>
    </>
  )
}
