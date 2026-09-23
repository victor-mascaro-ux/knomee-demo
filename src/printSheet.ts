/* Download PDF, without a PDF library.
 *
 * The button says PDF and the browser already makes them: printing with "Save
 * as PDF" as the destination produces the real thing, laid out by the same
 * engine that drew the page, rather than a second rendering through a canvas
 * library that would put 200KB in a bundle that already warns at build time and
 * get the fonts subtly wrong.
 *
 * What the reader gets is the whole sheet rather than the tab they happen to be
 * on: the page renders every tab while it prints, each starting on a new sheet
 * of paper, and goes back to the one tab afterwards. `printing` is what a
 * screen switches on to render the rest; the print stylesheet in index.css does
 * the layout.
 */

import { useCallback, useEffect, useState } from 'react'

/* Set on <body> for as long as the print is being prepared, synchronously with
   the click, so the cards that mount for it can see it on their first render.
   The scores count themselves up when they scroll into view; a tab that is
   rendered only to be printed never scrolls anywhere, and an observer that
   fires after the dialog has opened is an observer that fires too late — so
   anything that waits for the screen reads this and arrives at its value. */
export const PRINTING_CLASS = 'is-printing'
export const isPrinting = () =>
  typeof document !== 'undefined' && document.body.classList.contains(PRINTING_CLASS)

export function usePrintSheet() {
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    if (!printing) return
    /* The dialog blocks the thread the moment it opens, so the extra tabs have
       to be painted before it does — one frame, then a beat for the images the
       other tabs bring with them. */
    const done = () => {
      document.body.classList.remove(PRINTING_CLASS)
      setPrinting(false)
    }
    window.addEventListener('afterprint', done)
    const raf = window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        window.print()
        /* Safari fires no afterprint on some versions; this is the belt. */
        window.setTimeout(done, 400)
      }, 120)
    })
    return () => {
      window.removeEventListener('afterprint', done)
      window.cancelAnimationFrame(raf)
    }
  }, [printing])

  const print = useCallback(() => {
    document.body.classList.add(PRINTING_CLASS)
    setPrinting(true)
  }, [])
  return { printing, print }
}
