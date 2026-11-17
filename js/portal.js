/* ═══════════════════════════════════════════════════════
   THE FARM STORIES — Portal project aggregator
   One registry drives the map pins AND the project cards.
   Filters (location / size / budget / feature / selling)
   update both, with a live result count and empty state.
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const PROJECTS = [
    {
      id: 'mango-meadows', name: 'The Mango Meadows',
      place: 'Agali, Kerala', note: 'About 90 min from Coimbatore',
      state: 'kl', status: 'selling', statusLabel: 'Now selling',
      sizes: ['20-30'], budgetMin: 40, budgetMax: 240,
      features: ['orchard', 'mountain'],
      specs: [['7.4 acres', 'Total area'], ['22', 'Plots'], ['280+', 'Mango trees']],
      img: 'assets/mm2/aerial-900.jpg',
      imgAlt: 'The Mango Meadows farmhouse over the valley',
      pin: { lon: 76.65, lat: 11.1, label: 'Agali', side: 'r' },
      cta: 'Read this chapter →', action: 'projects',
      tip: 'Agali, Kerala · 22 plots · 20–27 cents · Now selling',
    },
    {
      id: 'sol-village', name: 'SOL Creator Village',
      place: 'Attappadi, Kerala', note: 'Private hilltop · tar-road access',
      state: 'kl', status: 'selling', statusLabel: 'Now selling',
      sizes: [], budgetMin: 0, budgetMax: 0,
      features: ['mountain', 'forest'],
      specs: [['7 acres', 'Private hilltop'], ['Studios', 'Yoga shala · café'], ['Stays', 'Rent it when away']],
      img: 'assets/mm2/sol-aframe.jpg',
      imgAlt: 'An A-frame home on a misty hilltop at sunrise, SOL Creator Village',
      pin: { lon: 76.52, lat: 11.19, label: 'Attappadi', side: 'lb' },
      cta: 'Read about SOL →', ctaOpen: 'Hide details ↑', action: 'expand',
      about: 'Spirit of Life (SOL) Creator Village is a place for people who want to create, live, grow and build differently. It is spread across 7 acres of private hilltop land amidst the forests and misty hills of Attappadi, with direct access from the main road. Own your land and build your own home, studio or creative space in your own style. As an owner you can simply enjoy the community or help create it, and when you are away you can make your space available for stays and experiences.',
      facts: [['7 acres', 'Private hilltop'], ['Tar road', 'Direct access'], ['Studios', 'Yoga shala · café'], ['Amphitheatre', 'Coworking · podcast studio'], ['Clubhouse', 'Coming soon'], ['Retreats', 'Workshops · festivals']],
      gallery: [
        { src: 'assets/mm2/sol-aframe.jpg', label: 'Own your home in the wilderness' },
        { src: 'assets/mm2/sol-hills.jpg', label: 'Up on the hills: mist over Attappadi' },
        { src: 'assets/mm2/sol-aerial.jpg', label: 'The hilltop from above' },
        { src: 'assets/mm2/sol-gathering.jpg', label: 'Gatherings under the trees' },
      ],
      expandNote: 'From the SOL Creator Village brochure. A limited number of spaces are available. Click a picture to enlarge.',
      tip: 'Attappadi, Kerala · 7-acre private hilltop · Now selling',
    },
    {
      id: 'coconut-grove', name: 'Coconut Grove',
      place: 'Govindapuram, Coimbatore', note: 'Kinathukadavu Taluk · 14.07 acres',
      state: 'tn', status: 'selling', statusLabel: 'Now selling',
      sizes: ['20-30', '30-50'], budgetMin: 0, budgetMax: 0,
      features: ['orchard', 'water'],
      specs: [['14.07 ac', 'Total area'], ['9.19 ac', 'Salable'], ['2', 'Parks']],
      img: 'assets/coconut_grove.jpeg',
      imgAlt: 'Coconut Grove — red-earth site fringed by coconut groves, Govindapuram',
      pin: { lon: 77.02, lat: 10.82, label: 'Govindapuram', side: 'rb' },
      cta: 'Read the layout →', action: 'expand',
      about: 'Our second project — an approved residential layout of house sites in Govindapuram Village, Kinathukadavu, Coimbatore District. 14.07 acres across S.F. Nos 20/1, 21/1, 22/A1 & 22/B1, with two landscaped parks, 9–12 m layout roads and 9.19 acres of salable plots (65%). Red-earth land fringed by coconut groves.',
      facts: [['14.07 ac', 'Total area'], ['9.19 ac', 'Salable (65%)'], ['1.13 ac', 'Two parks'], ['3.63 ac', 'Roads'], ['1:800', 'Layout scale'], ['Coimbatore', 'District']],
      gallery: [
        { src: 'assets/coconut_grove.jpeg', label: 'The site — red-earth land fringed by coconut groves' },
        { src: 'assets/coconut-layout-1.jpg', label: 'Layout plan — house sites, parks &amp; roads' },
        { src: 'assets/coconut-layout-2.jpg', label: 'Layout plan — plot areas &amp; dimensions' },
      ],
      expandNote: 'Approved layout plan · &amp;t / L.B.S. survey, Aug 2025. Click a plan to enlarge.',
      tip: 'Govindapuram, Coimbatore · 14.07 acres · Now selling',
    },
  ];

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PIN_COLOR = { selling: '#C9973A', soon: '#6B8C6A', planned: '#92806B' };
  const statusRank = { selling: 0, soon: 1, planned: 2 };

  function el(name, attrs, parent) {
    const n = document.createElementNS(SVG_NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ── The map: India → South India → a state, with pins from the registry ── */
  const MAP = { vb: null, level: 'south', state: null, raf: 0 };
  const FOCUS = ['ka', 'kl', 'tn'];
  const STATE_LABELS = { ka: [166, 505, 'Karnataka'], kl: [174, 650, 'Kerala'], tn: [224, 630, 'Tamil Nadu'],
    ap: [296, 478, 'Andhra Pradesh'], tg: [238, 452, 'Telangana'], mh: [170, 420, 'Maharashtra'] };
  const SEAS = [[96, 590, 'Arabian Sea'], [322, 596, 'Bay of Bengal'], [240, 690, 'Indian Ocean']];
  const LEVEL_VB = { india: [0, 0, 612, 696], south: [100, 430, 200, 250] };

  function stateBox(id) {
    const b = MAP.detail.querySelector('.pm-state[data-id="' + id + '"]').getBBox();
    const pad = Math.max(b.width, b.height) * 0.14;
    return [b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2];
  }

  function buildMap() {
    const G = window.TFS_INDIA;
    MAP.india = document.getElementById('pm-india');
    MAP.detail = document.getElementById('pm-detail');
    MAP.links = document.getElementById('pm-links');
    if (!G || !MAP.india || !MAP.detail) return false;
    // mini India: every state, the south tinted, and a frame showing where the big map is looking
    const mini = el('g', { class: 'pm-mini-states' }, MAP.india);
    for (const id in G.states) {
      const focus = FOCUS.includes(id);
      const p = el('path', { d: G.states[id].d, class: 'pm-mstate' + (focus ? ' is-focus' : '') }, mini);
      p.addEventListener('click', () => go(focus ? 'state' : 'south', focus ? id : null));
    }
    el('text', { x: 236, y: 330, class: 'pm-mini-label' }, MAP.india).textContent = 'INDIA';
    MAP.frame = el('rect', { class: 'pm-frame' }, MAP.india);
    // the big map
    const states = el('g', { class: 'pm-states' }, MAP.detail);
    for (const id in G.states) {
      const focus = FOCUS.includes(id);
      const p = el('path', { d: G.states[id].d, class: 'pm-state' + (focus ? ' is-focus' : ''), 'data-id': id }, states);
      if (!focus) continue;
      p.setAttribute('tabindex', 0); p.setAttribute('role', 'button');
      p.setAttribute('aria-label', 'Zoom into ' + G.states[id].n);
      p.addEventListener('click', () => go('state', id));
      p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go('state', id); } });
    }
    const labels = el('g', { class: 'pm-labels' }, MAP.detail);
    for (const id in STATE_LABELS) {
      const [x, y, t] = STATE_LABELS[id];
      const g = el('g', { class: 'pm-anchor', 'data-x': x, 'data-y': y }, labels);
      el('text', { class: 'pm-slabel' + (FOCUS.includes(id) ? ' is-focus' : ''), 'text-anchor': 'middle' }, g).textContent = t.toUpperCase();
    }
    SEAS.forEach(([x, y, t]) => {
      const g = el('g', { class: 'pm-anchor', 'data-x': x, 'data-y': y }, labels);
      el('text', { class: 'pm-sea', 'text-anchor': 'middle' }, g).textContent = t;
    });
    renderPins(el('g', { id: 'map-pins' }, MAP.detail));
    return true;
  }

  function renderPins(layer) {
    const project = window.TFS_INDIA.project;
    PROJECTS.forEach(p => {
      const [x, y] = project(p.pin.lon, p.pin.lat);
      const g = el('g', { class: 'map-pin pm-anchor pin-' + p.status, 'data-id': p.id, 'data-x': x, 'data-y': y,
        tabindex: 0, role: 'button', 'aria-label': p.name + ' — ' + p.tip }, layer);
      el('circle', { cy: -8, r: 16, fill: 'transparent' }, g);                 // finger-sized tap area
      if (p.status === 'selling') {
        const halo = el('circle', { r: 6, class: 'pm-halo' }, g);
        el('animate', { attributeName: 'r', values: '4;9;4', dur: '3.2s', repeatCount: 'indefinite' }, halo);
        el('path', { d: 'M0 0c-5-6-8-9.5-8-13.5a8 8 0 0 1 16 0c0 4-3 7.5-8 13.5Z', class: 'pm-drop' }, g);
        el('circle', { cy: -13.5, r: 3, fill: '#fff' }, g);
      } else if (p.status === 'soon') {
        el('path', { d: 'M0 0c-4.4-5.2-7-8.3-7-11.8a7 7 0 0 1 14 0c0 3.5-2.6 6.6-7 11.8Z', class: 'pm-drop' }, g);
        el('circle', { cy: -11.8, r: 2.6, fill: '#fff' }, g);
      } else {
        el('circle', { r: 6.5, class: 'pm-ring' }, g);
        el('circle', { r: 2.4, class: 'pm-dot' }, g);
      }
      // side: l / r, with a trailing b to sit the label below the pin (keeps close pins apart)
      const left = p.pin.side[0] === 'l', below = p.pin.side[1] === 'b';
      el('text', { class: 'pm-plabel', x: left ? -11 : 11, y: below ? 10 : (p.status === 'planned' ? 4 : -9),
        'text-anchor': left ? 'end' : 'start' }, g).textContent = p.pin.label;
      const activate = e => {
        const r = g.getBoundingClientRect();
        if (typeof window.mapTip === 'function')
          window.mapTip({ clientX: e.clientX || r.left + r.width / 2, clientY: e.clientY || r.top }, p.name, p.tip);
        highlightCard(p.id);
      };
      g.addEventListener('click', e => { e.stopPropagation(); activate(e); });
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e); } });
    });
  }

  // draw the current view; pins and labels keep the same on-screen size at every zoom
  function paint() {
    const [x, y, w, h] = MAP.vb;
    MAP.detail.setAttribute('viewBox', x + ' ' + y + ' ' + w + ' ' + h);
    const k = Math.max(w / (MAP.detail.clientWidth || 1), h / (MAP.detail.clientHeight || 1));
    MAP.detail.querySelectorAll('.pm-anchor').forEach(a =>
      a.setAttribute('transform', 'translate(' + a.dataset.x + ' ' + a.dataset.y + ') scale(' + k + ')'));
    MAP.detail.style.setProperty('--k', k);
    // the frame on the mini map shows what the big map covers (what is actually visible)
    const cw = MAP.detail.clientWidth * k, ch = MAP.detail.clientHeight * k;
    const fx = x - (cw - w) / 2, fy = y - (ch - h) / 2;
    const fw = Math.min(cw, 612), fh = Math.min(ch, 696);
    MAP.frame.setAttribute('x', Math.max(0, fx)); MAP.frame.setAttribute('y', Math.max(0, fy));
    MAP.frame.setAttribute('width', fw); MAP.frame.setAttribute('height', fh);
    drawLinks();
  }

  // dashed guides from the frame on the mini map to the big map
  function drawLinks() {
    const L = MAP.links;
    if (!L || !L.clientWidth || getComputedStyle(L).display === 'none') return;
    const base = L.getBoundingClientRect(), f = MAP.frame.getBoundingClientRect(), d = MAP.detail.getBoundingClientRect();
    if (!f.width || MAP.level === 'india') { L.innerHTML = ''; return; }
    L.innerHTML = [[f.right, f.top, d.left, d.top + 6], [f.right, f.bottom, d.left, d.bottom - 6]].map(([x1, y1, x2, y2]) =>
      '<line x1="' + (x1 - base.left) + '" y1="' + (y1 - base.top) + '" x2="' + (x2 - base.left) + '" y2="' + (y2 - base.top) + '"/>').join('');
  }

  function tween(to) {
    cancelAnimationFrame(MAP.raf);
    const from = MAP.vb.slice(), t0 = performance.now();
    const dur = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 750;
    if (!dur) { MAP.vb = to.slice(); paint(); return; }
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      MAP.vb = from.map((v, i) => v + (to[i] - v) * e); paint();
      if (k < 1) MAP.raf = requestAnimationFrame(step);
    };
    MAP.raf = requestAnimationFrame(step);
    setTimeout(() => { if (MAP.vb.some((v, i) => Math.abs(v - to[i]) > .01)) { MAP.vb = to.slice(); paint(); } }, dur + 400);
  }

  function go(level, stateId, fromFilter) {
    MAP.level = level; MAP.state = level === 'state' ? stateId : null;
    tween(level === 'state' ? stateBox(stateId) : LEVEL_VB[level]);
    const pm = document.getElementById('pm');
    pm.dataset.level = level;
    MAP.detail.querySelectorAll('.pm-state').forEach(p => p.classList.toggle('is-picked', p.dataset.id === MAP.state));
    const sep = pm.querySelector('.pm-crumb-sep'), crumb = pm.querySelector('.pm-crumb-state');
    sep.hidden = crumb.hidden = !MAP.state;
    if (MAP.state) crumb.textContent = window.TFS_INDIA.states[MAP.state].n;
    pm.querySelectorAll('.pm-crumbs [data-go]').forEach(b => b.classList.toggle('is-on', b.dataset.go === level));
    crumb.classList.toggle('is-on', level === 'state');
    const order = ['india', 'south', 'state'], cur = order.indexOf(level);
    pm.querySelectorAll('.pm-steps li').forEach(li => {
      const i = order.indexOf(li.dataset.step);
      li.classList.toggle('is-on', i === cur); li.classList.toggle('is-done', i < cur);
    });
    // the map and the Location filter move together
    if (!fromFilter) {
      const sel = document.getElementById('pf-location'), want = MAP.state || 'all';
      if (sel && sel.value !== want) { sel.value = want; applyFilters(); }
    }
  }

  function bindMap() {
    const pm = document.getElementById('pm');
    pm.querySelectorAll('.pm-crumbs [data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    pm.querySelectorAll('.pm-steps li').forEach(li => li.addEventListener('click', () =>
      li.dataset.step === 'state' ? go('state', MAP.state || 'tn') : go(li.dataset.step)));
    pm.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.zoom === 'reset') return go(MAP.state ? 'state' : 'south', MAP.state, true);
      const f = b.dataset.zoom === 'in' ? 0.72 : 1 / 0.72;
      const [x, y, w, h] = MAP.vb, nw = Math.min(700, Math.max(24, w * f)), nh = nw * h / w;
      tween([x + (w - nw) / 2, y + (h - nh) / 2, nw, nh]);
    }));
    // drag to pan
    let drag = null;
    MAP.detail.addEventListener('pointerdown', e => {
      if (e.target.closest('.map-pin')) return;
      drag = { x: e.clientX, y: e.clientY, vb: MAP.vb.slice(), moved: false };
    });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true; MAP.detail.classList.add('is-dragging');
      const k = Math.max(drag.vb[2] / MAP.detail.clientWidth, drag.vb[3] / MAP.detail.clientHeight);
      MAP.vb = [drag.vb[0] - dx * k, drag.vb[1] - dy * k, drag.vb[2], drag.vb[3]]; paint();
    });
    window.addEventListener('pointerup', () => {
      // a drag should not also count as a click on the state underneath
      if (drag && drag.moved) MAP.detail.addEventListener('click', e => e.stopPropagation(), { capture: true, once: true });
      drag = null; MAP.detail.classList.remove('is-dragging');
    });
    document.getElementById('pf-location').addEventListener('change', e => {
      const v = e.target.value;
      go(v === 'all' ? 'south' : 'state', v === 'all' ? null : v, true);
    });
    document.getElementById('pf-reset').addEventListener('click', () => go('south', null, true));
    window.addEventListener('resize', () => MAP.vb && paint());
    // the portal starts hidden: repaint once it is shown so sizes are right
    const sec = document.getElementById('portal');
    if (sec) new MutationObserver(() => { if (sec.classList.contains('active')) requestAnimationFrame(paint); })
      .observe(sec, { attributes: true, attributeFilter: ['class'] });
  }

  /* ── Render project cards ── */
  function renderCards() {
    const wrap = document.getElementById('project-cards');
    if (!wrap) return;
    wrap.innerHTML = '';
    [...PROJECTS].sort((a, b) => statusRank[a.status] - statusRank[b.status]).forEach(p => {
      const card = document.createElement('article');
      card.className = 'listing-card project-card' + (p.status === 'selling' ? '' : ' is-soon');
      card.dataset.id = p.id;
      const media = p.img
        ? `<img data-src="${p.img}" alt="${p.imgAlt || p.name}" loading="lazy">`
        : (p.status === 'selling' ? '' : `<span class="lcard-soon-label">${p.statusLabel}</span>`);
      // Optional inline "read more" panel (layout plans + facts), no redirect
      const expand = p.gallery ? (
        `<div class="lcard-expand" hidden>
          ${p.about ? `<p class="lcard-about">${p.about}</p>` : ''}
          ${p.facts ? `<div class="lcard-facts">${p.facts.map(([v, k]) =>
            `<div class="lfact"><strong>${v}</strong><span>${k}</span></div>`).join('')}</div>` : ''}
          <div class="lcard-gallery">${p.gallery.map(g =>
            `<figure class="lcard-shot" data-lightbox data-full="${g.src}">
              <img data-src="${g.src}" alt="${g.label}" loading="lazy">
              <figcaption>${g.label}</figcaption>
            </figure>`).join('')}</div>
          ${p.expandNote ? `<p class="lcard-expand-note">${p.expandNote}</p>` : ''}
        </div>`) : '';
      card.innerHTML =
        `<div class="lcard-img" ${p.grad ? `style="background:${p.grad};display:flex;align-items:center;justify-content:center;"` : ''}>
          ${media}
          <span class="lbadge ${p.status !== 'selling' ? 'lbadge-soon' : ''}">${p.statusLabel}</span>
        </div>
        <div class="lcard-body">
          <div class="lcard-name">${p.name}</div>
          <div class="lcard-loc">${p.place} · ${p.note}</div>
          <div class="lcard-specs">${p.specs.map(([v, k]) =>
            `<div class="lspec"><strong>${v}</strong><span>${k}</span></div>`).join('')}
          </div>
          <div class="lcard-cta ${p.status !== 'selling' ? 'lcard-cta-soon' : ''}">${p.cta}</div>
          ${expand}
        </div>`;
      card.addEventListener('click', e => {
        if (p.gallery) {
          if (e.target.closest('[data-lightbox]')) return; // let the lightbox open
          const panel = card.querySelector('.lcard-expand');
          const opening = panel.hidden;
          panel.hidden = !opening;
          card.classList.toggle('expanded', opening);
          const cta = card.querySelector('.lcard-cta');
          if (cta) cta.textContent = opening ? (p.ctaOpen || 'Hide layout ↑') : p.cta;
          if (opening && typeof window.observeLazy === 'function') window.observeLazy(panel);
          return;
        }
        if (p.action === 'projects') window.show('projects');
        else window.show('community');
      });
      wrap.appendChild(card);
    });
    // register newly created lazy images
    if (typeof window.observeLazy === 'function') window.observeLazy(wrap);
  }

  function highlightCard(id) {
    document.querySelectorAll('#project-cards .project-card').forEach(c => {
      const hit = c.dataset.id === id;
      c.classList.toggle('pin-highlight', hit);
      if (hit) c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    setTimeout(() => document.querySelectorAll('.pin-highlight')
      .forEach(c => c.classList.remove('pin-highlight')), 2400);
  }

  /* ── Filtering ── */
  function matches(p, f) {
    if (f.loc !== 'all' && p.state !== f.loc) return false;
    if (f.size !== 'all' && !p.sizes.includes(f.size)) return false;
    if (f.feature !== 'all' && !p.features.includes(f.feature)) return false;
    if (f.selling && p.status !== 'selling') return false;
    if (f.budget.length && p.budgetMax > 0) {
      const lo = Math.min(...f.budget), hi = Math.max(...f.budget);
      if (hi < p.budgetMin || lo > p.budgetMax) return false;
    }
    return true;
  }

  function readFilters() {
    return {
      loc: document.getElementById('pf-location').value,
      size: document.getElementById('pf-size').value,
      feature: document.getElementById('pf-feature').value,
      selling: document.getElementById('pf-selling').checked,
      budget: (document.getElementById('pf-budget').value.match(/\d+/g) || []).map(Number),
    };
  }

  function applyFilters() {
    const f = readFilters();
    let visible = 0;
    document.querySelectorAll('#project-cards .project-card').forEach(card => {
      const p = PROJECTS.find(x => x.id === card.dataset.id);
      const ok = matches(p, f);
      card.classList.toggle('filtered-out', !ok);
      if (ok) visible++;
    });
    document.querySelectorAll('#map-pins .map-pin').forEach(pin => {
      const p = PROJECTS.find(x => x.id === pin.dataset.id);
      pin.classList.toggle('pin-dimmed', !matches(p, f));
    });
    const count = document.getElementById('pf-count');
    if (count) count.textContent = 'Showing ' + visible + ' of ' + PROJECTS.length + ' projects';
    document.getElementById('pf-empty').hidden = visible > 0;
  }

  function bindFilters() {
    ['pf-location', 'pf-size', 'pf-feature'].forEach(id =>
      document.getElementById(id).addEventListener('change', applyFilters));
    document.getElementById('pf-selling').addEventListener('change', applyFilters);
    document.getElementById('pf-budget').addEventListener('input', applyFilters);
    document.getElementById('pf-reset').addEventListener('click', () => {
      ['pf-location', 'pf-size', 'pf-feature'].forEach(id => document.getElementById(id).value = 'all');
      document.getElementById('pf-selling').checked = false;
      document.getElementById('pf-budget').value = '';
      applyFilters();
    });
  }

  function init() {
    if (!document.getElementById('project-cards')) return;
    const mapped = buildMap();
    renderCards();
    bindFilters();
    applyFilters();
    if (mapped) { MAP.vb = LEVEL_VB.south.slice(); bindMap(); go('south', null, true); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.TFS_PROJECTS = PROJECTS;
})();
