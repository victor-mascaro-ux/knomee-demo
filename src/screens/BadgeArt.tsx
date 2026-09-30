/* A reward badge whose icon moves.
 *
 * The badge art is one drawing: the star, its lettering and the adventure's
 * icon all in a single SVG. To let the icon wander the way the adventure
 * icons do (advisor-flow.css, advIconWander) while the star and its words
 * hold still, the drawing is read into the page and the icon's shapes —
 * the ones sitting in the middle of the badge, smaller than the star — are
 * gathered into a group that is animated on its own. Until the drawing has
 * been read, or if it cannot be, the plain image stands in.
 */

import { useEffect, useRef, useState } from 'react'

async function load(src: string) {
  const res = await fetch(src)
  return res.text()
}

export default function BadgeArt({ src, className, alt = '' }: { src: string; className?: string; alt?: string }) {
  const [markup, setMarkup] = useState<string | null>(null)
  const box = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let live = true
    load(src)
      .then((t) => live && t.includes('<svg') && setMarkup(t))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [src])

  /* Once drawn: find the icon's shapes and group them. */
  useEffect(() => {
    const svg = box.current?.querySelector('svg')
    if (!svg) return
    const vb = svg.viewBox.baseVal
    const w = vb?.width || 1000
    const h = vb?.height || 1000
    const cx = (vb?.x || 0) + w / 2
    const cy = (vb?.y || 0) + h / 2
    const shapes = [...svg.querySelectorAll('path, circle, ellipse, rect, polygon')] as SVGGraphicsElement[]
    const icon: SVGGraphicsElement[] = []
    for (const el of shapes) {
      let b: DOMRect
      try {
        b = el.getBBox()
      } catch {
        continue
      }
      if (!b.width || !b.height) continue
      // Not the star (it spans most of the badge), and centred on the badge.
      if (b.width > w * 0.5 || b.height > h * 0.5) continue
      const mx = b.x + b.width / 2
      const my = b.y + b.height / 2
      if (Math.hypot(mx - cx, my - cy) > Math.min(w, h) * 0.2) continue
      icon.push(el)
    }
    if (!icon.length) return
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('class', 'badge-icon')
    icon[0].parentNode?.insertBefore(g, icon[0])
    icon.forEach((el) => g.appendChild(el))
  }, [markup])

  if (!markup) return <img className={className} src={src} alt={alt} />
  return (
    <span
      ref={box}
      className={`badge-art${className ? ` ${className}` : ''}`}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      dangerouslySetInnerHTML={{ __html: markup.replace(/<svg\b/, '<svg class="badge-art-svg"') }}
    />
  )
}
