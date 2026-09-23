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
    let cancelled = false
    const raf = window.requestAnimationFrame(() => {
      /* Wait for the pictures rather than for a guess at how long they take.
         The rows a fold was hiding mount for the print and fetch their artwork
         then, and the dialog freezes the page the moment it opens — a beat of
         120ms was enough for a 600-byte icon and not for a 12KB one, so one
         life event printed as an empty circle. Bounded, because a file that
         never arrives must not hold the dialog shut. */
      const imgs = Array.from(document.images).filter((i) => !i.complete)
      const ready = Promise.all(
        imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve())),
      )
      const capped = new Promise((r) => window.setTimeout(r, 1500))
      Promise.race([ready, capped]).then(() => {
        if (cancelled) return
        /* One more frame, so what decoded is also painted. */
        window.requestAnimationFrame(() => {
          if (cancelled) return
          window.print()
          /* Safari fires no afterprint on some versions; this is the belt. */
          window.setTimeout(done, 400)
        })
      })
    })
    return () => {
      cancelled = true
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
