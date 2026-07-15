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
  const tabs = ['overview', 'views', 'benefits', 'brochure'];
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
    const lenis = new Lenis({ duration: 1.35, smoothWheel: true });
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

/* ── Cursor glow ── */
function initCursorGlow() {
  if (REDUCED || !window.matchMedia('(hover:hover)').matches) return;
  const glow = document.getElementById('cursor-glow');
  let raf = null, x = 0, y = 0;
  window.addEventListener('mousemove', e => {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => {
      glow.style.left = x + 'px'; glow.style.top = y + 'px'; raf = null;
    });
  }, { passive: true });
  document.body.classList.add('glow-on');
}

/* ── Drifting leaves (very occasional, home hero only) ── */
function initLeaves() {
  if (REDUCED) return;
  const LEAF = '<svg viewBox="0 0 20 20"><path d="M10 1 C5 6 3 10 4 14 a6 6 0 0 0 12 0 C17 10 15 6 10 1 Z" fill="rgba(107,140,106,.7)"/></svg>';
  setInterval(() => {
    if (document.hidden) return;
    if (!document.getElementById('home').classList.contains('active')) return;
    if (window.scrollY > window.innerHeight) return;
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    leaf.innerHTML = LEAF;
    leaf.style.left = (8 + Math.random() * 84) + 'vw';
    leaf.style.animationDuration = (9 + Math.random() * 7) + 's';
    leaf.style.transform = 'scale(' + (0.7 + Math.random() * 0.7) + ')';
    document.body.appendChild(leaf);
    setTimeout(() => leaf.remove(), 17000);
  }, 6500);
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
  initCursorGlow();
  initLeaves();

  // If the intro is skipped (reduced motion / already seen), wake the hero now.
  if (REDUCED || sessionStorage.getItem('tfs-intro-seen')) wakeHero();

  // Defer motion libs until the browser is idle — keeps first paint fast.
  if ('requestIdleCallback' in window) requestIdleCallback(initMotion, { timeout: 3000 });
  else setTimeout(initMotion, 1200);
});

window.wakeHero = wakeHero;
