/* Marcus's Business ID inside the device frame — the firm-side twin of
   ClientMobileScreen.

   The page is not a mobile build any more than Emily's is. It is the same
   AdvisorProfileScreen the desktop renders, and its phone layout answers to a
   container query on .pp, so putting it in a 393px screen is enough. The
   Business ID is the Financial ID page card for card, so once it is in the
   frame it folds exactly the way hers does. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './client-experience.css'
import './advisor-flow.css'
import { RailFace } from './profileParts'
import AdvisorProfileScreen from './AdvisorProfileScreen'
import {
  DEVICE_H,
  DEVICE_W,
  IPhone,
  TAB_EDGE,
  TabFinId,
  TabQuestions,
  ZOOM_CONTROLS_TITLE,
  clampZoom,
  useDarkGround,
  useFitToWindow,
  useZoom,
} from './ClientExperienceScreen'
import AdventureList from './AdventureList'
import knomeeMark from '../assets/knomee-mark.svg'
import { adventureStates, derive, sampleAnswers } from '../data/advisorAnswers'
import { useDragScroll } from './mobileGestures'
import { BurgerMenu } from '../components/icons'
import { advisor } from '../data/advisorFlow'

const ZOOM_STEP = 0.1

export default function AdvisorMobileScreen({
  onExit,
  onAccountSettings,
  onRedo,
}: {
  onExit: () => void
  onAccountSettings?: () => void
  /** Into the flow itself, which is the only place an adventure can be answered
      again. This page can show what is finished; it cannot ask anything. */
  onRedo?: () => void
}) {
  useDarkGround()
  const { scale: fitScale, windowH } = useFitToWindow()
  const { zoom, setZoom, reset: resetZoom } = useZoom()
  const scale = fitScale * zoom
  const [, force] = useState(0)
  /* The rail — his portrait, the Recruitment Quotient, the route — sits at the foot
     of the page on a phone. His own portrait brings it up as a drawer. */
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [tab, setTab] = useState<'finid' | 'flow' | 'questions'>('finid')
  /* His finished sheet, read once. The adventures he completed and the three
     questions he came out with are both rules over these answers, so they are
     derived here rather than restated — the same `derive` the rest of the
     product reads him through. */
  const answered = useMemo(() => sampleAnswers(), [])
  const d = useMemo(() => derive(answered), [answered])
  const rows = useMemo(() => adventureStates(answered), [answered])
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
            {tab === 'flow' ? (
              <AdventureList
                rows={rows}
                done={d.progress.done}
                required={d.progress.required}
                completedOn={answered.completed}
                /* Every row is a way back into the flow, and so is the button
                   under them — this page has no questions of its own to ask. */
                onOpen={() => onRedo?.()}
                foot={
                  onRedo && (
                    <button className="cx-start af-wide" type="button" onClick={onRedo}>
                      Redo my adventures
                    </button>
                  )
                }
              />
            ) : tab === 'questions' ? (
              <div className="af-unlock">
                <h2 className="af-h1">My Three Questions</h2>
                <p className="af-body">
                  Put these to every platform you’re considering — including this one. They come
                  out of your own answers, so what you hear back tells you whether a platform is
                  the right one, and holds it to what it promises.
                </p>
                <ol className="af-qs">
                  {d.id.questions.map((q, n) => (
                    <li key={q}>
                      <span className="af-getnum">{n + 1}</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
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
            )}
          </div>

          {/* The same three the flow's own phone carries: the Business ID, the
              mark that opens what he finished, and the questions he came out
              with. This page had no bar at all, so the other two were only
              reachable by walking the flow again. */}
          <nav className="cx-tabbar">
            <svg className="cx-tab-edge" viewBox="0 0 390 96" width="390" height="96" aria-hidden>
              <path d={`${TAB_EDGE}V96H0Z`} fill="#fff" />
              <path d={TAB_EDGE} fill="none" stroke="#e6e5ea" strokeWidth="1.2" />
            </svg>
            <button
              type="button"
              className={`cx-tab ${tab === 'finid' ? 'is-on' : ''}`}
              onClick={() => setTab('finid')}
            >
              <TabFinId />
              <span className="cx-tab-lbl">Business ID</span>
            </button>
            <button
              type="button"
              className={`cx-tab cx-tab-center ${tab === 'flow' ? 'is-on' : ''}`}
              aria-label="Adventures"
              onClick={() => setTab('flow')}
            >
              <img className="cx-tab-mark" src={knomeeMark} alt="knomee" />
            </button>
            <button
              type="button"
              className={`cx-tab ${tab === 'questions' ? 'is-on' : ''}`}
              onClick={() => setTab('questions')}
            >
              <TabQuestions />
              <span className="cx-tab-lbl">My Questions</span>
            </button>
          </nav>
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
