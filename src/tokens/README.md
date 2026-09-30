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

- **A modal is a white panel on a dimmed plum ground.** Rounded 20px; the brand's coloured bar across the top with the title and
  close in white; the body on white; a foot of full-width pill buttons, the main
  action filled. On a desktop it sits centred; on a phone the same panel
  rises from the foot of the screen as a sheet, full width, rounded along its
  top only. The base styles are in `index.css` (the modal block, prefixed
  `body` so no modal's own header colour wins) and the phone sheet in
  `client-experience.css`; My Team's "Add someone" form is the reference.

- **A form field is label, helper, field — in that order, one look.** The
  label is 13px semibold in the page's ink; an optional helper under it is
  12.5px grey, upright (never italic); the field is a white box with a 12px
  radius and a 1.5px light border that turns grape on focus, 15px text, a
  plain grey placeholder. Every modal's fields follow it (the block in
  `index.css` after the modal rules maps each modal's own class names onto
  it); a new form reuses those classes or `.sh-field`.

- **Page tabs are one style.** A row of labels over a 1px rule: 16px grey,
  the active one plum and semibold with a 3px plum bar on the rule; every tab,
  the first included, has the same padding on both sides so its bar sits
  evenly under its label; hover darkens an inactive label to
  #333. The dashboard's `.tab` and a profile's `.pp-tab` are the same thing and
  must stay so — and so are My ID | Who sees it and the legal documents'
  tabs. There is no other tab style in the app.

