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

import { InvitePanel } from './AdvisorDirectoryScreen'
import { deleteEntry, deleteInvite, listEntries, type Trouble } from '../data/advisorDirectory'
import { candidateFromEntry, type LiveCandidate } from '../data/liveCandidates'
import './advisorDirectory.css'
import { Fragment, useCallback, useEffect, useState } from 'react'
import CollapsibleCard from '../components/CollapsibleCard'
import RowMenu from '../components/RowMenu'
import './firmCandidates.css'
import {
  candidates,
  statsOf,
  profileOwner,
  tierGroups,
  type Candidate,
  type Tier,
} from '../data/candidates'
import { talkTo } from '../data/candidateInsights'
import { advisor } from '../data/advisorFlow'
import KnomeeLoader from '../components/KnomeeLoader'
import {
  CaretDown,
  ChartIcon,
  ChevronDown,
  ChevronRight,
  CloseIcon,
  DownloadIcon,
  LightningIcon,
  PlusIcon,
  SearchIcon,
} from '../components/icons'

/* The same three tiers the advisor's dashboard drills into, and the insight
   each one surfaces as its "why". */
const TIER_META = [
  { key: 'Tier 1' as const, tierId: 'tier1' as const, name: 'Ready Now', range: '70–100 RQ', seg: 'seg-1', dot: 'dot-1', insightN: 1 },
  { key: 'Tier 2' as const, tierId: 'tier2' as const, name: 'Considering', range: '40–69 RQ', seg: 'seg-2', dot: 'dot-2', insightN: 7 },
  { key: 'Tier 3' as const, tierId: 'tier3' as const, name: 'Nurture', range: '0–39 RQ', seg: 'seg-3', dot: 'dot-3', insightN: 8 },
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

/* A row with a report behind it: the walkthrough's, or a live sitting that
   finished the flow. */
const opensProfile = (c: Candidate) =>
  c.name === profileOwner || ('entryId' in c && c.kq !== null)

function CandidateName({ c, onOpen }: { c: Candidate; onOpen: (c: Candidate) => void }) {
  const isOwner = opensProfile(c)
  /* The "new" pill sits on the name's line, as it does in the advisor's tables. */
  const tag = c.isNew ? <span className="new-tag cp-goal-tag is-new">New</span> : null
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
          {tag}
        </button>
      ) : (
        <span className="name-line">
          <span className="name-text">{c.name}</span>
          {tag}
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

function CommandCenter({
  onOpenProfile,
  stats,
  names,
  tier,
  setTier,
}: {
  /** The tier the bar is focused on — held by the page, because it filters
      the table under the card too, as the Clients dashboard's bar does. */
  tier: TierKey | null
  setTier: (t: TierKey | null | ((prev: TierKey | null) => TierKey | null)) => void
  onOpenProfile: (c: Candidate) => void
  /** The pipeline's figures, over the rows on the page. */
  stats: ReturnType<typeof statsOf>
  /** Who is on the page: the call-list only names people who are. */
  names: Set<string>
}) {
  const [listOpen, setListOpen] = useState(false)

  const onPage = talkTo.filter((t) => names.has(t.name))
  const flagged = tier ? onPage.filter((t) => t.tier === tier) : onPage
  const lead = flagged[0]
  const meta = tier ? TIER_META.find((m) => m.key === tier)! : null

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
      {/* Layer 0 — the pulse. RQ leads, as on the advisor's screen: it is the
          number the page ranks on and the one the tier bar is a split of. */}
      <div className="metric-tiles cmd-pulse">
          <div className="metric-tile">
            <span className="metric-label">
              AVG RQ SCORE
              <HelpTip
                side="right"
                text="Recruitment Quotient — how ready this advisor is to move, 0–100. It scores the move, not the book."
              />
            </span>
            <div className="metric-num">
              <span className="metric-value metric-value-kq">
                {Math.round(stats.avgRQ)}
              </span>
            </div>
          </div>
          <div className="metric-tile">
            <span className="metric-label">TOTAL CANDIDATES</span>
            <div className="metric-num">
              <span className="metric-value">{stats.total}</span>
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
              {/* A tier with nobody in it is left off the bar and its legend. */}
              {TIER_META.filter((m) => stats.byTier[m.tierId] > 0).map((m) => {
                const n = stats.byTier[m.tierId]
                return (
                  <button
                    key={m.key}
                    type="button"
                    style={{ flex: n }}
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
              {TIER_META.filter((m) => stats.byTier[m.tierId] > 0).map((m) => (
                <div className="dist-leg" key={m.key} style={{ flexGrow: stats.byTier[m.tierId] }}>
                  <span className="dist-leg-name">
                    <i className={`dot ${m.dot}`} />
                    {m.key} · {m.name}
                  </span>
                  <span className="dist-leg-range">{m.range}</span>
                </div>
              ))}
            </div>
            {stats.byTier.incomplete > 0 && (
              <p className="dist-foot">
                {stats.byTier.incomplete} incomplete profile
                {stats.byTier.incomplete === 1 ? '' : 's'} not shown
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
              <span className="cmd-lead-kq">RQ {lead.kq}</span>
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
                    <span className="talk-kq">RQ {t.kq}</span>
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

    </CollapsibleCard>
  )
}

/* ── the table ──────────────────────────────────────────────────────────── */

function Row({
  c,
  onOpen,
  onAdd,
  onRemove,
  checked,
  onToggle,
}: {
  c: Candidate
  onOpen: (c: Candidate) => void
  onAdd: (c: Candidate) => void
  /** Only a live sitting can be removed; the worked example cannot. */
  onRemove?: (c: LiveCandidate) => void
  checked: boolean
  onToggle: () => void
}) {
  const incomplete = c.tier === 'incomplete'
  return (
    <tr className={incomplete ? 'row-incomplete' : undefined}>
      <td className="col-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${c.name}`}
        />
      </td>
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
      {/* A sitting still under way has no scores yet: its three score cells
          are one, showing how far through the flow it is. */}
      {incomplete && 'entryId' in c ? (
        <td className="col-progress" colSpan={3}>
          {(() => {
            const { answered, total } = c as LiveCandidate
            const pct = total ? Math.round((answered / total) * 100) : 0
            return (
              <div className="fc-progress" aria-label={`${answered} of ${total} answered`}>
                <span className="fc-progress-track">
                  <i style={{ width: `${pct}%` }} />
                </span>
                <span className="fc-progress-label">
                  {answered} of {total} answered
                </span>
              </div>
            )
          })()}
        </td>
      ) : (
        <>
          <td className="col-num col-intent">{c.intent ?? '–'}</td>
          <td className="col-num col-clarity">{c.clarity ?? '–'}</td>
          <td className="col-num col-receptivity">{c.receptivity ?? '–'}</td>
        </>
      )}
      <td className="col-action">
        <div className="top-action">
          <div className="top-action-text">{c.topAction}</div>
          <div className="top-action-pop">{c.topAction}</div>
        </div>
      </td>
      {/* The advisor's bolt converts a prospect; this one adds an advisor to
          the network. Same control, same place, because it is the same move —
          the row's one action, taken without opening the profile. */}
      <td className="col-bolt">
        <button
          className={`bolt-btn ${incomplete ? 'bolt-disabled' : `bolt-${c.tier}`}`}
          type="button"
          title={incomplete ? undefined : 'Add to Network'}
          aria-label={incomplete ? undefined : 'Add to Network'}
          onClick={() => {
            if (!incomplete) onAdd(c)
          }}
        >
          <LightningIcon
            color={incomplete ? '#c9c9c9' : c.tier === 'tier3' ? '#240446' : '#ffffff'}
          />
        </button>
      </td>
      <td className="col-dots">
        <RowMenu
          items={[
            ...(incomplete
              ? [{ label: 'View profile', disabled: true }]
              : [
                  { label: 'Add to Network', onClick: () => onAdd(c) },
                  {
                    label: 'View profile',
                    disabled: !opensProfile(c),
                    onClick: opensProfile(c) ? () => onOpen(c) : undefined,
                  },
                ]),
            ...('entryId' in c && onRemove
              ? [{ label: 'Remove entry', danger: true, onClick: () => onRemove(c as LiveCandidate) }]
              : []),
          ]}
        />
      </td>
    </tr>
  )
}

function Table({
  rows,
  onOpen,
  onAdd,
  onRemove,
  selected,
  onToggle,
  allChecked,
  onToggleAll,
}: {
  rows: Candidate[]
  onOpen: (c: Candidate) => void
  onAdd: (c: Candidate) => void
  onRemove: (c: LiveCandidate) => void
  selected: Set<string>
  onToggle: (name: string) => void
  allChecked: boolean
  onToggleAll: () => void
}) {
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
            <th className="col-check">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={onToggleAll}
                aria-label="Select all candidates"
              />
            </th>
            <th className="col-name">Name / firm</th>
            <th className="col-kq tt" data-tip="Recruitment Quotient — how ready this advisor is to move">
              <button
                type="button"
                className="th-sort th-sort-btn"
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                aria-label="Sort by RQ score"
              >
                RQ Score
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
            <th className="col-action">Top Action</th>
            <th className="col-bolt" />
            <th className="col-dots" />
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
                  {/* Nine columns, and the band has to say nine: under
                      table-layout: fixed a colSpan that disagrees with the
                      table reserves width for columns that do not exist. */}
                  <td colSpan={9}>
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
                  sortRows(inGroup).map((c) => (
                    <Row
                      c={c}
                      key={'entryId' in c ? (c as LiveCandidate).entryId : c.name}
                      onOpen={onOpen}
                      onAdd={onAdd}
                      onRemove={onRemove}
                      checked={selected.has(c.name)}
                      onToggle={() => onToggle(c.name)}
                    />
                  ))}
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

function InviteAdvisorModal({
  onClose,
  onDone,
  onTrouble,
}: {
  onClose: () => void
  onDone: () => void
  onTrouble: (t: Trouble) => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="fc-invite-title">
      <div className="modal invite-modal fc-invite-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="fc-invite-title">
            Invite Advisor
          </h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body invite-body">
          <InvitePanel onDone={onDone} onTrouble={onTrouble} />
        </div>
      </div>
    </div>
  )
}

export default function FirmCandidatesScreen({
  onOpenProfile,
  onOpenEntry,
  onDownload,
  onAdd,
}: {
  onOpenProfile: (c: Candidate) => void
  /** A live sitting's row: opens the report built from its answers. */
  onOpenEntry: (entryId: string) => void
  onDownload: () => void
  onAdd: (c: Candidate) => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  /* The advisors who have taken the flow for real, placed in the pipeline by
     the same scoring as their reports. The walkthrough's own sitting is
     already a row (Marcus), so it is not listed twice. */
  const [live, setLive] = useState<LiveCandidate[]>([])
  const [inviting, setInviting] = useState(false)
  const [trouble, setTrouble] = useState<Trouble>(null)
  /* Until the sittings arrive, the page is waiting — not a pipeline of one. */
  const [loaded, setLoaded] = useState(false)
  const loadLive = useCallback(async () => {
    const { values, trouble: t } = await listEntries()
    setLoaded(true)
    setTrouble(t)
    const authored = new Set(candidates.map((c) => c.name))
    const rowsLive = values.filter((e) => e.answered > 0 && !authored.has(e.name)).map(candidateFromEntry)
    /* "New" is the latest arrival only: the pill moves on when somebody newer
       comes in. */
    const newest = rowsLive.reduce<LiveCandidate | null>((a, c) => (!a || c.at > a.at ? c : a), null)
    setLive(rowsLive.map((c) => ({ ...c, isNew: c === newest })))
  }, [])
  /* Removing a sitting: asked once, since it throws its answers away. */
  const [removing, setRemoving] = useState<LiveCandidate | null>(null)
  const remove = async (c: LiveCandidate) => {
    setRemoving(null)
    const t = await deleteEntry(c.entryId)
    if (!t && c.token) await deleteInvite(c.token)
    setTrouble(t)
    void loadLive()
  }
  useEffect(() => {
    void loadLive()
  }, [loadLive])
  /* The pipeline is the people who actually took the flow, and Marcus — the
     worked example whose report the demo walks through. No invented rows. */
  const pipeline = [...live, ...candidates.filter((c) => c.name === profileOwner)]
  /* The tier bar's focus narrows the table as well as the call-list. */
  const [tier, setTier] = useState<TierKey | null>(null)
  const tierId = tier ? TIER_META.find((m) => m.key === tier)!.tierId : null
  const rows = pipeline.filter(
    (c) =>
      (!tierId || c.tier === tierId) &&
      (!q || c.name.toLowerCase().includes(q) || c.firm.toLowerCase().includes(q)),
  )
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (name: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(name)) n.delete(name)
      else n.add(name)
      return n
    })
  const allNames = rows.map((c) => c.name)
  const allChecked = selected.size === allNames.length && allNames.length > 0
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(allNames))

  if (!loaded)
    return (
      <>
        <h1 className="page-title">My Candidates</h1>
        <KnomeeLoader title="Hold tight!" note="Gathering your candidates…" />
      </>
    )

  return (
    <>
      <h1 className="page-title">My Candidates</h1>
      <CommandCenter
        onOpenProfile={onOpenProfile}
        stats={statsOf(pipeline)}
        names={new Set(pipeline.map((c) => c.name))}
        tier={tier}
        setTier={setTier}
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
          {/* Download waits for a selection, the way the advisor's does. */}
          <button
            className={`btn btn-download ${selected.size > 0 ? 'active' : ''}`}
            type="button"
            aria-disabled={selected.size === 0}
            onClick={() => selected.size > 0 && onDownload()}
          >
            <DownloadIcon /> Download
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setInviting(true)}>
            <PlusIcon /> Invite
          </button>
        </div>
      </div>
      {/* The real invite, in the same modal the advisor dashboards open: a link
          to the advisor flow, sent under a brand, whose sitting lands in this
          table when it is answered. */}
      {removing && (
        <div className="modal-backdrop" onClick={() => setRemoving(null)} role="alertdialog" aria-modal="true" aria-labelledby="fc-remove-title">
          <div className="modal fc-remove-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id="fc-remove-title">
                Remove {removing.name}?
              </h2>
              <button className="modal-close" type="button" aria-label="Close" onClick={() => setRemoving(null)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <p className="fc-remove-note">
                Their answers leave the pipeline{removing.token ? ' and their link stops working' : ''}. This
                can’t be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" type="button" autoFocus onClick={() => setRemoving(null)}>
                Keep
              </button>
              <button className="btn btn-primary fc-remove-yes" type="button" onClick={() => void remove(removing)}>
                Remove entry
              </button>
            </div>
          </div>
        </div>
      )}
      {inviting && (
        <InviteAdvisorModal onClose={() => setInviting(false)} onDone={loadLive} onTrouble={setTrouble} />
      )}
      {trouble && <div className="adir-trouble">{trouble}</div>}

      <Table
        rows={rows}
        onOpen={(c) => ('entryId' in c ? onOpenEntry((c as LiveCandidate).entryId) : onOpenProfile(c))}
        onRemove={setRemoving}
        onAdd={onAdd}
        selected={selected}
        onToggle={toggle}
        allChecked={allChecked}
        onToggleAll={toggleAll}
      />
    </>
  )
}
