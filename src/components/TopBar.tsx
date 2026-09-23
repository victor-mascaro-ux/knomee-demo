/* The app's own bar: the brand at one end, the account menu at the other.
 *
 * It was written inline in App, which is where the product's screens are — and
 * fine until a screen that lives outside that shell needed the same bar. A
 * report opened from the directory is one: it is a desktop page in the firm's
 * product, and it was wearing a plum strip with a back button instead of the
 * header every other page in that product has.
 *
 * Presentational. The one thing the menu can actually do — open Account
 * Settings — arrives as a prop, and the item is left out where nothing is
 * passed rather than offered and dead.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { BurgerMenu } from './icons'
import { useDropdown } from './useDropdown'

export default function TopBar({
  /** A white-label brand's logo, where one is on. */
  logo,
  /** Where the logo sits when a brand is on: beside the knomee mark, or
      centred over the bar. */
  cobrand,
  /** The word under the knomee mark — which product this is. */
  sub = 'ADVISOR',
  onSettings,
}: {
  logo?: ReactNode
  cobrand?: 'left' | 'centered'
  sub?: string
  onSettings?: () => void
}) {
  const { open, shown, closing, setOpen } = useDropdown()
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
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          {logo ? (
            cobrand === 'left' ? (
              <div className="cobrand-stack">{logo}</div>
            ) : null
          ) : (
            <>
              <img className="brand-logo" src="./knomee-logo-white.svg" alt="knomee" />
              <span className="brand-sub">{sub}</span>
            </>
          )}
        </div>
        {logo && cobrand === 'centered' && (
          <div className="cobrand-stack cobrand-center">{logo}</div>
        )}
        <div className="menu-wrap" ref={ref}>
          <button
            className="menu-btn"
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={(e) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
          >
            <BurgerMenu />
          </button>
          {shown && (
            <div className={`menu-pop drop-anim${closing ? ' is-closing' : ''}`}>
              <div className="menu-account">
                <span className="menu-avatar">A</span>
                <span className="menu-name">Alex Advisor</span>
              </div>
              {onSettings && (
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onSettings()
                  }}
                >
                  Account Settings
                </button>
              )}
              <button className="menu-item" type="button">
                Sign Out
              </button>
              {/* No divider element here: .menu-hint draws its own rule, and the
                  two of them together read as one line printed twice. */}
              <div className="menu-hint">
                Press <b>D</b> for demo controls, <b>C</b> for comments
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
