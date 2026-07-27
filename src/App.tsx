import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { prospects, tierGroups, type Prospect, type Tier } from './data/prospects'
import { insights } from './data/insights'
import { utmBreakdowns, utmKeys } from './data/analytics'
import {
  engagement,
  outcomes,
  byTier,
  buildFunnel,
  type FunnelConfig,
} from './data/performance'
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
  MegaphoneIcon,
} from './components/icons'

type Screen = 'prospects' | 'clients' | 'performance'

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
function HelpTip({ text }: { text: string }) {
  return (
    <span className="help-tip tt" data-tip={text} tabIndex={0} role="img" aria-label={text}>
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
  children,
}: {
  icon: ReactNode
  title: string
  hint?: string
  bodyClassName: string
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <section className={`card ${className ?? ''}`}>
      <header className="card-head">
        <div className="card-title">
          {icon}
          <span>{title}</span>
          {hint && <HelpTip text={hint} />}
        </div>
        <button
          className={`show-toggle ${open ? '' : 'collapsed'}`}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? 'SHOW LESS' : 'SHOW MORE'} <ChevronUp />
        </button>
      </header>

      <div className={`collapse ${open ? 'open' : ''}`}>
        <div className="collapse-inner">
          <div className={bodyClassName}>{children}</div>
        </div>
      </div>
    </section>
  )
}

function TopLineMetrics() {
  return (
    <CollapsibleCard
      className="metrics-card"
      icon={<ChartIcon color="#7639a1" />}
      title="Top Line Metrics"
      hint="Headline counts for your prospect book — totals, average KQ score, and the tier split."
      bodyClassName="metrics-body"
    >
        <div className="metric-tiles">
          <div className="metric-tile">
            <span className="metric-label">TOTAL PROSPECTS</span>
            <div className="metric-num">
              <span className="metric-value tt" data-tip="Prospects in your book">12</span>
            </div>
          </div>
          <div className="metric-tile">
            <span className="metric-label">AVG KQ SCORE</span>
            <div className="metric-num">
              <span className="metric-value tt" data-tip="Average KQ across all prospects">55.9</span>
            </div>
          </div>

          <div className="metric-tile distribution">
            <div className="dist-head">
              <span className="metric-label">TIER DISTRIBUTION</span>
              <span className="dist-note">1 incomplete profile not shown</span>
            </div>
            <div className="dist-bar">
              <span className="seg seg-1 tt" data-tip="Tier 1 · 3 · 25%">3</span>
              <span className="seg seg-2 tt" data-tip="Tier 2 · 5 · 42%">5</span>
              <span className="seg seg-3 tt" data-tip="Tier 3 · 3 · 25%">3</span>
            </div>
            <div className="dist-legend">
              <div className="dist-leg">
                <span className="dist-leg-name"><i className="dot dot-1" />Tier 1 · Ready Now</span>
                <span className="dist-leg-range">70–100 KQ</span>
              </div>
              <div className="dist-leg">
                <span className="dist-leg-name"><i className="dot dot-2" />Tier 2 · Considering</span>
                <span className="dist-leg-range">40–69 KQ</span>
              </div>
              <div className="dist-leg">
                <span className="dist-leg-name"><i className="dot dot-3" />Tier 3 · Nurture</span>
                <span className="dist-leg-range">0–39 KQ</span>
              </div>
            </div>
          </div>
        </div>
    </CollapsibleCard>
  )
}

