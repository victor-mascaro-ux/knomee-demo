/* Where the prototype is, for the review overlay: every piece of state that
 * decides which screen is showing but is not in the address — the phone's tab,
 * the step of the flow, the open adventure and the step inside it.
 *
 * Each owner registers its piece under a key. The overlay reads a snapshot of
 * them all when a comment is left, and hands it back when the comment's card
 * is clicked, so the card lands on the exact step rather than on the page's
 * first screen. Values are plain JSON — numbers, strings, arrays of them.
 *
 * A comment left before positions were saved knows only its step's heading.
 * For those, `__ccNavFind` walks the screens the owners say they can show
 * (each key's `values`, and each owner's `roots`) until the heading matches,
 * and hands back the position it found — the overlay then saves it on the
 * comment, so the walk happens once.
 */

import { useEffect, useRef } from 'react'

type Entry = { get: () => unknown; set: (v: unknown) => void; values?: unknown[] }
const registry = new Map<string, Entry>()
/** Starting points an owner can be put in: whole-screen snapshots. */
const roots = new Map<string, () => Record<string, unknown>[]>()

/** Register one piece of screen state under `key` while the owner is mounted.
    `values` lists what it can be set to, for the heading search. */
export function useCcNav<T>(key: string, value: T, set: (v: T) => void, values?: T[]) {
  const ref = useRef(value)
  ref.current = value
  const setRef = useRef(set)
  setRef.current = set
  const valuesRef = useRef(values)
  valuesRef.current = values
  useEffect(() => {
    registry.set(key, {
      get: () => ref.current,
      set: (v) => setRef.current(v as T),
      get values() {
        return valuesRef.current as unknown[] | undefined
      },
    })
    return () => {
      registry.delete(key)
    }
  }, [key])
}

/** The screens an owner can start from, for the heading search. */
export function useCcNavRoots(owner: string, list: () => Record<string, unknown>[]) {
  const ref = useRef(list)
  ref.current = list
  useEffect(() => {
    roots.set(owner, () => ref.current())
    return () => {
      roots.delete(owner)
    }
  }, [owner])
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const snapshot = () => Object.fromEntries([...registry].map(([k, e]) => [k, e.get()]))

function apply(snap: Record<string, unknown>) {
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

async function settle(snap: Record<string, unknown>) {
  for (let n = 0; n < 12 && apply(snap) > 0; n++) await wait(60)
  await wait(140)
}

/** Walk the screens until `matches()` says the one showing is the one wanted. */
async function find(matches: () => boolean): Promise<Record<string, unknown> | null> {
  if (matches()) return snapshot()
  const starts = [...roots.values()].flatMap((r) => r())
  for (const start of starts) {
    const before = new Set(registry.keys())
    await settle(start)
    if (matches()) return snapshot()
    // Whatever mounted because of this start — an adventure's own step — is
    // walked through its values.
    for (const [k, e] of [...registry]) {
      if (before.has(k) || !e.values) continue
      for (const v of e.values) {
        await settle({ [k]: v })
        if (matches()) return snapshot()
      }
    }
  }
  return null
}

declare global {
  interface Window {
    __ccNavSnapshot?: () => Record<string, unknown>
    /** Applies what it can; returns how many keys are not there yet or not
        yet equal, so the caller can try again once the next owner mounts. */
    __ccNavApply?: (snap: Record<string, unknown>) => number
    __ccNavFind?: (matches: () => boolean) => Promise<Record<string, unknown> | null>
  }
}

if (typeof window !== 'undefined') {
  window.__ccNavSnapshot = snapshot
  window.__ccNavApply = apply
  window.__ccNavFind = find
}
