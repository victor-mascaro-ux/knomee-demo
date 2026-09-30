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

## Rules

- **An icon, avatar or badge beside text aligns to the top of the text, never
  to the middle of the block.** Next to one line the two agree; once the text
  runs to two lines or more (a name over a date, a title over a caption), a
  centred icon floats between them and stops belonging to either. In a flex
  row use `align-items: flex-start`; in a grid, `align-self: start` on the
  icon's cell. Nudge it down only to meet the first line's cap height.

- **A modal is a white panel on a dimmed plum ground.** Rounded 20px; a white
  head with the title in the page's ink (never a coloured bar) and a quiet
  grey close; the body on white; a foot of full-width pill buttons, the main
  action filled. On a desktop it sits centred; on a phone the same panel
  rises from the foot of the screen as a sheet, full width, rounded along its
  top only. The base styles are in `index.css` (the modal block, prefixed
  `body` so no modal's own header colour wins) and the phone sheet in
  `client-experience.css`; My Team's "Add someone" form is the reference.
