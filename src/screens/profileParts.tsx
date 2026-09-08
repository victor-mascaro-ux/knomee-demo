/* The pieces the prospect and client profiles share.
   They were duplicated once, and the copies drifted — the client page ended up
   with a different confidence dial and a different badge entirely. Both screens
   now import these, so the two pages cannot diverge again. */

export function ReadinessBars({ level }: { level: number }) {
  return (
    <span className="pp-bars" aria-label={`Readiness ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`pp-bar ${i <= level ? 'on' : ''}`} style={{ height: 5 + i * 2.4 }} />
      ))}
    </span>
  )
}

export function Gauge({ label }: { label: string }) {
  // A segmented 180° dial (light → deep purple bands) with a grey teardrop
  // needle, matching the product's confidence gauge.
  const cx = 60
  const cy = 60
  const r = 42
  // Three confidence levels (Weak → Moderate → Strong), light → deep purple.
  const colors = ['#dcc8f2', '#a878df', '#6f2dc4']
  const pt = (deg: number) => {
    const a = (deg * Math.PI) / 180
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const
  }
  const step = 180 / colors.length
  const segs = colors.map((c, i) => {
    const start = 180 - i * step - 3
    const end = 180 - (i + 1) * step + 3
    const [x0, y0] = pt(start)
    const [x1, y1] = pt(end)
    return (
      <path
        key={i}
        d={`M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`}
        fill="none"
        stroke={c}
        strokeWidth="14"
        strokeLinecap="round"
      />
    )
  })
  return (
    <span className="pp-gauge" aria-label={`Confidence: ${label}`}>
      <svg viewBox="0 0 120 70" width="112" height="65">
        {segs}
        {/* Needle points into the "Strong" (rightmost) band. */}
        <g transform="rotate(48 60 60)">
          <path
            d="M60 27 C 55 42, 53 51, 53 57 A 7 7 0 1 0 67 57 C 67 51, 65 42, 60 27 Z"
            fill="#6f6a7c"
          />
          <circle cx="60" cy="57" r="2.6" fill="#cfc9d8" />
        </g>
      </svg>
    </span>
  )
}

const BADGE_TINT: Record<string, string> = {
  'Financial Joy': '#bfe6dd',
  Confidence: '#fbe3a6',
  Outlook: '#f6c6d4',
  'Future You': '#d2ecbe',
  Goals: '#c6e2f6',
}

// A scalloped "seal" medallion: a wavy colored ring with the adventure icon in
// the middle and the category / "ADVENTURE COMPLETE" curved around it, like the
// real product's badges.
export function BadgeMedallion({ label, icon }: { label: string; icon: string }) {
  const tint = BADGE_TINT[label] ?? '#e6e6ee'
  const slug = label.replace(/\s+/g, '-').toLowerCase()
  const cx = 60
  const cy = 60
  const R = 46
  const n = 18
  const bump = 6.5
  const bumps = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI
    return <circle key={i} cx={cx + R * Math.cos(a)} cy={cy + R * Math.sin(a)} r={bump} fill={tint} />
  })
  return (
    <span className="pp-badge-disc">
      <svg viewBox="0 0 120 120" width="90" height="90">
        <defs>
          <path id={`pp-top-${slug}`} d="M 22 60 A 38 38 0 0 1 98 60" fill="none" />
          <path id={`pp-bot-${slug}`} d="M 24 60 A 36 36 0 0 0 96 60" fill="none" />
        </defs>
        {bumps}
        <circle cx={cx} cy={cy} r={R} fill={tint} />
        <text className="pp-badge-arc">
          <textPath href={`#pp-top-${slug}`} startOffset="50%" textAnchor="middle">
            {label.toUpperCase()}
          </textPath>
        </text>
        <text className="pp-badge-arc">
          <textPath href={`#pp-bot-${slug}`} startOffset="50%" textAnchor="middle">
            ADVENTURE COMPLETE
          </textPath>
        </text>
        <image href={icon} x={cx - 27} y={cy - 27} width="54" height="54" />
      </svg>
    </span>
  )
}
