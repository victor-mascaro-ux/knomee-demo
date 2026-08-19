# Commenting / review overlay

A self-contained, framework-agnostic "sticky-note review" overlay. A reviewer
presses **C** to enter comment mode, clicks anywhere to drop a numbered pin, and
writes threaded comments in a collapsible side rail. Comments persist and are
scoped per screen. Everything is namespaced under `.cc-` so it never collides
with the host app.

Extracted from the knomee-demo prototype. No build step, no framework, no
dependencies (Firebase is optional — see Persistence).

## Files

| File | What it is | Where it runs |
|------|-----------|---------------|
| `comment-overlay.css` | All overlay styles (`.cc-*`) | Host page `<head>` |
| `overlay-markup.html` | The `#ccStage` DOM (rail, catcher, pin layer, esc pill) | First child of host `<body>` |
| `comment-overlay.js` | All overlay logic (arming, pins, rail, persistence) | Host page, after the markup |
| `review-bridge.js` | Tiny bridge for the iframe model | *Inside* the reviewed app (wrapper model only) |

## Behavior

- **Hidden by default.** Invisible until armed. Toggle with **C** (ignored while
  typing in an input/textarea/select/contenteditable; never with ⌘/Ctrl/Alt so it
  won't hijack copy). **F2** is an alias. **Esc** exits.
- **Comment mode.** A transparent catcher covers the page to capture clicks; each
  click drops a numbered pin. Wheel/trackpad scrolling still works.
- **Rail.** A collapsible left rail lists all threads (count + "clear all"); click
  a pin or card to open its popover and read/add replies.
- **Per-screen scoping.** Pins belong to a screen id (see hook below), so a
  multi-page app keeps comments separate per page/route.

## Quick start (wrapper model — recommended, matches the source)

The overlay is the outer page; the app you're reviewing loads in an iframe.

1. In the host page `<head>`: `<link rel="stylesheet" href="comment-overlay.css">`
2. In the host `<body>`: paste `overlay-markup.html` as the first child, and set
   the `#ccProto` iframe `src` to your app's URL.
3. Before `</body>`: `<script src="comment-overlay.js"></script>`
4. In the **reviewed app** (the iframe's page): `<script src="review-bridge.js"></script>`
5. Open `comment-overlay.js` and set `PROJECT_ID` to something unique. Done —
   comments now persist to the reviewer's `localStorage`.

## Inline model (single SPA, no iframe)

If you'd rather overlay the app's own DOM directly:

1. Delete the `<div id="ccFrame">…</div>` block from `overlay-markup.html` and put
   your app's root element right after the markup instead.
2. Skip `review-bridge.js` entirely.
3. In `comment-overlay.js` make these small edits (all iframe-only plumbing):
   - `getScreenId()`: read `window.__ccScreenId` instead of `proto.contentWindow.__ccScreenId`.
   - Remove the `cc-frame-height` message handler and the `#ccProto` height sizing.
   - Remove the catcher `wheel` → `cc-scroll` postMessage (native scrolling already
     works when there's no covering iframe), and the `cc-nav` / `cc-route`
     hash-mirroring block (that's for the iframe address bar).

## Config (top of `comment-overlay.js`)

| Const | Default | Notes |
|-------|---------|-------|
| `PROJECT_ID` | `CHANGE-ME-…` | **Must be unique.** Namespaces stored comments. |
| `THEME` | `neutral-frost` | `neutral-frost` \| `smoke-tray` \| `branded-frost` |
| `USE_FIRESTORE` | `false` | `false` = localStorage only. `true` = real-time sync. |
| `SEED_DEMO` | `false` | `true` seeds fake comments, skips persistence (for previews). |
| `ACTIVATION_KEY` | `F2` | The `c` shortcut is always on in addition to this. |

## Per-screen hook

Set `window.__ccScreenId` to the current route/screen id whenever your app changes
screens, so pins scope correctly:

```js
window.__ccScreenId = 'clients' // e.g. on route change
```

Fallbacks if unset: an element matching `.screen.active` (its `id`), else `'default'`
(single-screen apps can ignore this entirely).

## Persistence

- **localStorage (default).** With `USE_FIRESTORE = false`, threads are saved in the
  reviewer's browser only. Zero config, but not shared between people.
- **Firestore (shared, real-time).** Set `USE_FIRESTORE = true`, load the two
  firebase compat scripts in the host page, and fill `firebaseConfig` with **your
  own** Firebase project (do not reuse someone else's):

  ```html
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
  ```

  Threads are stored at `video-feedback/{PROJECT_ID}/comments`. Your Firestore
  security rules must allow read/write to that collection.

## Notes

- Screenshot thumbnails on pins use `html2canvas` if it's present on the page
  (optional): `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>`.
- The `review-bridge.js` scroll fallback looks for a full-page inner scroller via
  `.landing, [data-cc-scroller]`. Add `data-cc-scroller` to your app's scroll
  container if it uses a fixed-layout page.
