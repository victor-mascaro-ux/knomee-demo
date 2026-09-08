import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  MOOD_ANGLES,
  MOOD_ARC,
  adventureActions,
  adventureProgress,
  clientInitial,
  completedAdventures,
  lockedAdventures,
  mobileTabs,
  moodQuestion,
  moods,
  quickActions,
  quickNext,
  voice as voiceScript,
  type AdventureAction,
  type ArtKey,
  type MoodId,
  type TabId,
} from '../data/experience'
import icFinancialJoy from '../assets/adventures/financial-joy.svg'
import icConfidence from '../assets/adventures/confidence.svg'
import icOutlook from '../assets/adventures/outlook.svg'
import icFutureYou from '../assets/adventures/future-you.svg'
import icGoals from '../assets/adventures/goals.svg'
import icLifeEvents from '../assets/adventures/life-events.svg'
import icQuestions from '../assets/adventures/questions.svg'
import imgVision from '../assets/adventures/vision.png'
import imgDivorce from '../assets/adventures/divorce.png'
import moodWorried from '../assets/moods/worried.svg'
import moodUnsure from '../assets/moods/unsure.svg'
import moodNeutral from '../assets/moods/neutral.svg'
import moodGood from '../assets/moods/good.svg'
import moodGreat from '../assets/moods/great.svg'
import knomeeMark from '../assets/knomee-mark.svg'
import './client-experience.css'
import './client-experience-quick-access.css'

const art: Record<ArtKey, string> = {
  'financial-joy': icFinancialJoy,
  confidence: icConfidence,
  outlook: icOutlook,
  'future-you': icFutureYou,
  goals: icGoals,
  'life-events': icLifeEvents,
  questions: icQuestions,
  vision: imgVision,
  divorce: imgDivorce,
}

const moodArt: Record<MoodId, string> = {
  worried: moodWorried,
  unsure: moodUnsure,
  neutral: moodNeutral,
  good: moodGood,
  great: moodGreat,
}

