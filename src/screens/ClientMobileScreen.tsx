/* Emily's Financial ID inside the device frame, for showing what an advisor's
   client page looks like on a phone without asking anyone to resize a window.

   The page itself is not a mobile build — it is the same ClientProfileScreen
   the desktop renders. Its phone layout answers to a container query on .pp, so
   putting it in a 393px screen is enough to trigger it. */

import { useEffect, useRef, useState } from 'react'
import { RailFace } from './profileParts'
import './client-experience.css'
import ClientProfileScreen from './ClientProfileScreen'
import {
  AdventuresScreen,
  DEVICE_H,
  DEVICE_W,
  IPhone,
  KnomeeFab,
  KnomeeSheet,
  TabAdventures,
  TabFinId,
  ZOOM_CONTROLS_TITLE,
  clampZoom,
  useDarkGround,
  useFitToWindow,
  useTabInd,
  useZoom,
} from './ClientExperienceScreen'
import { moneyHistory, moods } from '../data/experience'
import { useDragScroll } from './mobileGestures'
import { BurgerMenu } from '../components/icons'
import { DesktopIcon, GearIcon, ShieldIcon, SignOutIcon } from '../components/profileIcons'
import { clientProfile } from '../data/clientProfile'
import type { Client } from '../data/clients'
import { useDropdown } from '../components/useDropdown'
import { openLegal } from '../components/Legal'

const ZOOM_STEP = 0.1

/* The profile expects the client whose page it is; the sidebar and breadcrumb
   read the name off it. */
const EMILY = {
  name: clientProfile.owner,
  email: 'emily.watson@email.com',
  household: clientProfile.household,
  kr: 82,
  sentiment: 4,
  status: 'complete',
  lastSignIn: '05/03/2025',
  tier: 'engaged',
} as Client

