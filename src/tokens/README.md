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

- **An icon inside a circle reaches 0.8 of the radius.** Measure the
  drawing's farthest point from the centre (not its bounding box) and scale it
  so that point sits at 0.8R: 120 of 150 in the adventure icons' 300 disc, and
  every `src/assets/adventures/*.svg` is scaled about its centre to obey it.
  For the knomee mark, whose outer ring reaches 146.75 of its 288 box, that is
  a drawn size of 0.785 × the disc's diameter: 47px in a 60px disc, 63px in
  the phone bar's 80px one.

- **The client side's ink is ocean (`--client-ink`, `#086375`).** On a
  client's or a household's page every heading, name, strong label and big
  number is ocean, the way the prospect side's are plum. `--k-forest` read as
  near-black and is not a client colour any more. The tier ramp
  (`--client-1/2/3`) is separate and unchanged.

- **Accents come from knomee's main colours only.** When a design needs a set
  of distinct colours (groups, categories, a legend), take them from plum,
  grape, bolt, ocean, teal and lime (`--k-*` in `colors.css`); the light ones,
  lime and teal, take plum ink. Tangerine, amber, crimson and azure are signal
  and coaching-tag colours, not the brand's. If the main six run out, ask
  rather than reach for one of them.

- **A client's brand colours the bars, never the content.** The design can't
  guarantee legibility against a firm's colour, so a brand sets one variable,
  `--brand-bar`, and only the dashboard's top bar (`.topbar`), the phone's app
  bar (`.cx-appbar`) and the phone's selected-tab bar read it. Headings,
  buttons, tabs, card edges and modal headers keep knomee's own colours. A
  brand never sets a DS token (`--plum`, `--k-plum`, `--purple-bolt`,
  `--surface-brand`, `--action-primary`…); new chrome that should wear the
  firm's colour reads `--brand-bar` explicitly.

- **A modal is a white panel on a dimmed plum ground.** Rounded 20px; the brand's coloured bar across the top with the title and
  close in white — plum, or ocean (`--client-ink`) when it opens from a
  client's or household's page; the body on white; a foot of full-width pill buttons, the main
  action filled. On a desktop it sits centred; on a phone too, as a card a
  margin clear of the screen's edges. The base styles are in `index.css` (the modal block, prefixed
  `body` so no modal's own header colour wins) and the phone's in
  `client-experience.css`; My Team's "Add someone" form is the reference.

- **A form field is label, helper, field — in that order, one look.** The
  label is 13px semibold in the page's ink; an optional helper under it is
  12.5px grey, upright (never italic); the field is a white box with a 12px
  radius and a 1.5px light border that turns grape on focus, 15px text, a
  plain grey placeholder. Every modal's fields follow it (the block in
  `index.css` after the modal rules maps each modal's own class names onto
  it); a new form reuses those classes or `.sh-field`. The label sits 6px
  above its field (`--space-6`); with a helper, label, 2px, helper, 6px,
  field (`--space-2`, `--space-6`). That gap holds on every form in the app,
  the adventures' and sign-up's included, and no form sets its own; the
  adventures' "Your own answer" field is the reference.

- **Page tabs are one style.** A row of labels over a 1px rule: 16px grey,
  the active one plum and semibold with a 3px plum bar on the rule; every tab,
  the first included, has the same padding on both sides so its bar sits
  evenly under its label; hover darkens an inactive label to
  #333. The dashboard's `.tab` and a profile's `.pp-tab` are the same thing and
  must stay so — and so are My ID | Who sees it and the legal documents'
  tabs. There is no other tab style in the app. A tab row sits 16px under
  whatever bar is above it, on a dashboard as on a profile.

- **Buttons that act are Title Case; answers stay sentence case.** CTAs,
  pills, modal feet, link-style actions and menu rows read "Skip This
  Question", "Copy Link", "Back to Dashboard". Option chips and photo choices
  are things a person says, so they stay sentence case ("Nobody but me — it's
  my call"). A fold toggle reads Show More / Show Less, never See More. Copy,
  create and send confirm inside the button itself ("Copied ✓", "Link
  Created ✓"), not with a toast.

- **A card's header is one control, with its ? beside the title.** A card
  that folds (Show More / Show Less) opens and shuts from a click anywhere on
  its header, not only on the toggle. Use `CollapsibleCard`: its header takes
  the click and its `.card-hint` keeps the ? to its own tap. The help tip goes
  inside `.card-title`, right after the text, as `<HelpTip side="right">` so
  its bubble opens rightward. It never sits at the far right of the header,
  nor after a chart head's figure.

- **A detail panel edits in place, and its main button only closes.** The
  read-back of a question, goal or life event puts its fields in the panel
  itself, with no pencil and no second edit panel. They save when you leave
  them, and the item is tagged "Updated". A state (Resolved, Completed) is a
  checkbox under the fields, never a button, because a filled button after an
  edit reads as Save and gets pressed as one. The foot is Delete (crimson
  outline, confirming in place) · Done (primary, which closes). A read-only
  page shows plain text and no foot. New panels are built from
  `src/screens/ReadBack.tsx` (`InlineTitle`, `ReadBackCheck`, `ReadBackFoot`,
  `closesOnEscape`).

- **What's done sinks.** A resolved question or a completed goal or life event
  goes to the bottom of its list on every profile, straight away, even the
  moment it's ticked while it is still fresh. Above that, New leads, then
  Updated. `sortFresh` in `profileParts.tsx` does it.

- **Every phone has the same bottom bar.** The ID (Financial ID or Business
  ID) sits on the left and Adventures on the right. Between them is the knomee
  mark in an 80px white disc that the bar's edge bumps up around, 30px above
  the bar (`KnomeeFab`, sized by `--fab`, `--fab-mark` and `--fab-rise` in
  `client-experience.css`). The selected tab wears the dashboards' 3px tab
  underline on the bar's top edge, sliding from tab to tab (`useTabInd`).
  There are two tabs only; My Team lives in the burger menu.

- **The phone's burger menu is quiet.** Each row is a line icon in the
  label's own colour, then the label, left-aligned, in regular weight, with
  no trailing arrow (`SheetItem` in `ClientExperienceScreen.tsx`). Hairlines
  group the rows (`SheetGroup`): My Team; Account Settings and Legal &
  Privacy; Restart Adventures; Close Experience and Sign Out. A client's own
  menu is headed by their own photo and name. The way back to the profile is
  Close Experience, the mirror of the rail's Open Experience.

