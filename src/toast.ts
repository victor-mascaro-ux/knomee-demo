/* The app's toast, raised from anywhere. The design system confirms copy,
   create and send twice: inside the button itself ("Copied ✓", for a
   moment) and with a toast that names what happened ("Link copied").
   <Toaster /> (mounted once, in main.tsx) is the one place it shows. */

export const TOAST_EVENT = 'knomee:toast'

export function toast(message: string) {
  if (typeof window === 'undefined' || !message) return
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }))
}
