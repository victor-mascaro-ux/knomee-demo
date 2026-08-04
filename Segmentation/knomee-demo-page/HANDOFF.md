# 📦 Segmentation Page — Handoff for `victor-mascaro-ux/knomee-demo`

Adds a **Segmentation** tab beside Analytics. The existing niche cross-tab stays exactly where it is — the contrast between the two is the argument.

**Branch seen when this was built:** `claude/figma-prototype-page-b2ocon`

---

## 📁 What's in this folder

| File | Goes to | New or edit |
|---|---|---|
| `src/data/segmentation.ts` | `src/data/segmentation.ts` | **new** |
| `src/screens/SegmentationScreen.tsx` | `src/screens/SegmentationScreen.tsx` | **new** |
| `src/screens/segmentation.css` | `src/screens/segmentation.css` | **new** |
| — | `src/App.tsx` | **4 small edits**, below |

Nothing else is touched. `index.css` is not modified — the new styles live in their own file, imported by the component, so there's no merge conflict with your tokens.

---

## ✅ Already verified

| Check | Result |
|---|---|
| `tsc` strict, `noUnusedLocals`, `noUnusedParameters` | ✅ 0 errors |
| Server-render of all four models | ✅ renders, no `undefined` or `[object Object]` leaks |
| All 9 Model A labels present | ✅ |
| All 6 Model B families, 4 Model C quadrants, 11 Model D tags | ✅ |

Not verified: how it looks in your actual browser against your real tokens. Worth a glance before you push.

---

## ✏️ The four edits to `src/App.tsx`

### 1 · Add the import

After the existing `./data/...` imports near the top (around line 30):

```ts
import SegmentationScreen from './screens/SegmentationScreen'
```

### 2 · Extend the `Screen` type — line 82

```diff
-type Screen = 'prospects' | 'clients' | 'analytics'
+type Screen = 'prospects' | 'clients' | 'analytics' | 'segmentation'
```

### 3 · Add the tab — around line 2342

```diff
 const tabs: { id: Screen; label: string }[] = [
   { id: 'prospects', label: 'Prospects' },
   { id: 'clients', label: 'Clients' },
   { id: 'analytics', label: 'Analytics' },
+  { id: 'segmentation', label: 'Segmentation' },
 ]
```

### 4 · Render it — around line 2498

```diff
         {screen === 'analytics' &&
           (emptyMode ? <EmptyScreen variant="analytics" /> : <AnalyticsScreen />)}
+        {screen === 'segmentation' && <SegmentationScreen />}
       </main>
```

> **Note on `emptyMode`:** the new screen has no empty variant, so it always renders its content. If you want one, `EmptyVariant` in `App.tsx` needs a `'segmentation'` member too — left out deliberately to keep this patch to four lines.

---

## 🚀 Then

```bash
npm run build      # tsc -b && vite build — refreshes app/, which is what Pages serves
```

Commit **both** `src/` and the regenerated `app/`. Pages serves the built files directly, so skipping the build means the tab won't appear on the live site.

---

## 🤖 Prompt for Claude Code

Paste this in a session opened at the repo root:

```
Add a Segmentation tab to this app.

1. Copy these three files in from
   C:\Users\user.DESKTOP-FVLKNNP\Documents\Viktory Game Design\Knomee\Projects\knomee-demo-page\
     src/data/segmentation.ts        -> src/data/segmentation.ts
     src/screens/SegmentationScreen.tsx -> src/screens/SegmentationScreen.tsx
     src/screens/segmentation.css    -> src/screens/segmentation.css

2. Make exactly four edits to src/App.tsx:
   a. Add `import SegmentationScreen from './screens/SegmentationScreen'`
      after the existing ./data/... imports.
   b. Change the Screen type to:
      type Screen = 'prospects' | 'clients' | 'analytics' | 'segmentation'
   c. Append { id: 'segmentation', label: 'Segmentation' } to the `tabs` array.
   d. After the `screen === 'analytics'` branch in <main>, add:
      {screen === 'segmentation' && <SegmentationScreen />}

Do not modify src/index.css, AnalyticsScreen, or any existing data file.

3. Run `npm run build`, fix any type errors, and confirm app/ was regenerated.
4. Commit src/ and app/ together on a new branch, message:
   "Add schema-driven Segmentation tab"
   Then open a PR against the current default branch.
```

---

## 🖱️ Or by hand, through the GitHub web UI

1. Repo → **Add file → Create new file** → path `src/data/segmentation.ts` → paste contents → commit to a new branch.
2. Repeat for `src/screens/SegmentationScreen.tsx` and `src/screens/segmentation.css`.
3. Open `src/App.tsx` → pencil icon → make the four edits above → commit to the same branch.
4. ⚠️ **`app/` still needs rebuilding.** The web UI can't run `npm run build`, so the tab won't show on Pages until someone runs the build locally and commits `app/`. If that's a blocker, use the standalone-HTML route instead — say the word and I'll produce `segmentation.html` for the repo root, which Pages serves with no build step.

---

## 📄 What the page shows

- **Model switcher** — A Life Domain · B Purpose × Posture · C Vision × Readiness · D Tension Tags. Opens on **C**, the one that maps to a marketing decision rather than a theme.
- **Vision × Readiness quadrants** (Model C only) — who to call first.
- **Segment mix** — share per segment, including empty ones. Click any segment for its definition, hook and members.
- **Prospects table** — click a row for the full scoring trace back to the person's own answers.
- **How this is calculated** — collapsed by default: method and formulas, the rules every model obeys, the "Other" write-in policy, and what the Adventure cannot detect.
- **Coverage proof** — collapsed: 30,011 synthetic respondents, label reachability, and the missing-option backlog.

Data is baked into `segmentation.ts` from the scoring engine (`engine/` in the sibling folder). Regenerate rather than hand-edit — the numbers are live output, and the labels are an exhaustive partition of the Adventure's option space.
