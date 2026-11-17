/* ═══════════════════════════════════════════
   THE FARM STORIES — "Three things we bring together"
   Read at the pace of the scroll: the statement lights up word by word,
   then Land → Home → People arrive in turn. Desktop pins the scene while
   it plays; phones read it in normal flow. With reduced motion or no JS
   everything is simply visible.
   ═══════════════════════════════════════════ */
(function () {
  const scene = document.getElementById('tt-scene');
  if (!scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Split the statement into words, keeping the gold <em> phrases intact
  const statement = scene.querySelector('.tt-statement');
  const words = [];
  (function split(node) {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 1) return split(n);
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
        const w = document.createElement('span');
        w.className = 'tt-word'; w.textContent = t;
        frag.appendChild(w); words.push(w);
      });
      n.replaceWith(frag);
    });
  })(statement);

  const steps = [...scene.querySelectorAll('.tt-step')];
  const foot = scene.querySelector('.tt-foot');
  const pinnable = window.matchMedia('(min-width: 901px) and (min-height: 680px)');
  const clamp = v => Math.max(0, Math.min(1, v));
  scene.classList.add('tt-armed');

  let queued = false;
  function update() {
    queued = false;
    if (!scene.offsetParent) return;                       // home isn't the page on screen
    const vh = window.innerHeight;
    const pinned = pinnable.matches;
    scene.classList.toggle('tt-pinned', pinned);
    let lit;
    if (pinned) {
      // progress through the tall scene: words 0–50%, steps 50–82%, footer after
      const r = scene.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, scene.offsetHeight - vh));
      lit = clamp(p / 0.5);
      const ps = clamp((p - 0.5) / 0.32);
      steps.forEach((s, i) => s.classList.toggle('on', ps > i / 3 + 0.02));
      if (foot) foot.classList.toggle('on', p > 0.8);
    } else {
      // phones: words light as the statement crosses the screen; steps as they arrive
      const r = statement.getBoundingClientRect();
      lit = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.38));
      steps.forEach(s => s.classList.toggle('on', s.getBoundingClientRect().top < vh * 0.84));
      if (foot) foot.classList.toggle('on', foot.getBoundingClientRect().top < vh * 0.92);
    }
    const n = Math.round(lit * words.length);
    words.forEach((w, i) => w.classList.toggle('lit', i < n));
  }
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  if (pinnable.addEventListener) pinnable.addEventListener('change', request);
  // re-evaluate when the Home page is routed back into view
  const home = document.getElementById('home');
  if (home) new MutationObserver(request).observe(home, { attributes: true, attributeFilter: ['class'] });
  update();
})();

/* ── Text that lights up as it is read ──
   Any .scroll-read element: its words brighten as it moves up the screen,
   the same reading pace as the three-things statement. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = [...document.querySelectorAll('.scroll-read')];
  if (!els.length) return;
  const split = (node, words) => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 1) return split(n, words);
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
        const w = document.createElement('span'); w.className = 'sr-word'; w.textContent = t;
        frag.appendChild(w); words.push(w);
      });
      n.replaceWith(frag);
    });
  };
  const items = els.map(el => { const words = []; split(el, words); el.classList.add('sr-armed'); return { el, words }; });
  const clamp = v => Math.max(0, Math.min(1, v));
  let queued = false;
  function update() {
    queued = false;
    const vh = window.innerHeight;
    items.forEach(({ el, words }) => {
      if (!el.offsetParent) return;
      const r = el.getBoundingClientRect();
      const p = clamp((vh * 0.9 - r.top) / (r.height + vh * 0.32));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('lit', i < n));
    });
  }
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  document.querySelectorAll('section').forEach(sec => new MutationObserver(request).observe(sec, { attributes: true, attributeFilter: ['class'] }));
  update();
})();

/* ── Story One ledger: numbers count up once, as the band arrives ── */
(function () {
  const band = document.querySelector('.mh-ledger2');
  if (!band || !('IntersectionObserver' in window)) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = [...band.querySelectorAll('.ct')];
  if (!still) counters.forEach(c => { c.style.minWidth = c.offsetWidth ? c.offsetWidth + 'px' : ''; c.textContent = '0'; });
  const run = () => {
    const t0 = performance.now(), dur = 1600;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      counters.forEach(c => { c.textContent = Math.round(+c.dataset.to * e); });
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(entries => {
    if (!entries.some(en => en.isIntersecting)) return;
    io.disconnect();
    [...band.children].forEach((li, i) => setTimeout(() => li.classList.add('in'), i * 120));
    if (!still) run();
  }, { threshold: 0.35 });
  io.observe(band);
})();
