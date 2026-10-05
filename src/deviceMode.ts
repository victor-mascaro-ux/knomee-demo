/* Which device an experience is shown on: the phone (the default) or the
   desktop version of the same journey. Set from the D panel (cc-demo-set
   `device`) and kept for the tab, so moving between a journey's screens — or
   reloading — keeps the device the presenter chose. One store for every
   phone screen, read through `useDeviceMode`. */

import { useSyncExternalStore } from 'react'

export type DeviceMode = 'mobile' | 'desktop'

const KEY = 'knomee.device'
let mode: DeviceMode = (() => {
  try {
    return sessionStorage.getItem(KEY) === 'desktop' ? 'desktop' : 'mobile'
  } catch {
    return 'mobile'
  }
})()
const subs = new Set<() => void>()

export function getDeviceMode(): DeviceMode {
  return mode
}

export function setDeviceMode(next: DeviceMode) {
  try {
    sessionStorage.setItem(KEY, next)
  } catch {
    /* private window — it lasts for this page only */
  }
  if (next === mode) return
  mode = next
  subs.forEach((f) => f())
}

export function useDeviceMode(): DeviceMode {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => mode,
  )
}
