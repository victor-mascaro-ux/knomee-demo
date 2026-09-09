// Review bridge — active only when this app runs inside the commenting
// overlay's iframe (index.html). It forwards the activation key to the parent
// (so the overlay can be toggled while focus sits inside the prototype) and
// reports the document's height so the overlay can size the iframe to the full
// scrolling content, keeping comment pins anchored to the content.
//
// When the app is opened standalone (window.parent === window) this is a no-op.

// The overlay toggles on a single key: "c" for comment (works everywhere,
// including macOS, unlike bare function keys). F2 stays as an alias. "c" is
// ignored while typing in a field, and requires no ⌘/Ctrl/Alt so it never
// hijacks copy (⌘/Ctrl+C).
const isEditableTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}
const isToggleCombo = (e: KeyboardEvent) => {
  if (e.key === 'F2') return true
  if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
    return !isEditableTarget(e.target)
  }
  return false
}
// "d" for demo does the same for the overlay's demo panel — a separate layer
// with its own key, so summoning the demo controls never arms commenting.
const isDemoCombo = (e: KeyboardEvent) => {
  if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey && !e.altKey) {
    return !isEditableTarget(e.target)
  }
  return false
}

// ── Sticky rails, inside a frame that cannot scroll ──────────────────────────
// The overlay sizes this iframe to the full height of the content on purpose,
// so comment pins (stored as percentages of the frame) anchor to the content
// and scroll with it. The side effect is that this document never scrolls: the
// parent does. `position: sticky` measures against the nearest scrollport, and
// here that scrollport never moves — so a lateral menu that sticks perfectly
// when the app is opened on its own just rides the page off the top here.
//
// Nothing in the app's CSS can see the parent's scroll, so the offset is
// applied from here instead. Parent and frame are same-origin, so the frame's
// own box gives us the parent's scroll position for free — no message, and no
// change to the overlay. Each rail is translated by exactly what `sticky`
// would have done: hold `top` once the rail would pass it, and stop at the
// bottom of the column it belongs to.
const STICKY_RAILS = '.pp-side-inner, .settings-side-inner'
const STICKY_TOP = 12

function initStickyRails(frame: Element) {
  const shifts = new WeakMap<HTMLElement, number>()

  const sync = () => {
    // While the frame is short enough that this document scrolls on its own,
    // native sticky is doing the work and must not be doubled up on.
    const root = document.documentElement
    if (root.scrollHeight > root.clientHeight + 1) return

    const frameTop = frame.getBoundingClientRect().top
    document.querySelectorAll<HTMLElement>(STICKY_RAILS).forEach((el) => {
      const container = el.parentElement
      if (!container) return
      // Only where the stylesheet actually asked for sticky — the phone layouts
      // set these back to static and reorder the rail below the content.
      if (getComputedStyle(el).position !== 'sticky') {
        if (shifts.get(el)) {
          shifts.set(el, 0)
          el.style.transform = ''
        }
        return
      }

      const prev = shifts.get(el) || 0
      const elRect = el.getBoundingClientRect()
      const cRect = container.getBoundingClientRect()
      const naturalTop = elRect.top - prev
      // Sticky stops at the bottom of its containing block rather than
      // escaping it.
      const maxShift = Math.max(0, cRect.bottom - naturalTop - elRect.height)
      const wanted = STICKY_TOP - (frameTop + naturalTop)
      const shift = Math.min(Math.max(0, wanted), maxShift)

      if (Math.abs(shift - prev) > 0.5) {
        shifts.set(el, shift)
        el.style.transform = shift ? `translateY(${shift}px)` : ''
      }
    })
  }

  // Run on the scroll event itself rather than inside requestAnimationFrame.
  // rAF only fires when the frame is actually being painted, and this frame
  // spends plenty of time not being painted — occluded, backgrounded, or in a
  // headless check — which left the rail frozen at whatever offset it last
  // computed. Two elements and two rect reads per event is cheap enough to do
  // straight away, and the listener is passive so scrolling stays smooth.
  try {
    window.parent.addEventListener('scroll', sync, { passive: true })
    window.parent.addEventListener('resize', sync)
  } catch {
    return // cross-origin parent: nothing to read, leave the rails alone
  }
  window.addEventListener('resize', sync)
  window.addEventListener('load', sync)
  if ('ResizeObserver' in window) {
    new ResizeObserver(sync).observe(document.documentElement)
  }
  sync()
}

export function initReviewBridge() {
  if (window.parent === window) return
  const parent = window.parent

  window.addEventListener('keydown', (e) => {
    if (isToggleCombo(e)) {
      e.preventDefault()
      parent.postMessage({ type: 'cc-activate' }, '*')
    } else if (isDemoCombo(e)) {
      e.preventDefault()
      parent.postMessage({ type: 'cc-demo-activate' }, '*')
    }
  })

  // In comment mode the overlay covers the frame to catch pin clicks; it hands
  // scroll gestures here when the parent document itself can't scroll (a
  // fixed-layout page like the welcome page scrolls inside its own panel).
  window.addEventListener('message', (e) => {
    const d = e.data as { type?: string; dx?: number; dy?: number } | null
    if (!d || d.type !== 'cc-scroll') return
    const dx = d.dx || 0
    const dy = d.dy || 0
    // Prefer a full-page inner scroller (e.g. `.landing`); fall back to window.
    const inner = Array.from(document.querySelectorAll<HTMLElement>('.landing')).find(
      (el) => el.scrollHeight > el.clientHeight,
    )
    if (inner) inner.scrollBy(dx, dy)
    else window.scrollBy(dx, dy)
  })

  // How tall the content actually is. NOT `documentElement.scrollHeight`: the
  // shell sizes the iframe to whatever we report, and the iframe's viewport is
  // then a floor under that number — so a page that grew (zooming the phone in)
  // could never report its way back down, and the frame kept the extra height
  // as a white band under the content. The mount node's own box has no such
  // floor, so it tracks the content down as well as up.
  // A fixed-layout page (the welcome page, the phone) is sized BY the viewport
  // rather than sizing it: everything inside is `position: fixed`, so the mount
  // node's own box measures ~0. Reporting that collapsed the frame to nothing,
  // which left the page no viewport to fill — so it measured ~0 again and could
  // never recover. 0 is the signal for "one viewport tall"; the shell knows how
  // tall a viewport is, and this frame (already collapsed) no longer does.
  const contentHeight = () => {
    const root = document.getElementById('root')
    const h = root ? root.getBoundingClientRect().height : document.body.scrollHeight
    if (h < 2) return 0
    return Math.ceil(h)
  }

  let last = 0
  const reportHeight = () => {
    const h = contentHeight()
    if (h !== last) {
      last = h
      parent.postMessage({ type: 'cc-frame-height', height: h }, '*')
    }
  }

  window.addEventListener('load', reportHeight)
  window.addEventListener('resize', reportHeight)
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(reportHeight)
    ro.observe(document.documentElement)
    const root = document.getElementById('root')
    if (root) ro.observe(root)
  }
  // Safety net for late layout shifts (fonts, images, collapsible sections).
  window.setInterval(reportHeight, 1000)
  reportHeight()

  const frame = window.frameElement
  if (frame) initStickyRails(frame)
}
