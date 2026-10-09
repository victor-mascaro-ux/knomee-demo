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

/** Assets advised on — a stack of coins. */
export const CoinsIcon = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <ellipse cx="12" cy="6" rx="7" ry="2.5" />
    <path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
    <path d="M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
  </svg>
)

/** Who they serve — two people. */
export const PeopleIcon = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M3 19.5c.9-3.3 3.3-5 6-5s5.1 1.7 6 5" />
    <path d="M15.5 4.9a3.4 3.4 0 0 1 0 6.3M17.5 14.8c1.7.6 3 2.2 3.5 4.7" />
  </svg>
)

/** A firm — a building. */
export const BuildingIcon = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 20h16M6 20V9l6-4 6 4v11M10 20v-5h4v5" />
  </svg>
)

/** Where they live — a pin. */
export const PinIcon = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)

/** What they do — a briefcase. */
export const BriefcaseIcon = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
    <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
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

/* ── the phone menu's marks ──────────────────────────────────────────────
   One per item in the burger menu on every phone, so each row can be found by
   its shape before its words. Same construction as the rest of this file. */

/** Account Settings — a cog. */
export const GearIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

/** Legal & Privacy — a shield. */
export const ShieldIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 21.5s7.5-3.4 7.5-9.6V5.6L12 2.8 4.5 5.6v6.3c0 6.2 7.5 9.6 7.5 9.6z" />
    <path d="m9 12 2.2 2.2L15.4 10" />
  </svg>
)

/** Start over — an arrow coming round to where it began. */
export const RestartIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3.5 3.5V8H8" />
  </svg>
)

/** Sign Out — out through a door. */
export const SignOutIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M9.5 20.5H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h3.5" />
    <path d="M16 16.5 20.5 12 16 7.5M20.5 12H9.5" />
  </svg>
)

/** Back to the firm's side — a desktop screen. */
export const DesktopIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="2.8" y="3.8" width="18.4" height="12.4" rx="2" />
    <path d="M8.5 20.5h7M12 16.2v4.3" />
  </svg>
)

/** A dashboard — four panes. */
export const DashboardIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3.2" y="3.2" width="7.6" height="9.6" rx="1.6" />
    <rect x="13.2" y="3.2" width="7.6" height="5.6" rx="1.6" />
    <rect x="13.2" y="11.2" width="7.6" height="9.6" rx="1.6" />
    <rect x="3.2" y="15.2" width="7.6" height="5.6" rx="1.6" />
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
