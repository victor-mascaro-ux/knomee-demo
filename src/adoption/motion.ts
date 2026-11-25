/* Motion helpers. Everything that moves is skipped when the viewer prefers
   reduced motion: the CSS keeps its animations behind
   prefers-reduced-motion: no-preference, and these timers run their action
   straight away instead. */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Closes play a short exit: `leave(fn)` marks the piece as leaving, then runs
    `fn` (which takes it away) once the exit has played. */
export function useLeave(ms = 190): [boolean, (fn: () => void) => void] {
  const [leaving, setLeaving] = useState(false)
  const busy = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const leave = useCallback(
    (fn: () => void) => {
      if (reducedMotion()) {
        fn()
        return
      }
      if (busy.current) return
      busy.current = true
      setLeaving(true)
      timer.current = window.setTimeout(() => {
        busy.current = false
        setLeaving(false)
        fn()
      }, ms)
    },
    [ms],
  )
  return [leaving, leave]
}

/** A send's timing, as the prototype has it: a spinner, then the check, then
    what the send does. */
export const BUSY_MS = 560
export const OK_MS = 340

const easeOut = (k: number) => 1 - Math.pow(1 - k, 3)

/** A number of the demo's own that counts up (or down) to its new value. */
export function useCountUp(value: number, ms = 600): number {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = from.current
    from.current = value
    if (start === value || reducedMotion()) {
      setShown(value)
      return
    }
    let raf = 0
    let t0: number | null = null
    const tick = (t: number) => {
      if (t0 === null) t0 = t
      const k = Math.min(1, (t - t0) / ms)
      setShown(Math.round(start + (value - start) * easeOut(k)))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    /* A hidden tab holds animation frames back: the value lands anyway. */
    const land = window.setTimeout(() => {
      cancelAnimationFrame(raf)
      setShown(value)
    }, ms + 80)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(land)
    }
  }, [value, ms])
  return shown
}

/* The app's own numbers that count up: the dashboard's Top Line Metrics, and
   the Knomee Quotient on Sarah's page. They are the product's elements, so
   the count runs on the text the product drew, ending on the very value it
   drew, and marks them with data attributes of its own (which React leaves
   alone) for the colour while counting and the bump at the end. */
const COUNTED: { key: string; sel: string; fromZero?: boolean }[] = [
  { key: 'avg', sel: '.metric-value-kq' },
  { key: 'total', sel: '.metric-tile:nth-child(2) .metric-value' },
  /* Her score counts up from 0 each time her page opens. */
  { key: 'ppkq', sel: '.ap-side-stat-v', fromZero: true },
]

/** Counts the app's numbers up to their new values after each render: from
    the value last shown, so a step that adds someone counts on from the
    last. Held while `paused` (an intro screen covers the page). */
export function useCountUps(root: RefObject<HTMLElement | null>, paused: boolean) {
  /* Per number: the element and value last counted to, and, while a count
     runs, the text it last wrote (so its own writes are never mistaken for
     the product's new value) and how to stop it. */
  const last = useRef(new Map<string, { node: Element; value: number }>())
  const running = useRef(new Map<string, { node: Element; wrote: string; stop: () => void }>())
  useEffect(() => () => running.current.forEach((r) => r.stop()), [])
  useEffect(() => {
    if (paused) return
    const box = root.current
    if (!box) return
    for (const c of COUNTED) {
      const node = box.querySelector(c.sel)
      const text = node?.firstChild
      if (!node || !text || text.nodeType !== Node.TEXT_NODE) continue
      const run = running.current.get(c.key)
      if (run && run.node === node && text.nodeValue === run.wrote) continue
      const to = Number(text.nodeValue)
      if (!Number.isFinite(to)) continue
      const prev = last.current.get(c.key)
      if (!run && prev && prev.node === node && prev.value === to) continue
      const from = c.fromZero && prev?.node !== node ? 0 : (prev?.value ?? 0)
      last.current.set(c.key, { node, value: to })
      run?.stop()
      running.current.delete(c.key)
      if (from === to || reducedMotion()) {
        text.nodeValue = String(to)
        continue
      }
      const el = node as HTMLElement
      let raf = 0
      let bump = 0
      let t0: number | null = null
      const me = { node, wrote: String(from), stop: () => undefined as void }
      const write = (n: number) => {
        me.wrote = String(n)
        text.nodeValue = me.wrote
      }
      el.dataset.adCounting = ''
      write(from)
      const finish = () => {
        cancelAnimationFrame(raf)
        window.clearTimeout(land)
        if (running.current.get(c.key) !== me) return
        running.current.delete(c.key)
        if (!el.isConnected) return
        write(to)
        delete el.dataset.adCounting
        el.dataset.adBump = ''
        bump = window.setTimeout(() => delete el.dataset.adBump, 450)
      }
      const tick = (t: number) => {
        if (running.current.get(c.key) !== me || !el.isConnected) return
        if (t0 === null) t0 = t
        const k = Math.min(1, (t - t0) / 650)
        write(Math.round(from + (to - from) * easeOut(k)))
        if (k < 1) raf = requestAnimationFrame(tick)
        else finish()
      }
      raf = requestAnimationFrame(tick)
      /* A hidden tab holds animation frames back: the number lands anyway. */
      const land = window.setTimeout(finish, 730)
      me.stop = () => {
        cancelAnimationFrame(raf)
        window.clearTimeout(land)
        window.clearTimeout(bump)
        delete el.dataset.adCounting
        delete el.dataset.adBump
      }
      running.current.set(c.key, me)
    }
  })
}

/* A press ripple on the buttons that do something: drawn from where the
   pointer went down, inside the button, then gone. */
const RIPPLED =
  '.ad-db-btn, .intro-go, .ic-btn, .ad-nudge-btn, button.mail-cta, .ask-opt, .ic-opt, .notif, .ad-cal-btn, .ad-ask .btn, .ad-zoom .toolbar .btn-primary'

export function useRipples(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const box = root.current
    if (!box) return
    const down = (e: PointerEvent) => {
      if (reducedMotion()) return
      const b = (e.target as Element | null)?.closest<HTMLElement>(RIPPLED)
      if (!b || !box.contains(b) || (b as HTMLButtonElement).disabled) return
      const r = b.getBoundingClientRect()
      /* Inside the app, drawn at 86%: its own pixels are larger. */
      const z = b.offsetWidth ? r.width / b.offsetWidth : 1
      const d = (Math.max(r.width, r.height) * 2.2) / z
      const s = document.createElement('span')
      s.className = 'ad-ripple'
      s.style.width = s.style.height = `${d}px`
      s.style.left = `${(e.clientX - r.left) / z - d / 2}px`
      s.style.top = `${(e.clientY - r.top) / z - d / 2}px`
      b.appendChild(s)
      window.setTimeout(() => s.remove(), 650)
    }
    box.addEventListener('pointerdown', down, true)
    return () => box.removeEventListener('pointerdown', down, true)
  }, [root])
}
