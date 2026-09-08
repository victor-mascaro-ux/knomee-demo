import { useEffect, useState, type ReactNode } from 'react'
import {
  adventureProgress,
  adventures,
  clientInitial,
  mobileTabs,
  type Adventure,
  type AdventureIcon,
  type TabId,
} from '../data/experience'
import icFinancialJoy from '../assets/adventures/financial-joy.svg'
import icConfidence from '../assets/adventures/confidence.svg'
import icOutlook from '../assets/adventures/outlook.svg'
import icFutureYou from '../assets/adventures/future-you.svg'
import icGoals from '../assets/adventures/goals.svg'
import icLifeEvents from '../assets/adventures/life-events.svg'
import knomeeMark from '../assets/knomee-mark.svg'
import './client-experience.css'

/* The adventures that already have a real illustration in the design system use
   it; the rest fall back to the line drawings below until assets exist. */
const artwork: Partial<Record<AdventureIcon, string>> = {
  joy: icFinancialJoy,
  confidence: icConfidence,
  outlook: icOutlook,
  future: icFutureYou,
  goals: icGoals,
  events: icLifeEvents,
}

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
// The centre tab is the knomee mark itself — the real logo art, lifted from the
// wordmark lockup. It carries no label: the mark is the label.
const TabKnomee = () => <img className="cx-tab-mark" src={knomeeMark} alt="knomee" />
/* The bar's own top edge, arcing up around the centre mark. Drawn at the
   screen's exact 390px width so the arc is never distorted: a filled body plus
   an open stroke along the top, so only that edge carries the hairline. */
// Chord 82, rise 18 — a shallow swell the mark sits into, not a dome around it.
const TAB_EDGE = 'M0 18H154a55.7 55.7 0 0 1 82 0h154'
const TabBarEdge = () => (
  <svg className="cx-tab-edge" viewBox="0 0 390 96" width="390" height="96" aria-hidden>
    <path d={`${TAB_EDGE}V96H0Z`} fill="#fff" />
    <path d={TAB_EDGE} fill="none" stroke="#e6e5ea" strokeWidth="1.2" />
  </svg>
)

/* ── iPhone frame ──────────────────────────────────────────────────────────
   390 × 844 logical screen (iPhone 14) inside a titanium bezel, with the
   Dynamic Island and side buttons so it reads as a device, not a div. */
