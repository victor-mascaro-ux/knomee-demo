# Co-brand logo guidelines (for clients)

When knomee runs in your brand colors, your logo replaces the centered mark on
the top bar. So that it always lines up at the **same visual height as the
knomee logo** — on any brand color — please supply your logo exactly like this.

## The rule

1. **Format — vector SVG only.** No PNG/JPG, and no raster image embedded
   inside the SVG. Vector keeps it crisp at every size.

2. **Color — one flat white (`#FFFFFF`).** Your logo sits on your brand-color
   bar as a solid white knockout. No gradients, no drop shadows, no second
   color, no colored outline. Background transparent.

3. **Crop tight — this is what keeps the height identical.** The SVG `viewBox`
   must hug the artwork on all four sides, with **no padding or clear space
   baked in.** We scale your logo by its height, so any empty space above or
   below makes it render *smaller* than knomee's, and anything sticking out
   makes it *bigger*. Also remove fixed `width`/`height` attributes (or set
   them equal to the viewBox) — keep the `viewBox`.

4. **Shape — horizontal.** A wordmark, or a symbol + wordmark side by side. We
   fit to a fixed height (~20 px on screen) and let the width flow. A tall or
   stacked logo will read small, so send the horizontal lockup.

5. **Legible small.** Keep strokes at least ~1.5 px at 20 px height; avoid
   hairlines and fine detail that disappear when shrunk.

6. **File name.** `yourcompany-white.svg`.

## Why it works

We place every logo at one fixed height on the bar. Because your file is a
single flat white color and cropped tight to the artwork, that fixed height
*becomes* your logo's exact visual height — so it always matches the knomee
mark next to it, whatever the brand color behind it.

## 10-second self-check before you send

- Open the SVG — is it all white on a transparent background?
- Does the artwork touch all four edges of the canvas (no border of empty
  space)?
- Is there a `viewBox` and no leftover fixed `width`/`height` in pixels?

If yes to all three, it will drop in at the right height automatically.
