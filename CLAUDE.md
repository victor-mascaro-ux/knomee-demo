# knomee-demo — working notes

## Deploy workflow (standing instruction)

After completing a change on the working branch, **automatically ship it to the
live site without asking**:

1. Build (`npm run build`) and commit `src/` **and** the regenerated `app/`
   together — GitHub Pages serves the built files in `app/` directly, so a
   change is invisible on the live site until `app/` is rebuilt and committed.
2. Push the working branch.
3. Open a **new** pull request into the default branch
   (`claude/figma-prototype-page-b2ocon`) and merge it. Each ship is a fresh PR
   — a merged PR is finished and never reused.

The live site is https://victor-mascaro-ux.github.io/knomee-demo/ and updates
~60s after the merge.

Do not ask "want me to merge?" — just do the full push → PR → merge.

## App shape

- React + TS + Vite prototype under `src/`, prebuilt into `app/` (Pages has no
  build step). Root `index.html` is a hand-maintained comment overlay that
  iframes `./app/app.html`.
- All figures are placeholder/demo data.
