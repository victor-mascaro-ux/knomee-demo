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

/** A phone in the hand: the screen's short side is a phone's, whichever way
    it is held, or the window is too narrow for anything else. Such a screen
    is the journey's own screen — never drawn inside a phone frame — and an
    invited advisor on one gets the phone version; anyone else, the desktop. */
export function isPhoneScreen(): boolean {
  try {
    /* A screen that reports no size (some embeds) is not taken for a phone. */
    const short = Math.min(window.screen.width, window.screen.height)
    return (short > 0 && short <= 600) || window.innerWidth <= 640
  } catch {
    return false
  }
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

/* The profile an experience was opened from, so its menu's Back to Profile
   returns there — the converted Sarah's client page, say, rather than her
   prospect page. Each experience also knows its own person's profile, used
   when it was reached some other way. */
const BACK_KEY = 'knomee.experienceFrom'

export function openExperience(hash: string) {
  try {
    sessionStorage.setItem(BACK_KEY, window.location.hash)
  } catch {
    /* fine — the fallback still knows the way */
  }
  setDeviceMode('mobile')
  window.location.hash = hash
}

export function backToProfile(fallback: string) {
  let from: string | null = null
  try {
    from = sessionStorage.getItem(BACK_KEY)
    sessionStorage.removeItem(BACK_KEY)
  } catch {
    /* ignore */
  }
  window.location.hash = from || fallback
}
