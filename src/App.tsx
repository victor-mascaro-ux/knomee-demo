import {
  forwardRef,
  useEffect,
  useImperativeHandle,
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
  type FunnelSeg,
} from './data/performance'
import {
  CLIENT_ANNUAL_RATE,
  PROSPECT_ONE_TIME_RATE,
  currency,
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
  ChevronRight,
  SearchIcon,
  DownloadIcon,
  PlusIcon,
  LightningIcon,
  DotsIcon,
  InfoIcon,
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

function CollapsibleCard({
  icon,
  title,
  bodyClassName,
  className,
  children,
}: {
  icon: ReactNode
  title: string
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
      icon={<ChartIcon />}
      title="Top Line Metrics"
      bodyClassName="metrics-body"
    >
        <div className="metric-tiles">
          <div className="metric-tile">
            <span className="metric-label">TOTAL PROSPECTS</span>
            <span className="metric-value">12</span>
          </div>
          <div className="metric-tile">
            <span className="metric-label">AVG KQ SCORE</span>
            <span className="metric-value">55.9</span>
          </div>

          <div className="metric-tile distribution">
            <span className="metric-label">TIER DISTRIBUTION</span>
            <div className="dist-bar">
              <span className="seg seg-1">3</span>
              <span className="seg seg-2">5</span>
              <span className="seg seg-3">3</span>
            </div>
            <div className="dist-legend">
              <span><i className="dot dot-1" />Tier 1 (25%)</span>
              <span><i className="dot dot-2" />Tier 2 (42%)</span>
              <span><i className="dot dot-3" />Tier 3 (25%)</span>
            </div>
          </div>
        </div>

        <div className="tier-cards">
          <div className="tier-card">
            <div className="tier-card-head">
              <span className="tier-swatch sw-1" />
              <span className="tier-card-title">TIER 1 - READY NOW</span>
              <span className="tier-info"><InfoIcon /></span>
              <span className="tier-range">70-100<br />KQ</span>
            </div>
            <div className="tier-card-value"><strong>3</strong> 25%</div>
          </div>
          <div className="tier-card">
            <div className="tier-card-head">
              <span className="tier-swatch sw-2" />
              <span className="tier-card-title">TIER 2 - CONSIDERING</span>
              <span className="tier-info"><InfoIcon /></span>
              <span className="tier-range">40-69<br />KQ</span>
            </div>
            <div className="tier-card-value"><strong>5</strong> 42%</div>
          </div>
          <div className="tier-card">
            <div className="tier-card-head">
              <span className="tier-swatch sw-3" />
              <span className="tier-card-title">TIER 3 - NURTURE</span>
              <span className="tier-info"><InfoIcon /></span>
              <span className="tier-range">0-39<br />KQ</span>
            </div>
            <div className="tier-card-value"><strong>3</strong> 25%</div>
          </div>
          <div className="tier-card">
            <div className="tier-card-head">
              <span className="tier-swatch sw-x" />
              <span className="tier-card-title">INCOMPLETE PROFILES</span>
            </div>
            <div className="tier-card-value"><strong>1</strong></div>
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
      icon={<BoltIcon />}
      title="Actionable Insights"
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

function ProspectRow({ p, onConvert }: { p: Prospect; onConvert: (p: Prospect) => void }) {
  const incomplete = p.tier === 'incomplete'
  return (
    <tr className={incomplete ? 'row-incomplete' : undefined}>
      <td className="col-check">
        <input type="checkbox" />
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
      <td className="col-action">{p.topAction}</td>
      <td className="col-bolt">
        <button
          className={`bolt-btn ${incomplete ? 'bolt-disabled' : ''}`}
          type="button"
          title={incomplete ? undefined : 'Convert to client'}
          aria-label={incomplete ? undefined : 'Convert to client'}
          onClick={() => {
            if (!incomplete) onConvert(p)
          }}
        >
          <LightningIcon color={incomplete ? '#c9c9c9' : '#ffffff'} />
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

function ProspectsTable({ onConvert }: { onConvert: (p: Prospect) => void }) {
  return (
    <div className="table-wrap">
      <table className="prospects-table">
        <thead>
          <tr>
            <th className="col-check">
              <input type="checkbox" />
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
                  <ProspectRow p={p} key={p.name} onConvert={onConvert} />
                ))}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Toolbar() {
  return (
    <div className="toolbar">
      <div className="search-box">
        <SearchIcon />
        <input type="text" placeholder="Search name" />
      </div>
      <div className="toolbar-actions">
        <button className="btn btn-outline" type="button">
          <DownloadIcon /> Download
        </button>
        <button className="btn btn-primary" type="button">
          <PlusIcon /> Invite
        </button>
      </div>
    </div>
  )
}

function ProspectsScreen({ onConvert }: { onConvert: (p: Prospect) => void }) {
  return (
    <>
      <h1 className="page-title">My Dashboard</h1>
      <TopLineMetrics />
      <ActionableInsights />
      <Toolbar />
      <ProspectsTable onConvert={onConvert} />
    </>
  )
}

/* ── Clients screen (the converted book of business) ── */

function SentimentDots({ value, warn }: { value: number | null; warn?: boolean }) {
  if (value === null) return <span className="dash">–</span>
  return (
    <div className="sentiment">
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

function ClientRow({ c }: { c: Client }) {
  return (
    <tr className={c.isNew ? 'client-new' : undefined}>
      <td className="col-check">
        <input type="checkbox" />
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
        <SentimentDots value={c.sentiment} warn={c.warn} />
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
  const stops: string[] = []
  let acc = 0
  for (const s of confidenceSegments) {
    stops.push(`${s.color} ${acc}% ${acc + s.pct}%`)
    acc += s.pct
  }
  return (
    <div className="confidence">
      <div className="pie" style={{ background: `conic-gradient(${stops.join(', ')})` }} />
      <ul className="pie-legend">
        {confidenceSegments.map((s) => (
          <li key={s.label}>
            <span className="pie-emoji" style={{ background: s.color }}>{s.emoji}</span>
            <span className="pie-pct">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ActiveChart() {
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
      <polyline points={pts} fill="none" stroke="#9b51e0" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {activeSeries.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r="3" fill="#9b51e0" />
      ))}
      {activeSeries.map((d, i) => (
        <text key={`l${i}`} x={x(i)} y={h - 8} textAnchor="middle" fontSize="8.5" fill="#afafaf">{d.week}</text>
      ))}
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
      bodyClassName="metrics-body"
    >
      <div className="metric-tiles">
        <div className="metric-tile">
          <span className="metric-label">TOTAL CLIENTS</span>
          <span className="metric-value">{total}</span>
        </div>
        <div className="metric-tile">
          <span className="metric-label">AVG KR SCORE</span>
          <span className="metric-value">{AVG_KR_SCORE}</span>
        </div>
        <div className="metric-tile distribution">
          <span className="metric-label">TIER DISTRIBUTION</span>
          <div className="dist-bar">
            <span className="seg seg-c1" style={{ flex: engaged || 0.001 }}>{engaged}</span>
            <span className="seg seg-c2" style={{ flex: attention || 0.001 }}>{attention}</span>
            <span className="seg seg-c3" style={{ flex: reconnect || 0.001 }}>{reconnect}</span>
          </div>
          <div className="dist-legend">
            <span><i className="dot dot-c1" />Tier 1 ({pct(engaged)}%)</span>
            <span><i className="dot dot-c2" />Tier 2 ({pct(attention)}%)</span>
            <span><i className="dot dot-c3" />Tier 3 ({pct(reconnect)}%)</span>
          </div>
        </div>
      </div>

      <div className="tier-cards">
        <div className="tier-card">
          <div className="tier-card-head">
            <span className="tier-swatch sw-c1" />
            <span className="tier-card-title">TIER 1 - ENGAGED</span>
            <span className="tier-info"><InfoIcon /></span>
            <span className="tier-range">70-100<br />KR</span>
          </div>
          <div className="tier-card-value"><strong>{engaged}</strong> {pct(engaged)}%</div>
        </div>
        <div className="tier-card">
          <div className="tier-card-head">
            <span className="tier-swatch sw-c2" />
            <span className="tier-card-title">TIER 2 - ATTENTION</span>
            <span className="tier-info"><InfoIcon /></span>
            <span className="tier-range">40-69<br />KR</span>
          </div>
          <div className="tier-card-value"><strong>{attention}</strong> {pct(attention)}%</div>
        </div>
        <div className="tier-card">
          <div className="tier-card-head">
            <span className="tier-swatch sw-c3" />
            <span className="tier-card-title">TIER 3 - RECONNECT</span>
            <span className="tier-info"><InfoIcon /></span>
            <span className="tier-range">0-39<br />KR</span>
          </div>
          <div className="tier-card-value"><strong>{reconnect}</strong> {pct(reconnect)}%</div>
        </div>
        <div className="tier-card">
          <div className="tier-card-head">
            <span className="tier-swatch sw-x" />
            <span className="tier-card-title">INCOMPLETE PROFILES</span>
          </div>
          <div className="tier-card-value"><strong>{incomplete}</strong></div>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <div className="chart-head">
            <span className="metric-label">OVERALL CLIENT CONFIDENCE SCORE</span>
            <span className="chart-figure">{confidenceScore}</span>
          </div>
          <ConfidencePie />
        </div>
        <div className="chart-card">
          <div className="chart-head">
            <span className="metric-label">CLIENTS ACTIVE THIS WEEK</span>
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

function ClientsScreen({ clients }: { clients: Client[] }) {
  return (
    <>
      <h1 className="page-title">My Clients</h1>
      <ClientsMetrics clients={clients} />
      <ClientInsights />
      <Toolbar />
      <div className="table-wrap">
        <table className="prospects-table clients-table">
          <thead>
            <tr>
              <th className="col-check">
                <input type="checkbox" />
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
                    <ClientRow c={c} key={c.name} />
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
  const [hover, setHover] = useState<FunnelSeg | null>(null)
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
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover((h) => (h === s ? null : h))}
          >
            {s.pct >= 5 && <span className="ob-pct">{s.pct}%</span>}
            {hover === s && (
              <div className="ob-tip">
                <b>{s.count}</b>{' '}
                {s.completed ? 'completed' : s.gate ? 'dropped at sign-up' : 'dropped'}
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

function OnboardingFunnel() {
  const [active, setActive] = useState<Set<string>>(new Set(['won-late']))
  const toggle = (key: string) =>
    setActive((s) => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  return (
    <div className="funnel-matrix">
      <div className="fm-chips">
        {FUNNEL_CONFIGS.map((c) => (
          <label key={c.key} className={`fm-chip ${active.has(c.key) ? 'on' : ''}`}>
            <input
              type="checkbox"
              checked={active.has(c.key)}
              onChange={() => toggle(c.key)}
            />
            <span className="fm-check">
              <CheckIcon />
            </span>
            {c.name}
            {c.recommended && <span className="fm-rec">Recommended</span>}
          </label>
        ))}
      </div>
      <div className="fm-rows">
        {FUNNEL_CONFIGS.filter((c) => active.has(c.key)).map((c) => (
          <FunnelRow key={c.key} name={c.name} cfg={c.cfg} recommended={c.recommended} />
        ))}
        {active.size === 0 && (
          <div className="fm-empty">Select a configuration above to see its drop-off.</div>
        )}
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
      <h1 className="page-title">Analytics</h1>

      <section className="card perf-card">
        <header className="card-head">
          <div className="card-title">
            <ChartIcon />
            <span>Engagement</span>
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
            <TargetIcon />
            <span>Prospect Outcomes</span>
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

      <section className="card perf-card">
        <header className="card-head">
          <div className="card-title">
            <FunnelIcon />
            <span>Onboarding Funnel</span>
          </div>
          <span className="perf-note">how far prospects get before they drop off</span>
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
          </div>
          <span className="perf-note">how prospects arrived</span>
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
  return (
    <div className={`app-toast ${show ? 'show' : ''}`} role="status" aria-live="polite">
      <span className="app-toast-check">
        <CheckIcon />
      </span>
      {message}
    </div>
  )
}

/* ── Account settings (Profile · Security · Billing · Marketing) ── */

type SettingsSection = 'profile' | 'security' | 'billing' | 'marketing'

function downloadInvoice(opts: {
  name: string
  email: string
  amount: number
  cadence: string
  invoice: string
}) {
  const lines = [
    'KNOMEE ADVISOR — INVOICE',
    '========================',
    `Invoice:   ${opts.invoice}`,
    `Date:      ${new Date().toLocaleDateString('en-US')}`,
    '',
    `Billed to: Knomee Advisor`,
    `For:       ${opts.name} (${opts.email})`,
    `Type:      Prospect activation (${opts.cadence})`,
    '',
    `Amount:    ${currency(opts.amount)}`,
    '',
    'Prospects are billed once at 4× the standard rate. When a prospect',
    'becomes a client they are billed the standard rate annually thereafter.',
  ].join('\n')
  const blob = new Blob([lines], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${opts.invoice}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function BillingPanel() {
  const prospectLines = prospects
    .filter((p) => p.tier !== 'incomplete')
    .map((p, i) => ({
      name: p.name,
      email: p.email,
      amount: PROSPECT_ONE_TIME_RATE,
      cadence: 'one-time',
      invoice: `INV-P${String(1001 + i)}`,
    }))
  const clientLines = baseClients
    .filter((c) => c.tier !== 'incomplete')
    .map((c, i) => ({
      name: c.name,
      email: c.email,
      amount: CLIENT_ANNUAL_RATE,
      cadence: 'annual',
      invoice: `INV-C${String(2001 + i)}`,
    }))
  const prospectsTotal = prospectLines.reduce((a, l) => a + l.amount, 0)
  const clientsTotal = clientLines.reduce((a, l) => a + l.amount, 0)
  const total = prospectsTotal + clientsTotal

  return (
    <div className="settings-content">
      <h2 className="settings-h2">Billing</h2>

      <div className="bill-summary">
        <div className="bill-owe">
          <span className="settings-label">Total due this cycle</span>
          <span className="bill-owe-value">{currency(total)}</span>
        </div>
        <div className="bill-split">
          <div>
            <span className="settings-label">Prospects · one-time</span>
            <strong>{currency(prospectsTotal)}</strong>
            <span className="bill-note">{prospectLines.length} × {currency(PROSPECT_ONE_TIME_RATE)}</span>
          </div>
          <div>
            <span className="settings-label">Clients · annual</span>
            <strong>{currency(clientsTotal)}</strong>
            <span className="bill-note">{clientLines.length} × {currency(CLIENT_ANNUAL_RATE)}/yr</span>
          </div>
        </div>
      </div>

      <p className="bill-explain">
        Prospects are charged <b>once</b> at {currency(PROSPECT_ONE_TIME_RATE)} (4× the standard
        rate). When a prospect converts to a client they're billed the standard{' '}
        {currency(CLIENT_ANNUAL_RATE)} <b>annually</b> from the following year.
      </p>

      <div className="bill-table-wrap">
        <table className="bill-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Billing</th>
              <th>Amount</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bill-group">
              <td colSpan={4}>Prospects — charged once</td>
            </tr>
            {prospectLines.map((l) => (
              <tr key={l.invoice}>
                <td>
                  <div className="bill-person">
                    <span className="avatar avatar-initial">{l.name.charAt(0)}</span>
                    <div>
                      <div className="bill-name">{l.name}</div>
                      <div className="bill-email">{l.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="bill-badge one-time">one-time · 4×</span></td>
                <td className="bill-amount">{currency(l.amount)}</td>
                <td>
                  <button className="bill-invoice" type="button" onClick={() => downloadInvoice(l)}>
                    <DownloadIcon /> Invoice
                  </button>
                </td>
              </tr>
            ))}
            <tr className="bill-group">
              <td colSpan={4}>Clients — charged annually</td>
            </tr>
            {clientLines.map((l) => (
              <tr key={l.invoice}>
                <td>
                  <div className="bill-person">
                    <span className="avatar avatar-initial">{l.name.charAt(0)}</span>
                    <div>
                      <div className="bill-name">{l.name}</div>
                      <div className="bill-email">{l.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="bill-badge annual">annual · standard</span></td>
                <td className="bill-amount">{currency(l.amount)}</td>
                <td>
                  <button className="bill-invoice" type="button" onClick={() => downloadInvoice(l)}>
                    <DownloadIcon /> Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  { id: 'performance', label: 'Analytics' },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('prospects')
  const [converted, setConverted] = useState<Client[]>([])
  const [convertTarget, setConvertTarget] = useState<Prospect | null>(null)
  const [toast, setToast] = useState(false)
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
    setToast(true)
    window.setTimeout(() => setToast(false), 3200)
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
            <ProspectsScreen onConvert={setConvertTarget} />
          ))}
        {screen === 'clients' &&
          (emptyMode ? (
            <EmptyScreen variant="clients" onCta={() => setEmptyMode(false)} />
          ) : (
            <ClientsScreen clients={clients} />
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
      <Toast show={toast} message="Converted to Client" />
      <Confetti ref={confettiRef} />
    </div>
  )
}
