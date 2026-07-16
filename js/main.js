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
  requestAnimationFrame(observeReveals);
  if (window.ScrollTrigger) ScrollTrigger.refresh();
  return false;
}

/* ── Project tabs (preserved API) ── */
function openTab(name) {
  show('projects');
  const tabs = ['overview', 'plotmap', 'views', 'benefits', 'brochure'];
  const btns = document.querySelectorAll('.ptab');
  const panes = document.querySelectorAll('.tab-pane');
  const idx = tabs.indexOf(name);
  btns.forEach(b => b.classList.remove('active'));
  panes.forEach(p => p.classList.remove('active'));
  if (idx >= 0) {
    btns[idx].classList.add('active');
    document.getElementById('pane-' + name).classList.add('active');
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

/* ── Counter animation for story stats ── */
function animateCounters() {
  const nums = document.querySelectorAll('.hero-stat .num[data-count]');
  if (REDUCED) {
    nums.forEach(n => n.textContent = n.dataset.count + (n.dataset.suffix || ''));
    return;
  }
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

  // Lenis smooth scroll, calm and slow
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

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
  const els = document.querySelectorAll('img[data-src], [data-bg]');
  if (!('IntersectionObserver' in window)) { els.forEach(loadLazyEl); return; }
  lazyObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { loadLazyEl(en.target); lazyObserver.unobserve(en.target); }
    });
  }, { rootMargin: '300px 0px' });
  els.forEach(el => lazyObserver.observe(el));
}
/* ── Hero artwork: use assets/hero.jpg when it exists in the repo ── */
function initHeroArt() {
  const img = document.getElementById('hero-art');
  if (!img) return;
  const probe = new Image();
  probe.onload = () => {
    img.src = probe.src;
    img.hidden = false;
    document.querySelector('.hero-canvas').classList.add('has-art');
  };
  probe.src = 'assets/hero.jpg';
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

/* ── Portal: project aggregator filters ── */
function initProjectFilters() {
  const loc = document.getElementById('pf-location');
  if (!loc) return;
  const size = document.getElementById('pf-size');
  const feature = document.getElementById('pf-feature');
  const selling = document.getElementById('pf-selling');
  const budget = document.getElementById('pf-budget');
  const cards = document.querySelectorAll('#project-cards .project-card');
  const empty = document.getElementById('pf-empty');

  function apply() {
    let visible = 0;
    cards.forEach(card => {
      let ok = true;
      if (loc.value !== 'all' && card.dataset.loc !== loc.value) ok = false;
      if (size.value !== 'all' && !card.dataset.sizes.split(' ').includes(size.value)) ok = false;
      if (feature.value !== 'all' && !card.dataset.features.split(' ').includes(feature.value)) ok = false;
      if (selling.checked && card.dataset.status !== 'selling') ok = false;
      // budget: any numeric overlap with the card's price band (₹ lakhs)
      const m = (budget.value.match(/\d+/g) || []).map(Number);
      if (ok && m.length && +card.dataset.max > 0) {
        const lo = Math.min(...m), hi = Math.max(...m);
        if (hi < +card.dataset.min || lo > +card.dataset.max) ok = false;
      }
      card.classList.toggle('filtered-out', !ok);
      if (ok) visible++;
    });
    empty.hidden = visible > 0;
  }

  [loc, size, feature].forEach(n => n.addEventListener('change', apply));
  selling.addEventListener('change', apply);
  budget.addEventListener('input', apply);
  document.getElementById('pf-reset').addEventListener('click', () => {
    loc.value = size.value = feature.value = 'all';
    selling.checked = false; budget.value = '';
    apply();
  });
}

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
  initProjectFilters();

  // If the intro is skipped (reduced motion / already seen), wake the hero now.
  if (REDUCED || sessionStorage.getItem('tfs-intro-seen')) wakeHero();

  // Defer motion libs until the browser is idle — keeps first paint fast.
  if ('requestIdleCallback' in window) requestIdleCallback(initMotion, { timeout: 3000 });
  else setTimeout(initMotion, 1200);
});

window.wakeHero = wakeHero;
