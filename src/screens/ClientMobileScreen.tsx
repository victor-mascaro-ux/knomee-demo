/* Emily's Financial ID inside the device frame, for showing what an advisor's
   client page looks like on a phone without asking anyone to resize a window.

   The page itself is not a mobile build — it is the same ClientProfileScreen
   the desktop renders. Its phone layout answers to a container query on .pp, so
   putting it in a 393px screen is enough to trigger it. */

import { useState } from 'react'
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

export default function ClientMobileScreen({ onExit }: { onExit: () => void }) {
  useDarkGround()
  const { scale: fitScale, windowH } = useFitToWindow()
  const { zoom, setZoom, reset: resetZoom } = useZoom()
  const scale = fitScale * zoom
  const [, force] = useState(0)

  return (
    <div className="cx-page" style={windowH ? { minHeight: windowH } : undefined}>
      {/* The scaled frame keeps its unscaled footprint, so the wrapper carries
          the scaled height and the page never grows a phantom scrollbar. */}
      <div className="cx-fit" style={{ height: DEVICE_H * scale, width: DEVICE_W * scale }}>
        <IPhone scale={scale}>
          {/* The screen scrolls; what scrolls inside it is the desktop page. */}
          <div className="cx-viewport cxm-viewport">
            <ClientProfileScreen client={EMILY} onBack={() => force((n) => n + 1)} />
          </div>
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
