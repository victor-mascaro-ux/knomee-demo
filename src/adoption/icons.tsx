/* The demo's own small glyphs (its notes, emails and Intercom pieces).
   The knomee mark is the product's own five paths. */

import { MARK_PARTS } from '../screens/ClientExperienceScreen'

export function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 288 288" fill="none" aria-hidden focusable="false">
      {MARK_PARTS.map((d) => (
        <path key={d.slice(0, 12)} d={d} fill="currentColor" />
      ))}
    </svg>
  )
}

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const XIcon = () => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth="2.2" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const CheckIcon = () => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth="3.4" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

export const MailIcon = () => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth="2" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
  </svg>
)

export const ChatIcon = () => (
  <svg viewBox="0 0 28 28" fill="currentColor" aria-hidden>
    <path d="M14 3C7.4 3 2 7.5 2 13c0 3.1 1.7 5.9 4.4 7.7L5.5 25l5-2.6c1.1.3 2.3.4 3.5.4 6.6 0 12-4.5 12-10S20.6 3 14 3z" />
  </svg>
)

export const BellIcon = () => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth="2" aria-hidden>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
)

export const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth="2" aria-hidden>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </svg>
)

/** A pointing hand tapping: the notes' "try it" hint. */
