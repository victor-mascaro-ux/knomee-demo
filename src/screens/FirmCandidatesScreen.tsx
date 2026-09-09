/* My Candidates — the firm's pipeline, and the first tab of the Dynasty view.

   Deliberately the advisor's My Prospects screen, part for part: the same
   Actionable Metrics dashboard (pulse, the one next action, the call-list, the
   numbered reasoning behind it), the same toolbar, the same tier-grouped
   table. Only the data underneath is the firm's, and only the columns that
   have no advisor equivalent are new — stage and route. AUM and team size
   came out: the flow never asks either, so the pipeline was reporting two
   numbers nobody in it had said.

   Everything the dashboard states is computed in `candidates.ts` and
   `candidateInsights.ts`, which the table reads too, so the two halves of the
   screen cannot disagree. */

import { Fragment, useState } from 'react'
import CollapsibleCard from '../components/CollapsibleCard'
import './firmCandidates.css'
import {
  candidates,
  candidateStats,
  profileOwner,
  tierGroups,
  type Candidate,
  type Tier,
} from '../data/candidates'
import { insights, talkTo } from '../data/candidateInsights'
import { advisor } from '../data/advisorFlow'
import {
  CaretDown,
  ChartIcon,
  ChevronDown,
  ChevronRight,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
} from '../components/icons'

/* The same three tiers the advisor's dashboard drills into, and the insight
   each one surfaces as its "why". */
const TIER_META = [
  { key: 'Tier 1' as const, tierId: 'tier1' as const, name: 'Ready Now', range: '70–100 EQ', seg: 'seg-1', dot: 'dot-1', insightN: 1 },
  { key: 'Tier 2' as const, tierId: 'tier2' as const, name: 'Considering', range: '40–69 EQ', seg: 'seg-2', dot: 'dot-2', insightN: 7 },
  { key: 'Tier 3' as const, tierId: 'tier3' as const, name: 'Nurture', range: '0–39 EQ', seg: 'seg-3', dot: 'dot-3', insightN: 8 },
]
type TierKey = (typeof TIER_META)[number]['key']

/** The dashboard's help affordance, same glyph and bubble as the advisor's. */
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

/* ── the command centre ─────────────────────────────────────────────────────
   The advisor's layered dashboard, unchanged in shape: pulse (state) and the
   one next action always visible; the call-list and the reasoning are
   discoverable layers; the tier bar is the drill-in spine. */

