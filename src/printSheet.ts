/* Download PDF, without a PDF library.
 *
 * The button says PDF and the browser already makes them: printing this page
 * with "Save as PDF" as the destination produces the real thing, laid out by
 * the same engine that drew it, rather than a second rendering of the page
 * through a canvas library that would put another 200KB in the bundle and get
 * the fonts subtly wrong.
 *
 * What makes it a document rather than a screenshot of an app is the print
 * stylesheet in index.css: the bar, the rail, the tabs and every control drop
 * out, and what is left is the sheet itself.
 */

export function printSheet() {
  if (typeof window === 'undefined') return
  /* One frame for a tab switch to land, then the dialog — which blocks the
     thread the moment it opens, so anything not painted by then is not in the
     document. */
  window.requestAnimationFrame(() => {
    window.setTimeout(() => window.print(), 60)
  })
}