function IPhone({ children, scale = 1 }: { children: ReactNode; scale?: number }) {
  return (
    <div
      className="cx-device"
      style={scale === 1 ? undefined : { transform: `scale(${scale})` }}
    >
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
function AdventureArt({ a }: { a: Adventure }) {
  const src = artwork[a.icon]
  return (
    <span className={`cx-adv-art ${src ? 'has-img' : ''} ${a.state === 'open' ? 'is-open' : ''}`}>
      {src ? (
        <img src={src} alt="" />
      ) : (
        <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden>
          {art[a.icon]}
        </svg>
      )}
    </span>
  )
}

function AdventureRow({ a }: { a: Adventure }) {
  if (a.state === 'open') {
    return (
      <div className="cx-adv cx-adv-open">
        <AdventureArt a={a} />
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
      <AdventureArt a={a} />
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

/* ── keep the whole device on screen ──────────────────────────────────────
   The frame is a fixed 878 × 414 (a 390 × 844 screen inside its bezel), which
   is taller than most laptop windows. Rather than reflow the mobile layout at
   breakpoints — a scaled-down phone is still a phone, a reflowed one is not —
   scale the frame down until it fits, and never scale it up past 1.

   On the live site this runs inside the overlay's iframe, which is sized to the
   full document height (the parent scrolls, not the frame). So `innerHeight`
   here is the content's own height and tells us nothing; the parent's viewport
   is the window that has to hold the phone. Same origin, but guarded anyway. */
const DEVICE_H = 878
const DEVICE_W = 424
const FIT_PAD = 40 // breathing room around the device
// The view controls sit under the phone rather than over it, so the height they
// occupy comes off the space the phone is allowed to fill.
const CONTROLS_H = 46

function parentWindow(): Window | null {
  try {
    return window.parent && window.parent !== window ? window.parent : null
  } catch {
    return null // cross-origin embed — fall back to our own viewport
  }
}

/* ── zoom on top of the fit ───────────────────────────────────────────────
   Ctrl/⌘ + wheel and Ctrl/⌘ + = / - / 0, the shortcuts people already use to
   zoom a page — captured so they scale the phone instead of the whole demo.
   Zoom multiplies the fit scale, so 100% always means "as large as fits". */
const MIN_ZOOM = 0.4
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

function useZoom() {
  const [zoom, setZoom] = useState(1)
  // Back to the fit, and back to the top with it: zooming in scrolls the page
  // (the parent's page, on the live site), and zooming out should return the
  // whole view — controls included — not leave you parked below the device.
  const reset = () => {
    setZoom(1)
    try {
      window.scrollTo({ top: 0 })
    } catch {
      /* ignore */
    }
    try {
      parentWindow()?.scrollTo({ top: 0 })
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault() // otherwise the browser zooms the whole page
      setZoom((z) => clampZoom(z * (1 - e.deltaY * 0.0015)))
    }
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        setZoom((z) => clampZoom(z + ZOOM_STEP))
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        setZoom((z) => clampZoom(z - ZOOM_STEP))
      } else if (e.key === '0') {
        e.preventDefault()
        reset()
      }
    }
    // Non-passive, or preventDefault on the wheel is ignored. Bound on the
    // parent too: on the live site this page is an iframe and the pointer may
    // well be over the parent's margin when the wheel turns.
    const targets = [window, parentWindow()].filter(Boolean) as Window[]
    for (const w of targets) {
      try {
        w.addEventListener('wheel', onWheel, { passive: false })
        w.addEventListener('keydown', onKey)
      } catch {
        /* cross-origin — skip */
      }
    }
    return () => {
      for (const w of targets) {
        try {
          w.removeEventListener('wheel', onWheel)
          w.removeEventListener('keydown', onKey)
        } catch {
          /* ignore */
        }
      }
    }
  }, [])
  return { zoom, setZoom, reset }
}

function useFitToWindow() {
  const [fit, setFit] = useState({ scale: 1, windowH: 0 })
  useEffect(() => {
    const measure = () => {
      const p = parentWindow()
      let h = window.innerHeight
      let w = window.innerWidth
      try {
        if (p) {
          h = p.innerHeight
          w = p.innerWidth
        }
      } catch {
        /* cross-origin — keep our own */
      }
      setFit({
        scale: Math.min(1, (h - FIT_PAD - CONTROLS_H) / DEVICE_H, (w - FIT_PAD) / DEVICE_W),
        windowH: h,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    const p = parentWindow()
    try {
      p?.addEventListener('resize', measure)
    } catch {
      /* ignore */
    }
    return () => {
      window.removeEventListener('resize', measure)
      try {
        p?.removeEventListener('resize', measure)
      } catch {
        /* ignore */
      }
    }
  }, [])
  return fit
}

export default function ClientExperienceScreen({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<TabId>('adventures')
  const [menuOpen, setMenuOpen] = useState(false)
  const { scale: fitScale, windowH } = useFitToWindow()
  const { zoom, setZoom, reset: resetZoom } = useZoom()
  const scale = fitScale * zoom

  return (
    // The page is exactly as tall as the window it has to fit in. `100vh` would
    // be wrong here: inside the review iframe, which is sized to the document,
    // it grows every time the content does and never comes back down — leaving
    // the controls stranded below the fold after a zoom out.
    <div className="cx-page" style={windowH ? { minHeight: windowH } : undefined}>
      {/* The scaled frame keeps its unscaled footprint, so the wrapper carries
          the scaled height and the page never grows a phantom scrollbar. */}
      <div className="cx-fit" style={{ height: DEVICE_H * scale, width: DEVICE_W * scale }}>
        <IPhone scale={scale}>
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
                aria-label={t.label}
                onClick={() => setTab(t.id)}
              >
                <TabKnomee />
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

      {/* View controls, kept out of the phone and deliberately quiet: fit is
          always there to get back to the default, and the zoom stepper only
          shows once you have zoomed away from it. */}
      <div className="cx-view" role="group" aria-label="View">
        {zoom !== 1 && (
          <span className="cx-zoom">
            <button
              type="button"
              onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
              aria-label="Zoom out"
            >
              &minus;
            </button>
            <span className="cx-zoom-pct">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
              aria-label="Zoom in"
            >
              +
            </button>
          </span>
        )}
        <button
          type="button"
          className="cx-fit-btn"
          onClick={resetZoom}
          title="Ctrl/Cmd + wheel or + / − to zoom · Ctrl/Cmd + 0 to reset"
        >
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              d="M2 6V2.6h3.4M14 6V2.6h-3.4M2 10v3.4h3.4M14 10v3.4h-3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Fit to screen
        </button>
      </div>
    </div>
  )
}
