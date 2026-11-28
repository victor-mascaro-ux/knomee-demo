/* Modals ease to their new height. When what a modal holds changes (a tab
   switched, a box that opens with an answer, a field added), its height
   moves to the new one in a fifth of a second instead of jumping. Every
   .modal is watched from here (started once, in main.tsx); there is nothing
   for a modal to opt into. Skipped for people who prefer reduced motion. */

const MS = 200
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

interface State {
  /** The height last settled on. */
  h: number | null
  /** The ease under way, if one is. */
  anim: Animation | null
}

const states = new WeakMap<HTMLElement, State>()

const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function tween(el: HTMLElement, st: State, from: number, to: number) {
  if (reduced() || Math.abs(from - to) < 2) return
  const anim = el.animate(
    [
      { height: `${from}px`, overflow: 'hidden' },
      { height: `${to}px`, overflow: 'hidden' },
    ],
    { duration: MS, easing: EASE },
  )
  st.anim = anim
  anim.onfinish = () => {
    if (st.anim !== anim) return
    st.anim = null
    /* It may have changed again while it eased: go on to where it is now. */
    const now = el.offsetHeight
    if (el.isConnected && Math.abs(now - to) >= 2) {
      st.h = now
      tween(el, st, to, now)
    }
  }
  anim.oncancel = () => {
    if (st.anim === anim) st.anim = null
  }
}

const observer =
  typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver((entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement
          const st = states.get(el)
          if (!st) continue
          if (!el.isConnected) {
            observer?.unobserve(el)
            states.delete(el)
            continue
          }
          /* While it eases, the sizes it passes through are its own. */
          if (st.anim) continue
          const h = el.offsetHeight
          const prev = st.h
          st.h = h
          if (prev !== null && h > 0) tween(el, st, prev, h)
        }
      })

function watch(el: HTMLElement) {
  if (!observer || states.has(el)) return
  states.set(el, { h: null, anim: null })
  observer.observe(el)
}

export function watchModalSizes() {
  if (typeof document === 'undefined' || !observer) return
  const scan = (root: ParentNode) => root.querySelectorAll<HTMLElement>('.modal').forEach(watch)
  scan(document)
  new MutationObserver((changes) => {
    for (const c of changes) {
      c.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return
        const el = n as HTMLElement
        if (el.classList.contains('modal')) watch(el)
        scan(el)
      })
    }
  }).observe(document.body, { childList: true, subtree: true })
}
