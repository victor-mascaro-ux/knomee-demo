// White-label "client brand" mode. Each brand recolors the primary (header,
// buttons, links) and swaps a centered logo into the top bar. Logos are white
// knockouts (they sit on the brand-colored bar) recreated as inline SVG.

import type { ReactNode } from 'react'

export interface ClientBrand {
  id: string
  name: string
  primary: string
  accent: string
  logo: ReactNode
}

// "Confetti Wealth" — scattered squares + wordmark.
function ConfettiLogo() {
  return (
    <svg className="client-logo" viewBox="0 0 336 40" fill="currentColor" role="img" aria-label="Confetti Wealth">
      <rect x="15" y="1" width="8" height="8" rx="1.5" />
      <rect x="2" y="12" width="9.5" height="9.5" rx="1.5" />
      <rect x="15.5" y="11.5" width="11.5" height="11.5" rx="1.5" opacity="0.72" />
      <rect x="31" y="13" width="8.5" height="8.5" rx="1.5" />
      <rect x="9" y="26" width="7.5" height="7.5" rx="1.5" opacity="0.72" />
      <rect x="20.5" y="25" width="11.5" height="11.5" rx="1.5" />
      <text x="54" y="28" fontSize="26" fontWeight="700" letterSpacing="0.5">CONFETTI</text>
      <text x="208" y="28" fontSize="26" fontWeight="400" letterSpacing="2.5">WEALTH</text>
    </svg>
  )
}

// "Affirm Wealth Advisors" — AWA monogram, divider, stacked name.
function AffirmLogo() {
  return (
    <svg className="client-logo" viewBox="0 0 300 40" fill="currentColor" role="img" aria-label="Affirm Wealth Advisors">
      <text x="0" y="31" fontFamily="Georgia, 'Times New Roman', serif" fontSize="34" fontWeight="700" letterSpacing="-1.5">
        AWA
      </text>
      <rect x="92" y="3" width="2" height="34" opacity="0.55" />
      <text x="104" y="17" fontSize="13" fontWeight="600" letterSpacing="2.4">AFFIRM WEALTH</text>
      <text x="104" y="34" fontSize="13" fontWeight="600" letterSpacing="2.4">ADVISORS</text>
    </svg>
  )
}

export const CLIENT_BRANDS: ClientBrand[] = [
  { id: 'affirm', name: 'Affirm Wealth Advisors', primary: '#1aa3c6', accent: '#1590b0', logo: <AffirmLogo /> },
  { id: 'confetti', name: 'Confetti Wealth', primary: '#0093b0', accent: '#007e98', logo: <ConfettiLogo /> },
]
