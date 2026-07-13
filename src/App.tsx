import { useEffect, useRef, useState, type ReactNode } from 'react'
import { prospects, tierGroups, type Prospect, type Tier } from './data/prospects'
import { insights } from './data/insights'
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
} from './components/icons'

type Screen = 'prospects' | 'clients' | 'reporting'

const initial = (name: string) => name.trim().charAt(0).toUpperCase()

// Shared name + chevron (+ optional "new" tag) so the Prospects and Clients
// tables render the label identically and the arrow stays aligned with the name.
function NameLink({ name, isNew }: { name: string; isNew?: boolean }) {
  return (
    <span className="name-line">
      <span className="name-text">{name}</span>
      <ChevronRight />
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
      <h1 className="page-title">My Prospects</h1>
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

function ReportingScreen() {
  return (
    <>
      <h1 className="page-title">Reporting</h1>
      <div className="reporting-placeholder">
        <ChartIcon />
        <p>Reporting dashboards are coming soon.</p>
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
function Confetti({ fireKey }: { fireKey: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (fireKey === 0) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = (canvas.width = window.innerWidth)
    const H = (canvas.height = window.innerHeight)
    canvas.style.display = 'block'

    const COLORS = ['#a855f7', '#7c3aed', '#b98ddc', '#086375', '#c0ffe7', '#240446', '#d4b3eb', '#6ba1ac', '#e879f9', '#67e8f9']
    const SHAPES = ['rect', 'circle', 'ribbon']
    const pieces = Array.from({ length: 180 }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * 160,
      w: 6 + Math.random() * 10,
      h: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      rot: Math.random() * Math.PI * 2,
      dRot: (Math.random() - 0.5) * 0.14,
      vx: (Math.random() - 0.5) * 3,
      vy: 2.5 + Math.random() * 3.5,
      sway: (Math.random() - 0.5) * 0.06,
      alpha: 1,
    }))

    const END = Date.now() + 2000
    let fading = false
    let raf = 0
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
        raf = requestAnimationFrame(draw)
      } else {
        canvas.style.display = 'none'
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [fireKey])

  return <canvas ref={ref} className="confetti-canvas" aria-hidden />
}

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

const tabs: { id: Screen; label: string }[] = [
  { id: 'prospects', label: 'Prospects' },
  { id: 'clients', label: 'Clients' },
  { id: 'reporting', label: 'Reporting' },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('prospects')
  const [converted, setConverted] = useState<Client[]>([])
  const [convertTarget, setConvertTarget] = useState<Prospect | null>(null)
  const [toast, setToast] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)

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
    setConvertTarget(null)
    setScreen('clients')
    setConfettiKey((k) => k + 1)
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
          <button className="menu-btn" type="button" aria-label="Open menu">
            <BurgerMenu />
          </button>
        </div>
      </header>

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

        {screen === 'prospects' && <ProspectsScreen onConvert={setConvertTarget} />}
        {screen === 'clients' && <ClientsScreen clients={clients} />}
        {screen === 'reporting' && <ReportingScreen />}
      </main>

      {convertTarget && (
        <ConvertModal
          prospect={convertTarget}
          onCancel={() => setConvertTarget(null)}
          onConfirm={confirmConvert}
        />
      )}
      <Toast show={toast} message="Converted to Client" />
      <Confetti fireKey={confettiKey} />
    </div>
  )
}
