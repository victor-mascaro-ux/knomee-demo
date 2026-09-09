/* My Candidates — the firm's pipeline, and the first tab of the Dynasty view.
   The advisor's Prospects screen anatomy (title, command centre, toolbar,
   tier-grouped table) with the firm's own columns and its own centre of
   gravity: the behavioural clusters.

   The table and the clusters read the same array, so they cannot disagree.
   Clicking a cluster or a readiness stage filters the table to exactly the
   people the card is talking about — a card that cannot show you its own
   members is an assertion, not an insight. */

import { Fragment, useState } from 'react'
import './firmCandidates.css'
import {
  candidates,
  candidateStats,
  profileOwner,
  tierGroups,
  type Candidate,
  type Stage,
  type Tier,
} from '../data/candidates'
import { clusterOf, clusters, clusterLead, MIN_SAMPLE, unclustered } from '../data/candidateInsights'
import type { ClusterKey } from '../data/candidateInsights'
import {
  CaretDown,
  ChartIcon,
  ChevronDown,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
} from '../components/icons'

/* The five stages, deepest colour at the far end, so the bar reads as
   progress. Every value is a token. */
const STAGE_META: { stage: Stage; fill: string; ink: string }[] = [
  { stage: 'Pre-contemplation', fill: 'var(--k-grape-light)', ink: 'var(--k-plum)' },
  { stage: 'Contemplation', fill: 'var(--k-lilac-soft)', ink: 'var(--k-plum)' },
  { stage: 'Preparation', fill: 'var(--k-lilac)', ink: 'var(--k-plum)' },
  { stage: 'Action', fill: 'var(--k-grape)', ink: 'var(--k-white)' },
  { stage: 'Maintenance', fill: 'var(--k-plum)', ink: 'var(--k-white)' },
]

const money = (m: number) => (m >= 1000 ? `$${(m / 1000).toFixed(1)}B` : `$${m}M`)

function CandidateName({ c, onOpen }: { c: Candidate; onOpen: (c: Candidate) => void }) {
  const isOwner = c.name === profileOwner
  return (
    <div className="name-block">
      {isOwner ? (
        <button type="button" className="name-line name-link-btn" onClick={() => onOpen(c)}>
          <span className="name-text">
            {c.name}
            <span className="name-chevron" aria-hidden>
              ›
            </span>
          </span>
        </button>
      ) : (
        <span className="name-line">
          <span className="name-text">{c.name}</span>
        </span>
      )}
      <span className="email-line">{c.firm}</span>
    </div>
  )
}

/* ── the command centre ─────────────────────────────────────────────────── */

