/* ═══════════════════════════════════════════════════════
   THE FARM STORIES — main site behaviour
   Routing (preserved), motion, micro-interactions, CRO.
   Motion libraries (Lenis / GSAP / ScrollTrigger / SplitType)
   are lazy-loaded after first paint and are all optional —
   the site is fully functional without them.
   ═══════════════════════════════════════════════════════ */
'use strict';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Navigation (preserved API) ── */
function show(id) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const el = document.getElementById('nl-' + id);
  if (el) el.classList.add('active');
  document.getElementById('site-nav').classList.remove('menu-open');
  window.scrollTo(0, 0);
  // keep the URL hash in sync so sections are deep-linkable / shareable
  if (target && id !== 'home' && ('#' + id) !== location.hash) {
    history.replaceState(null, '', '#' + id);
  } else if (id === 'home' && location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  requestAnimationFrame(observeReveals);
  if (window.ScrollTrigger) ScrollTrigger.refresh();
  return false;
}
// Deep-link: open the section named in the URL hash on load / hashchange
function routeFromHash() {
  const id = (location.hash || '').replace('#', '');
  if (id && document.getElementById(id) && document.getElementById(id).tagName === 'SECTION') show(id);
}
window.addEventListener('hashchange', routeFromHash);

/* ── Project tabs (preserved API) ── */
function openTab(name) {
  show('projects');
  const tabs = ['overview', 'plotmap', 'farmhouse', 'views', 'benefits', 'brochure'];
  const btns = document.querySelectorAll('.ptab');
  const panes = document.querySelectorAll('.tab-pane');
  const idx = tabs.indexOf(name);
  btns.forEach(b => b.classList.remove('active'));
  panes.forEach(p => p.classList.remove('active'));
  if (idx >= 0) {
    btns[idx].classList.add('active');
    const pane = document.getElementById('pane-' + name);
    pane.classList.add('active');
    // Force-load any lazy media in the just-opened pane — a tab pane starts
    // display:none, where IntersectionObserver may never fire.
    if (typeof loadLazyIn === 'function') loadLazyIn(pane);
  }
  requestAnimationFrame(observeReveals);
}

/* ── What's New filter (preserved API) ── */
function filterPosts(type, btn) {
  document.querySelectorAll('.wn-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.wn-card').forEach(card => {
    card.classList.toggle('hidden', !(type === 'all' || card.dataset.type === type));
  });
  const featured = document.querySelector('.wn-featured');
  if (featured) featured.style.display = (type === 'all' || featured.dataset.type === type) ? '' : 'none';
}

/* ── Forms (CRO: instant, forgiving feedback) ── */
function notifySubmit(form) {
  form.classList.add('sent');
  const btn = form.querySelector('button');
  btn.textContent = 'You’re on the list ✓';
  btn.disabled = true;
  return false;
}

function openVisitForm(plotName) {
  const modal = document.getElementById('visit-modal');
  modal.hidden = false;
  document.getElementById('visit-plot-field').value = plotName || '';
  const sub = modal.querySelector('.modal-sub');
  if (plotName) sub.textContent = 'You asked about ' + plotName + '. Guided visits every weekend, 75–90 minutes from Coimbatore. We’ll confirm on WhatsApp within a few hours.';
  document.body.style.overflow = 'hidden';
}
function closeVisitForm() {
  document.getElementById('visit-modal').hidden = true;
  document.body.style.overflow = '';
}
function visitSubmit(form) {
  form.hidden = true;
  document.getElementById('visit-done').hidden = false;
  setTimeout(closeVisitForm, 3200);
  setTimeout(() => { form.hidden = false; document.getElementById('visit-done').hidden = true; form.reset(); }, 3800);
  return false;
}

