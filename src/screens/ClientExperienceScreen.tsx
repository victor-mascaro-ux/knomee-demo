import { useState, type ReactNode } from 'react'
import {
  adventureProgress,
  adventures,
  clientInitial,
  mobileTabs,
  type Adventure,
  type AdventureIcon,
  type TabId,
} from '../data/experience'
import './client-experience.css'

/* ── adventure illustrations ──────────────────────────────────────────────
   One flat line drawing per adventure, all on the same 40×40 grid so the
   circles read at a uniform weight whether the row is open or locked. */
/* One thumb glyph on a 16 × 16 grid, reused up (approve) and rotated 180°
   down (reject) — the Financial Joy mark is the two of them overlapping. */
const THUMB = 'M4.4 7.6h2.4v6H4.4zM7.6 7.5l2-3.9c.5-.9 1.9-.6 1.9.5v2.4h1.6c.8 0 1.4.7 1.2 1.5l-.6 2.6c-.1.6-.6 1-1.2 1H7.6z'
const Thumb = ({ x, y, s, down }: { x: number; y: number; s: number; down?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${s})${down ? ' rotate(180 8 8)' : ''}`}>
    <path d={THUMB} fill="#fff" />
  </g>
)

const art: Record<AdventureIcon, ReactNode> = {
  joy: (
    <g>
      <circle cx="14.5" cy="16.5" r="11" fill="#8ed14f" />
      <Thumb x={4.6} y={7.7} s={1.05} />
      <circle cx="26" cy="24" r="10" fill="#f4696e" stroke="#fff" strokeWidth="2" />
      <Thumb x={19.7} y={16.8} s={0.95} down />
    </g>
  ),
  confidence: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="20" cy="20" r="6.2" />
      <path d="M20 6.5v4M20 29.5v4M6.5 20h4M29.5 20h4M10.4 10.4l2.8 2.8M26.8 26.8l2.8 2.8M29.6 10.4l-2.8 2.8M13.2 26.8l-2.8 2.8" />
    </g>
  ),
  outlook: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 25.5a5 5 0 0 1 .5-10 7 7 0 0 1 13.2-1.2 5.6 5.6 0 0 1 1.3 11.2z" />
      <path d="M17.4 29.6c0-1.6 2.6-1.9 2.6-3.5a1.5 1.5 0 0 0-2.8-.6M19.6 33.4v.1" strokeWidth="1.9" />
    </g>
  ),
  future: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 17.8 26 9.4a2 2 0 0 1 2.7 1l1.4 3a2 2 0 0 1-1 2.6l-17.4 8.4a2 2 0 0 1-2.7-1l-1.4-3a2 2 0 0 1 1-2.6Z" />
      <path d="M17 13.6l2.3 5M14.8 25.8 12 33m9-5.6 3 5.6M12 33h13" />
    </g>
  ),
  goals: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 30.5 15 13l6 9.5 3.5-5 10 13z" />
      <path d="M21 22.5V6.5l7 2.4-7 2.6" />
    </g>
  ),
  events: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6.5" y="9.5" width="27" height="24" rx="3" />
      <path d="M6.5 16.5h27M13 6v6M27 6v6" />
      <path d="M13 22h3M18.5 22h3M24 22h3M13 27.5h3M18.5 27.5h3" />
    </g>
  ),
  people: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="14" r="5" />
      <path d="M5.5 31c0-4.7 4.3-8.2 9.5-8.2s9.5 3.5 9.5 8.2" />
      <circle cx="28.5" cy="16.5" r="4" />
      <path d="M27 22.9c4.2.4 7.5 3.5 7.5 7.6" />
    </g>
  ),
  short: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="19" cy="21" r="12" />
      <circle cx="19" cy="21" r="6.6" />
      <circle cx="19" cy="21" r="1.6" fill="currentColor" stroke="none" />
      <path d="M23.5 16.5 32 8m-4.6-.6L32 8l.6 4.6" />
    </g>
  ),
  values: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7.5v25M12 32.5h16M8 13.5h24" />
      <path d="M8 13.5 4 23a4.6 4.6 0 0 0 8 0zM32 13.5 28 23a4.6 4.6 0 0 0 8 0z" />
      <circle cx="20" cy="9.5" r="2.2" />
    </g>
  ),
  history: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32.5 20a12.5 12.5 0 1 1-4.2-9.3" />
      <path d="M33 5.5v6h-6" />
      <path d="M23 15.6a3.3 3.3 0 0 0-3-1.6c-1.9 0-3.2 1-3.2 2.5s1.4 2.2 3.2 2.6c1.9.4 3.4 1 3.4 2.7s-1.4 2.7-3.4 2.7a3.6 3.6 0 0 1-3.3-1.8M20 11.6v2.4m0 10.5v2.4" />
    </g>
  ),
  risk: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 27a14.5 14.5 0 0 1 29 0z" />
      <path d="M20 27 27.5 16" />
      <circle cx="20" cy="27" r="2.2" fill="currentColor" stroke="none" />
      <path d="M5.5 27h29" />
    </g>
  ),
}

/* ── mobile chrome icons ── */
const ClockIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.2" />
    <path d="M8 4.6V8l2.6 1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ArrowRight = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M3 8h9.2M8.6 4.4 12.2 8l-3.6 3.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ProgressTick = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
    <circle cx="10" cy="10" r="8.6" stroke="#240446" strokeWidth="1.5" />
    <path
      d="M6 10.3 8.9 13l5-5.6"
      stroke="#086375"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
// Broken ring + tick, the way the mobile design draws the Adventures tab.
const TabAdventures = () => (
  <svg viewBox="0 0 28 28" width="27" height="27" fill="none" aria-hidden>
    <circle
      cx="14"
      cy="14"
      r="11"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeDasharray="15 6.5"
      strokeDashoffset="4"
    />
    <path
      d="M8.6 14.4 12.6 18.3 20 9.9"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const TabFinId = () => (
  <svg viewBox="0 0 32 26" width="34" height="27" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="1.6" y="2.4" width="28.8" height="21.2" rx="2.6" />
    <circle cx="11" cy="10.6" r="3.2" />
    <path d="M6.2 18.6c.8-2.3 2.7-3.5 4.8-3.5s4 1.2 4.8 3.5" strokeLinecap="round" />
    <path d="M20 9.4h5.6M20 14h4.2M20 18.4h5.6" strokeLinecap="round" />
  </svg>
)
// The centre tab: the knomee labyrinth with the heart at its middle. Always the
// brand grey — it is the mark, not a state indicator.
const TabKnomee = ({ size = 50 }: { size?: number }) => (
  <svg viewBox="0 0 44 44" width={size} height={size} fill="none" aria-hidden>
    <g stroke="currentColor" strokeLinecap="round">
      <circle cx="22" cy="22" r="19.4" strokeWidth="3.3" strokeDasharray="93 29" strokeDashoffset="24" />
      <circle cx="22" cy="22" r="13.2" strokeWidth="3.3" strokeDasharray="59 24" strokeDashoffset="-14" />
      <path
        d="M22 28.4c-4.9-3.3-7.2-5.5-7.2-8.2a3.7 3.7 0 0 1 6.9-1.9 3.7 3.7 0 0 1 6.9 1.9c0 2.7-2.3 4.9-7.2 8.2Z"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </g>
  </svg>
)
/* The bar's own top edge, arcing up around the centre mark. Drawn at the
   screen's exact 390px width so the arc is never distorted: a filled body plus
   an open stroke along the top, so only that edge carries the hairline. */
// Chord 70, rise 16 — a shallow swell the mark sits into, not a dome around it.
const TAB_EDGE = 'M0 16H160a46.3 46.3 0 0 1 70 0h160'
const TabBarEdge = () => (
  <svg className="cx-tab-edge" viewBox="0 0 390 94" width="390" height="94" aria-hidden>
    <path d={`${TAB_EDGE}V94H0Z`} fill="#fff" />
    <path d={TAB_EDGE} fill="none" stroke="#e6e5ea" strokeWidth="1.2" />
  </svg>
)

/* ── iPhone frame ──────────────────────────────────────────────────────────
   390 × 844 logical screen (iPhone 14) inside a titanium bezel, with the
   Dynamic Island and side buttons so it reads as a device, not a div. */
function IPhone({ children }: { children: ReactNode }) {
  return (
    <div className="cx-device">
      <span className="cx-key cx-key-silent" />
      <span className="cx-key cx-key-volup" />
      <span className="cx-key cx-key-voldn" />
      <span className="cx-key cx-key-power" />
      <div className="cx-bezel">
        <div className="cx-screen">
          <div className="cx-island" />
          <div className="cx-statusbar">
            <span className="cx-time">9:41</span>
            <span className="cx-status-right">
              <svg viewBox="0 0 18 12" width="17" height="11" aria-hidden>
                <rect x="0" y="7.5" width="3" height="4.5" rx="1" fill="#1a1a1a" />
                <rect x="4.6" y="5" width="3" height="7" rx="1" fill="#1a1a1a" />
                <rect x="9.2" y="2.5" width="3" height="9.5" rx="1" fill="#1a1a1a" />
                <rect x="13.8" y="0" width="3" height="12" rx="1" fill="#1a1a1a" opacity="0.3" />
              </svg>
              <svg viewBox="0 0 16 12" width="16" height="12" aria-hidden>
                <path
                  d="M8 10.6l1.9-2.2a2.9 2.9 0 0 0-3.8 0zM8 6.5a5.4 5.4 0 0 1 3.6 1.4l1.3-1.5a7.6 7.6 0 0 0-9.8 0l1.3 1.5A5.4 5.4 0 0 1 8 6.5zM8 2.4a9.6 9.6 0 0 1 6.3 2.4l1.3-1.5a11.8 11.8 0 0 0-15.2 0l1.3 1.5A9.6 9.6 0 0 1 8 2.4z"
                  fill="#1a1a1a"
                />
              </svg>
              <svg viewBox="0 0 27 13" width="25" height="12" aria-hidden>
                <rect
                  x="0.7"
                  y="0.7"
                  width="22"
                  height="11.6"
                  rx="3.2"
                  fill="none"
                  stroke="#1a1a1a"
                  strokeOpacity="0.4"
                  strokeWidth="1.1"
                />
                <rect x="2.4" y="2.4" width="18.6" height="8.2" rx="2.1" fill="#1a1a1a" />
                <path d="M24.2 4.4v4.2a2.2 2.2 0 0 0 0-4.2z" fill="#1a1a1a" fillOpacity="0.45" />
              </svg>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ── the Adventures home screen ── */
function AdventureRow({ a }: { a: Adventure }) {
  if (a.state === 'open') {
    return (
      <div className="cx-adv cx-adv-open">
        <span className="cx-adv-art is-joy">
          <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden>
            {art[a.icon]}
          </svg>
        </span>
        <div className="cx-adv-main">
          <div className="cx-adv-title">{a.title}</div>
          {a.blurb && <div className="cx-adv-blurb">{a.blurb}</div>}
        </div>
        <div className="cx-adv-right">
          {a.minutes !== undefined && (
            <span className="cx-adv-min">
              <ClockIcon />
              {a.minutes} min
            </span>
          )}
          <button className="cx-start" type="button">
            Start
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="cx-adv cx-adv-locked">
      <span className="cx-adv-art">
        <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden>
          {art[a.icon]}
        </svg>
      </span>
      <div className="cx-adv-title">{a.title}</div>
    </div>
  )
}

function AdventuresScreen() {
  const { done, required } = adventureProgress
  const pct = Math.round((done / required) * 100)
  return (
    <>
      <div className="cx-progress">
        <div className="cx-progress-top">
          <span>Progress</span>
          <span>
            {done}/{required} Adventures Completed
          </span>
        </div>
        <div className="cx-progress-row">
          <ProgressTick />
          <div className="cx-progress-track">
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="cx-progress-pct">{pct}%</span>
        </div>
      </div>

      <h2 className="cx-screen-title">My Adventures</h2>

      <div className="cx-adv-list">
        {adventures.map((a) => (
          <AdventureRow a={a} key={a.title} />
        ))}
      </div>
    </>
  )
}

/* ── the two tabs that are not built yet ── */
const stubs: Record<Exclude<TabId, 'adventures'>, { title: string; body: string }> = {
  knomee: {
    title: 'Knomee',
    body: 'The home surface — what the client sees between adventures. Not designed yet.',
  },
  finid: {
    title: 'Financial ID',
    body: 'The profile the client keeps once the five adventures are done, and the artefact the advisor opens on the desktop side. Not designed yet.',
  },
}

function StubScreen({ tab }: { tab: Exclude<TabId, 'adventures'> }) {
  const s = stubs[tab]
  return (
    <div className="cx-stub">
      <div className="cx-stub-badge">Not built yet</div>
      <h3>{s.title}</h3>
      <p>{s.body}</p>
    </div>
  )
}

/* The in-phone menu. The only way back to the advisor side now lives here, so
   the demo is driven entirely from inside the device. */
function MobileMenu({ onExit, onClose }: { onExit: () => void; onClose: () => void }) {
  return (
    <div className="cx-sheet" onClick={onClose}>
      <div className="cx-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cx-sheet-account">
          <span className="cx-sheet-avatar">{clientInitial}</span>
          <span>
            <b>Client</b>
            <i>Adventures in progress</i>
          </span>
        </div>
        <button className="cx-sheet-item" type="button" onClick={onExit}>
          Advisor Experience
          <ArrowRight />
        </button>
        <div className="cx-sheet-hint">Switches back to the adviser demo.</div>
      </div>
    </div>
  )
}

export default function ClientExperienceScreen({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<TabId>('adventures')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="cx-stage">
      <IPhone>
        <header className="cx-appbar">
          <div className="cx-appbar-brand">
            <img src="./knomee-logo-white.svg" alt="knomee" />
          </div>
          <button
            className="cx-appbar-burger"
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.9">
              <path d="M3 6h16M3 11h16M3 16h16" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="cx-viewport">
          {tab === 'adventures' ? <AdventuresScreen /> : <StubScreen tab={tab} />}
        </div>

        <nav className="cx-tabbar">
          <TabBarEdge />
          {mobileTabs.map((t) =>
            t.center ? (
              <button
                key={t.id}
                type="button"
                className={`cx-tab cx-tab-center ${tab === t.id ? 'is-on' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <TabKnomee />
                <span className="cx-tab-lbl">{t.label}</span>
              </button>
            ) : (
              <button
                key={t.id}
                type="button"
                className={`cx-tab ${tab === t.id ? 'is-on' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.id === 'adventures' ? <TabAdventures /> : <TabFinId />}
                <span className="cx-tab-lbl">{t.label}</span>
              </button>
            ),
          )}
        </nav>

        <div className="cx-home-bar" />

        {menuOpen && <MobileMenu onExit={onExit} onClose={() => setMenuOpen(false)} />}
      </IPhone>
    </div>
  )
}