function Pulse({
  stage,
  onStage,
}: {
  stage: Stage | null
  onStage: (s: Stage) => void
}) {
  return (
    <div className="metric-tiles fc-pulse">
      <div className="metric-tile">
        <span className="metric-label">CANDIDATES</span>
        <div className="metric-num">
          <span className="metric-value">{candidateStats.total}</span>
        </div>
        <span className="fc-tile-sub">{candidateStats.scored} completed the flow</span>
      </div>
      <div className="metric-tile">
        <span className="metric-label">AUM IN PIPELINE</span>
        <div className="metric-num">
          <span className="metric-value">{money(candidateStats.aum)}</span>
        </div>
        <span className="fc-tile-sub">avg KQ {candidateStats.avgKQ}</span>
      </div>
      <div className="metric-tile distribution">
        <div className="dist-head">
          <span className="metric-label">READINESS STAGE</span>
          <span className="fc-tile-sub">
            The column no other pipeline has. Tap a stage to filter.
          </span>
        </div>
        <div className="dist-bar fc-stage-bar">
          {candidateStats.byStage.map((s, i) => {
            const meta = STAGE_META[i]
            return (
              <button
                key={s.stage}
                type="button"
                className={`seg tt ${stage === s.stage ? 'is-sel' : ''} ${
                  stage && stage !== s.stage ? 'is-dim' : ''
                }`}
                style={{ flex: s.count || 0.001, background: meta.fill, color: meta.ink }}
                onClick={() => onStage(s.stage)}
                aria-pressed={stage === s.stage}
                data-tip={`${s.stage} · ${s.count} advisors · ${s.share}%`}
              >
                {s.count}
              </button>
            )
          })}
        </div>
        <div className="dist-legend fc-stage-legend">
          {candidateStats.byStage.map((s, i) => (
            <div className="dist-leg" key={s.stage} style={{ flex: s.count || 0.001 }}>
              <span className="dist-leg-name">
                <i className="dot" style={{ background: STAGE_META[i].fill }} />
                {s.stage}
              </span>
              <span className="dist-leg-range">{s.share}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ClusterCard({
  c,
  active,
  onPick,
  onOpen,
}: {
  c: (typeof clusters)[number]
  active: boolean
  onPick: () => void
  onOpen: (c: Candidate) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className={`fc-cluster ${active ? 'is-active' : ''}`}>
      <header className="fc-cluster-head">
        <span className="fc-cluster-n">{c.n}</span>
        <div className="fc-cluster-title">
          <h3>{c.name}</h3>
          <p>{c.spine}</p>
        </div>
      </header>

      <div className="fc-cluster-stats">
        <span className="fc-stat">
          <b>{c.size}</b> advisors
        </span>
        <span className="fc-stat">
          <b>{c.share}%</b> of pipeline
        </span>
        <span className="fc-stat">
          avg KQ <b>{c.avgKQ}</b>
        </span>
        <span className="fc-stat">
          avg book <b>{money(c.avgAUM)}</b>
        </span>
        <span className={`fc-stat ${c.thin ? 'is-thin' : ''}`}>
          converts <b>{c.conv}%</b>
          <i>
            {c.signed}/{c.size}
            {c.thin ? ` · n≤${MIN_SAMPLE}, not yet evidence` : ''}
          </i>
        </span>
      </div>

      <p className="fc-cluster-appr">
        <span className="fc-k">Recurring apprehension</span>
        {c.apprehension.label} — {c.apprehension.count} of {c.size} ({c.apprehension.share}%)
      </p>

      <p className="fc-cluster-action">
        <span className="fc-do">Do</span>
        {c.action}
      </p>
      <p className="fc-cluster-why">{c.why}</p>

      <div className="fc-cluster-foot">
        <button type="button" className="fc-link" onClick={onPick} aria-pressed={active}>
          {active ? 'Clear filter ✕' : 'Show in table'}
        </button>
        <button
          type="button"
          className="fc-link"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {open ? 'Hide the names' : `See the ${c.size}`} <ChevronDown />
        </button>
      </div>
      <div className={`collapse ${open ? 'open' : ''}`}>
        <div className="collapse-inner">
          <div className="fc-members">
            {c.members.map((m) => (
              <span className="fc-member" key={m.name}>
                {m.name === profileOwner ? (
                  <button type="button" className="fc-member-link" onClick={() => onOpen(m)}>
                    {m.name}
                  </button>
                ) : (
                  m.name
                )}
                <i>
                  KQ {m.kq} · {money(m.aum)}
                </i>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CommandCenter({
  cluster,
  onCluster,
  stage,
  onStage,
  onOpen,
}: {
  cluster: ClusterKey | null
  onCluster: (k: ClusterKey) => void
  stage: Stage | null
  onStage: (s: Stage) => void
  onOpen: (c: Candidate) => void
}) {
  return (
    <section className="card cmd-card">
      <header className="card-head">
        <div className="card-title">
          <ChartIcon color="#7639a1" />
          <span>Actionable Insights</span>
        </div>
      </header>
      <div className="cmd-body">
        <Pulse stage={stage} onStage={onStage} />
        <p className="fc-lead">{clusterLead}</p>
        <div className="fc-clusters">
          {clusters.map((c) => (
            <ClusterCard
              key={c.key}
              c={c}
              active={cluster === c.key}
              onPick={() => onCluster(c.key)}
              onOpen={onOpen}
            />
          ))}
        </div>
        {unclustered.length > 0 && (
          <p className="fc-unclustered">
            {unclustered.length} scored advisor{unclustered.length === 1 ? '' : 's'} match no
            cluster rule. They are in the table and in no card — if this number grows, the rules
            need revisiting rather than the pipeline.
          </p>
        )}
      </div>
    </section>
  )
}

/* ── the table ──────────────────────────────────────────────────────────── */

function Row({ c, onOpen }: { c: Candidate; onOpen: (c: Candidate) => void }) {
  const incomplete = c.tier === 'incomplete'
  return (
    <tr className={incomplete ? 'row-incomplete' : undefined}>
      <td className="col-name">
        <div className="name-cell">
          <span className="avatar-wrap">
            <span className="avatar avatar-initial">{c.name.charAt(0)}</span>
            {c.isNew && <span className="new-tag avatar-new">new</span>}
          </span>
          <CandidateName c={c} onOpen={onOpen} />
        </div>
      </td>
      <td className="col-kq">
        {c.kq === null ? (
          <span className="score-badge empty">–</span>
        ) : (
          <span className={`score-badge score-${c.tier}`}>{c.kq}</span>
        )}
      </td>
      <td className="col-num">{c.intent ?? '–'}</td>
      <td className="col-num">{c.clarity ?? '–'}</td>
      <td className="col-num">{c.receptivity ?? '–'}</td>
      <td className="col-firm-word">{c.stage ?? '–'}</td>
      <td className="col-num">{money(c.aum)}</td>
      <td className="col-num">{c.team}</td>
      <td className="col-firm-word">{c.route}</td>
      <td className="col-action">
        <div className="top-action">
          <div className="top-action-text">{c.topAction}</div>
          <div className="top-action-pop">{c.topAction}</div>
        </div>
      </td>
    </tr>
  )
}

function Table({ rows, onOpen }: { rows: Candidate[]; onOpen: (c: Candidate) => void }) {
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggleGroup = (id: string) =>
    setCollapsed((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const sortRows = (rs: Candidate[]) => {
    if (!sortDir) return rs
    const scored = [...rs.filter((c) => c.kq !== null)].sort(
      (a, b) => (b.kq as number) - (a.kq as number),
    )
    return [...scored, ...rs.filter((c) => c.kq === null)]
  }
  const orderedGroups = (() => {
    const scored = tierGroups.filter((g) => g.id !== 'incomplete')
    const rest = tierGroups.filter((g) => g.id === 'incomplete')
    return [...(sortDir === 'asc' ? [...scored].reverse() : scored), ...rest]
  })()

  return (
    <div className="table-wrap">
      <table className="prospects-table fc-table">
        <thead>
          <tr>
            <th className="col-name">Name / firm</th>
            <th className="col-kq">
              <button
                type="button"
                className="th-sort th-sort-btn"
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                aria-label="Sort by KQ score"
              >
                KQ Score
                <span
                  className={`th-caret ${sortDir ? 'is-active' : ''} ${
                    sortDir === 'asc' ? 'is-asc' : ''
                  }`}
                >
                  <CaretDown />
                </span>
              </button>
            </th>
            <th className="col-num">Intent</th>
            <th className="col-num">Clarity</th>
            <th className="col-num">Receptivity</th>
            <th className="col-firm-word">Stage</th>
            <th className="col-num">AUM</th>
            <th className="col-num">Team</th>
            <th className="col-firm-word">Route</th>
            <th className="col-action">Top action</th>
          </tr>
        </thead>
        <tbody>
          {orderedGroups.map((group) => {
            const inGroup = rows.filter((c) => c.tier === (group.id as Tier))
            if (inGroup.length === 0) return null
            const isCollapsed = collapsed.has(group.id)
            return (
              <Fragment key={`g-${group.id}`}>
                <tr
                  className={`group-header group-${group.id} ${isCollapsed ? 'is-collapsed' : ''}`}
                  onClick={() => toggleGroup(group.id)}
                >
                  <td colSpan={10}>
                    <div className="group-header-inner">
                      <button
                        type="button"
                        className="group-toggle"
                        aria-expanded={!isCollapsed}
                        aria-label={isCollapsed ? `Expand ${group.title}` : `Collapse ${group.title}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleGroup(group.id)
                        }}
                      >
                        <ChevronDown />
                      </button>
                      <span>{group.title}</span>
                      <span className="group-count">{inGroup.length}</span>
                      {group.range && <span className="group-range">{group.range}</span>}
                    </div>
                  </td>
                </tr>
                {!isCollapsed &&
                  sortRows(inGroup).map((c) => <Row c={c} key={c.name} onOpen={onOpen} />)}
              </Fragment>
            )
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="fc-empty">Nothing matches this filter. Clear it to see the pipeline.</p>
      )}
    </div>
  )
}

/* ── the screen ─────────────────────────────────────────────────────────── */

export default function FirmCandidatesScreen({
  onOpenProfile,
  onDownload,
  onInvite,
}: {
  onOpenProfile: (c: Candidate) => void
  onDownload: () => void
  onInvite: () => void
}) {
  const [cluster, setCluster] = useState<ClusterKey | null>(null)
  const [stage, setStage] = useState<Stage | null>(null)
  const [query, setQuery] = useState('')

  const pickCluster = (k: ClusterKey) => setCluster((p) => (p === k ? null : k))
  const pickStage = (s: Stage) => setStage((p) => (p === s ? null : s))

  const q = query.trim().toLowerCase()
  const rows = candidates.filter(
    (c) =>
      (!cluster || clusterOf(c) === cluster) &&
      (!stage || c.stage === stage) &&
      (!q || c.name.toLowerCase().includes(q) || c.firm.toLowerCase().includes(q)),
  )
  const activeCluster = clusters.find((c) => c.key === cluster)

  return (
    <>
      <h1 className="page-title">My Candidates</h1>
      <CommandCenter
        cluster={cluster}
        onCluster={pickCluster}
        stage={stage}
        onStage={pickStage}
        onOpen={onOpenProfile}
      />

      <div className="toolbar">
        <div className="search-box">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search name or firm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="toolbar-actions">
          <button className="btn btn-download active" type="button" onClick={onDownload}>
            <DownloadIcon /> Download
          </button>
          <button className="btn btn-primary" type="button" onClick={onInvite}>
            <PlusIcon /> Invite
          </button>
        </div>
      </div>

      {(activeCluster || stage) && (
        <div className="fc-filters">
          <span className="fc-filter-lead">
            Showing {rows.length} of {candidateStats.total}
          </span>
          {activeCluster && (
            <button type="button" className="fc-chip" onClick={() => setCluster(null)}>
              {activeCluster.n}. {activeCluster.name} ✕
            </button>
          )}
          {stage && (
            <button type="button" className="fc-chip" onClick={() => setStage(null)}>
              {stage} ✕
            </button>
          )}
          {activeCluster && <span className="fc-filter-do">{activeCluster.action}</span>}
        </div>
      )}

      <Table rows={rows} onOpen={onOpenProfile} />
    </>
  )
}