/* ── Lightbox for plans / imagery ── */
function initLightbox() {
  const box = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (!box) return;
  function open(src, alt) {
    img.src = src; img.alt = alt || '';
    box.hidden = false; document.body.style.overflow = 'hidden';
  }
  function close() { box.hidden = true; img.src = ''; document.body.style.overflow = ''; }
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-lightbox]');
    if (trigger) {
      e.preventDefault();
      const full = trigger.dataset.full || trigger.querySelector('img')?.src;
      const alt = trigger.querySelector('img')?.alt;
      if (full) open(full, alt);
    }
  });
  box.addEventListener('click', close);
  document.getElementById('lightbox-close').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) close(); });
}

/* ── Scroll reveals via IntersectionObserver ── */
let revealObserver;
function observeReveals() {
  if (REDUCED) { document.querySelectorAll('.reveal').forEach(n => n.classList.add('in')); return; }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }
  document.querySelectorAll('section.active .reveal:not(.in), .trust-strip .reveal:not(.in)')
    .forEach(n => revealObserver.observe(n));
}

/* ── Counter animation for story stats ──
   The HTML already holds the real final values (so no-JS / reduced-motion
   shows them). We only seed to 0 and count up when motion is allowed, and
   only for stats below the fold, so there's never a final→0 flash. */
function animateCounters() {
  const nums = document.querySelectorAll('.hero-stat .num[data-count]');
  if (REDUCED) return; // leave the static real values in place
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const n = en.target;
      io.unobserve(n);
      const end = +n.dataset.count, suffix = n.dataset.suffix || '';
      const t0 = performance.now(), dur = 1600;
      (function tick(t) {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        n.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.6 });
  // Leave the real value in the DOM as the resting/fallback state; the count-up
  // starts from 0 the moment a stat scrolls into view. Never pre-seed to 0, so a
  // stat that is navigated-to but never scrolled into view still shows its real
  // number instead of a stuck "0".
  nums.forEach(n => io.observe(n));
}

/* ── Lazy-load motion libraries, then enhance ── */
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function initMotion() {
  if (REDUCED) return;
  try {
    for (const src of (window.TFS_LIBS || [])) await loadScript(src);
  } catch (e) { return; } // motion is decorative; never block the site
  if (!window.gsap) return;

  gsap.registerPlugin(ScrollTrigger);

  // Native scrolling — no smooth-scroll library (snappy, zero lag).
  // ScrollTrigger drives the reveals/parallax off the browser's own scroll.

  // Typography reveal on the hero title
  if (window.SplitType) {
    const split = new SplitType('#hero-title', { types: 'lines,words' });
    gsap.from(split.words, {
      yPercent: 110, opacity: 0, duration: 1.1, ease: 'power3.out',
      stagger: 0.06, delay: 0.15,
    });
  }

  // Editorial parallax on large imagery
  document.querySelectorAll('.parallax-img img, .cs-img img').forEach(img => {
    gsap.to(img, {
      yPercent: -10, ease: 'none',
      scrollTrigger: { trigger: img.closest('div'), start: 'top bottom', end: 'bottom top', scrub: 1.2 },
    });
  });

  // Gentle drift on the hero chapter card
  gsap.to('.hero-chapter-card', {
    y: -14, ease: 'none',
    scrollTrigger: { trigger: '.hero-canvas', start: 'top top', end: 'bottom top', scrub: 1.5 },
  });
}

/* ── Lazy loading ──
   Images use data-src, background elements use data-bg (+ optional
   data-overlay gradient). Both load only when scrolled near the
   viewport — display:none sections load on first visit. */
