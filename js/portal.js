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
      place: 'Agali, Tamil Nadu', note: '45 km from Coimbatore',
      state: 'tn', status: 'selling', statusLabel: 'Now selling',
      sizes: ['20-30'], budgetMin: 40, budgetMax: 240,
      features: ['orchard', 'mountain'],
      specs: [['7 acres', 'Total area'], ['26', 'Plots'], ['300+', 'Mango trees']],
      img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&q=80',
      imgAlt: 'The Mango Meadows orchard',
      pin: { x: 278, y: 330, label: 'AGALI' },
      cta: 'Read this chapter →', action: 'projects',
      tip: 'Agali, Tamil Nadu · 26 plots · 20–30 cents · Now selling',
    },
    {
      id: 'coffee-canopy', name: 'Coffee Canopy',
      place: 'Chikmagalur, Karnataka', note: 'Estate country, 3,400 ft',
      state: 'ka', status: 'soon', statusLabel: 'Coming 2026',
      sizes: ['30-50'], budgetMin: 0, budgetMax: 0,
      features: ['coffee', 'mountain'],
      specs: [['Coffee estate', 'Character'], ['30–50c', 'Plot size']],
      grad: 'linear-gradient(135deg, #6B8C6A, #4A3728)',
      pin: { x: 238, y: 246, label: 'CHIKMAGALUR' },
      cta: 'Get notified →', action: 'community',
      tip: 'Chikmagalur, Karnataka · Coming 2026',
    },
    {
      id: 'pepper-hollow', name: 'Pepper Hollow',
      place: 'Wayanad, Kerala', note: 'Spice-belt plateau',
      state: 'kl', status: 'soon', statusLabel: 'Coming 2026',
      sizes: ['30-50'], budgetMin: 0, budgetMax: 0,
      features: ['orchard', 'water', 'mountain'],
      specs: [['Spice orchard', 'Character'], ['30–50c', 'Plot size']],
      grad: 'linear-gradient(135deg, #4A6449, #2C2418)',
      pin: { x: 218, y: 302, label: 'WAYANAD' },
      cta: 'Get notified →', action: 'community',
      tip: 'Wayanad, Kerala · Coming 2026',
    },
    {
      id: 'coconut-chronicle', name: 'The Coconut Chronicle',
      place: 'Pollachi, Tamil Nadu', note: 'Coconut country, canal-fed',
      state: 'tn', status: 'soon', statusLabel: 'Coming 2026',
      sizes: ['20-30'], budgetMin: 0, budgetMax: 0,
      features: ['orchard', 'water'],
      specs: [['Coconut groves', 'Character'], ['20–30c', 'Plot size']],
      grad: 'linear-gradient(135deg, #8B9C6A, #4A3728)',
      pin: { x: 300, y: 348, label: 'POLLACHI' },
      cta: 'Get notified →', action: 'community',
      tip: 'Pollachi, Tamil Nadu · Coming 2026',
    },
    {
      id: 'silver-oak-letters', name: 'Silver Oak Letters',
      place: 'Sakleshpur, Karnataka', note: 'Misty Western Ghats',
      state: 'ka', status: 'planned', statusLabel: 'Planned 2027',
      sizes: ['30-50'], budgetMin: 0, budgetMax: 0,
      features: ['coffee', 'mountain'],
      specs: [['Shade forest', 'Character'], ['30–50c', 'Plot size']],
      grad: 'linear-gradient(135deg, #7A8C7E, #35301F)',
      pin: { x: 214, y: 216, label: 'SAKLESHPUR' },
      cta: 'Get notified →', action: 'community',
      tip: 'Sakleshpur, Karnataka · Planned 2027',
    },
    {
      id: 'cardamom-diaries', name: 'The Cardamom Diaries',
      place: 'Vagamon, Kerala', note: 'High-range meadows',
      state: 'kl', status: 'planned', statusLabel: 'Planned 2027',
      sizes: ['20-30'], budgetMin: 0, budgetMax: 0,
      features: ['mountain', 'water'],
      specs: [['Hill meadows', 'Character'], ['20–30c', 'Plot size']],
      grad: 'linear-gradient(135deg, #6A8C88, #3A2A1B)',
      pin: { x: 258, y: 380, label: 'VAGAMON' },
      cta: 'Get notified →', action: 'community',
      tip: 'Vagamon, Kerala · Planned 2027',
    },
    {
      id: 'orange-notebook', name: 'The Orange Notebook',
      place: 'Yercaud, Tamil Nadu', note: 'Shevaroy hills, 4,900 ft',
      state: 'tn', status: 'planned', statusLabel: 'Planned 2027',
      sizes: ['50+'], budgetMin: 0, budgetMax: 0,
      features: ['orchard', 'mountain'],
      specs: [['Orange orchards', 'Character'], ['50c +', 'Plot size']],
      grad: 'linear-gradient(135deg, #C9973A, #4A3728)',
      pin: { x: 336, y: 288, label: 'YERCAUD' },
      cta: 'Get notified →', action: 'community',
      tip: 'Yercaud, Tamil Nadu · Planned 2027',
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

  /* ── Render map pins ── */
  function renderPins() {
    const layer = document.getElementById('map-pins');
    if (!layer) return;
    layer.innerHTML = '';
    PROJECTS.forEach(p => {
      const g = el('g', { class: 'map-pin pin-' + p.status, 'data-id': p.id, tabindex: 0, role: 'button',
        'aria-label': p.name + ' — ' + p.tip }, layer);
      g.style.cursor = 'pointer';
      const c = PIN_COLOR[p.status];
      if (p.status === 'selling') {
        const halo = el('circle', { cx: p.pin.x, cy: p.pin.y, r: 15, fill: c, opacity: '.18' }, g);
        const anim = el('animate', { attributeName: 'r', values: '12;17;12', dur: '3.2s', repeatCount: 'indefinite' }, halo);
        el('circle', { cx: p.pin.x, cy: p.pin.y, r: 8, fill: c, opacity: '.45' }, g);
        el('circle', { cx: p.pin.x, cy: p.pin.y, r: 5, fill: c }, g);
        el('circle', { cx: p.pin.x, cy: p.pin.y, r: 2, fill: '#fff' }, g);
        el('line', { x1: p.pin.x, y1: p.pin.y + 5, x2: p.pin.x, y2: p.pin.y + 18, stroke: c, 'stroke-width': 1.8 }, g);
      } else if (p.status === 'soon') {
        el('circle', { cx: p.pin.x, cy: p.pin.y, r: 8, fill: c, opacity: '.35' }, g);
        el('circle', { cx: p.pin.x, cy: p.pin.y, r: 4, fill: c }, g);
      } else {
        el('circle', { cx: p.pin.x, cy: p.pin.y, r: 7, fill: 'none', stroke: c, 'stroke-width': 1.2, 'stroke-dasharray': '2 2' }, g);
        el('circle', { cx: p.pin.x, cy: p.pin.y, r: 2.5, fill: c }, g);
      }
      const label = el('text', {
        x: p.pin.x, y: p.pin.y + (p.status === 'selling' ? 32 : 22),
        'text-anchor': 'middle', 'font-family': 'Outfit,sans-serif',
        'font-size': p.status === 'selling' ? 10 : 9,
        fill: p.status === 'selling' ? '#4A3728' : c,
        'letter-spacing': '.07em', 'font-weight': p.status === 'selling' ? '500' : '400',
      }, g);
      label.textContent = p.pin.label;

      const activate = e => {
        if (typeof window.mapTip === 'function') {
          const svg = layer.closest('svg');
          const r = svg.getBoundingClientRect();
          const cx = e.clientX || r.left + (p.pin.x / 600) * r.width;
          const cy = e.clientY || r.top + (p.pin.y / 430) * r.height;
          window.mapTip({ clientX: cx, clientY: cy }, p.name, p.tip);
        }
        highlightCard(p.id);
      };
      g.addEventListener('click', activate);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e); } });
    });
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
        : `<span class="lcard-soon-label">${p.statusLabel}</span>`;
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
        </div>`;
      card.addEventListener('click', () => {
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
    renderPins();
    renderCards();
    bindFilters();
    applyFilters();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.TFS_PROJECTS = PROJECTS;
})();
