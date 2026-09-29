import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

/* The tier bar's legend. Each label starts on the left edge of its own
   segment, read off the bar as drawn rather than rebuilt from flex shares —
   the segments' padding and gaps made a rebuilt column drift off its edge. A
   label wider than the room it has (its segment, up to where the next label
   starts) is set against the chart's right edge instead, so it never hangs
   off the card or sits under somebody else's bar. */
export default function TierLegend({
  bar,
  items,
}: {
  bar: RefObject<HTMLDivElement | null>
  items: { key: string; dot: string; name: string; range: string }[]
}) {
  const box = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState<({ left: number } | 'right')[] | 'flow'>([])
  const [height, setHeight] = useState(0)
  const itemsKey = items.map((i) => i.key).join('|')

  useLayoutEffect(() => {
    const b = bar.current
    const l = box.current
    if (!b || !l) return
    const measure = () => {
      const segs = [...b.children] as HTMLElement[]
      const labels = [...l.children] as HTMLElement[]
      /* Layout offsets, not painted boxes: the bar draws itself in with a
         transform, and a box read mid-animation is somewhere it will not stay.
         The segments, the bar and the legend share an offset parent, and the
         legend starts where the bar does. */
      const total = b.offsetWidth
      const starts = segs.map((seg) => seg.offsetLeft - b.offsetLeft)
      const widths = labels.map((x) => x.offsetWidth)
      const placed = starts.map((left, i) => {
        const room = (i + 1 < starts.length ? starts[i + 1] : total) - left
        return widths[i] <= room ? { left } : ('right' as const)
      })
      /* Too narrow a card for that to work — two labels on the right edge, or
         one pushed back over its neighbour — and the labels simply wrap in a
         row under the bar instead. */
      const spans = placed.map((at, i) =>
        at === 'right' ? [total - widths[i], total] : [at.left, at.left + widths[i]],
      )
      const clash = spans.some(([a, b], i) => spans.some(([c, d], j) => j > i && a < d + 8 && c < b + 8))
      const next = clash ? 'flow' : placed
      setPlace((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
      setHeight(clash ? 0 : Math.max(0, ...labels.map((x) => x.offsetHeight)))
    }
    measure()
    /* The observer is delivered with a frame, so a tab that is not painting
       misses it; the window's own resize is the belt to its braces. */
    const ro = new ResizeObserver(measure)
    ro.observe(b)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [bar, itemsKey])

  return (
    <div
      className={`dist-legend dist-legend-bars${place === 'flow' ? ' is-flow' : ''}`}
      ref={box}
      style={{ height: height || undefined }}
    >
      {items.map((m, i) => {
        const at = place === 'flow' ? undefined : place[i]
        return (
          <div
            className={`dist-leg${at === 'right' ? ' is-end' : ''}`}
            key={m.key}
            style={place === 'flow' ? undefined : at === 'right' ? { right: 0 } : { left: at?.left ?? 0 }}
          >
            <span className="dist-leg-name">
              <i className={`dot ${m.dot}`} />
              {m.name}
            </span>
            <span className="dist-leg-range">{m.range}</span>
          </div>
        )
      })}
    </div>
  )
}