let lazyObserver;
function loadLazyEl(el) {
  if (el.dataset.src) {
    el.src = el.dataset.src;
    el.addEventListener('load', () => el.classList.add('lazy-loaded'), { once: true });
    el.removeAttribute('data-src');
  } else if (el.dataset.bg) {
    const url = 'url("' + el.dataset.bg + '")';
    el.style.backgroundImage = el.dataset.overlay ? el.dataset.overlay + ', ' + url : url;
    el.removeAttribute('data-bg');
  }
}
function initLazyMedia() {
  if ('IntersectionObserver' in window) {
    lazyObserver = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { loadLazyEl(en.target); lazyObserver.unobserve(en.target); }
      });
    }, { rootMargin: '300px 0px' });
  }
  observeLazy(document);
}
// Register lazy media inside a root — also used for dynamically rendered cards.
function observeLazy(root) {
  const els = (root || document).querySelectorAll('img[data-src], [data-bg]');
  if (!lazyObserver) { els.forEach(loadLazyEl); return; }
  els.forEach(el => lazyObserver.observe(el));
}
// Immediately load all lazy media inside a container (used when a hidden
// pane/section becomes visible, so we never depend on the observer firing).
function loadLazyIn(root) {
  (root || document).querySelectorAll('img[data-src], [data-bg]').forEach(loadLazyEl);
}
/* ── Hero artwork ──
   Drop the artwork into the repo and it replaces the SVG recreation
   automatically. We probe a few likely filenames so whatever you commit
   (assets/hero.jpg, assets/hero.png, assets/asset.jpg, /hero.jpg …) works. */
function initHeroArt() {
  const img = document.getElementById('hero-art');
  if (!img) return;
  const candidates = [
    'assets/hero.jpg', 'assets/hero.jpeg', 'assets/hero.png', 'assets/hero.webp',
    'assets/asset.jpg', 'assets/asset.png', 'hero.jpg', 'hero.png',
  ];
  const v = '?v=' + (window.TFS_ASSET_V || '1');
  let i = 0;
  const probe = new Image();
  probe.onload = () => {
    img.src = probe.src;
    // Serve a lighter 1000px variant to phones (saves ~260KB above the fold).
    if (/assets\/hero\.jpg/.test(probe.src)) {
      img.srcset = 'assets/hero-mobile.jpg' + v + ' 1000w, ' + probe.src + ' 1823w';
      img.sizes = '100vw';
    }
    img.hidden = false;
    document.querySelector('.hero-canvas').classList.add('has-art');
  };
  probe.onerror = () => { if (++i < candidates.length) probe.src = candidates[i] + v; };
  probe.src = candidates[0] + v;
}

/* ── Brand logo ──
   Drop a logo into the repo and it replaces the SVG monogram in the
   nav, footer and about strip automatically — zero code changes.
   Probes common filenames; detects square badge vs. wide lockup. */
function initBrandLogo() {
  const candidates = [
    'assets/logo.png', 'assets/logo.svg', 'assets/logo.webp',
    'assets/logo.jpg', 'assets/logo.jpeg', 'logo.png',
  ];
  let i = 0;
  const probe = new Image();
  probe.onload = () => applyBrandLogo(probe.src);
  probe.onerror = () => { if (++i < candidates.length) probe.src = candidates[i]; };
  probe.src = candidates[0];
}
function applyBrandLogo(src) {
  document.body.classList.add('has-brand-logo');
  ['.nav-logo-img', '.foot-logo', '.quote-logo'].forEach(sel => {
    const slot = document.querySelector(sel);
    if (!slot) return;
    slot.innerHTML = '';
    const im = new Image();
    im.src = src; im.alt = 'The Farm Stories';
    slot.appendChild(im);
  });
}

/* ── Mobile: collapse each filter panel into a bottom-sheet ──
   Applies to both the plot-map filters and the Portal filters (same
   component). A "Filters" button opens the sheet; a backdrop / × closes it. */
