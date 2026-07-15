# The Farm Stories

A living storybook website for **The Farm Stories** — boutique orchard communities
in South India. Every farm is a chapter, every project is a book, and every owner
becomes part of the story.

## Structure

```
index.html      — the whole site (single page, section-based routing preserved)
css/main.css    — Malgudi-days warm paper theme, book intro, plot explorer styles
js/intro.js     — hardbound-book opening experience (page turns, paper motes, dissolve)
js/main.js      — routing, scroll reveals, lazy motion (Lenis/GSAP/ScrollTrigger/SplitType), CRO
js/plots.js     — interactive Mango Meadows masterplan (zoom, pan, filters, compare, bookmarks)
vercel.json     — static deployment config
```

## Deployment

Pure static site — deploys to Vercel with zero build step. Push to the connected
branch and Vercel serves `index.html` from the repository root.

## Notes

- Motion libraries load lazily from CDN after first paint and are optional; the
  site is fully functional without them.
- `prefers-reduced-motion` disables the book intro, ink animation, parallax,
  leaves, and cursor glow.
- The book intro shows once per browser session (`sessionStorage`), can be
  skipped, and auto-dissolves so it never traps a visitor.
- Saved plots persist in `localStorage`.
