import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { prospects, tierGroups, type Prospect, type Tier } from './data/prospects'
import { insights } from './data/insights'
import {
  MIN_SAMPLE,
  modelClusters,
  CLUSTER_KEYS,
  talkTo,
  utmKeys,
  type ClusterSeg,
} from './data/analytics'
import {
  advisors,
  adminSummary,
  adoptionStages,
  convDistribution,
  unactivated,
} from './data/admin'
import {
  CLIENT_ANNUAL_RATE,
  CONVERSION_RATE,
  currency,
  billingBook,
  billingHistory,
  billingLifetime,
} from './data/billing'
import {
  baseClients,
  clientTierGroups,
  convertedClient,
  AVG_KR_SCORE,
  confidenceScore,
  confidenceSegments,
  activeSeries,
  activeThisWeek,
  clientInsights,
  type Client,
  type ClientTier,
} from './data/clients'
import {
  KnomeeMark,
  ChartIcon,
  BoltIcon,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  SearchIcon,
  DownloadIcon,
  PlusIcon,
  LightningIcon,
  DotsIcon,
  CaretDown,
  BurgerMenu,
  WarnIcon,
  CheckIcon,
  CloseIcon,
  LockIcon,
  TargetIcon,
  TierBarsIcon,
  FunnelIcon,
} from './components/icons'
import SegmentationScreen from './screens/SegmentationScreen'
import { segModels, segMethod } from './data/segmentation'
import { useSlideIndicator } from './useSlideIndicator'

type Screen = 'prospects' | 'clients' | 'analytics'

const initial = (name: string) => name.trim().charAt(0).toUpperCase()

// Shared name + chevron (+ optional "new" tag) so the Prospects and Clients
// tables render the label identically and the arrow stays aligned with the name.
function NameLink({ name, isNew }: { name: string; isNew?: boolean }) {
  return (
    <span className="name-line">
      <span className="name-text">
        {name}
        <span className="name-chevron" aria-hidden>
          ›
        </span>
      </span>
      {isNew && <span className="new-tag">new</span>}
    </span>
  )
}

// Standard card help affordance: a "?" glyph that reveals its hint on hover.
// The bubble opens to the LEFT by default (the "?" usually sits at a card's
// right edge); pass side="right" where the glyph sits at the left instead, so
// the bubble doesn't overflow off-screen.
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

function CollapsibleCard({
  icon,
  title,
  hint,
  bodyClassName,
  className,
  defaultOpen = true,
  children,
}: {
  icon: ReactNode
  title: string
  hint?: string
  bodyClassName: string
  className?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={`card ${className ?? ''}`}>
      <header className="card-head">
        <div className="card-title">
          {icon}
          <span>{title}</span>
        </div>
        <div className="card-head-right">
          {hint && <HelpTip text={hint} />}
          <button
            className={`show-toggle ${open ? '' : 'collapsed'}`}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? 'SHOW LESS' : 'SHOW MORE'} <ChevronUp />
          </button>
        </div>
      </header>

      <div className={`collapse ${open ? 'open' : ''}`}>
        <div className="collapse-inner">
          <div className={bodyClassName}>{children}</div>
        </div>
      </div>
    </section>
  )
}

// Tier metadata shared by the pulse bar and the drill-in filter. `book` is the
// full-book count shown on the bar; the linked insight surfaces as the "why"
// when a tier is focused.
const TIER_META = [
  { key: 'Tier 1' as const, name: 'Ready Now', range: '70–100 KQ', book: 3, seg: 'seg-1', dot: 'dot-1', insightN: 1 },
  { key: 'Tier 2' as const, name: 'Considering', range: '40–69 KQ', book: 5, seg: 'seg-2', dot: 'dot-2', insightN: 7 },
  { key: 'Tier 3' as const, name: 'Nurture', range: '0–39 KQ', book: 3, seg: 'seg-3', dot: 'dot-3', insightN: 8 },
]
type TierKey = (typeof TIER_META)[number]['key']