export default function ClientMobileScreen({
  client = EMILY,
  onExit,
  onAccountSettings,
  onBackToProfile,
}: {
  /** Opened from the client's profile: the menu's way back to it. */
  onBackToProfile?: () => void
  /** Whose phone. Emily's unless another client is named. */
  client?: Client
  onExit: () => void
  onAccountSettings?: () => void
}) {
  useDarkGround()
  const { scale: fitScale, windowH, bare } = useFitToWindow()
  const { zoom, setZoom, reset: resetZoom } = useZoom()
  /* On a handset the frame is a picture of the device already in your hand,
     so it comes off and the screen is the window. */
  const scale = bare ? 1 : fitScale * zoom
  const [, force] = useState(0)
  /* The rail — portrait, household, advisory team — sits at the foot of the
     page on a phone. The burger brings it up as a drawer so it is a tap away
     rather than a long scroll. */
  const [menuOpen, setMenuOpen] = useState(false)
  /* Her account menu is a separate thing from her rail, so it gets its own
     control on its own side of the bar. */
  const account = useDropdown()
  const accountOpen = account.open
  const setAccountOpen = account.setOpen
  const accountRef = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!accountOpen) return
    const away = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('click', away)
    return () => document.removeEventListener('click', away)
  }, [accountOpen])
  /* Drag to scroll, as a finger would. */
  useDragScroll(viewport)
  /* The bottom bar every phone has: her Financial ID, the knomee mark, and
     her adventures — all five finished. */
  const [tab, setTab] = useState<'finid' | 'adventures'>('finid')
  const tabInd = useTabInd(tab)
  /* A tab opens at its top, not wherever the last one was scrolled to. */
  useEffect(() => {
    viewport.current?.scrollTo({ top: 0 })
  }, [tab])
  /* The knomee mark's quick-access sheet. Its four actions open the same
     forms on her Financial ID; a mood saved on it is her check-in. */
  const [sheet, setSheet] = useState(false)
  const [flow, setFlow] = useState<'goal' | 'event' | 'question' | 'vision' | null>(null)
  const [checkIn, setCheckIn] = useState<{ mood: string; level: number; date: string; note?: string } | null>(null)
  const pick = (f: 'goal' | 'event' | 'question' | 'vision') => {
    setSheet(false)
    setTab('finid')
    setFlow(f)
  }

  return (
    <div
      className={`cx-page${bare ? ' is-bare' : ''}`}
      style={windowH ? { minHeight: windowH } : undefined}
    >
      {/* The scaled frame keeps its unscaled footprint, so the wrapper carries
          the scaled height and the page never grows a phantom scrollbar. */}
      <div
        className="cx-fit"
        style={bare ? undefined : { height: DEVICE_H * scale, width: DEVICE_W * scale }}
      >
        <IPhone scale={scale} bare={bare} dim={sheet}>
          {/* The advisor's own bar. The page inside the frame is the advisor's
              product, not the client's app, so it keeps the plum header it has
              on a desktop rather than opening straight onto a white page. */}
          <header className="cx-appbar cxm-appbar">
            <div className="cx-appbar-brand">
              {/* Her own phone, so the client app's mark — not the advisor's. */}
              <img src="./knomee-logo-white.svg" alt="knomee" />
            </div>
            {/* The burger is her account menu — same glyph, same right-hand
                corner as the desktop top bar's, so it drops from the edge it
                sits on. */}
            <div className="menu-wrap cxm-account" ref={accountRef}>
              <button
                className="cx-appbar-burger"
                type="button"
                aria-label="Menu"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  setAccountOpen((o) => !o)
                }}
              >
                <BurgerMenu />
              </button>
              {account.shown && (
                <div className={`menu-pop cxm-menu-pop drop-anim${account.closing ? ' is-closing' : ''}`} role="menu">
                  {/* Her own phone, so her own account: her face and her
                      name, as Sarah's menu has hers. */}
                  <div className="menu-account">
                    <span className="menu-avatar">
                      <RailFace name={client.name} />
                    </span>
                    <span className="menu-name">{client.name}</span>
                  </div>
                  {/* In groups, as on every phone: the account, then the ways
                      out. */}
                  <button
                    className="menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false)
                      onAccountSettings?.()
                    }}
                  >
                    <GearIcon size={18} />
                    Account Settings
                  </button>
                  <button className="menu-item" type="button" role="menuitem" onClick={() => openLegal('terms')}>
                    <ShieldIcon size={18} />
                    Legal &amp; Privacy
                  </button>
                  <hr className="menu-sep" />
                  {onBackToProfile && (
                    <button
                      className="menu-item"
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountOpen(false)
                        onBackToProfile()
                      }}
                    >
                      <DesktopIcon size={18} />
                      Close Experience
                    </button>
                  )}
                  <button className="menu-item" type="button" role="menuitem">
                    <SignOutIcon size={18} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </header>
          {/* The screen scrolls; what scrolls inside it is the desktop page. */}
          <div
            className={`cx-viewport cxm-viewport${menuOpen ? ' is-menu-open' : ''}`}
            ref={viewport}
          >
            {tab === 'adventures' ? (
              /* All five finished. A finished one, or Add Goal / Add Life
                 Event, goes to her Financial ID, where its answers and its
                 forms are. */
              <AdventuresScreen onPick={pick} onOpenAdventure={() => setTab('finid')} />
            ) : (
            <ClientProfileScreen
              client={client}
              mine
              sharing
              startFlow={flow}
              onStartFlowDone={() => setFlow(null)}
              checkIn={checkIn ?? undefined}
              onBack={() => force((n) => n + 1)}
              ownerMenu={
                /* Emily's own initial, above her name, opening her rail. The
                   drawer comes in from the left and the circle sits on the
                   left, so the panel arrives where the tap was. */
                <button
                  className="cxm-rail-btn"
                  type="button"
                  aria-label={menuOpen ? 'Close client menu' : 'Client menu'}
                  aria-expanded={menuOpen}
                  onClick={() => {
                    setAccountOpen(false)
                    setMenuOpen((o) => !o)
                  }}
                >
                  <RailFace name={client.name} />
                </button>
              }
            />
            )}
          </div>
          {menuOpen && (
            <button
              className="cxm-scrim"
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
          )}
          {sheet && (
            <KnomeeSheet
              /* She has finished the five, so what is next is the adventure
                 after them. */
              next={{ a: moneyHistory, go: () => setSheet(false) }}
              onClose={() => setSheet(false)}
              onPick={pick}
              onSaveMood={(mood, note) => {
                const level = moods.findIndex((m) => m.id === mood)
                const d = new Date()
                const two = (n: number) => String(n).padStart(2, '0')
                setCheckIn({
                  mood: moods[level].word,
                  level,
                  note: note || undefined,
                  date: `${two(d.getMonth() + 1)}/${two(d.getDate())}/${d.getFullYear()}`,
                })
                setSheet(false)
                setTab('finid')
              }}
            />
          )}
          <nav className="cx-tabbar" ref={tabInd.ref}>
            {tabInd.ind}
            <button
              type="button"
              className={`cx-tab ${tab === 'finid' ? 'is-on' : ''}`}
              onClick={() => {
                setSheet(false)
                setTab('finid')
              }}
            >
              <TabFinId />
              <span className="cx-tab-lbl">Financial ID</span>
            </button>
            <KnomeeFab on={sheet} label="Knomee" onClick={() => setSheet((s) => !s)} />
            <button
              type="button"
              className={`cx-tab ${tab === 'adventures' ? 'is-on' : ''}`}
              onClick={() => {
                setSheet(false)
                setTab('adventures')
              }}
            >
              <TabAdventures />
              <span className="cx-tab-lbl">Adventures</span>
            </button>
          </nav>
          <div className="cx-home-bar" />
        </IPhone>
      </div>

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
        <button type="button" className="cx-fit-btn" onClick={resetZoom} title={ZOOM_CONTROLS_TITLE}>
          <svg
            viewBox="0 0 16 16"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M2 6V2.6h3.4M14 6V2.6h-3.4M2 10v3.4h3.4M14 10v3.4h-3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Fit to Screen
        </button>
        <button type="button" className="cx-fit-btn" onClick={onExit}>
          Back to the Advisor
        </button>
      </div>
    </div>
  )
}
