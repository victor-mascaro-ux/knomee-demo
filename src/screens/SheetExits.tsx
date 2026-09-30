/* A phone's sheets move rather than jump.
 *
 * Every modal on the phone is a sheet that rises from the foot of the screen
 * (client-experience.css). Two things CSS cannot do for them, done here once
 * for all of them rather than taught to each modal:
 *
 * — Leaving. A modal is gone the moment its owner stops rendering it, so the
 *   screen watches for a sheet being taken out, puts an inert copy of it back
 *   for a moment, and lets that copy slide down and fade before it goes.
 *
 * — Changing size. A sheet whose contents change — Add a goal going from its
 *   suggestions to the goal's details, a life event opening its list — used
 *   to snap to the new height on some steps and ease on others. Each sheet is
 *   measured, and whenever its height changes after it has opened, it glides
 *   from the old height to the new one.
 */

import { useEffect, useRef } from 'react'

const SHEETS = '.modal-backdrop, .sh-form-back'
const PANELS = '.modal-backdrop .modal, .sh-form-back .sh-form'
const LEAVE_MS = 300
const RESIZE_MS = 280
/* How long a sheet takes to rise; a height change inside that is the rise. */
const SETTLE_MS = 420

export default function SheetExits() {
  const mark = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const screen = mark.current?.closest('.cx-screen') as HTMLElement | null
    if (!screen || typeof MutationObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    /* Heights, per panel, and when each was first seen. */
    const heights = new WeakMap<Element, number>()
    const since = new WeakMap<Element, number>()
    const moving = new WeakSet<Element>()
    const ro =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver((entries) => {
            for (const e of entries) {
              const el = e.target as HTMLElement
              const h = el.getBoundingClientRect().height / (screen.getBoundingClientRect().width / screen.offsetWidth || 1)
              const was = heights.get(el)
              heights.set(el, h)
              if (was === undefined || moving.has(el)) continue
              if (Date.now() - (since.get(el) ?? 0) < SETTLE_MS) continue
              if (Math.abs(h - was) < 2) continue
              moving.add(el)
              const anim = el.animate([{ height: `${was}px` }, { height: `${h}px` }], {
                duration: RESIZE_MS,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              })
              const done = () => {
                moving.delete(el)
                heights.set(el, el.getBoundingClientRect().height / (screen.getBoundingClientRect().width / screen.offsetWidth || 1))
              }
              anim.onfinish = done
              anim.oncancel = done
            }
          })
    const watch = (root: Element) => {
      if (!ro) return
      const found = root.matches?.(PANELS) ? [root] : [...root.querySelectorAll(PANELS)]
      for (const p of found) {
        if ((p as HTMLElement).closest('[data-leaving]')) continue
        since.set(p, Date.now())
        ro.observe(p)
      }
    }
    watch(screen)

    const obs = new MutationObserver((records) => {
      for (const rec of records) {
        rec.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && !node.dataset.leaving) watch(node)
        })
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
    return () => {
      obs.disconnect()
      ro?.disconnect()
    }
  }, [])
  return <span ref={mark} hidden />
}
