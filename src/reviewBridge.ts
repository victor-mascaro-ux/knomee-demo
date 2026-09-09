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
}
