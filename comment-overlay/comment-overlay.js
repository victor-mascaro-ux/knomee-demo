(function () {
  'use strict';

  // ────────────────────────────────────────────────────────
  // Config — change these for your project.
  //
  // PROJECT_ID: unique id for THIS project. If USE_FIRESTORE is on, comments
  //   are namespaced by it in the shared Firestore project, so two sites left
  //   on the same id would share one comment thread. MUST be unique.
  // THEME: 'neutral-frost' | 'smoke-tray' | 'branded-frost'
  // USE_FIRESTORE: false (default) = comments persist to the reviewer's
  //   localStorage only, zero config. true = real-time sync via Firestore
  //   (fill in `firebaseConfig` below with YOUR OWN Firebase project).
  // SEED_DEMO: true = seeds 3 fake comments and skips all persistence — for
  //   previewing the overlay itself. Leave false in real projects.
  // ACTIVATION_KEY / the "c" shortcut: reveals/hides the overlay.
  // ────────────────────────────────────────────────────────
  const PROJECT_ID    = 'CHANGE-ME-unique-project-id';
  const THEME         = 'neutral-frost';
  const USE_FIRESTORE = false;
  const SEED_DEMO     = false;
  const ACTIVATION_KEY = 'F2';
  // ────────────────────────────────────────────────────────

  const stage    = document.getElementById('ccStage');
  const frame    = document.getElementById('ccFrame');
  const proto    = document.getElementById('ccProto');
  const catcher  = document.getElementById('ccCatcher');
  const pinLayer = document.getElementById('ccPinLayer');
  const closeModeBtn = document.getElementById('ccCloseMode');
  const listEl   = document.getElementById('ccList');
  const countEl  = document.getElementById('ccCount');
  const clearBtn = document.getElementById('ccClearAll');
  const rail     = document.getElementById('ccRail');
  const collapseBtn = document.getElementById('ccCollapse');
  const RAIL_COLLAPSED_KEY = 'knomee-cc-rail-collapsed';

  stage.dataset.ccTheme = THEME;

  const STORE_KEY = 'knomee-prototype-feedback::' + PROJECT_ID;

  let store = { threads: [] };
  let draft = null;            // unpersisted thread while composing the first note
  let activeId = null;
  let popoverEl = null;
  let commentMode = false;
  let currentScreen = 'default';

  // ── Shared storage (Firestore) ──────────────────────────
  // Deliberate deviation from the design spec's localStorage-only
  // persistence: comments must be shared across reviewers/devices (same
  // behavior as the knomee-video feedback tool), so Firestore is the
  // source of truth and localStorage is only a fast-paint seed and
  // offline fallback. Same Firebase project AND same top-level
  // collection ("video-feedback") as the video tool — the project's
  // security rules only allow that one collection name — namespaced
  // by PROJECT_ID as the doc ID.
  // Fill in with YOUR OWN Firebase project when USE_FIRESTORE is true. The
  // two firebase-*-compat.js <script> tags must be loaded in the host page.
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  let db = null, stateRef = null, threadsRef = null;
  if (USE_FIRESTORE) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    stateRef = db.collection('video-feedback').doc(PROJECT_ID);
    threadsRef = stateRef.collection('comments');
  }

  // Accepts both the current schema and legacy single-text comments
  // (pre-threads) so old data keeps rendering. Legacy comments have no
  // screen — screen:null is treated as "show on every screen".
  function normalize(raw) {
    return {
      id: raw.id,
      screen: (typeof raw.screen === 'string') ? raw.screen : null,
      x: raw.x, y: raw.y,
      img: raw.img || null,
      createdAt: raw.createdAt || Date.now(),
      resolved: !!raw.resolved,
      messages: Array.isArray(raw.messages) ? raw.messages
        : (raw.text ? [{ text: raw.text, createdAt: raw.createdAt || Date.now() }] : [])
    };
  }

  function loadLocalFallback() {
    if (SEED_DEMO) return;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed.threads) ? parsed.threads
          : (Array.isArray(parsed.comments) ? parsed.comments : []);
        store.threads = items.map(normalize);
      }
    } catch (e) { /* keep defaults */ }
  }
  function cacheLocally() {
    if (SEED_DEMO) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ threads: store.threads })); }
    catch (e) { /* best-effort only */ }
  }

  function initSync() {
    if (SEED_DEMO || !USE_FIRESTORE) return;
    threadsRef.orderBy('createdAt').onSnapshot(snap => {
      store.threads = snap.docs.map(d => normalize(d.data()));
      cacheLocally();
      renderAll();
      refreshOpenThread();
    }, err => {
      console.warn('Firestore sync error', err);
      showWarning("Can't reach the shared comment server — showing your last saved copy.");
    });
  }

  function persistThread(t) {
    cacheLocally();
    if (SEED_DEMO || !USE_FIRESTORE) return;
    threadsRef.doc(t.id).set(t).catch(err => {
      console.warn('Could not save comment', err);
      showWarning();
    });
  }
  function persistDelete(id) {
    cacheLocally();
    if (SEED_DEMO || !USE_FIRESTORE) return;
    threadsRef.doc(id).delete().catch(err => {
      console.warn('Could not delete comment', err);
      showWarning();
    });
  }

  let warningEl = null;
  function showWarning(message, sticky) {
    const text = message || "Couldn't save that change — it may be lost on reload.";
    if (warningEl) { warningEl.textContent = text; return; }
    const el = document.createElement('div');
    el.className = 'cc-warning';
    el.textContent = text;
    document.body.appendChild(el);
    warningEl = el;
    if (sticky) {
      el.style.cursor = 'pointer';
      el.title = 'Dismiss';
      el.addEventListener('click', () => { el.remove(); if (warningEl === el) warningEl = null; });
    } else {
      setTimeout(() => { el.remove(); if (warningEl === el) warningEl = null; }, 7000);
    }
  }

  // ── Namespace conflict detection ─────────────────────────
  // Warns if and only if a different deployment is actually using this
  // PROJECT_ID. Each deployed site stamps the state doc with its URL;
  // finding someone else's stamp means two sites share one thread.
  // localhost/file:// is skipped so local dev never trips it.
  const SITE_ID = location.host + location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
  const IS_LOCAL_DEV = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  function checkNamespaceConflict() {
    if (IS_LOCAL_DEV || SEED_DEMO || !USE_FIRESTORE) return;
    stateRef.get().then(snap => {
      const claimedBy = snap.exists ? snap.data().claimedBy : null;
      if (claimedBy && claimedBy !== SITE_ID) {
        showWarning('Another prototype (' + claimedBy + ') uses the same PROJECT_ID — you are seeing and overwriting each other\'s comments. Change PROJECT_ID in index.html. (Click to dismiss)', true);
      }
      return stateRef.set({ claimedBy: SITE_ID }, { merge: true });
    }).catch(err => console.warn('Namespace conflict check failed', err));
  }

  // ── Screens ──────────────────────────────────────────────
  // Pins belong to a screen. The overlay reads the prototype's current
  // screen id without requiring integration: a prototype can expose
  // window.__ccScreenId, or use the .screen.active convention (like the
  // dummy). Falls back to a single 'default' screen.
  function getScreenId() {
    try {
      const w = proto.contentWindow;
      if (w && w.__ccScreenId) return String(w.__ccScreenId);
      const d = proto.contentDocument;
      const el = d && d.querySelector('.screen.active');
      if (el && el.id) return el.id;
    } catch (e) { /* cross-origin or not ready */ }
    return 'default';
  }
  setInterval(() => {
    const s = getScreenId();
    if (s !== currentScreen) {
      currentScreen = s;
      closeThread();
      renderAll();
    }
  }, 400);

  // ── Helpers ──────────────────────────────────────────────
  function relTime(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 10) return 'Just now';
    if (s < 60) return s + 's ago';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  function findThread(id) {
    if (draft && draft.id === id) return draft;
    return store.threads.find(t => t.id === id) || null;
  }

  // Unresolved threads on the current screen (legacy null-screen threads
  // show everywhere), in creation order — their index is the pin number.
  function visibleThreads() {
    const list = store.threads.filter(t =>
      !t.resolved && (t.screen === null || t.screen === currentScreen));
    if (draft) list.push(draft);
    return list.sort((a, b) => a.createdAt - b.createdAt);
  }

  // ── Capture (rail thumbnails) ────────────────────────────
  function captureFrame() {
    let target;
    try { target = proto.contentDocument.body; } catch (e) { target = null; }
    if (!target || typeof html2canvas === 'undefined') return Promise.resolve(null);
    const w = proto.clientWidth, h = proto.clientHeight;
    return html2canvas(target, {
      backgroundColor: '#ffffff', logging: false, useCORS: true,
      foreignObjectRendering: true,
      width: w, height: h, windowWidth: w, windowHeight: h,
      scale: Math.min(1, 900 / w)
    }).then(c => c.toDataURL('image/jpeg', 0.8)).catch(() => null);
  }

  // ── Rendering ────────────────────────────────────────────
  function renderAll() { renderPins(); renderRail(); }

  function renderPins() {
    pinLayer.innerHTML = '';
    visibleThreads().forEach((t, i) => {
      const wrap = document.createElement('button');
      wrap.className = 'cc-pin-wrap' + (t.id === activeId ? ' cc-active' : '');
      wrap.style.left = t.x + '%';
      wrap.style.top = t.y + '%';
      wrap.setAttribute('aria-label', 'Comment ' + (i + 1));
      wrap.innerHTML = '<div class="cc-pin"><span>' + (i + 1) + '</span></div>';
      wrap.addEventListener('click', (e) => { e.stopPropagation(); openThread(t.id); });
      pinLayer.appendChild(wrap);
    });
  }

  function renderRail() {
    const visible = visibleThreads().filter(t => t !== draft);
    const numbers = new Map(visibleThreads().map((t, i) => [t.id, i + 1]));
    countEl.textContent = String(visible.length);
    clearBtn.disabled = store.threads.length === 0;
    listEl.innerHTML = '';

    if (!visible.length) {
      const empty = document.createElement('div');
      empty.className = 'cc-empty';
      empty.innerHTML =
        '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" stroke-linejoin="round"/>' +
          '<circle cx="12" cy="10" r="2.4" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.5 2.5"/>' +
        '</svg>' +
        '<div class="cc-empty-title">No comments yet</div>' +
        '<div class="cc-empty-sub">Click anywhere on the frame to drop a pin and leave the first note.</div>';
      listEl.appendChild(empty);
      return;
    }

    // newest first
    visible.slice().sort((a, b) => b.createdAt - a.createdAt).forEach(t => {
      const card = document.createElement('button');
      card.className = 'cc-card' + (t.id === activeId ? ' cc-active' : '');

      const thumb = document.createElement('div');
      thumb.className = 'cc-thumb';
      if (t.img) {
        const img = document.createElement('img');
        img.src = t.img; img.alt = '';
        thumb.appendChild(img);
      }
      const dot = document.createElement('div');
      dot.className = 'cc-thumb-dot';
      dot.style.left = t.x + '%'; dot.style.top = t.y + '%';
      thumb.appendChild(dot);

      const body = document.createElement('div');
      body.className = 'cc-card-body';
      const meta = document.createElement('div');
      meta.className = 'cc-card-meta';
      meta.innerHTML = '<div class="cc-token"><span>' + (numbers.get(t.id) || '') + '</span></div>';
      const time = document.createElement('span');
      time.className = 'cc-time';
      time.textContent = relTime(t.createdAt);
      meta.appendChild(time);
      const snippet = document.createElement('div');
      snippet.className = 'cc-snippet';
      snippet.textContent = t.messages.length ? t.messages[0].text : '…';
      body.appendChild(meta);
      body.appendChild(snippet);

      card.appendChild(thumb);
      card.appendChild(body);
      card.addEventListener('click', (e) => { e.stopPropagation(); openThread(t.id); });
      listEl.appendChild(card);
    });
  }

  // ── Thread popover ───────────────────────────────────────
  function clampPopover(el, xPct, yPct) {
    const fw = frame.clientWidth, fh = frame.clientHeight;
    const px = (xPct / 100) * fw, py = (yPct / 100) * fh;
    const w = el.offsetWidth || 300, h = el.offsetHeight || 160;
    let left = px + 18;
    if (left + w > fw - 10) left = px - w - 18;
    if (left < 10) left = 10;
    let top = py - 10;
    if (top + h > fh - 10) top = fh - h - 10;
    if (top < 10) top = 10;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  function removePopover() {
    if (popoverEl) { popoverEl.remove(); popoverEl = null; }
  }

  function fillMessages(container, t) {
    container.innerHTML = '';
    t.messages.forEach((m, i) => {
      const msg = document.createElement('div');
      msg.className = 'cc-msg';
      if (i > 0) {
        const mt = document.createElement('div');
        mt.className = 'cc-msg-time';
        mt.textContent = relTime(m.createdAt);
        msg.appendChild(mt);
      }
      const txt = document.createElement('div');
      txt.className = 'cc-msg-text';
      txt.textContent = m.text;
      msg.appendChild(txt);
      container.appendChild(msg);
    });
  }

  // Keeps an open popover honest when a Firestore snapshot replaces
  // store.threads (e.g. another reviewer replied, or our own write echoed
  // back) — without rebuilding the popover, which would eat focus and any
  // half-typed reply.
  function refreshOpenThread() {
    if (!activeId || !popoverEl) return;
    if (draft && draft.id === activeId) return;   // drafts aren't in the store yet
    const t = store.threads.find(x => x.id === activeId);
    if (!t || t.resolved) { closeThread(); return; }   // gone or resolved elsewhere
    const msgs = popoverEl.querySelector('.cc-msgs');
    if (msgs) fillMessages(msgs, t);
  }

  function openThread(id) {
    const t = findThread(id);
    if (!t) return;
    // switching threads discards an empty draft
    if (draft && draft.id !== id && !draft.messages.length) discardDraft();
    activeId = id;
    removePopover();

    const pop = document.createElement('div');
    pop.className = 'cc-popover cc-chrome';
    pop.addEventListener('click', (e) => e.stopPropagation());

    // head: timestamp + delete — no identity chrome
    const head = document.createElement('div');
    head.className = 'cc-pop-head';
    const time = document.createElement('span');
    time.className = 'cc-pop-time';
    time.textContent = t.messages.length ? relTime(t.createdAt) : 'New comment';
    // Delete is always present (the collapsed "menu" — just this one icon).
    // On a real thread it confirms and removes; on an empty draft it just
    // discards the pin.
    const actions = document.createElement('div');
    actions.className = 'cc-pop-actions';
    const del = document.createElement('button');
    del.className = 'cc-icon-btn';
    del.title = 'Delete'; del.setAttribute('aria-label', 'Delete comment');
    del.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    del.addEventListener('click', () => {
      if (t.messages.length) {
        if (!confirm('Delete this comment thread?')) return;
        store.threads = store.threads.filter(x => x.id !== t.id);
        persistDelete(t.id);
      }
      closeThread();   // an empty draft simply discards
    });
    actions.appendChild(del);
    head.appendChild(time);
    head.appendChild(actions);
    pop.appendChild(head);

    // body: messages (first = the note, rest = replies)
    const msgs = document.createElement('div');
    msgs.className = 'cc-msgs';
    fillMessages(msgs, t);
    pop.appendChild(msgs);

    // foot: reply input + send
    const foot = document.createElement('div');
    foot.className = 'cc-pop-foot';
    const input = document.createElement('textarea');
    input.className = 'cc-reply';
    input.rows = 1;
    input.placeholder = t.messages.length ? 'Reply…' : 'Add a comment…';
    const send = document.createElement('button');
    send.className = 'cc-send';
    send.title = 'Send'; send.setAttribute('aria-label', 'Send');
    send.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function doSend() {
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      t.messages.push({ text: text, createdAt: Date.now() });
      // Replace-by-id rather than plain push: a Firestore snapshot may have
      // swapped store.threads for fresh objects since this popover opened,
      // leaving `t` a stale reference that findThread would no longer see.
      store.threads = store.threads.filter(x => x.id !== t.id);
      store.threads.push(t);
      if (draft && draft.id === t.id) draft = null;   // first message makes the draft real
      persistThread(t);
      openThread(t.id);   // re-render popover with the new message
      renderAll();
    }
    send.addEventListener('click', doSend);
    // Grow the input with its content (up to the CSS max-height, then scroll),
    // re-clamping the popover so it doesn't slide off the frame as it grows.
    function autoGrow() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 140) + 'px';
      if (popoverEl) clampPopover(popoverEl, t.x, t.y);
    }
    input.addEventListener('input', autoGrow);
    input.addEventListener('keydown', (e) => {
      // Enter sends; Shift+Enter inserts a line break. (Esc is handled once,
      // globally, by the capture-phase listener — never here.)
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });
    foot.appendChild(input);
    foot.appendChild(send);
    pop.appendChild(foot);

    frame.appendChild(pop);
    popoverEl = pop;
    clampPopover(pop, t.x, t.y);
    input.focus();
    autoGrow();

    renderAll();
  }

  function discardDraft() {
    draft = null;
  }

  function closeThread() {
    if (draft && !draft.messages.length) discardDraft();
    activeId = null;
    removePopover();
    renderAll();
  }

  // ── Comment mode ─────────────────────────────────────────
  function setMode(on) {
    commentMode = on;
    stage.classList.toggle('cc-mode', on);
    if (!on) closeThread();
  }

  closeModeBtn.addEventListener('click', (e) => { e.stopPropagation(); setMode(false); });

  // ── Armed state: the overlay stays hidden until ACTIVATION_KEY ─────────
  // Arming reveals the chrome and drops straight into comment mode; pressing
  // the key again (or Esc) hides everything and returns the prototype to a
  // clean, fully interactive state.
  let armed = false;
  function setArmed(on) {
    armed = on;
    stage.classList.toggle('cc-armed', on);
    setMode(on);
    if (!on) setRailCollapsed(true);
  }
  function toggleArmed() { setArmed(!armed); }

  // Single-key toggle: "c" for comment (works everywhere, incl. macOS, unlike
  // bare function keys). F2 stays as an alias. "c" is ignored while typing in a
  // field and requires no ⌘/Ctrl/Alt, so it never hijacks copy.
  function isEditableTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }
  function isToggleCombo(e) {
    if (e.key === ACTIVATION_KEY) return true;
    if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
      return !isEditableTarget(e.target);
    }
    return false;
  }
  window.addEventListener('keydown', (e) => {
    if (isToggleCombo(e)) { e.preventDefault(); toggleArmed(); }
  });

  // Messages from the prototype iframe: the activation key forwarded from
  // inside the frame (where focus normally sits), and the frame's content
  // height so we can size the iframe and keep pins anchored to the content.
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'cc-activate') {
      toggleArmed();
    } else if (d.type === 'cc-frame-height' && typeof d.height === 'number') {
      proto.style.height = Math.max(d.height, 1) + 'px';
    } else if (d.type === 'cc-route' && typeof d.hash === 'string') {
      // Mirror the prototype's current page into our address bar so the URL
      // people copy always points at the page they're looking at.
      if (window.location.hash !== d.hash) {
        history.replaceState(null, '', d.hash || location.pathname + location.search);
      }
    }
  });

  // A shared link opened here (or the user editing the hash) → tell the frame
  // to navigate to that page.
  window.addEventListener('hashchange', () => {
    if (proto.contentWindow) {
      proto.contentWindow.postMessage({ type: 'cc-nav', hash: window.location.hash }, '*');
    }
  });

  function setRailCollapsed(on) {
    rail.classList.toggle('cc-collapsed', on);
    collapseBtn.title = on ? 'Expand comments' : 'Collapse comments';
    collapseBtn.setAttribute('aria-label', collapseBtn.title);
    try { localStorage.setItem(RAIL_COLLAPSED_KEY, on ? '1' : '0'); } catch (e) { /* best-effort */ }
  }
  collapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setRailCollapsed(!rail.classList.contains('cc-collapsed'));
  });

  // Comment mode must never trap the page scroll: the catcher sits over the
  // prototype to intercept pin clicks, but wheel / trackpad gestures should
  // still scroll the prototype behind it. Most pages scroll the parent document
  // (the iframe is sized to full content); fixed-layout pages (e.g. the welcome
  // page) scroll INSIDE the frame instead, so hand the delta to the app there
  // when the parent can't move.
  catcher.addEventListener('wheel', (e) => {
    const factor = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    const dx = e.deltaX * factor, dy = e.deltaY * factor;
    const y0 = window.scrollY, x0 = window.scrollX;
    window.scrollBy(dx, dy);
    if (window.scrollY === y0 && window.scrollX === x0 && proto.contentWindow) {
      proto.contentWindow.postMessage({ type: 'cc-scroll', dx: dx, dy: dy }, '*');
    }
    e.preventDefault();
  }, { passive: false });

  // drop a pin
  catcher.addEventListener('click', (e) => {
    e.stopPropagation();
    closeThread();
    const rect = catcher.getBoundingClientRect();
    const xPct = Math.min(98, Math.max(2, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(96, Math.max(4, ((e.clientY - rect.top) / rect.height) * 100));
    const t = {
      id: 'c' + Date.now() + Math.random().toString(36).slice(2, 7),
      screen: currentScreen,
      x: xPct, y: yPct,
      img: null,
      createdAt: Date.now(),
      resolved: false,
      messages: []
    };
    draft = t;
    openThread(t.id);
    // thumbnail for the rail card — captured async, attached when ready
    captureFrame().then(url => {
      if (!url) return;
      const live = findThread(t.id);
      if (!live) return;   // draft was discarded
      live.img = url;
      if (!draft || draft.id !== live.id) persistThread(live);
      renderRail();
    });
  });

  // click outside an open thread closes it
  document.addEventListener('click', (e) => {
    if (!activeId) return;
    if (popoverEl && popoverEl.contains(e.target)) return;
    if (e.target.closest && e.target.closest('.cc-pin-wrap, .cc-card')) return;
    closeThread();
  });

  // Single source of truth for Esc, in the CAPTURE phase so it runs before
  // any element-level handler and behaves identically no matter where focus
  // sits (reply input, a pin, the body). One Esc is a full retreat: it
  // dismisses any open card, exits comment mode, AND tucks the persistent
  // menu back to its slim tab — the prototype is left clean in one press.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const menuOpen = !rail.classList.contains('cc-collapsed');
    if (!activeId && !commentMode && !menuOpen && !armed) return;
    e.preventDefault();
    e.stopPropagation();
    if (activeId) closeThread();       // dismiss any open card first
    setArmed(false);                   // full retreat: hide the overlay entirely
  }, true);

  // ── Clear all ────────────────────────────────────────────
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!store.threads.length) return;
    if (!confirm('Delete all ' + store.threads.length + ' comment thread(s)? This can\'t be undone.')) return;
    const ids = store.threads.map(t => t.id);
    store.threads = [];
    closeThread();
    cacheLocally();
    if (!SEED_DEMO) {
      const batch = db.batch();
      ids.forEach(id => batch.delete(threadsRef.doc(id)));
      batch.commit().catch(err => {
        console.warn('Could not clear comments', err);
        showWarning("Couldn't clear all comments on the shared server — they may reappear on reload.");
      });
    }
  });

  // ── Demo seeding (SEED_DEMO only — memory only, no persistence) ──
  function seedDemo() {
    const now = Date.now();
    const mk = (x, y, mins, msgs) => ({
      id: 'demo' + x + y, screen: null, x: x, y: y, img: null,
      createdAt: now - mins * 60000, resolved: false,
      messages: msgs.map((m, i) => ({ text: m, createdAt: now - mins * 60000 + i * 90000 }))
    });
    store.threads = [
      mk(38, 30, 42, ['The headline feels one size too small at this width.']),
      mk(62, 52, 18, ['Can this field validate on blur instead of on submit?', 'Agreed — on-submit-only feels laggy here.']),
      mk(50, 74, 6,  ['Love the button treatment. Ship it.'])
    ];
    setMode(true);
    renderAll();
    openThread(store.threads[1].id);
  }

  // ── Init ─────────────────────────────────────────────────
  // The menu is persistent, so default it to the slim collapsed tab — it
  // stays reachable at all times without covering the prototype. Only an
  // explicit '0' (the reviewer expanded it before) keeps it open on load.
  try { setRailCollapsed(localStorage.getItem(RAIL_COLLAPSED_KEY) !== '0'); }
  catch (e) { setRailCollapsed(true); }
  loadLocalFallback();
  renderAll();
  initSync();
  checkNamespaceConflict();
  if (SEED_DEMO) {
    // wait a beat for the iframe so pins land over painted content
    setTimeout(seedDemo, 600);
  }
})();
