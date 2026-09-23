import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { useDragScroll, useSwipeDown } from './mobileGestures'
import JoyFlow, { sampleJoyAnswers, type JoyAnswers } from './JoyFlow'
import ConfidenceFlow, { CONFIDENCE_STATEMENTS, type ConfidenceAnswers } from './ConfidenceFlow'
import OutlookFlow, { SAMPLE_OUTLOOK, type OutlookAnswers } from './OutlookFlow'
import FutureYouFlow, { SAMPLE_FUTURE, type FutureYouAnswers } from './FutureYouFlow'
import GoalsFlow, { type GoalsAnswers } from './GoalsFlow'
import { RailFace } from './profileParts'
import {
  MOOD_ANGLES,
  MOOD_ARC,
  adventureActions,
  adventureProgress,
  completedAdventures,
  lockedAdventures,
  mobileTabs,
  moodQuestion,
  journey,
  moods,
  quickActions,
  quickNext,
  voices,
  voiceTiming,
  type VoiceScript,
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
import imgVision from '../assets/adventures/vision-board.svg'
import imgDivorce from '../assets/adventures/divorce.png'
import moodWorried from '../assets/moods/worried.svg'
import moodUnsure from '../assets/moods/unsure.svg'
import moodNeutral from '../assets/moods/neutral.svg'
import moodGood from '../assets/moods/good.svg'
import moodGreat from '../assets/moods/great.svg'
import './client-experience.css'
import ProspectProfileScreen from './ProspectProfileScreen'
import { prospects } from '../data/prospects'
import { DEMO_TODAY, financialId } from '../data/financialId'
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
export const ClockIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.2" />
    <path d="M8 4.6V8l2.6 1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const CheckIcon = ({ size = 13 }: { size?: number }) => (
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
export const ArrowRight = ({ size = 15 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M3 8h9.2M8.6 4.4 12.2 8l-3.6 3.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const TabAdventures = () => (
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
export const TabFinId = () => (
  <svg viewBox="0 0 32 26" width="34" height="27" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="1.6" y="2.4" width="28.8" height="21.2" rx="2.6" />
    <circle cx="11" cy="10.6" r="3.2" />
    <path d="M6.2 18.6c.8-2.3 2.7-3.5 4.8-3.5s4 1.2 4.8 3.5" strokeLinecap="round" />
    <path d="M20 9.4h5.6M20 14h4.2M20 18.4h5.6" strokeLinecap="round" />
  </svg>
)

/* The third tab on the advisor's flow: the three questions the eight minutes
   hand back. Drawn to sit beside TabFinId — same box, same stroke weight. */
/* The knomee mark as paths rather than an <img>, so a tab bar can colour it.
   The centre tab is a destination on the advisor's phone — it opens the
   adventures — and an <img> cannot be recoloured, so "you are here" had to be
   said by going slightly transparent, which reads as disabled rather than
   active. As paths it takes the tab's own colour: muted off, plum on.

   The client's journey keeps the <img>: its centre is quick access rather than
   a page, and dimming is the right word for a control that opens a sheet. */
export const TabMark = () => (
  <svg className="cx-tab-mark" viewBox="0 0 288 288" aria-hidden>
    {MARK_PARTS.map((d, i) => (
      <path key={i} d={d} />
    ))}
  </svg>
)

export const TabQuestions = () => (
  <svg viewBox="0 0 32 26" width="34" height="27" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path
      d="M6 2.6h20A3.4 3.4 0 0 1 29.4 6v9.3a3.4 3.4 0 0 1-3.4 3.4H13.7l-5.5 4.7v-4.7H6a3.4 3.4 0 0 1-3.4-3.4V6A3.4 3.4 0 0 1 6 2.6Z"
      strokeLinejoin="round"
    />
    <path d="M12.9 7.2a3.2 3.2 0 0 1 6.2.8c0 2.2-3.1 2.5-3.1 4.4" strokeLinecap="round" />
    <circle cx="16" cy="15" r="1.15" fill="currentColor" stroke="none" />
  </svg>
)

/* The knomee mark's own five paths, in fill order: centre heart, upper ring,
   lower ring, upper outer ring, lower outer ring. From knomee-mark.svg — as
   paths rather than an <img> so the long-press fill and the voice rings can
   animate each stroke and recolour them. */
export const MARK_PARTS = [
  'M165.378 198.685C164.99 198.685 164.537 198.685 164.149 198.62C110.711 192.518 93.0496 170.8 87.2917 158.466C78.8167 140.224 83.2159 121.394 98.5487 110.372C112.523 100.333 130.766 101.12 141.895 112.274C146.229 116.605 146.294 123.757 142.024 128.152C137.753 132.548 130.703 132.614 126.367 128.283C122.356 124.281 115.757 125.462 111.358 128.677C108.318 130.843 101.913 137.206 107.347 148.886C110.258 155.119 121.063 169.62 159.815 175.393C180.064 141.34 175.859 123.691 173.012 117.458C170.619 112.34 167.319 109.125 163.179 107.813C159.298 106.632 154.704 107.222 150.951 109.453C145.711 112.602 138.918 110.831 135.813 105.516C132.707 100.202 134.455 93.3125 139.695 90.1632C148.817 84.6517 159.815 83.2739 169.648 86.3577C176.764 88.5885 186.598 94.0998 193.003 107.878C198.761 120.279 204.066 147.836 174.695 193.567C172.624 196.783 169.13 198.685 165.443 198.685H165.378Z',
  'M58.8323 136.393C57.9266 136.393 57.0208 136.262 56.1152 136.066C49.5809 134.556 45.5052 127.93 47.0578 121.303C53.0745 94.861 68.86 72.4218 91.5679 58.0527C114.211 43.6838 141.059 39.1566 167.132 45.2584C202.843 53.6568 231.179 81.0825 241.013 116.972C242.824 123.534 239.072 130.291 232.602 132.128C226.134 133.966 219.47 130.094 217.658 123.599C210.218 96.4357 188.74 75.6367 161.632 69.2724C141.901 64.614 121.586 68.0914 104.378 78.983C87.2334 89.8746 75.2648 106.868 70.6715 126.88C69.3775 132.588 64.3961 136.393 58.8323 136.393Z',
  'M144.457 245.68C137.018 245.68 129.448 244.828 121.944 243.055C82.3504 233.804 52.4614 201.523 45.7331 160.909C44.6333 154.217 49.0973 147.853 55.6961 146.737C62.295 145.622 68.5704 150.149 69.6702 156.841C74.7811 187.614 97.4243 212.021 127.378 219.042C168.136 228.556 208.893 202.704 218.339 161.435C219.826 154.807 226.361 150.674 232.895 152.249C239.429 153.758 243.505 160.385 241.953 167.011C231.278 213.858 190.003 245.68 144.457 245.68Z',
  'M182.923 284.948C177.554 284.948 172.572 281.405 170.89 275.893C168.884 269.136 172.636 261.984 179.235 259.95C221.093 246.959 252.6 211.922 261.398 168.487C267.803 136.796 261.656 104.515 244.124 77.5489C226.592 50.5825 199.744 32.1456 168.496 25.5844C161.703 24.1409 157.304 17.383 158.727 10.4937C160.151 3.60443 166.75 -0.85719 173.607 0.586272C211.389 8.45969 243.93 30.8333 265.15 63.508C286.37 96.1828 293.81 135.288 286.046 173.67C275.372 226.291 237.266 268.742 186.611 284.423C185.382 284.816 184.152 285.014 182.923 285.014V284.948Z',
  'M117.96 288C117.119 288 116.278 287.934 115.437 287.737C77.6551 279.864 45.1137 257.556 23.8938 224.815C2.67386 192.142 -4.76604 153.036 2.99733 114.653C14.7718 56.39 59.6054 11.446 117.184 0.226364C124.041 -1.08587 130.64 3.4413 131.935 10.3305C133.228 17.2854 128.764 23.9778 121.971 25.2901C74.4204 34.6069 37.415 71.6777 27.6461 119.837C21.2413 151.528 27.3872 183.809 44.9196 210.775C62.4518 237.742 89.3002 256.178 120.547 262.739C127.341 264.182 131.741 270.941 130.317 277.83C129.088 283.866 123.847 288 118.025 288H117.96Z',
]

/* The tab bar's own top edge, arcing up around the centre mark. Drawn at the
   screen's exact 390px width so the arc is never distorted — chord 82, rise 18,
   a shallow swell the mark sits into rather than a dome around it. */
export const TAB_EDGE = 'M0 18H154a55.7 55.7 0 0 1 82 0h154'

/* The tab bar's top edge and its swell around the centre mark. The swell is a
   true circle at any width: it was one SVG stretched to the screen, and on a
   screen wider than 390 the stretch flattened the circle into an ellipse. Now
   the flat edge is the bar's own white with a hairline on top, full width, and
   the swell is drawn separately at its own size, centred on it. */
export const TabEdge = () => (
  <span className="cx-tab-edge" aria-hidden>
    <svg className="cx-tab-dome" viewBox="150 0 90 20" width="90" height="20">
      <path d="M154 18.6a55.7 55.7 0 0 1 82 0Z" fill="#fff" />
      <path d="M150 18h4a55.7 55.7 0 0 1 82 0h4" fill="none" stroke="#e6e5ea" strokeWidth="1.2" />
    </svg>
  </span>
)

/* ── keep the whole device on screen ──────────────────────────────────────
   The frame is a fixed 882 × 428, taller than most laptop windows. Rather than
   reflow the mobile layout at breakpoints — a scaled-down phone is still a
   phone, a reflowed one is not — scale the frame until it fits, never above 1.

   On the live site this runs inside the overlay's iframe, which is sized to the
   full document height (the parent scrolls, not the frame). So `innerHeight`
   here is the content's own height and tells us nothing; the parent's viewport
   is the window that has to hold the phone. Same origin, but guarded anyway. */
export const DEVICE_H = 882
export const DEVICE_W = 428
const FIT_PAD = 40
// The view controls sit under the phone rather than over it, so the height they
// occupy comes off the space the phone is allowed to fill.
const CONTROLS_H = 46
/* Below this the window IS a phone, and drawing a phone inside it is a picture
   of a picture: the rail, the bezel, the notch and the 9:41 all become clutter
   over the real ones. The frame drops away and the screen takes the window. */
const BARE_MAX = 640

function parentWindow(): Window | null {
  try {
    return window.parent && window.parent !== window ? window.parent : null
  } catch {
    return null // cross-origin embed — fall back to our own viewport
  }
}

/* Paint the dark ground on the document for as long as a mobile view is on
   screen, so the window around the phone is never white. Shared by both mobile
   demos — see `.cx-dark-ground`. */
export function useDarkGround() {
  useEffect(() => {
    const el = document.documentElement
    el.classList.add('cx-dark-ground')
    return () => el.classList.remove('cx-dark-ground')
  }, [])
}

export function useFitToWindow() {
  const [fit, setFit] = useState({ scale: 1, windowH: 0, bare: false })
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
      const bare = w <= BARE_MAX
      setFit({
        scale: bare
          ? 1
          : Math.min(1, (h - FIT_PAD - CONTROLS_H) / DEVICE_H, (w - FIT_PAD) / DEVICE_W),
        windowH: h,
        bare,
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
export const ZOOM_CONTROLS_TITLE =
  'Ctrl/Cmd + wheel or + / \u2212 to zoom \u00b7 Ctrl/Cmd + 0 to reset'
export const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

export function useZoom() {
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

/* ── the firm's colours, inside the phone ──────────────────────────
   A journey is the client's or the advisor's first sight of the firm, so the
   phone wears the same white label the desktop shell does rather than knomee's
   plum. Only what the deal actually recolours: the bar, and the plum and grape
   the screens paint buttons and accents with. `--text-strong` resolves at
   :root, so headlines stay the app's own dark whatever brand is on — which is
   the rule the shell already follows. */
export interface FlowBrand {
  primary: string
  accent: string
  logo: ReactNode
}

export function brandVars(brand?: FlowBrand | null): CSSProperties {
  if (!brand) return {}
  return {
    '--surface-brand': brand.primary,
    '--action-primary': brand.primary,
    '--action-primary-hover': brand.accent,
    '--border-strong': brand.primary,
    '--k-plum': brand.primary,
    '--plum': brand.primary,
    '--k-grape': brand.accent,
    '--purple-bolt': brand.accent,
  } as CSSProperties
}

/** What sits at the left of every phone app bar: the firm's mark if the demo
    is co-branded, knomee's wordmark if it is not. */
export function AppbarBrand({ brand }: { brand?: FlowBrand | null }) {
  return (
    <div className="cx-appbar-brand">
      {brand ? brand.logo : <img src="./knomee-logo-white.svg" alt="knomee" />}
    </div>
  )
}

/* ── iPhone frame ──────────────────────────────────────────────────────────
   390 × 844 logical screen (iPhone 14) inside a titanium bezel, with the
   Dynamic Island and side buttons so it reads as a device, not a div. */
export function IPhone({
  children,
  scale = 1,
  dim = false,
  bare = false,
}: {
  children: ReactNode
  scale?: number
  dim?: boolean
  /* No rail, no bezel, no notch — the screen is the window. See BARE_MAX. */
  bare?: boolean
}) {
  if (bare) {
    /* No measured height here. The screen stretches to the page, which is the
       window — a number measured once can go stale, and a stale one is a
       screen that is not the size of the thing it is filling. */
    return (
      <div className="cx-device is-bare">
        <div className="cx-bezel">
          <div className={`cx-screen ${dim ? 'has-sheet' : ''}`}>{children}</div>
        </div>
      </div>
    )
  }
  return (
    <div className="cx-device" style={scale === 1 ? undefined : { transform: `scale(${scale})` }}>
      <span className="cx-key cx-key-silent" />
      <span className="cx-key cx-key-volup" />
      <span className="cx-key cx-key-voldn" />
      <span className="cx-key cx-key-power" />
      <div className="cx-bezel">
        <div className={`cx-screen ${dim ? 'has-sheet' : ''}`}>
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

/* A whole adventure row as one tap target. The client screen leaves `onRow`
   off and its rows stay inert, exactly as before; the advisor demo passes one
   so any row — completed or locked — opens its adventure. */
function rowTap(onRow?: () => void) {
  if (!onRow) return {}
  return {
    role: 'button',
    tabIndex: 0,
    onClick: onRow,
    onKeyDown: (e: ReactKeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onRow()
      }
    },
  }
}
const tapClass = (onRow?: () => void) => (onRow ? ' cx-adv-tap' : '')

/* Whose product this is, at the top of the menu.
 *
 * The page-level credit is fixed to the window, so on a phone rendering it sits
 * over the device frame rather than inside the product. The menu is where
 * somebody actually looks to find out whose app they are holding, so the credit
 * goes there too — top of the panel, to the right, so it reads as a mark ON the
 * sheet rather than as the sheet's first item. */
export function SheetCredit() {
  return (
    <div className="cx-sheet-credit" aria-label="Powered by knomee">
      <span aria-hidden>powered by</span>
      <img src="./knomee-logo-plum.svg" alt="knomee" />
    </div>
  )
}

/* How far through the core adventures she is: one segment per adventure,
   each filling in turn with the brand's plum-to-lilac, a light running across
   what is done, and the percentage counting up to where she is. */
export function ProgressMeter({ done, required }: { done: number; required: number }) {
  const pct = Math.round((done / required) * 100)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setShown(pct)
    let raf = 0
    const t0 = performance.now()
    const from = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 900)
      setShown(Math.round(from + (pct - from) * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pct])
  return (
    <div className={`cx-progress${done >= required ? ' is-full' : ''}`}>
      <div className="cx-progress-top">
        <span className="cx-progress-label">Progress</span>
        <span>
          <b>{done}</b>/{required} Adventures Completed
        </span>
      </div>
      <div className="cx-progress-row">
        <div
          className="cx-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={required}
          aria-valuenow={done}
          aria-label={`${done} of ${required} adventures completed`}
        >
          {Array.from({ length: required }, (_, i) => (
            <span
              key={i}
              className={`cx-progress-seg${i < done ? ' is-on' : ''}${i === done - 1 ? ' is-last' : ''}`}
              style={{ ['--i' as string]: i }}
            >
              <i />
            </span>
          ))}
        </div>
        <span className="cx-progress-pct">{shown}%</span>
      </div>
    </div>
  )
}

export function CompletedRow({
  title,
  artKey,
  on,
  onRow,
}: {
  title: string
  artKey: ArtKey
  on: string
  onRow?: () => void
}) {
  return (
    <div className={`cx-adv cx-adv-done${tapClass(onRow)}`} {...rowTap(onRow)}>
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

export function ActionRow({
  a,
  onAct,
  onRow,
  keep,
}: {
  a: AdventureAction
  onAct?: () => void
  onRow?: () => void
  /** One of the two adventures she keeps coming back to, drawn to stand out. */
  keep?: boolean
}) {
  return (
    <div
      className={`cx-adv ${a.outline ? 'cx-adv-done' : 'cx-adv-open'}${keep ? ' cx-adv-keep' : ''}${tapClass(onRow)}`}
      {...rowTap(onRow)}
    >
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
          onClick={
            onAct
              ? (e) => {
                  // The row may be a tap target too; the pill answers for itself.
                  e.stopPropagation()
                  onAct()
                }
              : undefined
          }
        >
          {a.label}
        </button>
      </div>
    </div>
  )
}

export function LockedRow({
  title,
  artKey,
  onRow,
}: {
  title: string
  artKey?: ArtKey
  onRow?: () => void
}) {
  return (
    <div className={`cx-adv cx-adv-locked${tapClass(onRow)}`} {...rowTap(onRow)}>
      {artKey ? (
        // A locked adventure that has artwork wears it drained of colour, the
        // treatment `.cx-adv-art.has-img` was written for.
        <span className="cx-adv-art has-img">
          <img src={art[artKey]} alt="" />
        </span>
      ) : (
        <span className="cx-adv-art" />
      )}
      <div className="cx-adv-title">{title}</div>
    </div>
  )
}

function AdventuresScreen({
  onPick,
  onOpenAdventure,
  done,
  onSkipTo,
  built = ['financial-joy'],
  onAddAgain,
}: {
  onPick: (flow: 'goal' | 'event' | 'question' | 'vision') => void
  /** An adventure that can actually be taken. */
  onOpenAdventure: (id: string) => void
  /** Adventures completed, by id, with the day each was. Given, the list is
      a new client's journey; absent, the authored five-of-five. */
  done?: Record<string, string>
  /** A greyed adventure, tapped: for the demo, everything before it is
      completed with sample answers and it becomes the one that is next. */
  onSkipTo?: (id: string) => void
  /** The adventures that can actually be taken. */
  built?: string[]
  /** Goals or Life Events, done and taken again: one more of each. */
  onAddAgain?: (id: string) => void
}) {
  if (done) {
    /* The journey: what is done, the one thing next, and the rest waiting in
       the order they come. The meter counts the five core adventures. */
    const next = journey.find((j) => !done[j.id])
    const coreDone = journey.filter((j) => j.core && done[j.id]).length
    return (
      <>
        <h2 className="cx-screen-title">My Adventures</h2>
        <ProgressMeter done={coreDone} required={journey.filter((j) => j.core).length} />
        <div className="cx-adv-list">
          {/* Once Goals is done, it and Life Events are the two she keeps
              adding to, so they lead the list rather than trail it. */}
          {(done.goals
            ? [...journey.filter((j) => REPEAT[j.id]), ...journey.filter((j) => !REPEAT[j.id])]
            : journey
          ).map((j) =>
            REPEAT[j.id] && (done[j.id] || (j.id === 'life-events' && j === next)) ? (
              /* Goals and Life Events are never finished: once done they stay a
                 card with its way to add one more, not a completed row. Life
                 Events is one from the start — it is a list to keep, not an
                 adventure to finish. */
              <ActionRow
                key={j.id}
                a={{ title: j.title, art: j.art!, minutes: j.minutes, outline: true, ...REPEAT[j.id] }}
                keep
                onAct={onAddAgain ? () => onAddAgain(j.id) : undefined}
                onRow={onAddAgain ? () => onAddAgain(j.id) : undefined}
              />
            ) : done[j.id] ? (
              <CompletedRow
                key={j.id}
                title={j.title}
                artKey={j.art!}
                on={done[j.id]}
                onRow={built.includes(j.id) ? () => onOpenAdventure(j.id) : undefined}
              />
            ) : j === next ? (
              <ActionRow
                key={j.id}
                a={{ title: j.title, art: j.art!, blurb: j.blurb, minutes: j.minutes, label: 'Start' }}
                onAct={built.includes(j.id) ? () => onOpenAdventure(j.id) : undefined}
                onRow={built.includes(j.id) ? () => onOpenAdventure(j.id) : undefined}
              />
            ) : (
              <LockedRow
                key={j.id}
                title={j.title}
                artKey={j.art}
                onRow={onSkipTo ? () => onSkipTo(j.id) : undefined}
              />
            ),
          )}
        </div>
      </>
    )
  }
  return (
    <>
      {/* The page says what it is, then how far through it you are: a meter
          above the title measures something that has not been named yet. */}
      <h2 className="cx-screen-title">My Adventures</h2>
      <ProgressMeter done={adventureProgress.done} required={adventureProgress.required} />
      <div className="cx-adv-list">
        {completedAdventures.map((a) => (
          <CompletedRow
            key={a.title}
            title={a.title}
            artKey={a.art}
            on={a.on}
            /* Financial Joy is the one that is built. A completed adventure
               opens where it ended — the answers, and the badge. */
            onRow={a.art === 'financial-joy' ? () => onOpenAdventure('financial-joy') : undefined}
          />
        ))}
        {adventureActions.map((a) => {
          /* "Add a new goal" on this list and "Add a new goal" on the quick
             sheet are the same sentence, so they open the same form. */
          const flow = QUICK_FLOW[a.art]
          return (
            <ActionRow
              key={a.title}
              a={a}
              onAct={flow ? () => onPick(flow) : undefined}
              onRow={flow ? () => onPick(flow) : undefined}
            />
          )
        })}
        {lockedAdventures.map((t) => (
          <LockedRow key={t} title={t} />
        ))}
      </div>
    </>
  )
}

/* The adventures a client keeps coming back to, and how their card asks once
   they are done. */
const REPEAT: Record<string, { blurb: string; label: string }> = {
  goals: { blurb: 'Add a new goal.', label: 'Add Goal' },
  'life-events': { blurb: 'Add a new Life Event.', label: 'Add Life Event' },
}

/* Which of the four quick actions opens a form on the Financial ID — all four:
   saving a vision builds a board, which lands on her Financial ID. */
const QUICK_FLOW: Partial<Record<ArtKey, 'goal' | 'event' | 'question' | 'vision'>> = {
  goals: 'goal',
  'life-events': 'event',
  questions: 'question',
  vision: 'vision',
}

/* ── quick access: one tap on the knomee mark ──────────────────────────────
   The next adventure, four things worth doing, and the mood arc — a flat plum
   disc that runs off the bottom of the screen, faces along its rim. */
function KnomeeSheet({
  onClose,
  onPick,
  onSaveMood,
  next,
}: {
  /** What the journey says is next, and what taking it does. Absent, the
      authored demo's Life Events. */
  next?: { a: AdventureAction; go?: () => void }
  onClose: () => void
  /** One of the four things the Financial ID can add. */
  onPick: (flow: 'goal' | 'event' | 'question' | 'vision') => void
  /** How they feel, and why, on its way to the top of their Financial ID. */
  onSaveMood: (mood: MoodId, note: string) => void
}) {
  const [mood, setMood] = useState<MoodId | null>(null)
  /* Once a face is tapped the arc becomes what that face means: its word, a
     box for the reason, and the way back to the other four. */
  const [why, setWhy] = useState('')
  const picked = moods.find((m) => m.id === mood)
  const { r, faceR, face } = MOOD_ARC
  const swipe = useSwipeDown(onClose)
  return (
    <div
      className={`kx-sheet ${picked ? 'is-asking' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Quick access"
      style={sheetStyle(swipe)}
    >
      <span className="kx-grip" aria-hidden {...swipe.handlers} />

      {picked ? (
        <div className="kx-mood-detail">
          <span className="kx-mood-face">
            <img src={moodArt[picked.id]} alt="" />
          </span>
          <span className="kx-mood-word">{picked.word}</span>
          <label className="kx-mood-label" htmlFor="kx-why">
            Why do you feel this way? <i>(optional)</i>
          </label>
          <textarea
            id="kx-why"
            className="kx-mood-note"
            rows={3}
            value={why}
            placeholder="Say as much or as little as you like."
            onChange={(e) => setWhy(e.target.value)}
          />
          <div className="kx-mood-foot">
            <button
              className="kx-mood-again"
              type="button"
              onClick={() => {
                setMood(null)
                setWhy('')
              }}
            >
              Choose another
            </button>
            <button
              className="kx-mood-save"
              type="button"
              onClick={() => onSaveMood(picked.id, why.trim())}
            >
              Save
            </button>
          </div>
        </div>
      ) : null}
      <div className="kx-next">
        {/* Start does what the card says is next: the flow its art names,
            the same one the tile below it opens. */}
        {next ? (
          <ActionRow a={next.a} onAct={next.go} onRow={next.go} />
        ) : (
          <ActionRow
            a={quickNext}
            onAct={QUICK_FLOW[quickNext.art] ? () => onPick(QUICK_FLOW[quickNext.art]!) : undefined}
            onRow={QUICK_FLOW[quickNext.art] ? () => onPick(QUICK_FLOW[quickNext.art]!) : undefined}
          />
        )}
      </div>
      <div className="kx-actions">
        {quickActions.map((q, i) => (
          <button
            key={q.label}
            className="kx-action"
            type="button"
            style={{ animationDelay: `${i * 0.06}s` }}
            onClick={() => {
              const flow = QUICK_FLOW[q.art]
              if (flow) onPick(flow)
            }}
          >
            <span>
              <img className={`kx-art-${q.art}${q.raster ? ' is-raster' : ''}`} src={art[q.art]} alt="" />
            </span>
            {q.label}
          </button>
        ))}
      </div>
      <div className={`kx-arc ${mood ? 'is-asking' : ''}`}>
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
                animationDelay: `${0.16 + i * 0.045}s`,
              }}
              onClick={() => setMood(m.id)}
            >
              <img src={moodArt[m.id]} alt="" />
            </button>
          )
        })}
        {!picked && <div className="kx-ask">{moodQuestion}</div>}
      </div>
    </div>
  )
}

/* ── voice capture: long-press the knomee mark ─────────────────────────────
   Listening → what it heard, offered for editing → the thing it created. The
   transcript is scripted; the point is the shape of the interaction. */
/** A sheet follows the finger while held, and springs when released. */
/* It goes down behind the tab bar rather than past it: whatever the drag pushes
   below the sheet's resting foot is clipped away, or the mood disc slid out
   into the strip under the bar. */
function sheetStyle(swipe: ReturnType<typeof useSwipeDown>) {
  const ease = '0.26s cubic-bezier(0.22, 0.81, 0.28, 1.05)'
  const down = Math.max(0, swipe.offset)
  return {
    transform: swipe.offset ? `translateY(${swipe.offset}px)` : undefined,
    clipPath: down ? `inset(0 0 ${down}px 0)` : undefined,
    transition: swipe.holding ? 'none' : `transform ${ease}, clip-path ${ease}`,
  }
}

type VoicePhase = 'listen' | 'ready' | 'done'

/* The mic, for listening again: the same glyph the capture itself is about. */
const MicGlyph = () => (
  <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden>
    <rect x="7" y="2.5" width="6" height="10" rx="3" fill="currentColor" />
    <path
      d="M4.6 9.6a5.4 5.4 0 0 0 10.8 0M10 15v2.6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
)

function VoiceSheet({ script, onClose }: { script: VoiceScript; onClose: () => void }) {
  const swipe = useSwipeDown(onClose)
  const [phase, setPhase] = useState<VoicePhase>('listen')
  const [heard, setHeard] = useState(0)
  const said = script.said

  useEffect(() => {
    if (phase !== 'listen') return
    if (heard >= said.length) {
      const t = window.setTimeout(() => setPhase('ready'), voiceTiming.settleMs)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(
      () => setHeard((n) => n + 1),
      heard === 0 ? voiceTiming.firstWordMs : voiceTiming.wordMs,
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
      style={sheetStyle(swipe)}
    >
      <span className="kx-grip" aria-hidden {...swipe.handlers} />
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

      {phase !== 'done' && <div className="vx-cap">{live ? 'Listening' : 'Heard you'}</div>}

      {live && heard === 0 && (
        <>
          <div className="vx-wave" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <i key={i} style={{ animationDelay: `${i * 0.11}s` }} />
            ))}
          </div>
          <div className="vx-hint">{voiceTiming.hint}</div>
        </>
      )}

      {/* One card across both phases. The words land in it while listening and
          stay exactly where they are when listening stops — it is the same
          element, so nothing re-enters. Only the send button and the actions
          arrive, which is the point: the transcript is settled, the choices
          about it are new. */}
      {phase !== 'done' && (live ? heard > 0 : true) && (
        <div className={`vx-say ${live ? '' : 'is-editable'}`}>
          <div
            className="vx-say-field"
            contentEditable={!live}
            suppressContentEditableWarning
            role={live ? undefined : 'textbox'}
            aria-label={live ? undefined : 'Edit what Knomee heard'}
          >
            {live
              ? said.slice(0, heard).map((w, i) => (
                  <span key={i} className="vx-say-word">
                    {i ? ' ' : ''}
                    {w}
                  </span>
                ))
              : said.join(' ')}
            {live && <span className="vx-caret" aria-hidden />}
          </div>
          {/* Heard wrong? Say it again, from where the words are. */}
          {!live && (
            <button
              className="vx-send"
              type="button"
              aria-label="Listen again"
              onClick={listenAgain}
            >
              <MicGlyph />
            </button>
          )}
        </div>
      )}

      {phase === 'ready' && (
        <div className="vx-acts">
          <button className="vx-second" type="button" onClick={onClose}>
            Cancel
          </button>
          {/* The button says what it will make, not that it will send. */}
          <button className="vx-primary" type="button" onClick={() => setPhase('done')}>
            {script.action}
          </button>
        </div>
      )}

      {phase === 'done' && (
        <>
          <div className="vx-done">
            <CheckIcon />
            {script.done}
          </div>
          {/* The same anatomy the event will have on the Financial ID — the
              adventure row's art disc, then category, title and meta — so the
              client is looking at the record itself, not a receipt for it. */}
          <div className="vx-card">
            <span className="cx-adv-art has-img is-open">
              <img
                /* Raster art has no disc of its own, so it is inset to the
                   size the drawn ones reach — the quick sheet's rule. */
                className={/\.png($|\?)/.test(art[script.result.art]) ? 'is-raster' : undefined}
                src={art[script.result.art]}
                alt=""
              />
            </span>
            <div className="vx-card-main">
              <span className="vx-card-tag">{script.result.tag}</span>
              <b>{script.result.title}</b>
              <i>{script.result.meta}</i>
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

/* Whose phone this is. Sarah Mitchell, the prospect whose answers the demo is
   built on — her Financial ID here is the one her advisor opens, carrying her
   content and her palette, rather than a client's page with her name on it. */
/* The day an adventure is completed on her phone: the real one, in the
   list's own MM.DD.YYYY. */
const completedToday = () => {
  const d = new Date()
  const two = (n: number) => String(n).padStart(2, '0')
  return `${two(d.getMonth() + 1)}.${two(d.getDate())}.${d.getFullYear()}`
}

const SARAH = prospects.find((p) => p.name === financialId.owner) ?? prospects[0]

/* The in-phone menu. The only way back to the advisor side lives here, so the
   demo is driven entirely from inside the device. */
function MobileMenu({
  onExit,
  onClose,
  onRestart,
  progress,
}: {
  onExit: () => void
  onClose: () => void
  /** Back to a new client's first day. */
  onRestart: () => void
  /** Where she is on the five, said under her name. */
  progress: string
}) {
  return (
    <div className="cx-sheet" onClick={onClose}>
      <div className="cx-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cx-sheet-account">
          {/* Her face, the same one her advisor's page shows, falling back to
              her letter if the photograph will not load. */}
          <span className="cx-sheet-avatar">
            <RailFace name={SARAH.name} fallback={SARAH.avatar} />
          </span>
          <span>
            <b>{financialId.owner}</b>
            <i>{progress}</i>
          </span>
          <SheetCredit />
        </div>
        <button className="cx-sheet-item" type="button" onClick={onRestart}>
          Restart all adventures
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
            <path
              d="M3.2 8a4.8 4.8 0 1 0 1.5-3.5M3.2 2.6v2.6h2.6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="cx-sheet-hint">Back to 0 of 5 and an empty Financial ID.</div>
        <button className="cx-sheet-item" type="button" onClick={onExit}>
          Advisor Experience
          <ArrowRight />
        </button>
        <div className="cx-sheet-hint">Switches back to the advisor demo.</div>
      </div>
    </div>
  )
}

export default function ClientExperienceScreen({
  onExit,
  brand,
}: {
  onExit: () => void
  brand?: FlowBrand | null
}) {
  const [tab, setTab] = useState<TabId>('adventures')
  const [menuOpen, setMenuOpen] = useState(false)
  const [railOpen, setRailOpen] = useState(false)
  const [sheet, setSheet] = useState(false)
  /* What the quick-access sheet asked for, on its way to the Financial ID. */
  const [flow, setFlow] = useState<'goal' | 'event' | 'question' | 'vision' | null>(null)
  /* The check-in she has just made, which her Financial ID carries at the top
     of the page the way the advisor's copy of it does. */
  const [checkIn, setCheckIn] = useState<{ mood: MoodId; note: string } | null>(null)
  /* Wherever one of the three is asked for — the quick sheet, a row on the
     adventures list — it is the same thing: the Financial ID, with that form
     already open on it. */
  /* The adventure being taken, if any. It takes over the screen: the app bar
     carries its name and a way out, and its own footer replaces the tab bar. */
  const [adventure, setAdventure] = useState<string | null>(null)
  /* Reopened from her Financial ID: the adventure's ending again, with her
     answers, and back to the page after — nothing on the journey changes. */
  const [reviewing, setReviewing] = useState(false)
  /* However an adventure is left — its end, or the bar's cross — a replay is
     over with it, so the next one opened is taken for real. */
  useEffect(() => {
    if (!adventure) setReviewing(false)
  }, [adventure])
  const leaveReview = () => {
    setReviewing(false)
    setAdventure(null)
    setTab('finid')
  }
  /* Her journey. She starts new: nothing done and an empty Financial ID, and
     finishing Financial Joy completes it on the list, opens the next, and
     puts its answers on the page. */
  const [joy, setJoy] = useState<JoyAnswers | null>(null)
  /* Adventures completed, by id, with the day. */
  const [done, setDone] = useState<Record<string, string>>({})
  /* What Confidence handed back, once it has. */
  const [conf, setConf] = useState<ConfidenceAnswers | null>(null)
  /* And what Outlook handed back. */
  const [outlook, setOutlook] = useState<OutlookAnswers | null>(null)
  /* And what Future You handed back. */
  const [future, setFuture] = useState<FutureYouAnswers | null>(null)
  /* And the goals set in the Goals adventure. */
  const [goalsDone, setGoalsDone] = useState<GoalsAnswers | null>(null)
  /* An adventure that has been built, and can be taken. */
  const BUILT = ['financial-joy', 'confidence', 'outlook', 'future-you', 'goals']
  /* Completing an adventure — the first time or again — makes the journey
     stand at it: everything before it complete, it complete, and everything
     after it waiting. */
  const completeAt = (id: string) => {
    const upTo = journey.findIndex((j) => j.id === id)
    setDone((d) => {
      const next: Record<string, string> = {}
      for (const j of journey.slice(0, upTo)) next[j.id] = d[j.id] ?? completedToday()
      next[id] = completedToday()
      return next
    })
  }
  /* For the demo: a greyed adventure tapped completes every one before it
     with sample answers — Financial Joy with the answers OK would record, the
     rest with her authored ones — and leaves the tapped one next. */
  const skipTo = (id: string) => {
    const upTo = journey.findIndex((j) => j.id === id)
    if (upTo < 0) return
    setDone((d) => {
      const next = { ...d }
      for (const j of journey.slice(0, upTo)) if (!next[j.id]) next[j.id] = completedToday()
      return next
    })
    if (!joy) setJoy(sampleJoyAnswers())
  }
  /* A restart is a new client: the answers go, and her Financial ID is rebuilt
     from nothing — anything added to it, and her check-in, go too. */
  const [journeyRun, setJourneyRun] = useState(0)
  const restart = () => {
    setJoy(null)
    setConf(null)
    setOutlook(null)
    setFuture(null)
    setGoalsDone(null)
    setDone({})
    setCheckIn(null)
    setAdventure(null)
    setFlow(null)
    setSheet(false)
    setVoiceOpen(false)
    setTab('adventures')
    setJourneyRun((n) => n + 1)
    setMenuOpen(false)
  }
  const openFlow = (f: 'goal' | 'event' | 'question' | 'vision') => {
    setSheet(false)
    setTab('finid')
    setFlow(f)
  }
  /* One more goal, or one more life event, once that adventure is done: the
     Financial ID's own Add panel, not the adventure over again. */
  const addAgain = (id: string) => openFlow(id === 'goals' ? 'goal' : 'event')
  /* The quick sheet's card is the journey's own next step: the adventure up
     next, or once all are done, one more goal. */
  const upNext = journey.find((j) => !done[j.id])
  const sheetNext =
    upNext?.id === 'life-events'
      ? {
          a: { title: upNext.title, art: upNext.art!, minutes: upNext.minutes, outline: true, ...REPEAT['life-events'] },
          go: () => addAgain('life-events'),
        }
      : upNext
    ? {
        a: {
          title: upNext.title,
          art: upNext.art!,
          blurb: `Next up · ${upNext.blurb.charAt(0).toLowerCase()}${upNext.blurb.slice(1)}`,
          minutes: upNext.minutes,
          label: 'Start',
        },
        go: BUILT.includes(upNext.id)
          ? () => {
              setSheet(false)
              setTab('adventures')
              setAdventure(upNext.id)
            }
          : upNext.id === 'life-events'
            ? () => openFlow('event')
            : undefined,
      }
    : {
        a: { title: 'Goals', art: 'goals' as const, minutes: 3, outline: true, ...REPEAT.goals },
        go: () => addAgain('goals'),
      }
  const [voiceOpen, setVoiceOpen] = useState(false)
  /* Which scripted example the next long press plays. Each press takes the
     next one — a life event, a question, a goal — and then round again. */
  const [voiceAt, setVoiceAt] = useState(-1)
  const [pressing, setPressing] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)
  useDragScroll(viewport)
  useDarkGround()
  const { scale: fitScale, windowH, bare } = useFitToWindow()
  const { zoom, setZoom, reset: resetZoom } = useZoom()
  /* On a handset the frame is gone, so there is nothing to scale. */
  const scale = bare ? 1 : fitScale * zoom

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
      setVoiceAt((i) => (i + 1) % voices.length)
      setVoiceOpen(true)
    }, 290)
  }
  const pressEnd = () => {
    if (timer.current) window.clearTimeout(timer.current)
    setPressing(false)
  }

  const pickTab = (id: TabId) => {
    // Swallow the click that ends a long press — but only that one, or a
    // stray click with no press before it would wedge the tab bar shut.
    if (held.current) {
      held.current = false
      return
    }
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
    <div
      className={`cx-page${bare ? ' is-bare' : ''}`}
      style={{ ...brandVars(brand), ...(windowH && !bare ? { minHeight: windowH } : null) }}
    >
      {/* The scaled frame keeps its unscaled footprint, so the wrapper carries
          the scaled height and the page never grows a phantom scrollbar. On a
          handset there is no frame to carry: the screen is the window, the way
          it already is on every other one of these. */}
      <div
        className="cx-fit"
        style={bare ? undefined : { height: DEVICE_H * scale, width: DEVICE_W * scale }}
      >
        <IPhone scale={scale} bare={bare} dim={sheet || voiceOpen}>
          <header className="cx-appbar">
            {adventure ? (
              <>
                {/* Inside an adventure the bar carries its name and the way
                    out, in place of the wordmark and the burger. */}
                <div className="af-appbar-title">
                  {journey.find((j) => j.id === adventure)?.title ?? 'Financial Joy'}
                </div>
                <button
                  className="cx-appbar-burger"
                  type="button"
                  aria-label="Close this adventure and go back to My Adventures"
                  onClick={() => setAdventure(null)}
                >
                  <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M5.5 5.5l11 11M16.5 5.5l-11 11" strokeLinecap="round" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <AppbarBrand brand={brand} />
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
              </>
            )}
          </header>

          <div
            className={`cx-viewport${tab !== 'adventures' ? ' cx-viewport-id' : ''}${
              tab !== 'adventures' && railOpen ? ' is-menu-open' : ''
            }`}
            ref={viewport}
          >
            {adventure === 'goals' ? (
              <GoalsFlow
                review={reviewing ? (goalsDone ?? { goals: financialId.goals.slice(0, 1) }) : undefined}
                reward={
                  reviewing
                    ? {
                        before: journey.filter((j) => j.core && done[j.id]).length,
                        after: journey.filter((j) => j.core && done[j.id]).length,
                        total: journey.filter((j) => j.core).length,
                        next: journey.find((j) => !done[j.id])?.title ?? 'Life Events',
                      }
                    : {
                        before: 4,
                        after: 5,
                        total: journey.filter((j) => j.core).length,
                        next: 'Life Events',
                      }
                }
                onComplete={(answers) => {
                  if (reviewing) return leaveReview()
                  setGoalsDone(answers)
                  completeAt('goals')
                  setAdventure(null)
                  setTab('adventures')
                }}
              />
            ) : adventure === 'future-you' ? (
              <FutureYouFlow
                review={reviewing ? (future ?? SAMPLE_FUTURE) : undefined}
                reward={
                  reviewing
                    ? {
                        before: journey.filter((j) => j.core && done[j.id]).length,
                        after: journey.filter((j) => j.core && done[j.id]).length,
                        total: journey.filter((j) => j.core).length,
                        next: journey.find((j) => !done[j.id])?.title ?? 'Goals',
                      }
                    : {
                        before: 3,
                        after: 4,
                        total: journey.filter((j) => j.core).length,
                        next: 'Goals',
                      }
                }
                onComplete={(answers) => {
                  if (reviewing) return leaveReview()
                  setFuture(answers)
                  completeAt('future-you')
                  setAdventure(null)
                  setTab('adventures')
                }}
              />
            ) : adventure === 'outlook' ? (
              <OutlookFlow
                review={reviewing ? (outlook ?? SAMPLE_OUTLOOK) : undefined}
                reward={
                  reviewing
                    ? {
                        before: journey.filter((j) => j.core && done[j.id]).length,
                        after: journey.filter((j) => j.core && done[j.id]).length,
                        total: journey.filter((j) => j.core).length,
                        next: journey.find((j) => !done[j.id])?.title ?? 'Future You',
                      }
                    : {
                        before: 2,
                        after: 3,
                        total: journey.filter((j) => j.core).length,
                        next: 'Future You',
                      }
                }
                onComplete={(answers) => {
                  if (reviewing) return leaveReview()
                  setOutlook(answers)
                  completeAt('outlook')
                  setAdventure(null)
                  setTab('adventures')
                }}
              />
            ) : adventure === 'confidence' ? (
              <ConfidenceFlow
                review={reviewing ? (conf ?? { values: CONFIDENCE_STATEMENTS.map((s) => s.sample) }) : undefined}
                reward={
                  reviewing
                    ? {
                        before: journey.filter((j) => j.core && done[j.id]).length,
                        after: journey.filter((j) => j.core && done[j.id]).length,
                        total: journey.filter((j) => j.core).length,
                        next: journey.find((j) => !done[j.id])?.title ?? 'Outlook',
                      }
                    : {
                        before: 1,
                        after: 2,
                        total: journey.filter((j) => j.core).length,
                        next: 'Outlook',
                      }
                }
                onComplete={(answers) => {
                  if (reviewing) return leaveReview()
                  setConf(answers)
                  completeAt('confidence')
                  setAdventure(null)
                  setTab('adventures')
                }}
              />
            ) : adventure ? (
              <JoyFlow
                review={reviewing ? (joy ?? sampleJoyAnswers()) : undefined}
                /* Financial Joy is the first adventure, and taking it — the first
                   time or again — is where the journey starts: the reward always
                   reads 0 to 1 of 5, with Confidence next. Reopened from her
                   Financial ID it is only a look back, and says where she is. */
                reward={
                  reviewing
                    ? {
                        before: journey.filter((j) => j.core && done[j.id]).length,
                        after: journey.filter((j) => j.core && done[j.id]).length,
                        total: journey.filter((j) => j.core).length,
                        next: journey.find((j) => !done[j.id])?.title ?? 'Confidence',
                      }
                    : { before: 0, after: 1, total: journey.filter((j) => j.core).length, next: 'Confidence' }
                }
                onClose={() => setAdventure(null)}
                onComplete={(answers) => {
                  /* Done: the answers go on her Financial ID, and she lands on
                     the list, where the adventure now reads as complete and the
                     next one has opened. */
                  /* Taken again, it starts the journey over from itself: only
                     Financial Joy is complete, Confidence is next, and what
                     came after goes back to waiting. */
                  if (reviewing) return leaveReview()
                  setJoy(answers)
                  completeAt('financial-joy')
                  setAdventure(null)
                  setTab('adventures')
                }}
              />
            ) : tab === 'adventures' ? (
              <AdventuresScreen
                onPick={openFlow}
                onOpenAdventure={setAdventure}
                done={done}
                onSkipTo={skipTo}
                built={BUILT}
                onAddAgain={addAgain}
              />
            ) : (
              /* Her Financial ID is the page her advisor opens, carrying her
                 answers — one artefact, not a second rendering of it. It was a
                 "not built yet" card here long after the page itself was
                 built. */
              <ProspectProfileScreen
                key={journeyRun}
                prospect={SARAH}
                fresh={{ joy, done, conf, outlook, future, goals: goalsDone }}
                onOpenEnding={(id) => {
                  setReviewing(true)
                  setAdventure(id)
                }}
                mine
                checkIn={
                  checkIn
                    ? {
                        level: moods.findIndex((m) => m.id === checkIn.mood),
                        mood: moods.find((m) => m.id === checkIn.mood)?.word ?? '',
                        note: checkIn.note,
                        date: DEMO_TODAY,
                      }
                    : undefined
                }
                startFlow={flow}
                onStartFlowDone={() => setFlow(null)}
                onBack={() => setTab('adventures')}
                ownerMenu={
                  <button
                    className="cxm-rail-btn"
                    type="button"
                    aria-label={railOpen ? 'Close my details' : 'My details'}
                    aria-expanded={railOpen}
                    onClick={() => setRailOpen((o) => !o)}
                  >
                    <RailFace name={SARAH.name} fallback={SARAH.avatar} />
                  </button>
                }
              />
            )}
          </div>
          {tab !== 'adventures' && railOpen && (
            <button
              className="cxm-scrim"
              type="button"
              aria-label="Close my details"
              onClick={() => setRailOpen(false)}
            />
          )}

          {sheet && (
            <KnomeeSheet
              next={sheetNext}
              onClose={() => setSheet(false)}
              onPick={openFlow}
              onSaveMood={(mood, note) => {
                setCheckIn({ mood, note })
                setSheet(false)
                setTab('finid')
              }}
            />
          )}
          {voiceOpen && (
            <VoiceSheet
              key={voiceAt}
              script={voices[Math.max(0, voiceAt)]}
              onClose={() => setVoiceOpen(false)}
            />
          )}

          {!adventure && (
          <nav
            className="cx-tabbar"
            onPointerDown={pressStart}
            onPointerUp={pressEnd}
            onPointerLeave={pressEnd}
          >
            <TabEdge />
            {mobileTabs.map((t) =>
              t.center ? (
                <button
                  key={t.id}
                  type="button"
                  className={`cx-tab cx-tab-center ${active === t.id ? 'is-on' : ''}`}
                  aria-label={t.label}
                  onClick={() => pickTab(t.id)}
                >
                  {/* The mark takes the tab's own colour — muted while the
                      sheet is shut, plum while it is open — rather than
                      dimming, which read as the logo being turned off. */}
                  <TabMark />
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
          )}

          <div className="cx-home-bar" />

          {menuOpen && (
            <MobileMenu
              onExit={onExit}
              onClose={() => setMenuOpen(false)}
              onRestart={restart}
              progress={`${journey.filter((j) => j.core && done[j.id]).length} of 5 adventures complete`}
            />
          )}
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
          title={ZOOM_CONTROLS_TITLE}
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
