/* Profile icons — the emoji that stood in on the profile pages, redrawn as
   line icons in the design system's idiom: a square viewBox, `currentColor`,
   1.6 stroke with round caps and joins, no fills except where a shape reads
   better solid. Sized by the `size` prop, coloured by the CSS around them.

   Where the design system has no icon for a concept (aspiration, vision), the
   drawing follows the same construction as the ones it does have rather than
   inventing a second style. */

type IconProps = { size?: number }

const base = (size: number) => ({
  viewBox: '0 0 24 24',
  width: size,
  height: size,
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

/** Joined — a calendar. */
export const CalendarIcon = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3.2" y="5" width="17.6" height="15.4" rx="2.4" />
    <path d="M3.2 9.6h17.6M8.2 2.8v4M15.8 2.8v4" />
  </svg>
)

/** Email — an envelope. */
export const MailIcon = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="2.6" y="4.6" width="18.8" height="14.8" rx="2.4" />
    <path d="m3.6 7 7.3 5.2a2 2 0 0 0 2.2 0L20.4 7" />
  </svg>
)

/** Core values, hopes — a target. */
export const TargetIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="8.6" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
)

/** Joy and motivation — a sparkle. */
export const SparkleIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 3.2 13.7 9l5.8 1.7-5.8 1.7L12 18.2l-1.7-5.8L4.5 10.7 10.3 9z" />
    <path d="M18.6 3.4v3M20.1 4.9h-3" />
  </svg>
)

/** Biggest concern — a warning triangle. */
export const WarningIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 4.2 21 19.6H3z" />
    <path d="M12 10v4.1M12 17.1v.1" />
  </svg>
)

/** Lifestyle aspiration — a framed picture. */
export const FrameIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2.2" />
    <path d="m4.4 16.4 4.3-4.3a1.6 1.6 0 0 1 2.2 0l3.4 3.4" />
    <path d="m13.2 14.2 1.7-1.7a1.6 1.6 0 0 1 2.2 0l2.5 2.5" />
    <circle cx="9" cy="9.2" r="1.5" />
  </svg>
)

/** Future vision — a bolt. */
export const BoltIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M13.2 2.8 5.4 13.4h5.6l-.9 7.8 8-10.8h-5.6z" />
  </svg>
)

/** Key highlights — a lightbulb. */
export const BulbIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M9.4 17.6a6.4 6.4 0 1 1 5.2 0" />
    <path d="M9.4 17.6h5.2M10.2 20.6h3.6" />
  </svg>
)

/** Badges — a medal. */
export const MedalIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="14.4" r="5.8" />
    <path d="M12 11.9l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" />
    <path d="M8.6 8.6 6.4 3.4h11.2l-2.2 5.2" />
  </svg>
)

/** The chevron that ends a row you can open. */
export const RowChevron = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <path d="m9.6 5.4 6.4 6.6-6.4 6.6" />
  </svg>
)

/** Completed / resolved. */
export const CheckIcon = ({ size = 13 }: IconProps) => (
  <svg {...base(size)} strokeWidth={2.4}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

/** Disclosure — points down when a section is open, up when it is closed. */
export const CaretIcon = ({ size = 13, up }: IconProps & { up?: boolean }) => (
  <svg {...base(size)} style={up ? { transform: 'rotate(180deg)' } : undefined}>
    <path d="m6 9.5 6 6 6-6" />
  </svg>
)

/** Named so data files can carry a key rather than a glyph. */
export const HIGHLIGHT_ICON = {
  target: TargetIcon,
  sparkle: SparkleIcon,
  warning: WarningIcon,
  frame: FrameIcon,
  bolt: BoltIcon,
} as const

export type HighlightIcon = keyof typeof HIGHLIGHT_ICON
