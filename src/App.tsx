import { useState, type ReactNode } from 'react'
import { prospects, tierGroups, type Prospect, type Tier } from './data/prospects'
import { insights } from './data/insights'
import {
  KnomeeMark,
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
} from './components/icons'

const initial = (name: string) => name.trim().charAt(0).toUpperCase()

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

function ProspectRow({ p }: { p: Prospect }) {
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
            <span className="name-line">
              {p.name} <ChevronRight />
            </span>
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
        <button className={`bolt-btn ${incomplete ? 'bolt-disabled' : ''}`} type="button">
          <LightningIcon color={incomplete ? '#c9c9c9' : '#ffffff'} />
        </button>
      </td>
      <td className="col-dots">
        <button className="dots-btn" type="button">
          <DotsIcon />
        </button>
      </td>
    </tr>
  )
}

function ProspectsTable() {
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
                  <ProspectRow p={p} key={p.name} />
                ))}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function App() {
  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <KnomeeMark />
          <span className="brand-name">knomee</span>
          <span className="brand-sub">ADVISOR</span>
        </div>
        <button className="menu-btn" type="button" aria-label="Open menu">
          <BurgerMenu />
        </button>
      </header>

      <main className="content">
        <nav className="tabs">
          <button className="tab tab-active" type="button">Prospects</button>
          <button className="tab" type="button">Clients</button>
          <button className="tab" type="button">Reporting</button>
        </nav>

        <h1 className="page-title">My Prospects</h1>

        <TopLineMetrics />
        <ActionableInsights />

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

        <ProspectsTable />
      </main>
    </div>
  )
}
