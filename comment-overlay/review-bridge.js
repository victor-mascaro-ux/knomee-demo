// Review bridge — load this INSIDE the app that the overlay iframes (the
// #ccProto page), e.g. <script src="review-bridge.js"></script>. It lets the
// activation key work while focus is inside the frame, reports the document
// height so the overlay can size the iframe to the full scrolling content
// (keeping pins anchored), and scrolls the content when the overlay forwards a
// wheel gesture in comment mode.
//
// Only needed for the WRAPPER (iframe) model. In the INLINE model, skip this.
// When the app is opened standalone (not iframed) this is a no-op.
(function () {
  'use strict';
  if (window.parent === window) return;
  var parent = window.parent;

  // Toggle on a single key: "c" for comment (works everywhere, incl. macOS,
  // unlike bare function keys). F2 is an alias. "c" is ignored while typing in
  // a field and requires no Cmd/Ctrl/Alt, so it never hijacks copy.
  function isEditableTarget(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }
  function isToggleCombo(e) {
    if (e.key === 'F2') return true;
    if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
      return !isEditableTarget(e.target);
    }
    return false;
  }

  window.addEventListener('keydown', function (e) {
    if (isToggleCombo(e)) {
      e.preventDefault();
      parent.postMessage({ type: 'cc-activate' }, '*');
    }
  });

  // In comment mode the overlay covers the frame to catch pin clicks; it hands
  // scroll gestures here when the parent document itself can't scroll (a
  // fixed-layout page scrolls inside its own panel). Adjust the selector below
  // to your app's full-page inner scroller if it has one.
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== 'cc-scroll') return;
    var dx = d.dx || 0, dy = d.dy || 0;
    var inner = Array.prototype.slice
      .call(document.querySelectorAll('.landing, [data-cc-scroller]'))
      .find(function (el) { return el.scrollHeight > el.clientHeight; });
    if (inner) inner.scrollBy(dx, dy);
    else window.scrollBy(dx, dy);
  });

  var last = 0;
  function reportHeight() {
    var h = Math.ceil(document.documentElement.scrollHeight);
    if (h !== last) {
      last = h;
      parent.postMessage({ type: 'cc-frame-height', height: h }, '*');
    }
  }
  window.addEventListener('load', reportHeight);
  window.addEventListener('resize', reportHeight);
  if ('ResizeObserver' in window) {
    new ResizeObserver(reportHeight).observe(document.documentElement);
  }
  window.setInterval(reportHeight, 1000); // safety net for late layout shifts
  reportHeight();
})();
