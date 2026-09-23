/* Open / closing / shut for a dropdown that is not a SelectMenu (a row's
   actions, the account menu). `shown` stays true through the fold-away, so the
   list can roll back into its button before it leaves the page; `closing`
   is the class hook for that. Pair with the `.drop-anim` class. */

import { useEffect, useRef, useState } from 'react'
import './selectMenu.css'

const CLOSE_MS = 140

export function useDropdown() {
  const [state, setState] = useState<'shut' | 'open' | 'closing'>('shut')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const setOpen = (next: boolean | ((was: boolean) => boolean)) => {
    setState((s) => {
      const was = s === 'open'
      const want = typeof next === 'function' ? next(was) : next
      if (want === was) return s
      window.clearTimeout(timer.current)
      if (want) return 'open'
      timer.current = window.setTimeout(() => setState('shut'), CLOSE_MS)
      return 'closing'
    })
  }
  return {
    open: state === 'open',
    shown: state !== 'shut',
    closing: state === 'closing',
    setOpen,
  }
}
