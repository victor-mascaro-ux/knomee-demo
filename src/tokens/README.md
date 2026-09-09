# Design tokens

Synced from the **Knomee Design System** project on claude.ai/design
(`1f9140df-8d47-4850-a72e-cdca53c06943`), which was itself built from this
repo and reconciled the two token files that had drifted apart
(`src/index.css` and `wireframes/tokens/colors.css` — the shipped values won).

These three files are the **source of truth for colour, type and space**. They
are pure `:root` declarations: importing them changes nothing on its own, and
`index.css` aliases its own long-standing names (`--plum`, `--line`, …) onto
them so the 4,000 lines of shipped CSS keep working while the values live in
one place.

| File | Owns |
|---|---|
| `colors.css` | brand ramps, neutrals, and the semantic aliases (`--text-strong`, `--surface-card`, `--action-primary`, tier ramps, the four `--tag-*` coaching pairs and the two `--signal-*` readiness accents) |
| `typography.css` | families, the 14-step size scale, weights, leading, tracking |
| `layout.css` | space ramp, radii, elevation, motion, and fixed metrics (`--phone-w`, `--topbar-h`, `--page-pad`) |

The mobile layer (`src/screens/client-experience.css`) is the design system's
`tokens/mobile.css`, kept next to the screen it styles.

Not imported: the design system's `tokens/components.css` (a parallel component
layer that would collide with the shipped rules in `index.css`) and
`tokens/fonts.css` (self-hosts Poppins from TTFs; this app loads it from Google
Fonts in `app.html`).

Added here rather than synced down: `--k-azure`/`--k-crimson` and their washes,
the four `--tag-*` pairs the Readiness and Playbook tabs hang their behavioural
tags on, and `--signal-motivator`/`--signal-concern`. The ramp had no blue and
no concern red; both are sampled from the Prospect Playbook design. Push them up
on the next sync.

To re-sync, read the project with the `DesignSync` tool — the token files are
small and diffable.
