import { useLayoutEffect, useRef, useState } from 'react'

export type IndicatorBox = { left: number; top: number; width: number; height: number }

/**
 * Slides a highlight to the active item in a segmented control. Measures the
 * `[data-active="true"]` child inside the returned ref and reports its box, so
 * an absolutely-positioned highlight can transition to it. Re-measures when the
 * active key changes and whenever the container resizes or reflows (wrapping,
 * font swap). The container must be `position: relative` so offsets are
 * measured against it.
 */
export function useSlideIndicator<T extends HTMLElement = HTMLDivElement>(activeKey: string) {
  const ref = useRef<T>(null)
  const [box, setBox] = useState<IndicatorBox | null>(null)
  useLayoutEffect(() => {
    const nav = ref.current
    if (!nav) return
    const measure = () => {
      const el = nav.querySelector<HTMLElement>('[data-active="true"]')
      if (!el) return
      setBox({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(nav)
    // Fonts can swap after first paint and shift widths; re-measure shortly after.
    const t = window.setTimeout(measure, 80)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.clearTimeout(t)
    }
  }, [activeKey])
  return { ref, box }
}