function CommandCenter({ onOpenProfile }: { onOpenProfile: (c: Candidate) => void }) {
  const [tier, setTier] = useState<TierKey | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)

  const flagged = tier ? talkTo.filter((t) => t.tier === tier) : talkTo
  const lead = flagged[0]
  const meta = tier ? TIER_META.find((m) => m.key === tier)! : null
  const tierInsight = meta ? insights.find((i) => i.n === meta.insightN) : undefined
  const orderedInsights = tierInsight
    ? [tierInsight, ...insights.filter((i) => i !== tierInsight)]
    : insights

  const pickTier = (k: TierKey) =>
    setTier((prev) => {
      const next = prev === k ? null : k
      setListOpen(next !== null)
      return next
    })
  const clear = () => {
    setTier(null)
    setListOpen(false)
  }

  return (
    <CollapsibleCard
      className="cmd-card"
      icon={<ChartIcon color="#7639a1" />}
      title="Actionable Metrics"
      hint={<HelpTip text="The pipeline at a glance, who to talk to, and the reasoning behind it." />}
      bodyClassName="cmd-body"
      defaultOpen
    >
      {/* Layer 0 — the pulse. EQ leads, as on the advisor's screen: it is the
          number the page ranks on and the one the tier bar is a split of. */}
      <div className="metric-tiles cmd-pulse">
          <div className="metric-tile">
            <span className="metric-label">
              AVG EQ SCORE
              <HelpTip
                side="right"
                text="Enterprise Quotient — how ready an advisor is to move onto a platform, 0–100. The same three dimensions as a client's KQ, asked of a practice: Intent (a live decision or a recurring mood), Clarity (do they know what kind of independence they want) and Receptivity (would they let a platform help). It scores the move, not the book."
              />
            </span>
            <div className="metric-num">
              <span className="metric-value metric-value-kq">
                {candidateStats.avgEQ.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="metric-tile">
            <span className="metric-label">TOTAL CANDIDATES</span>
            <div className="metric-num">
              <span className="metric-value">{candidateStats.total}</span>
            </div>
          </div>
          <div className="metric-tile distribution">
            <div className="dist-head">
              <span className="metric-label">TIER DISTRIBUTION</span>
              {tier ? (
                <button className="cmd-clear" type="button" onClick={clear}>
                  Clear filter ✕
                </button>
              ) : (
                <span className="dist-filter-hint">
                  <svg
                    viewBox="0 0 16 16"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    aria-hidden
                  >
                    <path
                      d="M2.5 4h11l-4.2 4.8v3.4l-2.6 1.4V8.8L2.5 4Z"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                  Tap a tier to filter
                </span>
              )}
            </div>
            <div className="dist-bar cmd-dist-bar">
              {TIER_META.map((m) => {
                const n = candidateStats.byTier[m.tierId]
                return (
                  <button
                    key={m.key}
                    type="button"
                    style={{ flex: n || 0.001 }}
                    className={`seg ${m.seg} tt ${tier === m.key ? 'is-sel' : ''} ${
                      tier && tier !== m.key ? 'is-dim' : ''
                    }`}
                    onClick={() => pickTier(m.key)}
                    aria-pressed={tier === m.key}
                    data-tip={`${m.key} · ${m.name} · ${n}`}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
            <div className="dist-legend dist-legend-bars">
              {TIER_META.map((m) => (
                <div
                  className="dist-leg"
                  key={m.key}
                  style={{ flex: candidateStats.byTier[m.tierId] || 0.001 }}
                >
                  <span className="dist-leg-name">
                    <i className={`dot ${m.dot}`} />
                    {m.key} · {m.name}
                  </span>
                  <span className="dist-leg-range">{m.range}</span>
                </div>
              ))}
            </div>
            {candidateStats.byTier.incomplete > 0 && (
              <p className="dist-foot">
                {candidateStats.byTier.incomplete} incomplete profile
                {candidateStats.byTier.incomplete === 1 ? '' : 's'} not shown
              </p>
            )}
          </div>
        </div>

        {/* Layer 0 — the one next action */}
        <div className="cmd-focus">
          <p className="cmd-focus-line">
            {meta ? (
              <>
                <b>
                  {meta.key} · {meta.name}
                </b>{' '}
                — {flagged.length} flagged to talk to this week.
              </>
            ) : (
              <>
                <b>{flagged.length} candidates</b> flagged to talk to this week.
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
              <span className={`talk-tier ${lead.tier === 'Tier 1' ? 't1' : 't2'}`}>
                {lead.tier}
              </span>
              <span className="cmd-lead-kq">EQ {lead.kq}</span>
              <span className="cmd-lead-niche">{lead.niche}</span>
              <span className="cmd-lead-more">
                {listOpen ? 'Hide' : `See all ${flagged.length}`}
                <ChevronDown />
              </span>
            </button>
          ) : (
            <p className="cmd-empty">
              None flagged in this tier this week — keep them on a light-touch nurture track.
            </p>
          )}
        </div>

        {/* Layer 1 — the full call-list */}
        <div className={`collapse ${listOpen && flagged.length ? 'open' : ''}`}>
          <div className="collapse-inner">
            <div className="talk-list cmd-talk-list">
              {flagged.map((t) => (
                <div className="talk-card" key={t.name}>
                  <div className="talk-head">
                    {(() => {
                      // Only the candidate whose profile is built out is a link,
                      // the same rule the Prospects and Clients tables follow.
                      const rec = candidates.find((c) => c.name === t.name)
                      return rec && rec.name === profileOwner ? (
                        <button
                          type="button"
                          className="talk-name name-link-btn"
                          onClick={() => onOpenProfile(rec)}
                        >
                          {t.name}
                        </button>
                      ) : (
                        <span className="talk-name">{t.name}</span>
                      )
                    })()}
                    <span className={`talk-tier ${t.tier === 'Tier 1' ? 't1' : 't2'}`}>
                      {t.tier}
                    </span>
                    <span className="talk-kq">EQ {t.kq}</span>
                    <span className="talk-niche">{t.niche}</span>
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

        {/* Layer 1 — the evidence */}
        <div className="cmd-why">
          <button
            className={`invite-preview-toggle cmd-why-toggle ${whyOpen ? 'is-open' : ''}`}
            type="button"
            aria-expanded={whyOpen}
            onClick={() => setWhyOpen((o) => !o)}
          >
            {meta ? `Why — ${meta.name}` : 'Why these numbers'} <ChevronDown />
          </button>
          {meta && tierInsight && !whyOpen && (
            <button className="cmd-why-peek" type="button" onClick={() => setWhyOpen(true)}>
              <b>{tierInsight.title}.</b> {tierInsight.body.split('. ')[0]}.{' '}
              <span className="cmd-why-peek-more">Read more →</span>
            </button>
          )}
          <div className={`collapse ${whyOpen ? 'open' : ''}`}>
            <div className="collapse-inner">
              <div className="cmd-insights">
                {orderedInsights.map((ins) => (
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
    </CollapsibleCard>
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
            {c.name === profileOwner ? (
              /* Only the candidate whose profile is built out has a picture —
                 the same rule that decides whose name is a link. */
              <span className="avatar fc-portrait">
                <img src={advisor.photo} alt="" />
              </span>
            ) : (
              <span className="avatar avatar-initial">{c.name.charAt(0)}</span>
            )}
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
      <td className="col-num col-intent">{c.intent ?? '–'}</td>
      <td className="col-num col-clarity">{c.clarity ?? '–'}</td>
      <td className="col-num col-receptivity">{c.receptivity ?? '–'}</td>
      <td className="col-firm-word col-stage">{c.stage ?? '–'}</td>
      <td className="col-firm-word col-route">{c.route}</td>
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
                aria-label="Sort by EQ score"
              >
                EQ Score
                <span
                  className={`th-caret ${sortDir ? 'is-active' : ''} ${
                    sortDir === 'asc' ? 'is-asc' : ''
                  }`}
                >
                  <CaretDown />
                </span>
              </button>
            </th>
            <th className="col-num col-intent">Intent</th>
            <th className="col-num col-clarity">Clarity</th>
            <th className="col-num col-receptivity">Receptivity</th>
            <th className="col-firm-word col-stage">Stage</th>
            <th className="col-firm-word col-route">Route</th>
            <th className="col-action">Top Action</th>
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
                        aria-label={
                          isCollapsed ? `Expand ${group.title}` : `Collapse ${group.title}`
                        }
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
        <p className="fc-empty">No candidate matches that search.</p>
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
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const rows = candidates.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.firm.toLowerCase().includes(q),
  )

  return (
    <>
      <h1 className="page-title">My Candidates</h1>
      <CommandCenter onOpenProfile={onOpenProfile} />

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

      <Table rows={rows} onOpen={onOpenProfile} />
    </>
  )
}
