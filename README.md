# The Farm Stories

A living storybook website for **The Farm Stories** — boutique orchard communities
in South India. Every farm is a chapter, every project is a book, and every owner
becomes part of the story.

## Structure

```
index.html      — the whole site (single page, section-based routing preserved)
css/main.css    — Malgudi-days warm paper theme, book intro, portal + plot explorer styles
js/intro.js     — hardbound-book opening experience (page turns, paper motes, dissolve)
js/main.js      — routing, scroll reveals, lazy media loading, project filters, motion, CRO
js/plots.js     — interactive Mango Meadows masterplan (zoom, pan, filters, compare, bookmarks)
assets/         — put the hero artwork at assets/hero.jpg and it is used automatically
vercel.json     — static deployment config
```

The Portal aggregates **projects** (Mango Meadows, Coffee Canopy, Pepper Hollow)
with location / size / budget / nature filters and a South India pin map. The
plot-level explorer lives inside Our Projects → Plot Map.

## Drop-in assets

The site auto-detects files in `assets/` — commit them and they appear with
zero code changes:

- `assets/hero.jpg` — hero artwork; replaces the SVG recreation on load.
- `assets/logo.png` (or `.svg` / `.webp` / `.jpg`) — brand logo; replaces the
  monogram in the nav, footer and about strip, and hides the text wordmark.
  Works for square badges or wide lockups; dark logos keep a light chip on the
  dark placements.
- `assets/masterplan.jpg` — architect's site plan, shown in Our Projects →
  Plot Map under the "Architect's plan" toggle (zoom / pan).
- `assets/floor-ground.jpg`, `assets/floor-first.jpg` — farmhouse floor plans,
  shown in Our Projects → Farmhouse Design (click to enlarge in a lightbox).
- `assets/mango-cover.jpg` + `assets/mango-render-*.jpg` + `assets/mango-view-*.jpg`
  — Mango Meadows design renders, used as the project cover, the Site Views
  gallery (click to enlarge), the home chapter spread and the What's New feature.
- `assets/logo-mango.png` / `assets/logo-mango-cream.png` — the Mango Meadows
  project wordmark (green for light backgrounds, cream for dark).

The masterplan, floor-plan and render images here were extracted from the
supplied Mango Meadows PDFs.

## Deployment

Pure static site — deploys to Vercel with zero build step. Push to the connected
branch and Vercel serves `index.html` from the repository root.

## Notes

- Motion libraries load lazily from CDN after first paint and are optional; the
  site is fully functional without them.
- All photography lazy-loads: content images via `data-src`, background images
  via `data-bg`, satellite imagery only when the toggle is first used.
- `prefers-reduced-motion` disables the book intro, ink animation, and parallax.
- The book intro shows once per browser session (`sessionStorage`), can be
  skipped, and auto-dissolves so it never traps a visitor.
- Saved plots persist in `localStorage`.