function initMobileFilters() {
  const backdrop = document.createElement('div');
  backdrop.className = 'filter-backdrop';
  document.body.appendChild(backdrop);
  let openPanel = null;
  function shut() {
    if (openPanel) {
      openPanel.classList.remove('sheet-open');
      // Return the panel to its original spot in the DOM (see note in open()).
      if (openPanel._home) openPanel._home.parentNode.insertBefore(openPanel, openPanel._home);
    }
    openPanel = null;
    backdrop.classList.remove('show');
    document.body.classList.remove('filter-sheet-lock');
  }
  backdrop.addEventListener('click', shut);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') shut(); });

  document.querySelectorAll('.filter-panel').forEach(panel => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mobile-filter-btn';
    btn.innerHTML = '<span aria-hidden="true">⚙</span> Filters';
    panel.parentNode.insertBefore(btn, panel);

    // Anchor node marking where the panel lives when closed, so we can restore
    // it after portaling to <body>. (The panel's fields keep their ids, so the
    // filter logic in plots.js / portal.js keeps working wherever it sits.)
    const home = document.createComment('filter-panel-home');
    panel.parentNode.insertBefore(home, panel);
    panel._home = home;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'filter-sheet-close';
    close.setAttribute('aria-label', 'Close filters');
    close.textContent = '×';
    panel.insertBefore(close, panel.firstChild);

    btn.addEventListener('click', () => {
      if (openPanel) shut();
      // The section/tab wrapper carries a transform from the reveal system,
      // which would trap position:fixed inside it. Portal to <body> so the
      // sheet anchors to the viewport.
      document.body.appendChild(panel);
      openPanel = panel;
      // next frame so the translateY(101%) start state paints before sliding up
      requestAnimationFrame(() => panel.classList.add('sheet-open'));
      backdrop.classList.add('show');
      document.body.classList.add('filter-sheet-lock');
    });
    close.addEventListener('click', shut);
  });
}

/* ── Portal: South India map tooltip (preserved API) ── */
function mapTip(e, title, info) {
  const tt = document.getElementById('map-tt');
  if (!tt) return;
  const panel = tt.closest('.map-panel');
  const rect = panel.getBoundingClientRect();
  tt.innerHTML = '<strong>' + title + '</strong>' + info;
  tt.style.left = Math.min(e.clientX - rect.left + 14, rect.width - 220) + 'px';
  tt.style.top = (e.clientY - rect.top - 54) + 'px';
  tt.classList.add('show');
  clearTimeout(tt._t);
  tt._t = setTimeout(() => tt.classList.remove('show'), 3200);
}

/* Portal filtering and rendering live in js/portal.js */

/* ── Nav behaviour + sticky CRO bar ── */
function initScrollChrome() {
  const nav = document.getElementById('site-nav');
  const sticky = document.getElementById('sticky-cta');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('nav-scrolled', y > 8);
    nav.classList.toggle('nav-hidden', y > 420 && y > lastY);
    lastY = y;
    if (sticky) {
      sticky.hidden = false;
      sticky.classList.toggle('shown', y > window.innerHeight * 0.9);
    }
  }, { passive: true });

  document.getElementById('nav-burger').addEventListener('click', () =>
    nav.classList.toggle('menu-open'));
}

/* ── Wake the hero (ink drawing + photo dissolve) ── */
function wakeHero() {
  const canvas = document.querySelector('.hero-canvas');
  if (canvas) canvas.classList.add('awake');
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href="#"]').forEach(a =>
    a.addEventListener('click', e => e.preventDefault()));
  document.getElementById('visit-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeVisitForm();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeVisitForm();
  });

  observeReveals();
  animateCounters();
  initScrollChrome();
  initLazyMedia();
  initHeroArt();
  initBrandLogo();
  initLightbox();
  initMobileFilters();
  routeFromHash();

  // If the intro is skipped (reduced motion / already seen), wake the hero now.
  if (REDUCED || sessionStorage.getItem('tfs-intro-seen')) wakeHero();

  // Defer motion libs until the browser is idle — keeps first paint fast.
  if ('requestIdleCallback' in window) requestIdleCallback(initMotion, { timeout: 3000 });
  else setTimeout(initMotion, 1200);
});

window.wakeHero = wakeHero;
window.observeLazy = observeLazy;
window.mapTip = mapTip;