function ActionableInsights() {
  const col1 = insights.slice(0, 4)
  const col2 = insights.slice(4, 8)
  return (
    <CollapsibleCard
      className="insights-card"
      icon={<BoltIcon color="#7639a1" />}
      title="Actionable Insights"
      hint="Auto-generated takeaways ranked by opportunity, so you know who to prioritise."
      bodyClassName="insights-body"
    >
      {[col1, col2].map((col, i) => (
        <div className="insights-col" key={i}>
          {col.map((ins) => (
            <div className="insight" key={ins.n}>
              <div className="insight-num">{ins.n}</div>
              <div className="insight-text">
                <div className="insight-title">{ins.title}</div>
                <p className="insight-body">{ins.body}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </CollapsibleCard>
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
}: {
  downloadActive: boolean
  onDownload: () => void
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
        <button className="btn btn-primary" type="button">
          <PlusIcon /> Invite
        </button>
      </div>
    </div>
  )
}

function ProspectsScreen({
  onConvert,
  onDownload,
}: {
  onConvert: (p: Prospect) => void
  onDownload: () => void
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
      <h1 className="page-title">My Dashboard</h1>
      <TopLineMetrics />
      <ActionableInsights />
      <Toolbar downloadActive={selected.size > 0} onDownload={onDownload} />
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
      hint="Headline counts for your client book — totals, average KR score, and the tier split."
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
              <HelpTip text="Blended sentiment across your clients, from frustrated to delighted." />
            </span>
            <span className="chart-figure">{confidenceScore}</span>
          </div>
          <ConfidencePie />
        </div>
        <div className="chart-card">
          <div className="chart-head">
            <span className="chart-head-l">
              <span className="metric-label">CLIENTS ACTIVE THIS WEEK</span>
              <HelpTip text="Share of clients who logged in each week over the last stretch." />
            </span>
            <span className="chart-figure">{activeThisWeek}%</span>
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
      hint="Clients that need attention, flagged by recent engagement and sentiment signals."
      bodyClassName="client-insights-body"
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

function ClientsScreen({ clients, onDownload }: { clients: Client[]; onDownload: () => void }) {
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
      <Toolbar downloadActive={selected.size > 0} onDownload={onDownload} />
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

/* ── UTM attribution card (used on the Performance page) ── */

function UtmBreakdownCard({
  label,
  values,
}: {
  label: string
  values: { value: string; count: number }[]
}) {
  const total = values.reduce((a, v) => a + v.count, 0)
  return (
    <div className="utm-card">
      <div className="utm-card-title">{label}</div>
      <ul className="utm-list">
        {values.map((v) => (
          <li key={v.value}>
            <span className="utm-value">{v.value}</span>
            <span className="utm-track">
              <span className="utm-fill" style={{ width: `${(v.count / total) * 100}%` }} />
            </span>
            <span className="utm-count">{v.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Performance screen (engagement · outcomes · by tier · onboarding funnel) ── */

function KQGauge({ value }: { value: number }) {
  return (
    <div className="kq-gauge">
      <div className="kq-track">
        <span className="kq-dot" style={{ left: `${value}%` }} />
      </div>
      <div className="kq-axis">
        <span>0</span>
        <span>Nurture</span>
        <span>Considering</span>
        <span>Ready</span>
        <span>100</span>
      </div>
    </div>
  )
}

function TierSector() {
  return (
    <>
      <div className="sector-bar">
        {byTier.map((t) => (
          <span
            key={t.tier}
            className={`sector-seg ${t.pct < 6 ? 'sector-seg-narrow' : ''}`}
            style={{ flex: t.pct, background: t.color }}
          >
            <span className="sector-lbl">{t.count}</span>
          </span>
        ))}
      </div>
      <div className="sector-legend">
        {byTier.map((t) => (
          <span key={t.tier}>
            <i className="swatch" style={{ background: t.color }} />
            {t.name} · {t.count} · {Math.round(t.pct)}%
          </span>
        ))}
      </div>
    </>
  )
}

const FUNNEL_CONFIGS: {
  key: string
  name: string
  cfg: FunnelConfig
  recommended?: boolean
}[] = [
  { key: 'won-late', name: 'Welcome on · Gate late', cfg: { welcome: true, gate: 'late' }, recommended: true },
  { key: 'won-early', name: 'Welcome on · Gate early', cfg: { welcome: true, gate: 'early' } },
  { key: 'woff-late', name: 'Welcome off · Gate late', cfg: { welcome: false, gate: 'late' } },
  { key: 'woff-early', name: 'Welcome off · Gate early', cfg: { welcome: false, gate: 'early' } },
]

function FunnelRow({ name, cfg, recommended }: { name: string; cfg: FunnelConfig; recommended?: boolean }) {
  // Track hover by index: buildFunnel rebuilds segment objects each render, so
  // object identity would never match after a state update.
  const [hover, setHover] = useState<number | null>(null)
  const { segments, complete } = buildFunnel(cfg)
  return (
    <div className="fm-row">
      <div className="fm-row-head">
        <span className="fm-row-name">{name}</span>
        {recommended && <span className="fconfig-pill">Recommended</span>}
        <span className="fm-row-complete">
          <b>{complete}%</b> complete
        </span>
      </div>
      <div className="ob-bar">
        {segments.map((s, i) => (
          <div
            key={`${s.stage}-${i}`}
            className={`ob-seg ${s.gate ? 'gate' : ''} ${s.completed ? 'done' : ''}`}
            style={{ flex: s.pct, background: s.gate ? undefined : s.color, color: s.ink }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((h) => (h === i ? null : h))}
          >
            {s.pct >= 5 && <span className="ob-pct">{s.pct}%</span>}
            {hover === i && (
              <div className="ob-tip">
                <b>{s.count}</b> {s.count === 1 ? 'person' : 'people'}{' '}
                {s.completed
                  ? 'completed onboarding'
                  : s.gate
                    ? 'dropped at the sign-up gate'
                    : 'dropped off here'}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="ob-labels">
        {segments.map((s, i) => (
          <span key={`${s.stage}-l-${i}`} style={{ flex: s.pct }}>
            {s.stage}
          </span>
        ))}
      </div>
    </div>
  )
}

const CFG_BY_KEY = Object.fromEntries(FUNNEL_CONFIGS.map((c) => [c.key, c]))

function OnboardingFunnel() {
  const [active, setActive] = useState<Set<string>>(new Set(['won-late']))
  const toggle = (key: string) =>
    setActive((s) => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  const cell = (key: string) => {
    const c = CFG_BY_KEY[key]
    return (
      <label className={`fm-cell ${active.has(key) ? 'on' : ''}`} aria-label={c.name}>
        <input type="checkbox" checked={active.has(key)} onChange={() => toggle(key)} />
        <span className="fm-check">
          <CheckIcon />
        </span>
        {c.recommended && <span className="fm-rec">Recommended</span>}
      </label>
    )
  }
  return (
    <div className="funnel-matrix">
      {/* Welcome on/off (rows) × Gate late/early (columns) */}
      <div className="fm-grid">
        <span className="fm-grid-corner" aria-hidden="true" />
        <span className="fm-grid-col">Gate late</span>
        <span className="fm-grid-col">Gate early</span>
        <span className="fm-grid-row">Welcome on</span>
        {cell('won-late')}
        {cell('won-early')}
        <span className="fm-grid-row">Welcome off</span>
        {cell('woff-late')}
        {cell('woff-early')}
      </div>
      <div className="fm-output">
        <div className="fm-rows">
          {FUNNEL_CONFIGS.filter((c) => active.has(c.key)).map((c) => (
            <FunnelRow key={c.key} name={c.name} cfg={c.cfg} recommended={c.recommended} />
          ))}
          {active.size === 0 && (
            <div className="fm-empty">Select a configuration to see its drop-off.</div>
          )}
        </div>
      </div>
      <div className="fm-legend">
        <span>
          <i className="swatch" style={{ background: '#8a52bf' }} />
          Adventure drop-off
        </span>
        <span>
          <i className="swatch fm-hatch" />
          Sign-up gate
        </span>
        <span>
          <i className="swatch" style={{ background: '#d8c5ec' }} />
          Welcome
        </span>
        <span>
          <i className="swatch" style={{ background: '#3dbdaa' }} />
          Completed
        </span>
      </div>
    </div>
  )
}

function PerformanceScreen() {
  return (
    <>
      <h1 className="page-title">Performance</h1>

      <section className="card perf-card">
        <header className="card-head">
          <div className="card-title">
            <ChartIcon />
            <span>Engagement</span>
            <HelpTip text="Where prospects are in the onboarding journey, from first invite through to a booked meeting." />
          </div>
        </header>
        <div className="perf-body">
        <div className="perf-metrics">
          {engagement.map((m) => (
            <div className="perf-metric" key={m.label}>
              <div className="perf-lbl">{m.label}</div>
              <div className="perf-num">{m.value}</div>
              <div className={`perf-sub ${m.tone}`}>{m.sub}</div>
            </div>
          ))}
        </div>
        </div>
      </section>

      <section className="card perf-card">
        <header className="card-head">
          <div className="card-title">
            <FunnelIcon />
            <span>Onboarding Funnel</span>
            <HelpTip text="how far prospects get before they drop off" />
          </div>
        </header>
        <div className="perf-body">
        <OnboardingFunnel />
        </div>
      </section>

      <section className="card perf-card">
        <header className="card-head">
          <div className="card-title">
            <MegaphoneIcon />
            <span>Marketing (UTM) Attribution</span>
            <HelpTip text="how prospects arrived" />
          </div>
        </header>
        <div className="perf-body">
        <div className="utm-grid">
          {utmBreakdowns.map((b) => (
            <UtmBreakdownCard key={b.key} label={b.label} values={b.values} />
          ))}
        </div>
        <div className="utm-keys">
          <div className="utm-keys-title">Tracked UTM keys</div>
          <div className="utm-keys-list">
            {utmKeys.map((k) => (
              <span className="utm-chip" key={k.key} title={k.label}>
                {k.key}
              </span>
            ))}
          </div>
        </div>
        </div>
      </section>

      <section className="card perf-card">
        <header className="card-head">
          <div className="card-title">
            <TargetIcon />
            <span>Prospect Outcomes</span>
            <HelpTip text="Conversion rate and average KQ across the prospects you scored this year." />
          </div>
        </header>
        <div className="perf-body">
        <div className="perf-outcomes">
          <div className="outcome-card">
            <div className="perf-lbl">Converted · Prospect → Client</div>
            <div className="outcome-top">
              <span className="outcome-num">{outcomes.converted}</span>
              <span className="outcome-rate">{outcomes.rate}% rate</span>
            </div>
            <div className="outcome-sub">of {outcomes.scored} scored prospects this year</div>
            <div className="outcome-track">
              <span className="outcome-fill" style={{ width: `${outcomes.rate}%` }} />
            </div>
            <div className="outcome-target">target {outcomes.target}%</div>
          </div>
          <div className="outcome-card">
            <div className="perf-lbl">Average KQ Score</div>
            <div className="outcome-num">{outcomes.avgKQ}</div>
            <KQGauge value={outcomes.avgKQ} />
          </div>
        </div>
        </div>
      </section>

      <section className="card perf-card">
        <header className="card-head">
          <div className="card-title">
            <TierBarsIcon />
            <span>By Tier</span>
            <HelpTip text="How prospects spread across readiness tiers, with conversion and KQ for each." />
          </div>
        </header>
        <div className="perf-body">
        <TierSector />
        <div className="perf-tier-table">
          <div className="ptt-head">
            <span className="ptt-tier">Tier</span>
            <span>Prospects</span>
            <span>Avg KQ</span>
            <span>Conversion</span>
            <span>KQ Range</span>
          </div>
          {byTier.map((t) => (
            <div className="ptt-row" key={t.tier}>
              <span className="ptt-tier">
                <i className="swatch" style={{ background: t.color }} />
                {t.tier} · {t.name}
              </span>
              <span>{t.count}</span>
              <span>{t.avgKQ}</span>
              <span className={t.convGood ? 'conv-good' : 'conv-muted'}>{t.conv}</span>
              <span>{t.range}</span>
            </div>
          ))}
        </div>
        </div>
      </section>
    </>
  )
}

/* ── Empty dashboard states ─────────────────────────────────────────────
   Same chrome as the populated screens (locked metric/insight bars, toolbar,
   table header) with a centered illustration + CTA. Rendered for Reporting
   always, and for Prospects/Clients when the internal "empty" mode is on. */

type EmptyVariant = 'prospects' | 'clients' | 'performance'

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
  performance: {
    title: 'Performance',
    caption: 'Your Performance Dashboard is empty.',
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

      {/* Performance has no metrics/insights bars, search, or buttons. */}
      {variant !== 'performance' && (
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

function ConvertModal({
  prospect,
  onCancel,
  onConfirm,
}: {
  prospect: Prospect
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true">
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
  { id: 'performance', label: 'Performance' },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('prospects')
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
    ;(window as unknown as { __ccScreenId?: string }).__ccScreenId = screen
  }, [screen])

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
            <span className="brand-sub">ADVISOR</span>
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
                    setMenuOpen(false)
                  }}
                >
                  Account Settings
                </button>
                <button className="menu-item" type="button">
                  Sign Out
                </button>
                <div className="menu-divider" />
                <div className="menu-pop-title">Demo controls</div>
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

      {settingsOpen ? (
        <SettingsScreen onClose={() => setSettingsOpen(false)} />
      ) : (
      <main className="content">
        <nav className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab ${screen === t.id ? 'tab-active' : ''}`}
              type="button"
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
            />
          ))}
        {screen === 'clients' &&
          (emptyMode ? (
            <EmptyScreen variant="clients" onCta={() => setEmptyMode(false)} />
          ) : (
            <ClientsScreen clients={clients} onDownload={() => showToast('CSV downloaded')} />
          ))}
        {screen === 'performance' &&
          (emptyMode ? <EmptyScreen variant="performance" /> : <PerformanceScreen />)}
      </main>
      )}

      {convertTarget && (
        <ConvertModal
          prospect={convertTarget}
          onCancel={() => setConvertTarget(null)}
          onConfirm={confirmConvert}
        />
      )}
      <Toast show={toast.show} message={toast.msg} />
      <Confetti ref={confettiRef} />
    </div>
  )
}
