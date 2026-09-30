/* Where the prototype is, for the review overlay: every piece of state that
 * decides which screen is showing but is not in the address — the phone's tab,
 * the step of the flow, the open adventure and the step inside it.
 *
 * Each owner registers its piece under a key. The overlay reads a snapshot of
 * them all when a comment is left, and hands it back when the comment's card
 * is clicked, so the card lands on the exact step rather than on the page's
 * first screen. Values are plain JSON — numbers, strings, arrays of them.
 */

import { useEffect, useRef } from 'react'

type Entry = { get: () => unknown; set: (v: unknown) => void }
const registry = new Map<string, Entry>()

/** Register one piece of screen state under `key` while the owner is mounted. */
export function useCcNav<T>(key: string, value: T, set: (v: T) => void) {
  const ref = useRef(value)
  ref.current = value
  const setRef = useRef(set)
  setRef.current = set
  useEffect(() => {
    registry.set(key, { get: () => ref.current, set: (v) => setRef.current(v as T) })
    return () => {
      registry.delete(key)
    }
  }, [key])
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

declare global {
  interface Window {
    __ccNavSnapshot?: () => Record<string, unknown>
    /** Applies what it can; returns how many keys are not there yet or not
        yet equal, so the caller can try again once the next owner mounts. */
    __ccNavApply?: (snap: Record<string, unknown>) => number
  }
}

if (typeof window !== 'undefined') {
  window.__ccNavSnapshot = () => Object.fromEntries([...registry].map(([k, e]) => [k, e.get()]))
  window.__ccNavApply = (snap) => {
    let left = 0
    for (const [k, v] of Object.entries(snap)) {
      const e = registry.get(k)
      if (!e) {
        left += 1
        continue
      }
      if (!same(e.get(), v)) {
        e.set(v)
        left += 1
      }
    }
    return left
  }
}
