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
  DEVICE_H,
  DEVICE_W,
  IPhone,
  ZOOM_CONTROLS_TITLE,
  clampZoom,
  useDarkGround,
  useFitToWindow,
  useZoom,
} from './ClientExperienceScreen'
import { useDragScroll } from './mobileGestures'
import { BurgerMenu } from '../components/icons'
import { clientProfile } from '../data/clientProfile'
import type { Client } from '../data/clients'

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
  onExit,
  onAccountSettings,
}: {
  onExit: () => void
  onAccountSettings?: () => void
}) {
  useDarkGround()
  const { scale: fitScale, windowH } = useFitToWindow()
  const { zoom, setZoom, reset: resetZoom } = useZoom()
  const scale = fitScale * zoom
  const [, force] = useState(0)
  /* The rail — portrait, household, advisory team — sits at the foot of the
     page on a phone. The burger brings it up as a drawer so it is a tap away
     rather than a long scroll. */
  const [menuOpen, setMenuOpen] = useState(false)
  /* The advisor's account menu is a separate thing from the client's rail, so
     it gets its own control on its own side of the bar. */
  const [accountOpen, setAccountOpen] = useState(false)
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

  return (
    <div className="cx-page" style={windowH ? { minHeight: windowH } : undefined}>
      {/* The scaled frame keeps its unscaled footprint, so the wrapper carries
          the scaled height and the page never grows a phantom scrollbar. */}
      <div className="cx-fit" style={{ height: DEVICE_H * scale, width: DEVICE_W * scale }}>
        <IPhone scale={scale}>
          {/* The advisor's own bar. The page inside the frame is the advisor's
              product, not the client's app, so it keeps the plum header it has
              on a desktop rather than opening straight onto a white page. */}
          <header className="cx-appbar cxm-appbar">
            <div className="cx-appbar-brand">
              <img src="./knomee-advisor-white.svg" alt="knomee advisor" />
            </div>
            {/* The burger is the account menu, the same one the desktop top bar
                opens — same glyph, same items, same right-hand corner, so it
                drops from the edge it sits on. */}
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
              {accountOpen && (
                <div className="menu-pop cxm-menu-pop" role="menu">
                  <div className="menu-account">
                    <span className="menu-avatar">A</span>
                    <span className="menu-name">Alex Advisor</span>
                  </div>
                  <button
                    className="menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false)
                      onAccountSettings?.()
                    }}
                  >
                    Account Settings
                  </button>
                  <button className="menu-item" type="button" role="menuitem">
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
            <ClientProfileScreen
              client={EMILY}
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
                  <RailFace name={EMILY.name} />
                </button>
              }
            />
          </div>
          {menuOpen && (
            <button
              className="cxm-scrim"
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
          )}
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
          Fit to screen
        </button>
        <button type="button" className="cx-fit-btn" onClick={onExit}>
          Back to the advisor
        </button>
      </div>
    </div>
  )
}
