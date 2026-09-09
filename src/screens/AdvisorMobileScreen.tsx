/* Marcus's Advisor ID inside the device frame — the firm-side twin of
   ClientMobileScreen.

   The page is not a mobile build any more than Emily's is. It is the same
   AdvisorProfileScreen the desktop renders, and its phone layout answers to a
   container query on .pp, so putting it in a 393px screen is enough. The
   Advisor ID is the Financial ID page card for card, so once it is in the
   frame it folds exactly the way hers does. */

import { useCallback, useEffect, useRef, useState } from 'react'
import './client-experience.css'
import { RailFace } from './profileParts'
import AdvisorProfileScreen from './AdvisorProfileScreen'
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
import { advisor } from '../data/advisorFlow'

const ZOOM_STEP = 0.1

export default function AdvisorMobileScreen({
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
  /* The rail — his portrait, the Enterprise Quotient, the route — sits at the foot
     of the page on a phone. His own portrait brings it up as a drawer. */
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  useDragScroll(viewport)

  useEffect(() => {
    if (!accountOpen) return
    const away = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('click', away)
    return () => document.removeEventListener('click', away)
  }, [accountOpen])

  const openRail = useCallback(() => {
    setAccountOpen(false)
    setMenuOpen((o) => !o)
  }, [])

  return (
    <div className="cx-page" style={windowH ? { minHeight: windowH } : undefined}>
      <div className="cx-fit" style={{ height: DEVICE_H * scale, width: DEVICE_W * scale }}>
        <IPhone scale={scale}>
          {/* The firm's own bar. The page inside the frame is the Dynasty rep's
              product, not Marcus's app, so it keeps the header it has on a
              desktop — and the burger in it is the account menu, as it is
              everywhere else. */}
          <header className="cx-appbar cxm-appbar">
            <div className="cx-appbar-brand">
              <img src="./knomee-advisor-white.svg" alt="knomee advisor" />
            </div>
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
          <div
            className={`cx-viewport cxm-viewport${menuOpen ? ' is-menu-open' : ''}`}
            ref={viewport}
          >
            <AdvisorProfileScreen
              onBack={() => force((n) => n + 1)}
              ownerMenu={
                /* His portrait, under his name, opening his rail — the drawer
                   comes in from the left and the circle sits on the left. */
                <button
                  className="cxm-rail-btn"
                  type="button"
                  aria-label={menuOpen ? 'Close candidate menu' : 'Candidate menu'}
                  aria-expanded={menuOpen}
                  onClick={openRail}
                >
                  <RailFace name={advisor.name} />
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
          Back to the desktop
        </button>
      </div>
    </div>
  )
}
