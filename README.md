# Knomee Advisor — Demo

A pixel-faithful recreation of the **My Prospects** dashboard from the Knomee
Advisor Figma prototype, built with React, TypeScript, and Vite.

[Figma reference »](https://www.figma.com/design/8HhKtgP7kuKaaC7IvWWjhO/Knomee---Demo--2026--NEW?node-id=19003-21027)

## The page

The Prospects Dashboard reproduces the design 1:1:

- **Top bar** with the Knomee Advisor brand and account avatar
- **Prospects / Clients / Reporting** tabs
- **Top Line Metrics** — total prospects, average KQ score, tier distribution
  bar, and per-tier summary cards
- **Actionable Insights** — an eight-item, two-column insight list
- **Prospects table** — grouped by tier (Ready Now / Considering / Nurture /
  Incomplete) with KQ / Intent / Clarity / Receptivity scores, sign-up date,
  and top action per prospect

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check and build for production
npm run preview  # preview the production build
```

## Project structure

```
src/
  App.tsx                # page composition (top bar, tabs, sections, table)
  index.css              # design tokens + all styling
  components/icons.tsx   # inline SVG icon set
  data/prospects.ts      # prospect rows + tier groups
  data/insights.ts       # actionable-insights copy
```

Colors and typography follow the Figma variables (Poppins type ramp; Plum,
Ocean, Steel, and Lilac brand palette).
