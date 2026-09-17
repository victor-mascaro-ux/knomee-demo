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
    <svg className="client-logo" viewBox="0 1 336 35.5" fill="currentColor" role="img" aria-label="Confetti Wealth">
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
    <svg className="client-logo" viewBox="0 3 300 34" fill="currentColor" role="img" aria-label="Affirm Wealth Advisors">
      <text x="0" y="31" fontFamily="Georgia, 'Times New Roman', serif" fontSize="34" fontWeight="700" letterSpacing="-1.5">
        AWA
      </text>
      <rect x="92" y="3" width="2" height="34" opacity="0.55" />
      <text x="104" y="17" fontSize="13" fontWeight="600" letterSpacing="2.4">AFFIRM WEALTH</text>
      <text x="104" y="34" fontSize="13" fontWeight="600" letterSpacing="2.4">ADVISORS</text>
    </svg>
  )
}

// "Acme" — the name and nothing else, set in a serif with the letters pushed
// apart. The other two brands are a mark plus a wordmark in the app's own
// grotesque; this one is there to prove the bar carries a firm whose whole
// identity is a typeface, which is most of them.
function AcmeLogo() {
  return (
    <svg className="client-logo" viewBox="0 3 200 34" fill="currentColor" role="img" aria-label="Acme">
      <text
        x="0"
        y="31"
        fontFamily="Georgia, 'Iowan Old Style', 'Times New Roman', serif"
        fontSize="30"
        fontWeight="400"
        letterSpacing="7"
      >
        ACME
      </text>
    </svg>
  )
}

export const CLIENT_BRANDS: ClientBrand[] = [
  { id: 'affirm', name: 'Affirm Wealth Advisors', primary: '#1aa3c6', accent: '#1590b0', logo: <AffirmLogo /> },
  { id: 'confetti', name: 'Confetti Wealth', primary: '#0093b0', accent: '#007e98', logo: <ConfettiLogo /> },
  /* Not cyan, because the other two are and a white-label demo that only ever
     changes shade proves nothing — but not the burgundy it was either. That sat
     at hue 340, six degrees off --k-crimson and sixty-five off the plum it
     shares a screen with: two dark purple-reds that are not the same colour,
     which reads as a mistake rather than as another firm. And on the phone it
     had to hold a bar above a lime adventure card and a teal progress fill,
     which is a warm colour against two cool ones.

     Navy instead. Hue 214 is the widest gap the knomee ramp leaves open: 61
     degrees off the plum, 22 off --k-ocean, and the only token near it,
     --k-azure, is a bright tag ink at 53% lightness that never appears on
     these screens. It sits under plum headlines without arguing with them and
     goes with the lime and the teal rather than at them. 59% saturation at 27%
     lightness, so it reads as a colour and not as near-black — the fault the
     clay red before the burgundy had. White on it measures 10.58:1, still the
     strongest of the three brands. */
  { id: 'acme', name: 'Acme', primary: '#1c3f6e', accent: '#163258', logo: <AcmeLogo /> },
]
