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

export function initReviewBridge() {
  if (window.parent === window) return
  const parent = window.parent

  window.addEventListener('keydown', (e) => {
    if (isToggleCombo(e)) {
      e.preventDefault()
      parent.postMessage({ type: 'cc-activate' }, '*')
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

  let last = 0
  const reportHeight = () => {
    const h = Math.ceil(document.documentElement.scrollHeight)
    if (h !== last) {
      last = h
      parent.postMessage({ type: 'cc-frame-height', height: h }, '*')
    }
  }

  window.addEventListener('load', reportHeight)
  window.addEventListener('resize', reportHeight)
  if ('ResizeObserver' in window) {
    new ResizeObserver(reportHeight).observe(document.documentElement)
  }
  // Safety net for late layout shifts (fonts, images, collapsible sections).
  window.setInterval(reportHeight, 1000)
  reportHeight()
}