/* ── icons, matching the design system's Icon set ── */
const ClockIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.2" />
    <path d="M8 4.6V8l2.6 1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CheckIcon = ({ size = 13 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <polyline
      points="20 6 9 17 4 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const DotsIcon = () => (
  <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden>
    <g fill="currentColor">
      <circle cx="4" cy="9" r="1.4" />
      <circle cx="9" cy="9" r="1.4" />
      <circle cx="14" cy="9" r="1.4" />
    </g>
  </svg>
)
const ArrowRight = ({ size = 15 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M3 8h9.2M8.6 4.4 12.2 8l-3.6 3.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
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

/* The knomee mark's own five paths, in fill order: centre heart, upper ring,
   lower ring, upper outer ring, lower outer ring. From knomee-mark.svg — as
   paths rather than an <img> so the long-press fill and the voice rings can
   animate each stroke and recolour them. */
const MARK_PARTS = [
  'M165.378 198.685C164.99 198.685 164.537 198.685 164.149 198.62C110.711 192.518 93.0496 170.8 87.2917 158.466C78.8167 140.224 83.2159 121.394 98.5487 110.372C112.523 100.333 130.766 101.12 141.895 112.274C146.229 116.605 146.294 123.757 142.024 128.152C137.753 132.548 130.703 132.614 126.367 128.283C122.356 124.281 115.757 125.462 111.358 128.677C108.318 130.843 101.913 137.206 107.347 148.886C110.258 155.119 121.063 169.62 159.815 175.393C180.064 141.34 175.859 123.691 173.012 117.458C170.619 112.34 167.319 109.125 163.179 107.813C159.298 106.632 154.704 107.222 150.951 109.453C145.711 112.602 138.918 110.831 135.813 105.516C132.707 100.202 134.455 93.3125 139.695 90.1632C148.817 84.6517 159.815 83.2739 169.648 86.3577C176.764 88.5885 186.598 94.0998 193.003 107.878C198.761 120.279 204.066 147.836 174.695 193.567C172.624 196.783 169.13 198.685 165.443 198.685H165.378Z',
  'M58.8323 136.393C57.9266 136.393 57.0208 136.262 56.1152 136.066C49.5809 134.556 45.5052 127.93 47.0578 121.303C53.0745 94.861 68.86 72.4218 91.5679 58.0527C114.211 43.6838 141.059 39.1566 167.132 45.2584C202.843 53.6568 231.179 81.0825 241.013 116.972C242.824 123.534 239.072 130.291 232.602 132.128C226.134 133.966 219.47 130.094 217.658 123.599C210.218 96.4357 188.74 75.6367 161.632 69.2724C141.901 64.614 121.586 68.0914 104.378 78.983C87.2334 89.8746 75.2648 106.868 70.6715 126.88C69.3775 132.588 64.3961 136.393 58.8323 136.393Z',
  'M144.457 245.68C137.018 245.68 129.448 244.828 121.944 243.055C82.3504 233.804 52.4614 201.523 45.7331 160.909C44.6333 154.217 49.0973 147.853 55.6961 146.737C62.295 145.622 68.5704 150.149 69.6702 156.841C74.7811 187.614 97.4243 212.021 127.378 219.042C168.136 228.556 208.893 202.704 218.339 161.435C219.826 154.807 226.361 150.674 232.895 152.249C239.429 153.758 243.505 160.385 241.953 167.011C231.278 213.858 190.003 245.68 144.457 245.68Z',
  'M182.923 284.948C177.554 284.948 172.572 281.405 170.89 275.893C168.884 269.136 172.636 261.984 179.235 259.95C221.093 246.959 252.6 211.922 261.398 168.487C267.803 136.796 261.656 104.515 244.124 77.5489C226.592 50.5825 199.744 32.1456 168.496 25.5844C161.703 24.1409 157.304 17.383 158.727 10.4937C160.151 3.60443 166.75 -0.85719 173.607 0.586272C211.389 8.45969 243.93 30.8333 265.15 63.508C286.37 96.1828 293.81 135.288 286.046 173.67C275.372 226.291 237.266 268.742 186.611 284.423C185.382 284.816 184.152 285.014 182.923 285.014V284.948Z',
  'M117.96 288C117.119 288 116.278 287.934 115.437 287.737C77.6551 279.864 45.1137 257.556 23.8938 224.815C2.67386 192.142 -4.76604 153.036 2.99733 114.653C14.7718 56.39 59.6054 11.446 117.184 0.226364C124.041 -1.08587 130.64 3.4413 131.935 10.3305C133.228 17.2854 128.764 23.9778 121.971 25.2901C74.4204 34.6069 37.415 71.6777 27.6461 119.837C21.2413 151.528 27.3872 183.809 44.9196 210.775C62.4518 237.742 89.3002 256.178 120.547 262.739C127.341 264.182 131.741 270.941 130.317 277.83C129.088 283.866 123.847 288 118.025 288H117.96Z',
]

/* The tab bar's own top edge, arcing up around the centre mark. Drawn at the
   screen's exact 390px width so the arc is never distorted — chord 82, rise 18,
   a shallow swell the mark sits into rather than a dome around it. */
const TAB_EDGE = 'M0 18H154a55.7 55.7 0 0 1 82 0h154'

/* ── keep the whole device on screen ──────────────────────────────────────
   The frame is a fixed 878 × 424, taller than most laptop windows. Rather than
   reflow the mobile layout at breakpoints — a scaled-down phone is still a
   phone, a reflowed one is not — scale the frame until it fits, never above 1.

   On the live site this runs inside the overlay's iframe, which is sized to the
   full document height (the parent scrolls, not the frame). So `innerHeight`
   here is the content's own height and tells us nothing; the parent's viewport
   is the window that has to hold the phone. Same origin, but guarded anyway. */
const DEVICE_H = 878
const DEVICE_W = 424
const FIT_PAD = 40
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

/* ── iPhone frame ──────────────────────────────────────────────────────────
   390 × 844 logical screen (iPhone 14) inside a titanium bezel, with the
   Dynamic Island and side buttons so it reads as a device, not a div. */
function IPhone({ children, scale = 1 }: { children: ReactNode; scale?: number }) {
  return (
    <div className="cx-device" style={scale === 1 ? undefined : { transform: `scale(${scale})` }}>
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
function ProgressMeter({ done, required }: { done: number; required: number }) {
  const pct = Math.round((done / required) * 100)
  return (
    <div className="cx-progress">
      <div className="cx-progress-top">
        <span>Progress</span>
        <span>
          {done}/{required} Adventures Completed
        </span>
      </div>
      <div className="cx-progress-row">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden>
          <circle cx="10" cy="10" r="8.6" stroke="#240446" strokeWidth="1.5" />
          <path
            d="M6 10.3 8.9 13l5-5.6"
            stroke="#086375"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="cx-progress-track">
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="cx-progress-pct">{pct}%</span>
      </div>
    </div>
  )
}

function CompletedRow({ title, artKey, on }: { title: string; artKey: ArtKey; on: string }) {
  return (
    <div className="cx-adv cx-adv-done">
      <span className="cx-adv-art has-img is-open">
        <img src={art[artKey]} alt="" />
      </span>
      <div className="cx-adv-main">
        <div className="cx-adv-title">{title}</div>
        <div className="cx-adv-meta">
          <CheckIcon />
          Completed {on}
        </div>
      </div>
      <button className="cx-adv-more" type="button" aria-label={`More options for ${title}`}>
        <DotsIcon />
      </button>
    </div>
  )
}

function ActionRow({ a, onAct }: { a: AdventureAction; onAct?: () => void }) {
  return (
    <div className={`cx-adv ${a.outline ? 'cx-adv-done' : 'cx-adv-open'}`}>
      <span className="cx-adv-art has-img is-open">
        <img src={art[a.art]} alt="" />
      </span>
      <div className="cx-adv-main">
        <div className="cx-adv-title">{a.title}</div>
        <div className="cx-adv-blurb">{a.blurb}</div>
      </div>
      <div className="cx-adv-right">
        <span className="cx-adv-min">
          <ClockIcon />
          {a.minutes} min
        </span>
        <button
          className={`cx-start${a.outline ? ' cx-start-outline' : ''}`}
          type="button"
          onClick={onAct}
        >
          {a.label}
        </button>
      </div>
    </div>
  )
}

function LockedRow({ title }: { title: string }) {
  return (
    <div className="cx-adv cx-adv-locked">
      <span className="cx-adv-art" />
      <div className="cx-adv-title">{title}</div>
    </div>
  )
}

function AdventuresScreen() {
  return (
    <>
      <ProgressMeter done={adventureProgress.done} required={adventureProgress.required} />
      <h2 className="cx-screen-title">My Adventures</h2>
      <div className="cx-adv-list">
        {completedAdventures.map((a) => (
          <CompletedRow key={a.title} title={a.title} artKey={a.art} on={a.on} />
        ))}
        {adventureActions.map((a) => (
          <ActionRow key={a.title} a={a} />
        ))}
        {lockedAdventures.map((t) => (
          <LockedRow key={t} title={t} />
        ))}
      </div>
    </>
  )
}

/* ── quick access: one tap on the knomee mark ──────────────────────────────
   The next adventure, four things worth doing, and the mood arc — a flat plum
   disc that runs off the bottom of the screen, faces along its rim. */
function KnomeeSheet() {
  const [mood, setMood] = useState<MoodId | null>(null)
  const { r, faceR, face } = MOOD_ARC
  return (
    <div className="kx-sheet" role="dialog" aria-modal="true" aria-label="Quick access">
      <div className="kx-next">
        <ActionRow a={quickNext} />
      </div>
      <div className="kx-actions">
        {quickActions.map((q, i) => (
          <button
            key={q.label}
            className="kx-action"
            type="button"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span>
              <img className={q.raster ? 'is-raster' : undefined} src={art[q.art]} alt="" />
            </span>
            {q.label}
          </button>
        ))}
      </div>
      <div className="kx-arc">
        {moods.map((m, i) => {
          const a = (MOOD_ANGLES[i] * Math.PI) / 180
          return (
            <button
              key={m.id}
              type="button"
              aria-label={m.word}
              aria-pressed={mood === m.id}
              className={`kx-mood${mood === m.id ? ' is-on' : ''}`}
              style={{
                left: r + faceR * Math.sin(a) - face / 2,
                top: r - faceR * Math.cos(a) - face / 2,
                animationDelay: `${0.1 + i * 0.06}s`,
              }}
              onClick={() => setMood(m.id)}
            >
              <img src={moodArt[m.id]} alt="" />
            </button>
          )
        })}
        <div className="kx-ask">{moodQuestion}</div>
      </div>
    </div>
  )
}

/* ── voice capture: long-press the knomee mark ─────────────────────────────
   Listening → what it heard, offered for editing → the thing it created. The
   transcript is scripted; the point is the shape of the interaction. */
type VoicePhase = 'listen' | 'ready' | 'done'

function VoiceSheet({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<VoicePhase>('listen')
  const [heard, setHeard] = useState(0)
  const said = voiceScript.said

  useEffect(() => {
    if (phase !== 'listen') return
    if (heard >= said.length) {
      const t = window.setTimeout(() => setPhase('ready'), voiceScript.settleMs)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(
      () => setHeard((n) => n + 1),
      heard === 0 ? voiceScript.firstWordMs : voiceScript.wordMs,
    )
    return () => window.clearTimeout(t)
  }, [phase, heard, said.length])

  const live = phase === 'listen'
  const listenAgain = () => {
    setHeard(0)
    setPhase('listen')
  }

  return (
    <div
      className={`vx-sheet ${live ? 'is-live' : 'is-settled'}${phase === 'done' ? ' is-done' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Tell Knomee"
    >
      <div className="vx-rings" aria-hidden>
        <svg viewBox="0 0 288 288">
          <defs>
            <radialGradient id="vxRamp" gradientUnits="userSpaceOnUse" cx="144" cy="144" r="150">
              <stop offset="0" style={{ stopColor: 'var(--k-aqua)' }} />
              <stop offset="0.5" style={{ stopColor: 'var(--k-teal)' }} />
              <stop offset="1" style={{ stopColor: 'var(--k-ocean)' }} />
            </radialGradient>
          </defs>
          {MARK_PARTS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="url(#vxRamp)"
              style={{ animationDelay: `${i * 0.055}s, ${0.5 + i * 0.06}s` }}
            />
          ))}
        </svg>
      </div>

      {phase === 'listen' && (
        <>
          <div className="vx-cap">Listening</div>
          {heard === 0 ? (
            <>
              <div className="vx-wave" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <i key={i} style={{ animationDelay: `${i * 0.11}s` }} />
                ))}
              </div>
              <div className="vx-hint">{voiceScript.hint}</div>
            </>
          ) : (
            <div className="vx-say">
              {said.slice(0, heard).map((w, i) => (
                <span key={i} className="vx-say-word">
                  {i ? ' ' : ''}
                  {w}
                </span>
              ))}
              <span className="vx-caret" aria-hidden />
            </div>
          )}
        </>
      )}

      {phase === 'ready' && (
        <>
          <div className="vx-cap">Heard you</div>
          <div className="vx-say is-editable">
            <div
              className="vx-say-field"
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="Edit what Knomee heard"
            >
              {said.join(' ')}
            </div>
            <button
              className="vx-send"
              type="button"
              aria-label="Send"
              onClick={() => setPhase('done')}
            >
              <ArrowRight size={17} />
            </button>
          </div>
          <div className="vx-acts">
            <button className="vx-second" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="vx-primary" type="button" onClick={listenAgain}>
              Listen again
            </button>
          </div>
        </>
      )}

      {phase === 'done' && (
        <>
          <div className="vx-done">
            <CheckIcon />
            Life event created
          </div>
          <div className="vx-card">
            <img src={art[voiceScript.result.art]} alt="" />
            <div>
              <b>{voiceScript.result.title}</b>
              <i>{voiceScript.result.meta}</i>
            </div>
          </div>
          <button className="vx-dismiss" type="button" onClick={onClose}>
            Done for now
          </button>
        </>
      )}

      {phase === 'listen' && (
        <button className="vx-dismiss" type="button" onClick={onClose}>
          Cancel
        </button>
      )}
    </div>
  )
}

/* ── the Financial ID tab, which the design hasn't reached yet ── */
function StubScreen() {
  return (
    <div className="cx-stub">
      <div className="cx-stub-badge">Not built yet</div>
      <h3>Financial ID</h3>
      <p>
        The profile the client keeps once the five adventures are done, and the artefact the advisor
        opens on the desktop side. Not designed yet.
      </p>
    </div>
  )
}

/* The in-phone menu. The only way back to the advisor side lives here, so the
   demo is driven entirely from inside the device. */
function MobileMenu({ onExit, onClose }: { onExit: () => void; onClose: () => void }) {
  return (
    <div className="cx-sheet" onClick={onClose}>
      <div className="cx-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cx-sheet-account">
          <span className="cx-sheet-avatar">{clientInitial}</span>
          <span>
            <b>Client</b>
            <i>All five adventures complete</i>
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
  const [sheet, setSheet] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [pressing, setPressing] = useState(false)
  const { scale: fitScale, windowH } = useFitToWindow()
  const { zoom, setZoom, reset: resetZoom } = useZoom()
  const scale = fitScale * zoom

  // Long-press the centre mark to talk to Knomee; a plain tap opens quick
  // access. The gesture rides on the tab bar itself so the mark keeps being a
  // button — `held` swallows the click that a long press would otherwise fire.
  const timer = useRef<number | null>(null)
  const held = useRef(false)
  const pressStart = (e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).closest('.cx-tab-center')) return
    held.current = false
    setPressing(true)
    timer.current = window.setTimeout(() => {
      held.current = true
      setPressing(false)
      setSheet(false)
      setVoiceOpen(true)
    }, 290)
  }
  const pressEnd = () => {
    if (timer.current) window.clearTimeout(timer.current)
    setPressing(false)
  }

  const pickTab = (id: TabId) => {
    if (held.current) return
    if (id === 'knomee') {
      if (voiceOpen) {
        setVoiceOpen(false)
        return
      }
      setSheet((v) => !v)
    } else {
      setSheet(false)
      setVoiceOpen(false)
      setTab(id)
    }
  }

  const active: TabId = sheet || voiceOpen ? 'knomee' : tab

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
            {tab === 'adventures' ? <AdventuresScreen /> : <StubScreen />}
          </div>

          {sheet && <KnomeeSheet />}
          {voiceOpen && <VoiceSheet onClose={() => setVoiceOpen(false)} />}

          <nav
            className="cx-tabbar"
            onPointerDown={pressStart}
            onPointerUp={pressEnd}
            onPointerLeave={pressEnd}
          >
            <svg className="cx-tab-edge" viewBox="0 0 390 96" width="390" height="96" aria-hidden>
              <path d={`${TAB_EDGE}V96H0Z`} fill="#fff" />
              <path d={TAB_EDGE} fill="none" stroke="#e6e5ea" strokeWidth="1.2" />
            </svg>
            {mobileTabs.map((t) =>
              t.center ? (
                <button
                  key={t.id}
                  type="button"
                  className={`cx-tab cx-tab-center ${active === t.id ? 'is-on' : ''}`}
                  aria-label={t.label}
                  onClick={() => pickTab(t.id)}
                >
                  <img className="cx-tab-mark" src={knomeeMark} alt="knomee" />
                </button>
              ) : (
                <button
                  key={t.id}
                  type="button"
                  className={`cx-tab ${active === t.id ? 'is-on' : ''}`}
                  onClick={() => pickTab(t.id)}
                >
                  {t.id === 'adventures' ? <TabAdventures /> : <TabFinId />}
                  <span className="cx-tab-lbl">{t.label}</span>
                </button>
              ),
            )}
          </nav>

          {/* The mark's five strokes fill to plum inside-out under the finger,
              and stay filled while either sheet is open. */}
          {(pressing || sheet || voiceOpen) && (
            <div
              key={pressing ? 'press' : 'static'}
              className={`px-fill${(sheet || voiceOpen) && !pressing ? ' is-static' : ''}`}
              aria-hidden
            >
              <svg viewBox="0 0 288 288">
                {MARK_PARTS.map((d, i) => (
                  <path key={i} d={d} style={{ animationDelay: `${i * 0.037}s` }} />
                ))}
              </svg>
            </div>
          )}

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
