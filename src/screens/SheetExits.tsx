/* A phone's sheets slide away rather than vanish.
 *
 * Every modal on the phone is a sheet that rises from the foot of the screen
 * (client-experience.css). Rising is CSS; leaving is not, because a modal is
 * gone the moment its owner stops rendering it — each one closes its own way,
 * and teaching all of them to wait would be a change to every modal. So the
 * screen watches for a sheet being taken out, puts an inert copy of it back
 * for a moment, and lets that copy slide down and fade before it goes.
 */

import { useEffect, useRef } from 'react'

const SHEETS = '.modal-backdrop, .sh-form-back'
const LEAVE_MS = 300

export default function SheetExits() {
  const mark = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const screen = mark.current?.closest('.cx-screen') as HTMLElement | null
    if (!screen || typeof MutationObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const obs = new MutationObserver((records) => {
      for (const rec of records) {
        rec.removedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement) || node.dataset.leaving) return
          const sheet = node.matches(SHEETS) ? node : (node.querySelector(SHEETS) as HTMLElement | null)
          if (!sheet || !screen.isConnected) return
          const ghost = sheet.cloneNode(true) as HTMLElement
          ghost.dataset.leaving = '1'
          ghost.classList.add('is-leaving')
          ghost.setAttribute('aria-hidden', 'true')
          ghost.style.pointerEvents = 'none'
          screen.appendChild(ghost)
          window.setTimeout(() => ghost.remove(), LEAVE_MS)
        })
      }
    })
    obs.observe(screen, { childList: true, subtree: true })
    return () => obs.disconnect()
  }, [])
  return <span ref={mark} hidden />
}