// The single layered dashboard: pulse (state) + the one next action always
// visible; the full call-list and the evidence are discoverable layers. The
// tier bar is the drill-in spine — focusing a tier filters the call-list and
// surfaces that tier's insight.
function CommandCenter() {
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

  // Focusing a tier reveals its people; clicking it again clears the filter.
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
    <section className="card cmd-card">
      <header className="card-head">
        <div className="card-title">
          <ChartIcon color="#7639a1" />
          <span>Actionable Metrics</span>
        </div>
        <HelpTip text="Your book at a glance, who to talk to, and the reasoning behind it." />
      </header>

      <div className="cmd-body">
        {/* Layer 0 — the pulse */}
        <div className="metric-tiles cmd-pulse">
          <div className="metric-tile">
            <span className="metric-label">TOTAL PROSPECTS</span>
            <div className="metric-num"><span className="metric-value">12</span></div>
          </div>
          <div className="metric-tile">
            <span className="metric-label">AVG KQ SCORE</span>
            <div className="metric-num"><span className="metric-value">55.9</span></div>
          </div>
          <div className="metric-tile distribution">
            <div className="dist-head">
              <span className="metric-label">TIER DISTRIBUTION</span>
              {tier ? (
                <button className="cmd-clear" type="button" onClick={clear}>
                  Clear filter ✕
                </button>
              ) : (
                <span className="dist-note">1 incomplete profile not shown · tap a tier to focus</span>
              )}
            </div>
            <div className="dist-bar cmd-dist-bar">
              {TIER_META.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`seg ${m.seg} ${tier === m.key ? 'is-sel' : ''} ${
                    tier && tier !== m.key ? 'is-dim' : ''
                  }`}
                  onClick={() => pickTier(m.key)}
                  aria-pressed={tier === m.key}
                  data-tip={`${m.key} · ${m.name} — tap to focus`}
                >
                  {m.book}
                </button>
              ))}
            </div>
            <div className="dist-legend">
              {TIER_META.map((m) => (
                <div className="dist-leg" key={m.key}>
                  <span className="dist-leg-name">
                    <i className={`dot ${m.dot}`} />
                    {m.key} · {m.name}
                  </span>
                  <span className="dist-leg-range">{m.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Layer 0 — the one next action */}
        <div className="cmd-focus">
          <p className="cmd-focus-line">
            {meta ? (
              <>
                <b>{meta.key} · {meta.name}</b> — {flagged.length} flagged to talk to this week.
              </>
            ) : (
              <>
                <b>{flagged.length} prospects</b> flagged to talk to this week.
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
              <span className={`talk-tier ${lead.tier === 'Tier 1' ? 't1' : 't2'}`}>{lead.tier}</span>
              <span className="cmd-lead-kq">KQ {lead.kq}</span>
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
                    <span className="talk-name">{t.name}</span>
                    <span className={`talk-tier ${t.tier === 'Tier 1' ? 't1' : 't2'}`}>{t.tier}</span>
                    <span className="talk-kq">KQ {t.kq}</span>
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
      </div>
    </section>
  )
}

function ScoreBadge({ tier, value }: { tier: Tier; value: number | null }) {
  if (value === null) return <span className="score-badge empty">–</span>
  return <span className={`score-badge score-${tier}`}>{value}</span>
}

function Avatar({ p }: { p: Prospect }) {
  const [failed, setFailed] = useState(false)
  if (p.avatar && !failed) {
    return (
      <img className="avatar" src={p.avatar} alt="" onError={() => setFailed(true)} />
    )
  }
  return <span className="avatar avatar-initial">{initial(p.name)}</span>
}

function ProspectRow({
  p,
  onConvert,
  checked,
  onToggle,
}: {
  p: Prospect
  onConvert: (p: Prospect) => void
  checked: boolean
  onToggle: () => void
}) {
  const incomplete = p.tier === 'incomplete'
  return (
    <tr className={incomplete ? 'row-incomplete' : undefined}>
      <td className="col-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${p.name}`}
        />
      </td>
      <td className="col-name">
        <div className="name-cell">
          <Avatar p={p} />
          <div className="name-block">
            <NameLink name={p.name} />
            <span className="email-line">{p.email}</span>
          </div>
        </div>
      </td>
      <td className="col-kq">
        <ScoreBadge tier={p.tier} value={p.kq} />
      </td>
      <td className="col-num">{p.intent ?? '–'}</td>
      <td className="col-num">{p.clarity ?? '–'}</td>
      <td className="col-num">{p.receptivity ?? '–'}</td>
      <td className="col-signup">
        {p.signUpLabel ? (
          <span className="signup-invited">
            {p.signUpLabel}
            <br />
            {p.signUp}
          </span>
        ) : (
          p.signUp
        )}
      </td>
      <td className="col-action">
        <TopActionCell text={p.topAction} />
      </td>
      <td className="col-bolt">
        <button
          className={`bolt-btn ${incomplete ? 'bolt-disabled' : `bolt-${p.tier}`}`}
          type="button"
          title={incomplete ? undefined : 'Convert to client'}
          aria-label={incomplete ? undefined : 'Convert to client'}
          onClick={() => {
            if (!incomplete) onConvert(p)
          }}
        >
          {/* Tier 3 is a light plum, so the bolt uses dark ink to stay legible. */}
          <LightningIcon
            color={incomplete ? '#c9c9c9' : p.tier === 'tier3' ? '#240446' : '#ffffff'}
          />
        </button>
      </td>
      <td className="col-dots">
        <RowMenu
          items={
            incomplete
              ? [{ label: 'View profile', disabled: true }]
              : [{ label: 'Convert to client', onClick: () => onConvert(p) }, { label: 'View profile', disabled: true }]
          }
        />
      </td>
    </tr>
  )
}

// Top Action copy is variable-length. Clamp it to 3 lines with an ellipsis;
// when the text is longer than that, reveal a chevron to expand the cell (and
// its row) to the full text, and collapse it again.
function TopActionCell({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      // Overflow is only meaningful while clamped, so skip when expanded and
      // keep the last known value.
      if (expanded) return
      setOverflowing(el.scrollHeight - el.clientHeight > 1)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text, expanded])

  return (
    <div className="top-action">
      <div ref={ref} className={`top-action-text${expanded ? ' expanded' : ''}`}>
        {text}
      </div>
      {overflowing && (
        <button
          type="button"
          className="top-action-toggle"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </button>
      )}
    </div>
  )
}

interface MenuItem {
  label: string
  onClick?: () => void
  disabled?: boolean
}

function RowMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [open])
  return (
    <div className="row-menu" ref={ref}>
      <button
        className="dots-btn"
        type="button"
        aria-label="Row actions"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <DotsIcon />
      </button>
      {open && (
        <div className="row-menu-pop">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              className="row-menu-item"
              disabled={it.disabled}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                it.onClick?.()
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ProspectsTable({
  onConvert,
  selected,
  onToggle,
  allChecked,
  onToggleAll,
}: {
  onConvert: (p: Prospect) => void
  selected: Set<string>
  onToggle: (name: string) => void
  allChecked: boolean
  onToggleAll: () => void
}) {
  return (
    <div className="table-wrap">
      <table className="prospects-table">
        <thead>
          <tr>
            <th className="col-check">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={onToggleAll}
                aria-label="Select all prospects"
              />
            </th>
            <th className="col-name">Name</th>
            <th className="col-kq">
              <span className="th-sort">KQ Score <CaretDown /></span>
            </th>
            <th className="col-num">Intent</th>
            <th className="col-num">Clarity</th>
            <th className="col-num">Receptivity</th>
            <th className="col-signup">Sign Up</th>
            <th className="col-action">Top Action</th>
            <th className="col-bolt" />
            <th className="col-dots" />
          </tr>
        </thead>
        <tbody>
          {tierGroups.map((group) => {
            const rows = prospects.filter((p) => p.tier === group.id)
            if (rows.length === 0) return null
            return (
              <>
                <tr className={`group-header group-${group.id}`} key={`h-${group.id}`}>
                  <td colSpan={10}>
                    <div className="group-header-inner">
                      <span>{group.title}</span>
                      {group.range && <span className="group-range">{group.range}</span>}
                    </div>
                  </td>
                </tr>
                {rows.map((p) => (
                  <ProspectRow
                    p={p}
                    key={p.name}
                    onConvert={onConvert}
                    checked={selected.has(p.name)}
                    onToggle={() => onToggle(p.name)}
                  />
                ))}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Toolbar({
  downloadActive,
  onDownload,
  onInvite,
}: {
  downloadActive: boolean
  onDownload: () => void
  onInvite: () => void
}) {
  return (
    <div className="toolbar">
      <div className="search-box">
        <SearchIcon />
        <input type="text" placeholder="Search name" />
      </div>
      <div className="toolbar-actions">
        <button
          className={`btn btn-download ${downloadActive ? 'active' : ''}`}
          type="button"
          aria-disabled={!downloadActive}
          onClick={() => downloadActive && onDownload()}
        >
          <DownloadIcon /> Download
        </button>
        <button className="btn btn-primary" type="button" onClick={onInvite}>
          <PlusIcon /> Invite
        </button>
      </div>
    </div>
  )
}

function ProspectsScreen({
  onConvert,
  onDownload,
  onInvite,
}: {
  onConvert: (p: Prospect) => void
  onDownload: () => void
  onInvite: () => void
}) {
  const allNames = prospects.map((p) => p.name)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (name: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(name)) n.delete(name)
      else n.add(name)
      return n
    })
  const allChecked = selected.size === allNames.length && allNames.length > 0
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(allNames))
  return (
    <>
      <h1 className="page-title">My Prospects</h1>
      <CommandCenter />
      <Toolbar downloadActive={selected.size > 0} onDownload={onDownload} onInvite={onInvite} />
      <ProspectsTable
        onConvert={onConvert}
        selected={selected}
        onToggle={toggle}
        allChecked={allChecked}
        onToggleAll={toggleAll}
      />
    </>
  )
}

/* ── Clients screen (the converted book of business) ── */

function SentimentDots({
  value,
  warn,
  tier,
}: {
  value: number | null
  warn?: boolean
  tier?: ClientTier
}) {
  if (value === null) return <span className="dash">–</span>
  return (
    <div className={`sentiment${tier ? ` sentiment-${tier}` : ''}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`sdot ${i < value ? '' : 'empty'}`} />
      ))}
      {warn && (
        <span className="sentiment-warn">
          <WarnIcon />
        </span>
      )}
    </div>
  )
}

function ClientRow({
  c,
  checked,
  onToggle,
}: {
  c: Client
  checked: boolean
  onToggle: () => void
}) {
  return (
    <tr className={c.isNew ? 'client-new' : undefined}>
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
          <span className="avatar avatar-initial">{c.name.charAt(0).toUpperCase()}</span>
          <div className="name-block">
            <NameLink name={c.name} isNew={c.isNew} />
            <span className="email-line">{c.email}</span>
          </div>
        </div>
      </td>
      <td className="col-household">
        {c.household ? (
          <a href="#" className="household-link" onClick={(e) => e.preventDefault()}>
            {c.household}
          </a>
        ) : (
          <span className="dash">—</span>
        )}
      </td>
      <td className="col-sentiment">
        <SentimentDots value={c.sentiment} warn={c.warn} tier={c.tier} />
      </td>
      <td className="col-status">
        {c.secondaryStatus ? (
          <div className="status-stack">
            <span className="status-badge status-pending">{c.status}</span>
            <span className="status-badge">{c.secondaryStatus}</span>
          </div>
        ) : (
          <span className={`status-badge ${c.status === 'pending' ? 'status-pending' : ''}`}>
            {c.status}
          </span>
        )}
      </td>
      <td className="col-signin">
        {c.lastLabel ? (
          <span className="signup-invited">
            {c.lastLabel}
            <br />
            {c.lastSignIn}
          </span>
        ) : (
          c.lastSignIn
        )}
      </td>
      <td className="col-dots">
        <RowMenu items={[{ label: 'View profile', disabled: true }]} />
      </td>
    </tr>
  )
}

function ConfidencePie() {
  const [hover, setHover] = useState<number | null>(null)
  const cx = 50
  const cy = 50
  const r = 46
  let acc = 0
  const slices = confidenceSegments.map((s) => {
    const start = (acc / 100) * 2 * Math.PI - Math.PI / 2
    acc += s.pct
    const end = (acc / 100) * 2 * Math.PI - Math.PI / 2
    const large = s.pct > 50 ? 1 : 0
    const x1 = cx + r * Math.cos(start)
    const y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy + r * Math.sin(end)
    return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
  })
  return (
    <div className="confidence">
      <svg className="pie" viewBox="0 0 100 100" role="img" aria-label="Client confidence breakdown">
        {slices.map((d, i) => (
          <path
            key={confidenceSegments[i].label}
            d={d}
            fill={confidenceSegments[i].color}
            className={`pie-slice ${hover === i ? 'on' : ''} ${
              hover !== null && hover !== i ? 'dim' : ''
            }`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((h) => (h === i ? null : h))}
          />
        ))}
      </svg>
      <ul className="pie-legend">
        {confidenceSegments.map((s, i) => (
          <li
            key={s.label}
            className={hover === i ? 'on' : ''}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((h) => (h === i ? null : h))}
          >
            <span className="pie-swatch" style={{ background: s.color }} />
            <span className="pie-label">{s.label}</span>
            <span className="pie-pct">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ActiveChart() {
  const [hover, setHover] = useState<number | null>(null)
  const w = 560
  const h = 190
  const padL = 34
  const padR = 12
  const padT = 12
  const padB = 26
  const max = 100
  const n = activeSeries.length
  const x = (i: number) => padL + (i * (w - padL - padR)) / (n - 1)
  const y = (v: number) => padT + (1 - v / max) * (h - padT - padB)
  const pts = activeSeries.map((d, i) => `${x(i)},${y(d.value)}`).join(' ')
  const gridVals = [20, 40, 60, 80, 100]
  return (
    <svg className="active-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Clients active this week">
      {gridVals.map((g) => (
        <g key={g}>
          <line x1={padL} y1={y(g)} x2={w - padR} y2={y(g)} stroke="#eee" strokeWidth="1" />
          <text x={padL - 8} y={y(g) + 3} textAnchor="end" fontSize="9" fill="#afafaf">{g}%</text>
        </g>
      ))}
      <polyline points={pts} fill="none" stroke="#086375" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {activeSeries.map((d, i) => (
        <circle
          key={i}
          className="active-dot"
          cx={x(i)}
          cy={y(d.value)}
          r={hover === i ? 5 : 3}
          fill="#086375"
        />
      ))}
      {activeSeries.map((d, i) => (
        <text key={`l${i}`} x={x(i)} y={h - 8} textAnchor="middle" fontSize="8.5" fill="#afafaf">{d.week}</text>
      ))}
      {/* generous transparent hit targets */}
      {activeSeries.map((d, i) => (
        <circle
          key={`hit${i}`}
          cx={x(i)}
          cy={y(d.value)}
          r="16"
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover((cur) => (cur === i ? null : cur))}
        />
      ))}
      {hover !== null &&
        (() => {
          const d = activeSeries[hover]
          const tw = 44
          const th = 21
          const cxp = x(hover)
          const tx = Math.max(padL, Math.min(cxp - tw / 2, w - padR - tw))
          const ty = y(d.value) - th - 9
          return (
            <g pointerEvents="none">
              <rect x={tx} y={ty} width={tw} height={th} rx="6" fill="#240446" />
              <text x={tx + tw / 2} y={ty + th / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
                {d.value}%
              </text>
            </g>
          )
        })()}
    </svg>
  )
}

function ClientsMetrics({ clients }: { clients: Client[] }) {
  const count = (t: ClientTier) => clients.filter((c) => c.tier === t).length
  const engaged = count('engaged')
  const attention = count('attention')
  const reconnect = count('reconnect')
  const incomplete = count('incomplete')
  const total = clients.length
  const scored = engaged + attention + reconnect
  const pct = (n: number) => (scored ? Math.round((n / scored) * 100) : 0)

  return (
    <CollapsibleCard
      className="metrics-card"
      icon={<ChartIcon />}
      title="Top Line Metrics"
      hint="Totals, average KR score, and the tier split."
      bodyClassName="metrics-body"
    >
      <div className="metric-tiles">
        <div className="metric-tile">
          <span className="metric-label">TOTAL CLIENTS</span>
          <div className="metric-num">
            <span className="metric-value tt" data-tip="Clients in your book">{total}</span>
          </div>
        </div>
        <div className="metric-tile">
          <span className="metric-label">AVG KR SCORE</span>
          <div className="metric-num">
            <span className="metric-value tt" data-tip="Average KR across all clients">
              {AVG_KR_SCORE}
            </span>
          </div>
        </div>
        <div className="metric-tile distribution">
          <div className="dist-head">
            <span className="metric-label">TIER DISTRIBUTION</span>
            {incomplete > 0 && (
              <span className="dist-note">
                {incomplete} incomplete profile{incomplete === 1 ? '' : 's'} not shown
              </span>
            )}
          </div>
          <div className="dist-bar">
            <span
              className="seg seg-c1 tt"
              style={{ flex: engaged || 0.001 }}
              data-tip={`Tier 1 · ${engaged} · ${pct(engaged)}%`}
            >
              {engaged}
            </span>
            <span
              className="seg seg-c2 tt"
              style={{ flex: attention || 0.001 }}
              data-tip={`Tier 2 · ${attention} · ${pct(attention)}%`}
            >
              {attention}
            </span>
            <span
              className="seg seg-c3 tt"
              style={{ flex: reconnect || 0.001 }}
              data-tip={`Tier 3 · ${reconnect} · ${pct(reconnect)}%`}
            >
              {reconnect}
            </span>
          </div>
          <div className="dist-legend">
            <div className="dist-leg">
              <span className="dist-leg-name"><i className="dot dot-c1" />Tier 1 · Engaged</span>
              <span className="dist-leg-range">70–100 KR</span>
            </div>
            <div className="dist-leg">
              <span className="dist-leg-name"><i className="dot dot-c2" />Tier 2 · Attention</span>
              <span className="dist-leg-range">40–69 KR</span>
            </div>
            <div className="dist-leg">
              <span className="dist-leg-name"><i className="dot dot-c3" />Tier 3 · Reconnect</span>
              <span className="dist-leg-range">0–39 KR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <div className="chart-head">
            <span className="chart-head-l">
              <span className="metric-label">OVERALL CLIENT CONFIDENCE SCORE</span>
            </span>
            <span className="chart-head-r">
              <span className="chart-figure">{confidenceScore}</span>
              <HelpTip text="Blended client sentiment, from frustrated to delighted." />
            </span>
          </div>
          <ConfidencePie />
        </div>
        <div className="chart-card">
          <div className="chart-head">
            <span className="chart-head-l">
              <span className="metric-label">CLIENTS ACTIVE THIS WEEK</span>
            </span>
            <span className="chart-head-r">
              <span className="chart-figure">{activeThisWeek}%</span>
              <HelpTip text="Share of clients logging in each week." />
            </span>
          </div>
          <ActiveChart />
        </div>
      </div>
    </CollapsibleCard>
  )
}

function ClientInsights() {
  return (
    <CollapsibleCard
      className="insights-card"
      icon={<BoltIcon />}
      title="Actionable Insights"
      hint="Clients flagged by engagement and sentiment."
      bodyClassName="client-insights-body"
      defaultOpen={false}
    >
      {clientInsights.map((ins) => (
        <div className="client-insight" key={ins.name}>
          <div className="client-insight-head">
            <span className="ci-warn"><WarnIcon /></span>
            <span className="ci-name">{ins.name}</span>
            <ChevronRight />
          </div>
          <div className="client-insight-body">
            {ins.lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        </div>
      ))}
    </CollapsibleCard>
  )
}

function ClientsScreen({
  clients,
  onDownload,
  onInvite,
}: {
  clients: Client[]
  onDownload: () => void
  onInvite: () => void
}) {
  const allNames = clients.map((c) => c.name)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (name: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(name)) n.delete(name)
      else n.add(name)
      return n
    })
  const allChecked = selected.size === allNames.length && allNames.length > 0
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(allNames))
  return (
    <>
      <h1 className="page-title">My Clients</h1>
      <ClientsMetrics clients={clients} />
      <ClientInsights />
      <Toolbar downloadActive={selected.size > 0} onDownload={onDownload} onInvite={onInvite} />
      <div className="table-wrap">
        <table className="prospects-table clients-table">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Select all clients"
                />
              </th>
              <th className="col-name">Name</th>
              <th className="col-household">Household</th>
              <th className="col-sentiment">Sentiment</th>
              <th className="col-status">
                <span className="th-sort">Status <CaretDown /></span>
              </th>
              <th className="col-signin">Last Sign In</th>
              <th className="col-dots" />
            </tr>
          </thead>
          <tbody>
            {clientTierGroups.map((group) => {
              const rows = clients.filter((c) => c.tier === group.id)
              if (rows.length === 0) return null
              return (
                <>
                  <tr className={`group-header client-group-${group.id}`} key={`ch-${group.id}`}>
                    <td colSpan={7}>
                      <div className="group-header-inner">
                        <span>{group.title}</span>
                        {group.range && <span className="group-range">{group.range}</span>}
                      </div>
                    </td>
                  </tr>
                  {rows.map((c) => (
                    <ClientRow
                      c={c}
                      key={c.name}
                      checked={selected.has(c.name)}
                      onToggle={() => toggle(c.name)}
                    />
                  ))}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}


/* ── 2. Niche cross-tab: who shows up, crossed with who converts ── */

// One clustered row: share of the book (scored / 40) crossed with the segment's
// own conversion. Same bar grammar as before, now driven by the chosen model.
function ClusterRow({ s, maxShare, onOpen }: { s: ClusterSeg; maxShare: number; onOpen: () => void }) {
  const share = Math.round((s.scored / 40) * 100)
  const conv = s.scored ? Math.round((s.clients / s.scored) * 100) : 0
  const thin = s.scored < MIN_SAMPLE
  const up = s.delta > 0
  const flat = s.delta === 0
  return (
    <button className="niche-row niche-row-btn" type="button" onClick={onOpen}>
      <span className="niche-name">
        {s.name}
        <span className="niche-open" aria-hidden>
          ⓘ
        </span>
      </span>
      <span className="niche-bars">
        <span className="niche-bar-line">
          <i className="niche-bar-lbl">Share</i>
          <span className="niche-track">
            <span className="niche-fill share" style={{ width: `${(share / maxShare) * 100}%` }} />
          </span>
          <b className="niche-val">{share}%</b>
          <i className="attr-n">n={s.scored}</i>
        </span>
        <span className="niche-bar-line">
          <i className="niche-bar-lbl">Converts</i>
          <span className="niche-track">
            <span className="niche-fill conv" style={{ width: `${conv}%` }} />
          </span>
          <b className="niche-val">{conv}%</b>
          {thin ? (
            <i className="exp-thin">n={s.scored} · too small</i>
          ) : flat ? (
            <i className="niche-delta">— flat vs last quarter</i>
          ) : (
            <i className={`niche-delta ${up ? 'up' : 'down'}`}>
              {up ? '▲' : '▼'} {Math.abs(s.delta)} pts vs last quarter
            </i>
          )}
        </span>
      </span>
    </button>
  )
}

type ClusterKey = (typeof CLUSTER_KEYS)[number]

// Plain-language "how a prospect lands here" per model, kept deliberately
// jargon-free. A/B classify from concrete answer options; C/D from scores/flags.
// Short, glanceable explainer content per model: the questions it reads (with
// the Adventure each belongs to) and a one-line "how it's scored". Model D's
// scored line is filled per-tag from the rule.
type ExplainQ = { q: string; adv: string }
const EXPLAIN: Record<ClusterKey, { questions: ExplainQ[]; scored: string }> = {
  A: {
    questions: [
      { q: 'Ideal life', adv: 'Ideal Life' },
      { q: 'Attention shifts', adv: 'Life Balance' },
      { q: 'Future You', adv: 'Future You' },
    ],
    scored: 'We see which life area the answers point to most. The strongest one wins.',
  },
  B: {
    questions: [
      { q: 'Why money matters (top 3)', adv: 'Money & Meaning' },
      { q: 'Confidence check', adv: 'Confidence' },
    ],
    scored: 'We rank the top reasons money matters. The most telling one names the family.',
  },
  C: {
    questions: [
      { q: 'Vision clarity & Future You', adv: 'Vision' },
      { q: 'Readiness & timeframe', adv: 'Readiness' },
    ],
    scored: 'Two scores — how clear the vision is, how ready they are — split at the middle of your book.',
  },
  D: {
    questions: [{ q: 'Confidence, vision & readiness answers', adv: 'Across the Adventure' }],
    scored: '', // filled from the per-tag rule below
  },
}

// The intuitive explainer that opens when a category row is clicked: what the
// label means, how a prospect ends up in it, and how to talk to them.
function SegmentExplainer({
  modelKey,
  seg,
  onClose,
}: {
  modelKey: ClusterKey
  seg: ClusterSeg
  onClose: () => void
}) {
  const def = segModels[modelKey].segments.find((d) => d.name === seg.name)
  const ex = EXPLAIN[modelKey]
  // Model D classifies by explicit per-tag rules; use the one for this tag as
  // the plain "how it's scored" line.
  const rule = segMethod[modelKey].rules?.find((r) => r[0] === seg.name)
  const scored = rule ? `Flagged when: ${rule[1]}` : ex.scored
  const share = Math.round((seg.scored / 40) * 100)
  const conv = seg.scored ? Math.round((seg.clients / seg.scored) * 100) : 0
  const bandStyle = useViewportBand(true)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  // Portal to <body> so no transformed ancestor (the analytics card subtree)
  // can trap the fixed-positioned backdrop and let it drift with scroll.
  return createPortal(
    <div className="modal-backdrop" style={bandStyle} onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal explain-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{seg.name}</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body explain-body">
          <div className="explain-sub">{modelClusters[modelKey].name}</div>

          <section className="ex-sec">
            <h3 className="ex-h">What it means</h3>
            <p className="ex-text">{def?.blurb ?? seg.name}</p>
          </section>

          <section className="ex-sec">
            <h3 className="ex-h">What it looks at</h3>
            <ul className="ex-q">
              {ex.questions.map((qq) => (
                <li key={qq.q}>
                  <span className="ex-q-name">{qq.q}</span>
                  <span className="ex-q-adv">{qq.adv}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="ex-sec">
            <h3 className="ex-h">How it’s scored</h3>
            <p className="ex-text">{scored}</p>
          </section>

          <div className="explain-stats">
            <div className="explain-stat">
              <b>{seg.scored}</b>
              <span>prospects</span>
            </div>
            <div className="explain-stat">
              <b>{share}%</b>
              <span>of your book</span>
            </div>
            <div className="explain-stat">
              <b>{conv}%</b>
              <span>convert</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// The clustering lens for section 2: one switcher over the four Segmentation
// models, re-partitioning the same 40 scored prospects each time. This is the
// "who your prospects are = what your prospects want" view — the labels come
// straight from the Segmentation page, scored here by conversion.
function ProspectClusters() {
  const [key, setKey] = useState<(typeof CLUSTER_KEYS)[number]>('A')
  const model = modelClusters[key]
  const segs = [...model.segs].sort((a, b) => b.scored - a.scored)
  const maxShare = Math.max(...segs.map((s) => Math.round((s.scored / 40) * 100)))
  const [openSeg, setOpenSeg] = useState<ClusterSeg | null>(null)
  const ind = useSlideIndicator(key)
  return (
    <>
      <nav className="cluster-switch slide-nav" role="tablist" aria-label="Clustering model" ref={ind.ref}>
        {ind.box && (
          <span
            className="slide-ind slide-ind-round"
            style={{
              transform: `translate(${ind.box.left}px, ${ind.box.top}px)`,
              width: ind.box.width,
              height: ind.box.height,
            }}
          />
        )}
        {CLUSTER_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={k === key}
            data-active={k === key}
            className={`cluster-switch-btn ${k === key ? 'is-on' : ''}`}
            onClick={() => setKey(k)}
          >
            <span className="cluster-switch-k">{k}</span>
            {modelClusters[k].name}
          </button>
        ))}
      </nav>

      <p className="cluster-spine">{model.spine}</p>

      <div className="niche-list">
        {segs.map((s) => (
          <ClusterRow key={s.name} s={s} maxShare={maxShare} onOpen={() => setOpenSeg(s)} />
        ))}
      </div>

      <div className="niche-callout">
        <BoltIcon />
        <div>{model.lead}</div>
      </div>

      <p className="analytics-note">
        {model.exclusive
          ? 'Every scored prospect lands in exactly one segment — shares sum to 100% and clients to 12.'
          : 'Tags overlap: a prospect can carry several, so shares sum past 100% and per-tag clients past 12.'}{' '}
        Labels are the exhaustive partition defined on the Segmentation page.
      </p>

      {openSeg && (
        <SegmentExplainer modelKey={key} seg={openSeg} onClose={() => setOpenSeg(null)} />
      )}
    </>
  )
}

/* ── Admin (manager) view ───────────────────────────────────────────────
   The advisor screens answer "which of my prospects should I call?". This one
   answers a manager's question over 100 advisors: who is actually using
   Knomee, and who is turning it into clients. Same fabricated-sample spirit as
   the rest of the demo; every number rolls up from src/data/admin.ts. */

function AdminScreen() {
  const s = adminSummary
  const maxAdopt = adoptionStages[0].count
  const maxBucket = Math.max(...convDistribution.map((b) => b.count))
  const leaders = advisors // already sorted by clients desc in the data
  const rate = (c: number, comp: number) => (comp ? Math.round((c / comp) * 100) : 0)
  return (
    <>
      <h1 className="page-title">Practice Group — Admin</h1>

      {/* Adoption + production at a glance */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <TargetIcon />
            <span>Are Your Advisors Using Knomee?</span>
          </div>
          <HelpTip text="Adoption first (are they using it), then production (is it working)." />
        </header>
        <div className="analytics-body">
          <div className="impact-grid">
            <div className="impact-card">
              <div className="analytics-lbl">Active This Month</div>
              <div className="impact-num">{s.active30}</div>
              <div className="impact-compare">of {s.seats} seats · {Math.round((s.active30 / s.seats) * 100)}%</div>
              <div className="impact-detail">Opened Knomee in the last 30 days</div>
            </div>
            <div className="impact-card">
              <div className="analytics-lbl">Producing Clients</div>
              <div className="impact-num">{s.producing}</div>
              <div className="impact-compare">of {s.activated} activated · {Math.round((s.producing / s.activated) * 100)}%</div>
              <div className="impact-detail good">Converted at least one client</div>
            </div>
            <div className="impact-card">
              <div className="analytics-lbl">Clients Converted</div>
              <div className="impact-num">{s.clients}</div>
              <div className="impact-compare">from {s.completed.toLocaleString()} completed Adventures</div>
              <div className="impact-detail good">{s.convRate}% group conversion rate</div>
            </div>
            <div className="impact-card">
              <div className="analytics-lbl">Prospects Invited</div>
              <div className="impact-num">{s.invited.toLocaleString()}</div>
              <div className="impact-compare">across {s.activated} activated advisors</div>
              <div className="impact-detail">{Math.round(s.invited / s.activated)} avg per active advisor</div>
            </div>
          </div>
        </div>
      </section>

      {/* Adoption funnel — where advisors, not prospects, fall out */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <FunnelIcon />
            <span>Advisor Adoption Funnel</span>
          </div>
          <HelpTip text="Where advisors drop out of using the product at all." />
        </header>
        <div className="analytics-body">
          <div className="adopt-list">
            {adoptionStages.map((st) => (
              <div className="adopt-row" key={st.stage}>
                <span className="adopt-stage">
                  {st.stage}
                  <i className="adopt-note">{st.note}</i>
                </span>
                <span className="adopt-track">
                  <span
                    className="adopt-fill"
                    style={{ width: `${(st.count / maxAdopt) * 100}%` }}
                  />
                </span>
                <b className="adopt-val">{st.count}</b>
                <i className="adopt-pct">{Math.round((st.count / maxAdopt) * 100)}%</i>
              </div>
            ))}
          </div>
          {unactivated.length > 0 && (
            <div className="niche-callout">
              <WarnIcon />
              <div>
                <b>{unactivated.length} advisors have never invited a prospect.</b> They hold seats but
                have not activated — the fastest adoption win in the group.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Conversion spread across advisors */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <TierBarsIcon />
            <span>How Conversion Is Spread</span>
          </div>
          <HelpTip text="The spread across advisors is the story, not the average." />
        </header>
        <div className="analytics-body">
          <div className="conv-dist">
            {convDistribution.map((b) => (
              <div className="conv-col" key={b.label}>
                <span className="conv-count">{b.count}</span>
                <span className="conv-bar-wrap">
                  <span
                    className="conv-bar"
                    style={{ height: `${maxBucket ? (b.count / maxBucket) * 100 : 0}%` }}
                  />
                </span>
                <span className="conv-lbl">{b.label}</span>
              </div>
            ))}
          </div>
          <p className="analytics-note">
            Each bar is a count of advisors, bucketed by their own conversion rate (clients ÷ completed
            Adventures). Advisors with no completed Adventures yet are not placed.
          </p>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <ChartIcon />
            <span>Advisor Leaderboard</span>
          </div>
          <HelpTip text="All 100 advisors, ranked by clients converted." />
        </header>
        <div className="analytics-body">
          <div className="table-wrap admin-table-wrap">
            <table className="prospects-table admin-table">
              <thead>
                <tr>
                  <th>Advisor</th>
                  <th>Region</th>
                  <th className="num">Invited</th>
                  <th className="num">Completed</th>
                  <th className="num">Clients</th>
                  <th className="num">Conv.</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((a, i) => (
                  <tr key={a.name}>
                    <td>
                      <span className="admin-rank">{i + 1}</span>
                      {a.name}
                    </td>
                    <td className="admin-muted">{a.region}</td>
                    <td className="num">{a.invited}</td>
                    <td className="num">{a.completed}</td>
                    <td className="num"><b>{a.clients}</b></td>
                    <td className="num">{rate(a.clients, a.completed)}%</td>
                    <td>
                      <span className={`admin-badge ${a.active ? 'on' : 'off'}`}>
                        {a.active ? 'Active' : `Idle ${a.daysSinceActive}d`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}

function AnalyticsScreen() {
  return (
    <>
      <h1 className="page-title">Analytics</h1>

      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <ChartIcon />
            <span>Who Your Prospects Are — And Which Convert</span>
          </div>
          <HelpTip text="Cluster the book by any of the four models. Each row is a segment — click it to see what the label means and how prospects land in it." />
        </header>
        <div className="analytics-body">
          <ProspectClusters />
        </div>
      </section>
    </>
  )
}

/* ── Empty dashboard states ─────────────────────────────────────────────
   Same chrome as the populated screens (locked metric/insight bars, toolbar,
   table header) with a centered illustration + CTA. Rendered for Reporting
   always, and for Prospects/Clients when the internal "empty" mode is on. */

type EmptyVariant = 'prospects' | 'clients' | 'analytics'

interface EmptyConfig {
  title: string
  caption: string
  cta?: string
  ctaClass?: string
  subtitle: string
  columns: string[]
}

const emptyConfigs: Record<EmptyVariant, EmptyConfig> = {
  prospects: {
    title: 'My Dashboard',
    caption: 'Your Prospect Dashboard is empty.',
    cta: 'Test Prospect Experience',
    ctaClass: 'empty-cta-prospect',
    subtitle:
      'Experience the prospect journey to preview conversation starters and strategic conversion insights generated for you.',
    columns: ['Name', 'KQ Score', 'Intent', 'Clarity', 'Receptivity', 'Sign Up', 'Top Action'],
  },
  clients: {
    title: 'My Clients',
    caption: 'Your Client Dashboard is empty.',
    cta: 'Test Client Experience',
    ctaClass: 'empty-cta-client',
    subtitle: 'Start inviting clients by clicking the button above.',
    columns: ['Name', 'Household', 'Sentiment', 'Status', 'Last Sign In'],
  },
  analytics: {
    title: 'Analytics',
    caption: 'Your Analytics Dashboard is empty.',
    subtitle: 'Engagement, onboarding funnel and per-tier analytics appear here once prospects start onboarding.',
    columns: [],
  },
}

function LockedBar({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="locked-bar">
      <div className="card-title">
        {icon}
        <span>{title}</span>
      </div>
      <span className="locked-icon">
        <LockIcon />
      </span>
    </div>
  )
}

function EmptyIllustration({ variant }: { variant: EmptyVariant }) {
  return (
    <div className={`empty-illus illus-${variant}`} aria-hidden>
      <span className="illus-disc" />
      <span className="illus-chip chip-1">🧩</span>
      <span className="illus-chip chip-2">🏔️</span>
      <span className="illus-chip chip-3">☀️</span>
      <span className="illus-chip chip-4">🔎</span>
      <i className="illus-dot d1" />
      <i className="illus-dot d2" />
      <i className="illus-dot d3" />
      <i className="illus-dot d4" />
      <i className="illus-dot d5" />
    </div>
  )
}

function EmptyScreen({ variant, onCta }: { variant: EmptyVariant; onCta?: () => void }) {
  const cfg = emptyConfigs[variant]
  return (
    <>
      <h1 className="page-title">{cfg.title}</h1>

      {/* Analytics has no metrics/insights bars, search, or buttons. */}
      {variant !== 'analytics' && (
        <>
          <LockedBar icon={<ChartIcon />} title="Top Line Metrics" />
          <LockedBar icon={<BoltIcon />} title="Actionable Insights" />

          <div className="toolbar">
            <div className="search-box is-disabled">
              <SearchIcon />
              <input type="text" placeholder="Search name" disabled />
            </div>
            <div className="toolbar-actions">
              <button className="btn btn-outline" type="button" disabled>
                <DownloadIcon /> Download
              </button>
              <button className="btn btn-primary" type="button">
                <PlusIcon /> Invite
              </button>
            </div>
          </div>
        </>
      )}

      {cfg.columns.length > 0 && (
        <div className="table-wrap empty-table">
          <table className="prospects-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input type="checkbox" disabled />
                </th>
                {cfg.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
                <th className="col-dots" />
              </tr>
            </thead>
          </table>
        </div>
      )}

      <div className="empty-state">
        <p className="empty-caption">{cfg.caption}</p>
        <EmptyIllustration variant={variant} />
        {cfg.cta && (
          <button className={`empty-cta ${cfg.ctaClass ?? ''}`} type="button" onClick={onCta}>
            {cfg.cta}
          </button>
        )}
        <p className="empty-subtitle">{cfg.subtitle}</p>
      </div>
    </>
  )
}

/* ── Invite flow ─────────────────────────────────────────────────────────
   One modal, two tabs (prospect / client). Opened from the Invite button on
   either dashboard, defaulting to that dashboard's kind. Sending an email,
   copying the link, or copying the QR each fires the matching toast. All data
   is demo-fake: the link is a placeholder and the QR is decorative. */

// Modal positioning across embeddings.
//
// Default: let CSS `position: fixed; inset: 0` centre the modal in the visible
// window. That is correct for a standalone page, an internally-scrolling
// iframe, and the artifact preview — `fixed` pins to whatever the viewer sees,
// so the modal never drifts with scroll.
//
// The one exception is the GitHub Pages embed: the app runs in a full-height,
// same-origin iframe whose PARENT document scrolls. There `fixed` would centre
// on the tall iframe (off-screen), so we anchor an absolutely-positioned
// backdrop to the parent's visible band and follow the parent's scroll. We only
// do this when the parent is reachable (same-origin) AND our own window does
// not scroll — otherwise `fixed` is already right and we return nothing.
function useViewportBand(active: boolean) {
  const [band, setBand] = useState<{ top: number; height: number } | null>(null)
  useLayoutEffect(() => {
    if (!active) return
    let parentWin: Window | null = null
    try {
      if (window.parent !== window && typeof window.parent.scrollY === 'number') parentWin = window.parent
    } catch {
      parentWin = null
    }
    const selfScrolls = document.documentElement.scrollHeight > window.innerHeight + 2
    // No reachable scrolling parent, or our own window scrolls → `fixed` is right.
    if (!parentWin || selfScrolls) {
      setBand(null)
      return
    }
    const place = () => setBand({ top: parentWin!.scrollY, height: parentWin!.innerHeight })
    place()
    parentWin.addEventListener('scroll', place, { passive: true })
    parentWin.addEventListener('resize', place)
    return () => {
      parentWin!.removeEventListener('scroll', place)
      parentWin!.removeEventListener('resize', place)
    }
  }, [active])
  return band ? ({ position: 'absolute', top: band.top, height: band.height } as const) : undefined
}

type InviteKind = 'prospect' | 'client'

// Paper-plane send glyph, matching the mockup's input affordance.
function SendGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 2.5 9 11" />
      <path d="M17.5 2.5 12 17.5 9 11 2.5 8 17.5 2.5Z" />
    </svg>
  )
}

// Two-sheet copy glyph.
function CopyGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

// Decorative QR: three finder patterns + a seeded field of modules. It encodes
// nothing — the link beside it is the real (placeholder) share target.
function QrCode({ seed }: { seed: number }) {
  const N = 21
  let s = seed || 1
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  const finders: [number, number][] = [
    [0, 0],
    [0, N - 7],
    [N - 7, 0],
  ]
  const rects: { x: number; y: number }[] = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      // Separator ring around each finder stays white.
      const nearFinder = finders.some(([fr, fc]) => r >= fr - 1 && r <= fr + 7 && c >= fc - 1 && c <= fc + 7)
      const inFinder = finders.some(([fr, fc]) => r >= fr && r <= fr + 6 && c >= fc && c <= fc + 6)
      let on: boolean
      if (inFinder) {
        const fr = r < 7 ? 0 : N - 7
        const fc = c < 7 ? 0 : N - 7
        const rr = r - fr
        const cc = c - fc
        on = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4)
      } else if (nearFinder) {
        on = false
      } else {
        on = rand() > 0.5
      }
      if (on) rects.push({ x: c, y: r })
    }
  }
  return (
    <svg className="invite-qr-svg" viewBox={`-1 -1 ${N + 2} ${N + 2}`} role="img" aria-label="QR code">
      <rect x={-1} y={-1} width={N + 2} height={N + 2} fill="#fff" />
      {rects.map((m) => (
        <rect key={`${m.x}-${m.y}`} x={m.x} y={m.y} width={1} height={1} fill="#111" />
      ))}
    </svg>
  )
}

function InvitePreview({ kind }: { kind: InviteKind }) {
  return (
    <div className="invite-preview">
      <div className="invite-preview-meta">
        <div>
          From: <b>info@knomee.com</b>
        </div>
        <div>
          Subject: <b>Invitation to Join Beacon Planning</b>
        </div>
      </div>
      <div className="invite-preview-card">
        <div className="invite-preview-brand">
          <KnomeeMark size={20} /> knomee
        </div>
        <h4>Your Invitation</h4>
        <p>
          Alex Advisor has invited you to join Beacon Planning on Knomee
          {kind === 'client' ? ' as a client' : ''}.
        </p>
        <button className="invite-accept" type="button">
          Accept Invitation
        </button>
        <p className="invite-preview-foot">
          If you&rsquo;re having trouble with the above please email us at:{' '}
          <a href="mailto:info@knomee.com" onClick={(e) => e.preventDefault()}>
            info@knomee.com
          </a>
        </p>
      </div>
    </div>
  )
}

function InviteModal({
  initialKind,
  onClose,
  showToast,
}: {
  initialKind: InviteKind
  onClose: () => void
  showToast: (msg: string) => void
}) {
  const [kind, setKind] = useState<InviteKind>(initialKind)
  const [email, setEmail] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const tabInd = useSlideIndicator(kind)
  const label = kind === 'prospect' ? 'Prospect' : 'Client'
  const link = `knomee.com/${kind === 'prospect' ? 'kIIKLERH034847' : 'cLNT82H7A19023'}`

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Clipboard may be blocked inside the embedding iframe; the toast is the
  // demo's real feedback, so never let a copy failure swallow it.
  const copy = (text: string, msg: string) => {
    try {
      navigator.clipboard?.writeText(text)
    } catch {
      /* ignore — demo still confirms via toast */
    }
    showToast(msg)
  }

  const send = () => {
    if (!email.trim()) return
    showToast(`${label} email sent`)
    setEmail('')
  }

  const bandStyle = useViewportBand(true)

  return (
    <div className="modal-backdrop" style={bandStyle} onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal invite-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            Invite{' '}
            <span className="invite-title-word" key={kind}>
              {label}
            </span>
          </h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body invite-body">
          <div className="invite-tabs slide-nav" role="tablist" ref={tabInd.ref}>
            {tabInd.box && (
              <span
                className="slide-ind slide-ind-round"
                style={{
                  transform: `translate(${tabInd.box.left}px, ${tabInd.box.top}px)`,
                  width: tabInd.box.width,
                  height: tabInd.box.height,
                }}
              />
            )}
            {(['prospect', 'client'] as InviteKind[]).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                data-active={kind === k}
                className={`invite-tab ${kind === k ? 'is-on' : ''}`}
                onClick={() => setKind(k)}
              >
                Invite {k === 'prospect' ? 'Prospect' : 'Client'}
              </button>
            ))}
          </div>

          {/* Keyed on `kind` so the panel re-runs its enter animation on each
              tab switch — the content cross-fades instead of snapping. */}
          <div className="invite-panel" key={kind}>
            <h3 className="invite-section">Send Invite Email</h3>
            <label className="invite-field-label" htmlFor="invite-email">
              Email
            </label>
            <div className="invite-email-row">
              <input
                id="invite-email"
                type="email"
                placeholder={`Add ${kind} email`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button
                className="invite-send"
                type="button"
                aria-label={`Send ${kind} invite`}
                onClick={send}
              >
                <SendGlyph />
              </button>
            </div>
            <button
              className={`invite-preview-toggle ${previewOpen ? 'is-open' : ''}`}
              type="button"
              aria-expanded={previewOpen}
              onClick={() => setPreviewOpen((v) => !v)}
            >
              Preview <ChevronDown />
            </button>
            {/* Height-animated reveal so the preview expands rather than pops. */}
            <div className={`collapse invite-preview-collapse ${previewOpen ? 'open' : ''}`}>
              <div className="collapse-inner">
                <InvitePreview kind={kind} />
              </div>
            </div>

            <h3 className="invite-section">Share {label} Link</h3>
            <div className="invite-share">
              <div className="invite-share-col invite-share-link">
                <label className="invite-field-label">Link</label>
                <div className="invite-link-box">
                  <span className="invite-link-text">{link}</span>
                  <button
                    className="invite-copy"
                    type="button"
                    aria-label={`Copy ${kind} link`}
                    onClick={() => copy(link, `${label} link copied`)}
                  >
                    <CopyGlyph />
                  </button>
                </div>
              </div>
              <div className="invite-share-col">
                <label className="invite-field-label">QR Code</label>
                <div className="invite-qr-box">
                  <QrCode seed={kind === 'prospect' ? 7 : 23} />
                  <button
                    className="invite-copy invite-qr-copy"
                    type="button"
                    aria-label={`Copy ${kind} QR code`}
                    onClick={() => copy(link, `${label} QR code copied`)}
                  >
                    <CopyGlyph />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConvertModal({
  prospect,
  onCancel,
  onConfirm,
}: {
  prospect: Prospect
  onCancel: () => void
  onConfirm: () => void
}) {
  const bandStyle = useViewportBand(true)
  return (
    <div className="modal-backdrop" style={bandStyle} onClick={onCancel} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Convert to Client</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onCancel}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <b>{prospect.name}</b> will be sent to your <b>Clients</b> Dashboard.
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" type="button" onClick={onConfirm}>
            Convert
          </button>
        </div>
      </div>
    </div>
  )
}

// Confetti burst on conversion — ported from the original converting flow.
// Exposes an imperative fire() so it starts the instant Convert is clicked
// (no waiting on the Clients screen to re-render). Pieces spawn across the
// visible band so they're on screen immediately instead of falling in.
export interface ConfettiHandle {
  fire: () => void
}

const Confetti = forwardRef<ConfettiHandle>(function Confetti(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)

  useImperativeHandle(ref, () => ({
    fire() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      cancelAnimationFrame(rafRef.current)
      const W = (canvas.width = window.innerWidth)
      const H = (canvas.height = window.innerHeight)
      const band = Math.min(H, 900) // keep the burst inside the viewport
      canvas.style.display = 'block'

      const COLORS = ['#a855f7', '#7c3aed', '#b98ddc', '#086375', '#c0ffe7', '#240446', '#d4b3eb', '#6ba1ac', '#e879f9', '#67e8f9']
      const SHAPES = ['rect', 'circle', 'ribbon']
      const pieces = Array.from({ length: 200 }, () => ({
        x: Math.random() * W,
        y: Math.random() * band - 60, // spread across the visible band, on screen now
        w: 6 + Math.random() * 10,
        h: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        rot: Math.random() * Math.PI * 2,
        dRot: (Math.random() - 0.5) * 0.14,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3.5,
        sway: (Math.random() - 0.5) * 0.06,
        alpha: 1,
      }))

      const END = Date.now() + 2000
      let fading = false
      const draw = () => {
        ctx.clearRect(0, 0, W, H)
        if (Date.now() >= END && !fading) fading = true
        if (fading) pieces.forEach((p) => (p.alpha -= 0.025))
        pieces.forEach((p) => {
          if (p.alpha <= 0) return
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.alpha)
          ctx.translate(p.x + p.w / 2, p.y + p.h / 2)
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          if (p.shape === 'circle') {
            ctx.beginPath()
            ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (p.shape === 'ribbon') {
            ctx.fillRect(-p.w * 0.4, -p.h / 2, p.w * 0.8, p.h)
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
          }
          ctx.restore()
          p.x += p.vx
          p.y += p.vy
          p.vx += p.sway
          p.rot += p.dRot
          p.vy += 0.06
        })
        if (pieces.some((p) => p.alpha > 0)) {
          rafRef.current = requestAnimationFrame(draw)
        } else {
          canvas.style.display = 'none'
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    },
  }))

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden />
})

function Toast({ show, message }: { show: boolean; message: string }) {
  const ref = useRef<HTMLDivElement>(null)
  // The prototype is embedded in a full-height iframe whose parent document
  // scrolls, so `position: fixed` would pin the toast to the bottom of the tall
  // iframe (off-screen). Anchor it to the parent's visible viewport instead.
  useLayoutEffect(() => {
    if (!show) return
    let parentWin: Window | null = null
    try {
      if (window.parent !== window && typeof window.parent.scrollY === 'number') {
        parentWin = window.parent
      }
    } catch {
      parentWin = null
    }
    const place = () => {
      const el = ref.current
      if (!el) return
      const h = el.offsetHeight || 60
      // When the iframe is sized to its full content, the parent document is the
      // scroller; otherwise this window scrolls internally. Anchor to whichever
      // one actually scrolls so the toast lands in the visible viewport.
      const selfScrolls = document.documentElement.scrollHeight > window.innerHeight + 2
      const w = selfScrolls || !parentWin ? window : parentWin
      el.style.top = `${w.scrollY + w.innerHeight - h - 32}px`
    }
    place()
    const targets = new Set<Window>([window])
    if (parentWin) targets.add(parentWin)
    targets.forEach((t) => {
      t.addEventListener('scroll', place, { passive: true })
      t.addEventListener('resize', place)
    })
    return () =>
      targets.forEach((t) => {
        t.removeEventListener('scroll', place)
        t.removeEventListener('resize', place)
      })
  }, [show, message])
  return (
    <div ref={ref} className={`app-toast ${show ? 'show' : ''}`} role="status" aria-live="polite">
      <span className="app-toast-check">
        <CheckIcon />
      </span>
      {message}
    </div>
  )
}

/* ── Account settings (Profile · Security · Billing · Marketing) ── */

type SettingsSection = 'profile' | 'security' | 'billing' | 'marketing'

function UsageCard({
  accent,
  wash,
  icon,
  title,
  totalNum,
  totalUnit,
  rate,
  rateUnit,
  due,
  dueColor,
}: {
  accent: string
  wash: string
  icon: ReactNode
  title: string
  totalNum: string
  totalUnit: string
  rate: string
  rateUnit: string
  due: string
  dueColor: string
}) {
  return (
    <div className="usage-card" style={{ borderTopColor: accent }}>
      <div className="usage-head">
        <span className="usage-ico" style={{ background: wash }}>
          {icon}
        </span>
        <span className="usage-title">{title}</span>
      </div>
      <div className="usage-cols">
        <div className="usage-col">
          <div className="usage-lbl">Total</div>
          <div className="usage-num">{totalNum}</div>
          <div className="usage-unit">{totalUnit}</div>
        </div>
        <span className="usage-div" />
        <div className="usage-col">
          <div className="usage-lbl">Charged</div>
          <div className="usage-num sm">{rate}</div>
          <div className="usage-unit">{rateUnit}</div>
        </div>
        <span className="usage-div" />
        <div className="usage-col">
          <div className="usage-lbl">Due</div>
          <div className="usage-num due" style={{ color: dueColor }}>
            {due}
          </div>
        </div>
      </div>
    </div>
  )
}

function ClientsGlyph({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  )
}

function BillingPanel() {
  const { activeClients, conversionsThisYear, paymentMethod, nextInvoice, estClientsNextYear, estRenews } =
    billingBook
  const clientsDue = activeClients * CLIENT_ANNUAL_RATE
  const conversionsDue = conversionsThisYear * CONVERSION_RATE
  const yearTotal = clientsDue + conversionsDue
  const estTotal = estClientsNextYear * CLIENT_ANNUAL_RATE

  return (
    <div className="settings-content billing-content">
      <div className="billing-head">
        <h2 className="settings-h2">My Plan &amp; Billing</h2>
        <button className="btn btn-outline" type="button">
          <DownloadIcon /> Download
        </button>
      </div>

      <div className="bill-split-grid">
        {/* Current year */}
        <div className="bill-year">
          <div className="plan-hero">
            <div className="plan-hero-top">
              <div>
                <div className="plan-hero-eyebrow">This year · 2026</div>
                <div className="plan-hero-sub">Current plan &amp; pricing</div>
              </div>
              <span className="plan-pill grow">Pay as you grow</span>
            </div>
            <div className="plan-hero-bottom">
              <div>
                <div className="plan-hero-lbl">Total due this year</div>
                <div className="plan-hero-amt">{currency(yearTotal)}</div>
              </div>
              <div className="plan-hero-meta">
                {paymentMethod}
                <br />
                next invoice {nextInvoice}
              </div>
            </div>
          </div>

          <UsageCard
            accent="#3dbdaa"
            wash="#E4F6F1"
            icon={<ClientsGlyph color="#0E8C6B" />}
            title="Clients"
            totalNum={String(activeClients)}
            totalUnit="active clients"
            rate={currency(CLIENT_ANNUAL_RATE)}
            rateUnit="/ year each"
            due={currency(clientsDue)}
            dueColor="#3dbdaa"
          />

          <UsageCard
            accent="#a855f7"
            wash="#F3E8FD"
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#a855f7" aria-hidden>
                <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
              </svg>
            }
            title="Prospects converted"
            totalNum={String(conversionsThisYear)}
            totalUnit="this year"
            rate={currency(CONVERSION_RATE)}
            rateUnit="one-time each"
            due={currency(conversionsDue)}
            dueColor="#a855f7"
          />
        </div>

        {/* Estimated next year */}
        <div className="bill-year est">
          <div className="plan-hero est">
            <div className="plan-hero-top">
              <div>
                <div className="plan-hero-eyebrow">Estimated · 2027</div>
                <div className="plan-hero-sub">Projected plan &amp; pricing</div>
              </div>
              <span className="plan-pill estimate">Estimate</span>
            </div>
            <div className="plan-hero-bottom">
              <div>
                <div className="plan-hero-lbl">Est. total next year</div>
                <div className="plan-hero-amt">{currency(estTotal)}</div>
              </div>
              <div className="plan-hero-meta">
                Same pricing
                <br />
                renews {estRenews}
              </div>
            </div>
          </div>

          <UsageCard
            accent="#7bb8ae"
            wash="#EAF3F0"
            icon={<ClientsGlyph color="#5a8f81" />}
            title="Clients"
            totalNum={String(estClientsNextYear)}
            totalUnit="clients in 2027"
            rate={currency(CLIENT_ANNUAL_RATE)}
            rateUnit="/ year each"
            due={currency(estTotal)}
            dueColor="#7bb8ae"
          />
        </div>
      </div>

      {/* Billing history */}
      <div className="bill-history">
        <div className="bill-history-head">
          <span>Billing history</span>
        </div>
        <div className="bill-hrow bill-hhead">
          <span className="bh-date">Date</span>
          <span className="bh-item">Item</span>
          <span className="bh-num">Qty</span>
          <span className="bh-num">Rate</span>
          <span className="bh-num">Amount</span>
          <span className="bh-num">Status</span>
        </div>
        {billingHistory.map((r) => (
          <div className="bill-hrow" key={r.date + r.item}>
            <span className="bh-date">{r.date}</span>
            <span className="bh-item">{r.item}</span>
            <span className="bh-num">{r.qty}</span>
            <span className="bh-num">${r.rate}</span>
            <span className="bh-num">{currency(r.amount).replace('.00', '')}</span>
            <span className={`bh-num bh-status ${r.status}`}>{r.status}</span>
          </div>
        ))}
        <div className="bill-hrow bill-hfoot">
          <span className="bh-date">Lifetime</span>
          <span className="bh-item">
            {billingLifetime.clients} clients · {billingLifetime.conversions} conversions
          </span>
          <span className="bh-num" />
          <span className="bh-num" />
          <span className="bh-num bh-total">
            {currency(billingLifetime.total).replace('.00', '')}
          </span>
          <span className="bh-num" />
        </div>
      </div>
    </div>
  )
}

function MarketingPanel() {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(utmKeys.map((k, i) => [k.key, i < 6])),
  )
  const [custom, setCustom] = useState<{ key: string; label: string }[]>([])
  const [newKey, setNewKey] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const all = [...utmKeys, ...custom]
  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }))
  const addCustom = () => {
    const key = newKey.trim()
    if (!key) return
    setCustom((c) => [...c, { key, label: newDesc.trim() || 'Custom key' }])
    setChecked((c) => ({ ...c, [key]: true }))
    setNewKey('')
    setNewDesc('')
  }

  return (
    <div className="settings-content">
      <h2 className="settings-h2">Marketing</h2>
      <div className="mkt-sub">Allowed Prospect UTM Keys</div>

      <div className="mkt-grid">
        {all.map((k) => (
          <label className="mkt-item" key={k.key}>
            <input type="checkbox" checked={!!checked[k.key]} onChange={() => toggle(k.key)} />
            <span>
              <span className="mkt-label">{k.label}</span>
              <span className="mkt-key">{k.key}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mkt-add">
        <div className="mkt-add-fields">
          <input
            type="text"
            placeholder="custom_key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <input
            type="text"
            placeholder="Brief description (3–5 words)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
        </div>
        <button className="mkt-add-btn" type="button" onClick={addCustom}>
          Add
        </button>
      </div>

      <div className="mkt-footer">
        <button className="btn btn-primary" type="button">
          Save Changes
        </button>
      </div>
    </div>
  )
}

function ProfilePanel() {
  return (
    <div className="settings-content">
      <h2 className="settings-h2">Profile details</h2>
      <div className="settings-row">
        <span className="settings-label">Profile</span>
        <div className="settings-value profile-value">
          <span className="avatar avatar-initial profile-avatar">A</span>
          <span>Alex Advisor</span>
        </div>
        <button className="settings-link" type="button">Update profile</button>
      </div>
      <div className="settings-row">
        <span className="settings-label">Email addresses</span>
        <div className="settings-value">
          <div className="settings-email">
            alex@beaconplan.co <span className="settings-pill">Primary</span>
          </div>
          <button className="settings-link" type="button">+ Add email address</button>
        </div>
      </div>
      <div className="settings-row">
        <span className="settings-label">Connected accounts</span>
        <button className="settings-link" type="button">+ Connect account</button>
      </div>
    </div>
  )
}

function SecurityPanel() {
  return (
    <div className="settings-content">
      <h2 className="settings-h2">Security</h2>
      <div className="settings-row">
        <span className="settings-label">Password</span>
        <span className="settings-value">••••••••••</span>
        <button className="settings-link" type="button">Update password</button>
      </div>
      <div className="settings-row">
        <span className="settings-label">Active devices</span>
        <div className="settings-value">
          <div className="settings-device">
            <b>Chrome</b> · macOS <span className="settings-pill">This device</span>
          </div>
          <div className="settings-device-meta">San Francisco, US · Today at 3:40 PM</div>
        </div>
      </div>
      <div className="settings-row">
        <span className="settings-label">Delete account</span>
        <button className="settings-link danger" type="button">Delete account</button>
      </div>
    </div>
  )
}

function SettingsScreen({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<SettingsSection>('billing')
  const nav: { id: SettingsSection; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'billing', label: 'Billing' },
    { id: 'marketing', label: 'Marketing' },
  ]
  return (
    <main className="content settings-screen">
      <button className="settings-back" type="button" onClick={onClose}>
        ‹ Back to dashboard
      </button>
      <div className="settings-grid">
        <aside className="settings-side">
          <div className="settings-side-head">
            <h1>Account</h1>
            <p>Manage your account info.</p>
          </div>
          <nav className="settings-nav">
            {nav.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`settings-nav-item ${section === n.id ? 'active' : ''}`}
                onClick={() => setSection(n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </aside>
        <section className="settings-main">
          {section === 'profile' && <ProfilePanel />}
          {section === 'security' && <SecurityPanel />}
          {section === 'billing' && <BillingPanel />}
          {section === 'marketing' && <MarketingPanel />}
        </section>
      </div>
    </main>
  )
}

const tabs: { id: Screen; label: string }[] = [
  { id: 'prospects', label: 'Prospects' },
  { id: 'clients', label: 'Clients' },
  { id: 'analytics', label: 'Analytics' },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('prospects')
  const tabsInd = useSlideIndicator<HTMLElement>(screen)
  const [converted, setConverted] = useState<Client[]>([])
  const [convertTarget, setConvertTarget] = useState<Prospect | null>(null)
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })
  const showToast = (msg: string) => {
    setToast({ show: true, msg })
    window.setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200)
  }
  const confettiRef = useRef<ConfettiHandle>(null)
  // Internal-only: show the empty dashboards. Off by default so the prototype
  // reads as the populated demo; toggled from the top-right menu.
  const [emptyMode, setEmptyMode] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Invite modal: null when closed, otherwise the tab it opens on.
  const [inviteKind, setInviteKind] = useState<InviteKind | null>(null)
  // Reached from the burger menu rather than the tab bar: it describes how the
  // segments are derived, which is a level below the day-to-day dashboards.
  const [segmentationOpen, setSegmentationOpen] = useState(false)
  // Dev toggle between the advisor persona (the default demo) and the manager /
  // admin persona who oversees 100 advisors. Off = advisor.
  const [adminView, setAdminView] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [menuOpen])

  // Expose the current screen to the commenting overlay so comment pins are
  // scoped per screen (a pin dropped on Prospects doesn't show on Clients).
  useEffect(() => {
    ;(window as unknown as { __ccScreenId?: string }).__ccScreenId = adminView
      ? 'admin'
      : segmentationOpen
        ? 'segmentation'
        : screen
  }, [screen, segmentationOpen, adminView])

  // Esc closes the convert modal.
  useEffect(() => {
    if (!convertTarget) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConvertTarget(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [convertTarget])

  const confirmConvert = () => {
    if (!convertTarget) return
    const already = converted.some((c) => c.email === convertTarget.email)
    if (!already) {
      setConverted((prev) => [convertedClient(convertTarget.name, convertTarget.email), ...prev])
    }
    confettiRef.current?.fire() // fire immediately, before the heavy screen switch
    setConvertTarget(null)
    setScreen('clients')
    showToast('Converted to Client')
  }

  const clients = [...converted, ...baseClients]

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <img className="brand-logo" src="./knomee-logo-white.svg" alt="knomee" />
            <span className="brand-sub">{adminView ? 'ADMIN' : 'ADVISOR'}</span>
          </div>
          <div className="menu-wrap" ref={menuRef}>
            <button
              className="menu-btn"
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((v) => !v)
              }}
            >
              <BurgerMenu />
            </button>
            {menuOpen && (
              <div className="menu-pop">
                <div className="menu-account">
                  <span className="menu-avatar">A</span>
                  <span className="menu-name">Alex Advisor</span>
                </div>
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => {
                    setSettingsOpen(true)
                    setSegmentationOpen(false)
                    setAdminView(false)
                    setMenuOpen(false)
                  }}
                >
                  Account Settings
                </button>
                <button className="menu-item" type="button">
                  Sign Out
                </button>
                <div className="menu-divider" />
                <div className="menu-pop-title">Analysis</div>
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => {
                    setSegmentationOpen(true)
                    setSettingsOpen(false)
                    setAdminView(false)
                    setMenuOpen(false)
                  }}
                >
                  Segmentation
                </button>
                <div className="menu-divider" />
                <div className="menu-pop-title">Demo controls</div>
                <label className="menu-toggle">
                  <span>Admin view (100 advisors)</span>
                  <span className={`switch ${adminView ? 'on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={adminView}
                      onChange={(e) => {
                        setAdminView(e.target.checked)
                        setSettingsOpen(false)
                        setSegmentationOpen(false)
                      }}
                    />
                    <span className="switch-knob" />
                  </span>
                </label>
                <label className="menu-toggle">
                  <span>Empty dashboards</span>
                  <span className={`switch ${emptyMode ? 'on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={emptyMode}
                      onChange={(e) => setEmptyMode(e.target.checked)}
                    />
                    <span className="switch-knob" />
                  </span>
                </label>
                <div className="menu-hint">
                  Press <b>F2</b> to leave comments
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {adminView ? (
        <main className="content">
          <AdminScreen />
        </main>
      ) : settingsOpen ? (
        <SettingsScreen onClose={() => setSettingsOpen(false)} />
      ) : segmentationOpen ? (
        <main className="content">
          <button
            className="settings-back"
            type="button"
            onClick={() => setSegmentationOpen(false)}
          >
            ‹ Back to dashboard
          </button>
          <SegmentationScreen />
        </main>
      ) : (
      <main className="content">
        <nav className="tabs slide-nav" ref={tabsInd.ref}>
          {tabsInd.box && (
            <span
              className="slide-ind slide-ind-underline"
              style={{
                transform: `translateX(${tabsInd.box.left}px)`,
                width: tabsInd.box.width,
              }}
            />
          )}
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab ${screen === t.id ? 'tab-active' : ''}`}
              type="button"
              data-active={screen === t.id}
              onClick={() => setScreen(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {screen === 'prospects' &&
          (emptyMode ? (
            <EmptyScreen variant="prospects" onCta={() => setEmptyMode(false)} />
          ) : (
            <ProspectsScreen
              onConvert={setConvertTarget}
              onDownload={() => showToast('CSV downloaded')}
              onInvite={() => setInviteKind('prospect')}
            />
          ))}
        {screen === 'clients' &&
          (emptyMode ? (
            <EmptyScreen variant="clients" onCta={() => setEmptyMode(false)} />
          ) : (
            <ClientsScreen
              clients={clients}
              onDownload={() => showToast('CSV downloaded')}
              onInvite={() => setInviteKind('client')}
            />
          ))}
        {screen === 'analytics' &&
          (emptyMode ? <EmptyScreen variant="analytics" /> : <AnalyticsScreen />)}
      </main>
      )}

      {convertTarget && (
        <ConvertModal
          prospect={convertTarget}
          onCancel={() => setConvertTarget(null)}
          onConfirm={confirmConvert}
        />
      )}
      {inviteKind && (
        <InviteModal
          initialKind={inviteKind}
          onClose={() => setInviteKind(null)}
          showToast={showToast}
        />
      )}
      <Toast show={toast.show} message={toast.msg} />
      <Confetti ref={confettiRef} />
    </div>
  )
}
