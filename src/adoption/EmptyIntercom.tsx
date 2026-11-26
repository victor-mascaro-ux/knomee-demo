/* Intercom on the product's own empty Prospects dashboard (the burger menu's
 * Empty state), as Alex would see it in the real thing: the welcome banner
 * at the top of the page, its Show me pointing a tooltip at Invite, and the
 * chat button in the corner. None of the adoption demo's presentation comes
 * with it: no demo bar, no notes, no yellow labels or outlines.
 *
 * It is the demo's own Intercom pieces (intercom.tsx), shown afresh each
 * time the empty dashboard opens.
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnchoredTip, Banner, Launcher } from './intercom'
import { useLeave } from './motion'
import './adoption.css'

/** The empty dashboard's Invite button: what the tooltip points at. */
const INVITE = '.content .toolbar .btn-primary'

export default function EmptyIntercom() {
  const [welcome, setWelcome] = useState(true)
  const [tip, setTip] = useState(false)
  const [bannerLeaving, leaveBanner] = useLeave()
  const [tipLeaving, leaveTip] = useLeave()

  /* Invite pressed: the tooltip has done its job. */
  useEffect(() => {
    if (!tip) return
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.(INVITE)) setTip(false)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [tip])

  return (
    <>
      {welcome && (
        <div className="ad-intercom ad-intercom-flow">
          <Banner
            title="Welcome, Alex."
            action="Show me"
            onAction={() =>
              leaveBanner(() => {
                setWelcome(false)
                setTip(true)
              })
            }
            onDismiss={() => leaveBanner(() => setWelcome(false))}
            leaving={bannerLeaving}
          >
            This is where you see what matters to prospects before you meet them.
          </Banner>
        </div>
      )}
      {createPortal(
        <div className="ad-intercom ad-intercom-page">
          {tip && (
            <AnchoredTip
              anchor={() => document.querySelector<HTMLElement>(INVITE)}
              device={null}
              scroller={null}
              leaving={tipLeaving}
              onClose={() => leaveTip(() => setTip(false))}
            >
              Meeting someone this week? Click <b>Invite</b> to add them.
            </AnchoredTip>
          )}
          <Launcher />
        </div>,
        document.body,
      )}
    </>
  )
}
