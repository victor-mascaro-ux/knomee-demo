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
const STICKY_RAILS =
  '.topbar, .pp-crumb, .pp-tabs, .pp-side-inner, .settings-side-inner'
/* The same fault from the other end. `position: fixed` also resolves against
   this frame's viewport, and this frame's viewport IS the whole document — so
   a credit pinned 14px off the bottom lands 14px off the bottom of a 3,700px
   page and is never on screen. It rides the parent's window instead. */
const FIXED_FOOT = '.powered-by'

function initStickyRails(frame: Element) {
  const shifts = new WeakMap<HTMLElement, number>()

  /* Put every rail back where the stylesheet had it. */
  const release = () => {
    document.querySelectorAll<HTMLElement>(`${STICKY_RAILS}, ${FIXED_FOOT}`).forEach((el) => {
      if (!shifts.get(el)) return
      shifts.set(el, 0)
      el.style.transform = ''
    })
  }

  const sync = () => {
    // While the frame is short enough that this document scrolls on its own,
    // native sticky is doing the work and must not be doubled up on.
    //
    // Letting go has to be deliberate: leaving comment mode shortens the frame
    // back to one viewport, and simply returning here left every rail wearing
    // the offset from the last time the parent scrolled — a top bar stranded
    // a third of the way down the page, painting over the title, until a
    // reload. The transforms are ours, so we clear them.
    const root = document.documentElement
    if (root.scrollHeight > root.clientHeight + 1) {
      release()
      return
    }

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

      // Each element's own `top` rather than one constant: the bar pins at 0
      // and the rails pin below it.
      const stickyTop = parseFloat(getComputedStyle(el).top) || 0
      const prev = shifts.get(el) || 0
      const elRect = el.getBoundingClientRect()
      const cRect = container.getBoundingClientRect()
      const naturalTop = elRect.top - prev
      // Sticky stops at the bottom of its containing block rather than
      // escaping it.
      const maxShift = Math.max(0, cRect.bottom - naturalTop - elRect.height)
      const wanted = stickyTop - (frameTop + naturalTop)
      const shift = Math.min(Math.max(0, wanted), maxShift)

      if (Math.abs(shift - prev) > 0.5) {
        shifts.set(el, shift)
        el.style.transform = shift ? `translateY(${shift}px)` : ''
      }
    })

    // Bottom-anchored, so the target is the parent window's bottom rather than
    // a `top` offset: put the element's own bottom `bottom`px above it.
    const view = frame.ownerDocument.defaultView
    const viewportH = view ? view.innerHeight : 0
    if (!viewportH) return
    document.querySelectorAll<HTMLElement>(FIXED_FOOT).forEach((el) => {
      if (getComputedStyle(el).position !== 'fixed') return
      const prev = shifts.get(el) || 0
      const r = el.getBoundingClientRect()
      const naturalTop = r.top - prev
      const inset = parseFloat(getComputedStyle(el).bottom) || 0
      const wanted = viewportH - inset - r.height - frameTop - naturalTop
      if (Math.abs(wanted - prev) > 0.5) {
        shifts.set(el, wanted)
        el.style.transform = `translateY(${wanted}px)`
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
  /* The one event that actually fires when the overlay resizes this frame.
     `window.resize` is supposed to, and does not reliably for an iframe the
     parent has restyled; the ResizeObserver above watches the html element's
     own box, which is content-driven and does not move when the VIEWPORT
     around it changes. The visual viewport is precisely the thing that just
     changed — and it is the difference between the rails letting go when you
     leave comment mode and a top bar stranded over the page until reload. */
  window.visualViewport?.addEventListener('resize', sync)
  /* And the signal that is actually certain: the overlay, saying it has just
     resized this frame. A resized iframe does not reliably fire `resize`
     inside itself, and when it does the new box is not laid out yet — so this
     runs on the next frame, and again shortly after, rather than immediately. */
  window.addEventListener('message', (e) => {
    if ((e.data as { type?: string } | null)?.type !== 'cc-frame-sized') return
    requestAnimationFrame(sync)
    window.setTimeout(sync, 80)
  })
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
    } else if (e.key === 'Escape') {
      // Esc is the way out of the overlay's own layers, and its listener lives
      // in the parent document — which never sees a key pressed in here, where
      // focus sits the moment anybody clicks the prototype. Forwarded rather
      // than swallowed: this page has its own things Esc closes, and the
      // overlay only acts if one of ITS layers is open.
      parent.postMessage({ type: 'cc-escape' }, '*')
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

/* Back to the top of the page. Inside the review frame this document does not
   scroll — the parent does — so scrolling here alone would look like nothing
   happened. Same-origin, so the parent can be scrolled directly; standalone,
   the first call is the one that does the work. */
export function scrollPageToTop() {
  window.scrollTo(0, 0)
  if (window.parent === window) return
  try {
    window.parent.scrollTo(0, 0)
  } catch {
    /* cross-origin parent: nothing we can do, and nothing that breaks */
  }
}
