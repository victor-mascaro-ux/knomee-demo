/* Gestures that make the phone behave like a phone.
   A mouse cannot flick a screen, so the demo has to lend it the two gestures
   the real thing lives on: dragging content, and throwing a sheet away. Both
   are pointer-based, so a trackpad, a mouse and an actual finger all work. */

import { useEffect, useRef, useState, type RefObject } from 'react'

/** Below this, a pointer movement is a tap; above it, it is a drag. */
const DRAG_SLOP = 6

/**
 * Drag-to-scroll with momentum, for everything scrollable on the phone.
 *
 * Native touch scrolling is already right on a real handset, so this only takes
 * over for mouse and pen. It listens on the whole phone screen and moves the
 * nearest thing under the pointer that can scroll — the page, or a panel's
 * body, a photo library, the drawer — so every scrolling surface drags, not
 * only the page. A drag that starts inside a dialog stays in the dialog: if
 * nothing in it scrolls, nothing does, rather than the page behind it. It
 * swallows the click that ends a drag, or letting go over a row would open it.
 */
export function useDragScroll<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    /* Found fresh on every press, not held from the first render: the phone
       rebuilds its screen when it switches between framed and handset, and a
       listener left on the old one silently stopped every drag. */
    let page: HTMLElement = document.body
    let root: HTMLElement = document.body
    let el: HTMLElement = page
    let dragging = false
    let pointer = -1
    let lastY = 0
    let lastT = 0
    let velocity = 0 // px per frame
    let travelled = 0
    let scale = 1
    let raf = 0

    const scrolls = (n: HTMLElement) => {
      const oy = getComputedStyle(n).overflowY
      return (oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1
    }
    /* The nearest scrollable thing under the pointer, stopping at a dialog's
       edge; null when the drag should not scroll anything. */
    const scrollerFor = (target: Element | null): HTMLElement | null => {
      for (let n = target as HTMLElement | null; n && n !== root; n = n.parentElement) {
        if (n === page) return page
        if (scrolls(n)) return n
        if (n.matches('.modal-backdrop, [role="dialog"], [aria-modal="true"]')) return null
      }
      return null
    }

    const glide = () => {
      velocity *= 0.94 // friction — a flick coasts for about a second
      if (Math.abs(velocity) < 0.35) return
      el.scrollTop -= velocity
      raf = requestAnimationFrame(glide)
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.button !== 0) return
      const target = e.target as Element | null
      const current = ref.current
      if (!current || !current.isConnected) return
      page = current
      /* The phone's whole screen: sheets, drawers and panels that are not
         inside the page still sit on it. */
      root = (page.closest('.cx-screen') as HTMLElement | null) ?? page
      if (!target || !root.contains(target)) return
      // A drag that starts inside a field is a text selection, not a flick.
      // Now that the advisor flow can be typed into, taking it over would make
      // selecting your own sentence scroll the phone instead.
      if (target?.closest?.('input, textarea, select, [contenteditable]')) return
      // A control that is itself dragged — a board tile's resize handle, a
      // card thrown off a deck — keeps its drag rather than having the page
      // scroll under it.
      if (target?.closest?.('[data-no-drag-scroll]')) return
      const found = scrollerFor(target)
      if (!found) return
      el = found
      cancelAnimationFrame(raf)
      // The phone is drawn scaled; the pointer moves in screen pixels.
      scale = root.getBoundingClientRect().height / root.offsetHeight || 1
      dragging = true
      pointer = e.pointerId
      lastY = e.clientY
      lastT = performance.now()
      velocity = 0
      travelled = 0
      page.classList.add('is-dragging')
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointer) return
      const dy = (e.clientY - lastY) / scale
      const now = performance.now()
      travelled += Math.abs(dy)
      velocity = (dy / Math.max(1, now - lastT)) * 16
      lastY = e.clientY
      lastT = now
      el.scrollTop -= dy
      if (travelled > DRAG_SLOP) e.preventDefault()
    }

    const onUp = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointer) return
      dragging = false
      pointer = -1
      page.classList.remove('is-dragging')
      if (travelled > DRAG_SLOP) {
        // The click that ends a drag is not a tap — swallow exactly one.
        const swallow = (ev: Event) => {
          ev.stopPropagation()
          ev.preventDefault()
        }
        root.addEventListener('click', swallow, { capture: true, once: true })
        window.setTimeout(() => root.removeEventListener('click', swallow, true), 60)
        raf = requestAnimationFrame(glide)
      }
    }

    document.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [ref])
}

/** Past this drop, or this fast, the sheet is being thrown away. */
const DISMISS_DISTANCE = 110
const DISMISS_VELOCITY = 0.55 // px per ms

/**
 * Drag a sheet down to dismiss it. Returns the live offset to translate by and
 * the handlers for its grab handle — the sheet follows the finger, then either
 * leaves or springs back.
 */
export function useSwipeDown(onDismiss: () => void) {
  const [offset, setOffset] = useState(0)
  const [holding, setHolding] = useState(false)
  const from = useRef<number | null>(null)
  const startedAt = useRef(0)

  const end = (clientY: number) => {
    if (from.current === null) return
    const dropped = Math.max(0, clientY - from.current)
    const speed = dropped / Math.max(1, performance.now() - startedAt.current)
    from.current = null
    setHolding(false)
    setOffset(0)
    if (dropped > DISMISS_DISTANCE || (dropped > 40 && speed > DISMISS_VELOCITY)) onDismiss()
  }

  return {
    offset,
    holding,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        from.current = e.clientY
        startedAt.current = performance.now()
        setHolding(true)
        e.currentTarget.setPointerCapture?.(e.pointerId)
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (from.current === null) return
        // Resist upward drags: a sheet does not stretch past its own top.
        const dy = e.clientY - from.current
        setOffset(dy > 0 ? dy : dy / 6)
      },
      onPointerUp: (e: React.PointerEvent) => end(e.clientY),
      onPointerCancel: (e: React.PointerEvent) => end(e.clientY),
    },
  }
}
