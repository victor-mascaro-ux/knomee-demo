/* Gestures that make the phone behave like a phone.
   A mouse cannot flick a screen, so the demo has to lend it the two gestures
   the real thing lives on: dragging content, and throwing a sheet away. Both
   are pointer-based, so a trackpad, a mouse and an actual finger all work. */

import { useEffect, useRef, useState, type RefObject } from 'react'

/** Below this, a pointer movement is a tap; above it, it is a drag. */
const DRAG_SLOP = 6

/**
 * Drag-to-scroll with momentum, for a scrollable element inside the device.
 *
 * Native touch scrolling is already right on a real handset, so this only takes
 * over for mouse and pen. It swallows the click that ends a drag, or letting go
 * over a row would open it.
 */
export function useDragScroll<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    let dragging = false
    let pointer = -1
    let lastY = 0
    let lastT = 0
    let velocity = 0 // px per frame
    let travelled = 0
    let raf = 0

    const glide = () => {
      velocity *= 0.94 // friction — a flick coasts for about a second
      if (Math.abs(velocity) < 0.35) return
      el.scrollTop -= velocity
      raf = requestAnimationFrame(glide)
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.button !== 0) return
      // A drag that starts inside a field is a text selection, not a flick.
      // Now that the advisor flow can be typed into, taking it over would make
      // selecting your own sentence scroll the phone instead.
      if ((e.target as Element | null)?.closest?.('input, textarea, select, [contenteditable]'))
        return
      cancelAnimationFrame(raf)
      dragging = true
      pointer = e.pointerId
      lastY = e.clientY
      lastT = performance.now()
      velocity = 0
      travelled = 0
      el.classList.add('is-dragging')
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointer) return
      const dy = e.clientY - lastY
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
      el.classList.remove('is-dragging')
      if (travelled > DRAG_SLOP) {
        // The click that ends a drag is not a tap — swallow exactly one.
        const swallow = (ev: Event) => {
          ev.stopPropagation()
          ev.preventDefault()
        }
        el.addEventListener('click', swallow, { capture: true, once: true })
        window.setTimeout(() => el.removeEventListener('click', swallow, true), 60)
        raf = requestAnimationFrame(glide)
      }
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerdown', onDown)
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
