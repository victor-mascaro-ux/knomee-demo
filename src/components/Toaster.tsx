/* The app's one toast: a dark pill with a lime check, at the bottom right
   of what is in view, for a few seconds. Raised from anywhere with toast()
   (src/toast.ts); mounted once, in main.tsx, so every screen has it. A new
   toast replaces the one showing and gets its own full time. */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TOAST_EVENT } from '../toast'
import { CheckIcon } from './icons'

const SHOW_MS = 3200

function Toast({ show, message }: { show: boolean; message: string }) {
  const ref = useRef<HTMLDivElement>(null)
  // The prototype is embedded in a full-height iframe whose parent document
  // scrolls, so `position: fixed` would pin the toast to the bottom of the tall
  // iframe (off-screen). Anchor it to the parent's visible viewport instead.
  useLayoutEffect(() => {
    if (!show) return
    let parentWin: Window | null = null
    try {
      if (window.parent !== window && typeof window.parent.scrollY === 'number') {
        parentWin = window.parent
      }
    } catch {
      parentWin = null
    }
    const place = () => {
      const el = ref.current
      if (!el) return
      const h = el.offsetHeight || 60
      // When the iframe is sized to its full content, the parent document is the
      // scroller; otherwise this window scrolls internally. Anchor to whichever
      // one actually scrolls so the toast lands in the visible viewport.
      const selfScrolls = document.documentElement.scrollHeight > window.innerHeight + 2
      const w = selfScrolls || !parentWin ? window : parentWin
      el.style.top = `${w.scrollY + w.innerHeight - h - 32}px`
    }
    place()
    const targets = new Set<Window>([window])
    if (parentWin) targets.add(parentWin)
    targets.forEach((t) => {
      t.addEventListener('scroll', place, { passive: true })
      t.addEventListener('resize', place)
    })
    return () =>
      targets.forEach((t) => {
        t.removeEventListener('scroll', place)
        t.removeEventListener('resize', place)
      })
  }, [show, message])
  return (
    <div ref={ref} className={`app-toast ${show ? 'show' : ''}`} role="status" aria-live="polite">
      <span className="app-toast-check">
        <CheckIcon />
      </span>
      {message}
    </div>
  )
}

export default function Toaster() {
  const [t, setT] = useState({ show: false, message: '' })
  useEffect(() => {
    let timer: number | undefined
    const on = (e: Event) => {
      setT({ show: true, message: (e as CustomEvent<string>).detail })
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setT((x) => ({ ...x, show: false })), SHOW_MS)
    }
    window.addEventListener(TOAST_EVENT, on)
    return () => {
      window.removeEventListener(TOAST_EVENT, on)
      window.clearTimeout(timer)
    }
  }, [])
  return <Toast show={t.show} message={t.message} />
}
