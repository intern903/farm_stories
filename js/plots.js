/* ═══════════════════════════════════════════════════════
   THE FARM STORIES — Plot Explorer
   Interactive masterplan for The Mango Meadows.
   Zoom / pan / hover / filter / compare / bookmark.
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Plot data (site survey, March 2025) ─────────────
     status: available | reserved | sold
     size in cents, frontage in ft, elevation in m above site datum,
     sun = morning-sun (east-facing) plot, view = Nilgiris view,
     orchard = orchard-dense (6+ mature trees inside boundary) */
  const PLOTS = [
    { id: 1,  status: 'sold',      size: 24, frontage: 60, elev: 4,  trees: 7,  corner: true,  sun: true,  view: true,  dist: 40  },
    { id: 2,  status: 'sold',      size: 22, frontage: 40, elev: 4,  trees: 5,  corner: false, sun: true,  view: true,  dist: 70  },
    { id: 3,  status: 'reserved',  size: 21, frontage: 40, elev: 5,  trees: 6,  corner: false, sun: true,  view: true,  dist: 100 },
    { id: 4,  status: 'available', size: 26, frontage: 40, elev: 6,  trees: 8,  corner: false, sun: true,  view: true,  dist: 130 },
    { id: 5,  status: 'available', size: 28, frontage: 62, elev: 7,  trees: 9,  corner: true,  sun: true,  view: true,  dist: 160 },
    { id: 6,  status: 'sold',      size: 23, frontage: 58, elev: 3,  trees: 6,  corner: true,  sun: false, view: false, dist: 55  },
    { id: 7,  status: 'available', size: 20, frontage: 40, elev: 3,  trees: 4,  corner: false, sun: false, view: false, dist: 85  },
    { id: 8,  status: 'reserved',  size: 22, frontage: 40, elev: 4,  trees: 6,  corner: false, sun: false, view: false, dist: 115 },
    { id: 9,  status: 'sold',      size: 25, frontage: 40, elev: 5,  trees: 7,  corner: false, sun: false, view: true,  dist: 145 },
    { id: 10, status: 'available', size: 27, frontage: 60, elev: 6,  trees: 8,  corner: true,  sun: false, view: true,  dist: 175 },
    { id: 11, status: 'sold',      size: 21, frontage: 56, elev: 2,  trees: 5,  corner: true,  sun: true,  view: false, dist: 45  },
    { id: 12, status: 'available', size: 20, frontage: 40, elev: 2,  trees: 5,  corner: false, sun: true,  view: false, dist: 75  },
    { id: 13, status: 'available', size: 23, frontage: 40, elev: 3,  trees: 7,  corner: false, sun: true,  view: false, dist: 105 },
    { id: 14, status: 'reserved',  size: 24, frontage: 40, elev: 4,  trees: 6,  corner: false, sun: true,  view: true,  dist: 135 },
    { id: 15, status: 'available', size: 29, frontage: 64, elev: 6,  trees: 10, corner: true,  sun: true,  view: true,  dist: 165 },
    { id: 16, status: 'sold',      size: 22, frontage: 58, elev: 2,  trees: 5,  corner: true,  sun: false, view: false, dist: 60  },
    { id: 17, status: 'available', size: 30, frontage: 44, elev: 7,  trees: 11, corner: false, sun: false, view: true,  dist: 90  },
    { id: 18, status: 'reserved',  size: 23, frontage: 40, elev: 4,  trees: 6,  corner: false, sun: false, view: false, dist: 120 },
    { id: 19, status: 'sold',      size: 21, frontage: 40, elev: 4,  trees: 5,  corner: false, sun: false, view: false, dist: 150 },
    { id: 20, status: 'available', size: 26, frontage: 60, elev: 5,  trees: 8,  corner: true,  sun: false, view: true,  dist: 180 },
    { id: 21, status: 'sold',      size: 24, frontage: 62, elev: 1,  trees: 6,  corner: true,  sun: true,  view: false, dist: 35  },
    { id: 22, status: 'available', size: 20, frontage: 40, elev: 2,  trees: 4,  corner: false, sun: true,  view: false, dist: 65  },
    { id: 23, status: 'reserved',  size: 22, frontage: 40, elev: 3,  trees: 6,  corner: false, sun: true,  view: false, dist: 95  },
    { id: 24, status: 'sold',      size: 25, frontage: 40, elev: 4,  trees: 7,  corner: false, sun: true,  view: true,  dist: 125 },
    { id: 25, status: 'available', size: 27, frontage: 42, elev: 5,  trees: 9,  corner: false, sun: true,  view: true,  dist: 155 },
    { id: 26, status: 'sold',      size: 30, frontage: 66, elev: 6,  trees: 12, corner: true,  sun: true,  view: true,  dist: 185 },
  ];

  const NOTES = {
    available: 'Open for registration. Walk this plot with us on a weekend visit — the trees will introduce themselves.',
    reserved:  'A family has placed a token on this plot. Ask us about similar plots nearby.',
    sold:      'This chapter already belongs to a family. Its neighbours are still being written.',
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const state = {
    status: 'all', size: 'all', char: 'all', front: 'all',
    sun: false, savedOnly: false,
    selected: null, compare: [],
    saved: new Set(JSON.parse(localStorage.getItem('tfs-saved-plots') || '[]')),
    zoom: 1, panX: 0, panY: 0,
  };

  let svg, viewport, stage, tooltip;

  /* ── Layout: 26 plots in 4 rows flanking a central spine road ── */
  function plotRect(p) {
    const i = p.id - 1;
    const row = Math.floor(i / 7);           // 0..3
    const col = i % 7;
    const rowsY = [78, 218, 388, 528];
    const bandH = 108;
    // Rows 0-1 sit above the horizontal road, rows 2-3 below.
    const count = row === 3 ? 5 : 7;         // last row holds 5 wider plots
    const gutter = 10;
    const x0 = 96, x1 = 906;
    const w = (x1 - x0 - gutter * (count - 1)) / count;
    const c = Math.min(col, count - 1);
    return { x: x0 + c * (w + gutter), y: rowsY[row], w, h: bandH };
  }

  function el(name, attrs, parent) {
    const n = document.createElementNS(SVG_NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function drawTree(parent, x, y, r) {
    el('line', { x1: x, y1: y + r * .4, x2: x, y2: y + r * 1.4, class: 'mp-tree-trunk' }, parent);
    el('circle', { cx: x, cy: y, r: r, class: 'mp-tree' }, parent);
  }

  function buildMap() {
    svg = document.getElementById('masterplan');
    if (!svg) return;
    svg.innerHTML = '';
    viewport = el('g', { id: 'mp-viewport' }, svg);

    // Paper base + boundary
    const paper = el('g', { class: 'mp-paper' }, viewport);
    el('rect', { x: 40, y: 24, width: 920, height: 612, fill: 'none', stroke: 'rgba(74,55,40,.45)', 'stroke-width': 1.6, 'stroke-dasharray': '2 6', rx: 6 }, paper);
    const t = el('text', { x: 500, y: 52, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 13 }, paper);
    t.textContent = 'THE MANGO MEADOWS · MASTERPLAN · 7 ACRES';

    // 22-ft spine road (horizontal) + entrance stem
    el('path', { d: 'M40 355 H960', class: 'mp-road', 'stroke-width': 30 }, paper);
    el('path', { d: 'M40 355 H960', class: 'mp-road-dash' }, paper);
    el('path', { d: 'M500 636 V355', class: 'mp-road', 'stroke-width': 26 }, paper);
    el('path', { d: 'M500 636 V360', class: 'mp-road-dash' }, paper);
    const rd = el('text', { x: 728, y: 351, class: 'mp-text', 'font-size': 9 }, paper);
    rd.textContent = '22 FT INTERNAL ROAD';

    // Entrance arch
    el('path', { d: 'M472 632 Q500 596 528 632', fill: 'none', stroke: 'rgba(139,111,71,.8)', 'stroke-width': 2.5 }, paper);
    const en = el('text', { x: 500, y: 652, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 9 }, paper);
    en.textContent = 'ENTRANCE ARCH';

    // Amphitheatre pavilion + sunset deck
    el('circle', { cx: 60, cy: 355, r: 34, class: 'mp-amenity' }, paper);
    const am = el('text', { x: 60, y: 408, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 8 }, paper);
    am.textContent = 'PAVILION';
    el('rect', { x: 922, y: 330, width: 34, height: 50, rx: 4, class: 'mp-amenity' }, paper);
    const sd = el('text', { x: 940, y: 396, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 8 }, paper);
    sd.textContent = 'SUNSET DECK';

    // Compass
    const cp = el('g', { transform: 'translate(925,70)' }, paper);
    el('circle', { cx: 0, cy: 0, r: 16, fill: 'none', stroke: 'rgba(74,55,40,.4)', 'stroke-width': 1 }, cp);
    el('path', { d: 'M0 -12 L4 4 L0 1 L-4 4 Z', fill: 'rgba(139,111,71,.85)' }, cp);
    const nl = el('text', { x: 0, y: 30, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 9 }, cp);
    nl.textContent = 'N';

    // Orchard fringe trees (between plot bands and boundary)
    const fringe = [[70,100],[70,160],[70,250],[930,120],[930,200],[70,450],[70,560],[930,470],[930,560],[170,340],[330,372],[650,338],[810,372]];
    fringe.forEach(([x, y]) => drawTree(paper, x, y, 9));

    // Plots
    PLOTS.forEach(p => {
      const r = plotRect(p);
      const g = el('g', { class: 'plot ' + p.status, 'data-id': p.id, tabindex: 0, role: 'button',
        'aria-label': `Plot ${String(p.id).padStart(2, '0')}, ${p.size} cents, ${p.status}` }, viewport);
      el('rect', { x: r.x, y: r.y, width: r.w, height: r.h, rx: 3, class: 'plot-shape' }, g);
      // In-plot mango trees (sketch dots)
      const n = Math.min(3, Math.max(1, Math.round(p.trees / 4)));
      for (let k = 0; k < n; k++) {
        drawTree(g, r.x + r.w * (0.25 + k * 0.25), r.y + r.h * (k % 2 ? 0.3 : 0.68), 6);
      }
      const label = el('text', { x: r.x + r.w / 2, y: r.y + r.h / 2 + 5, class: 'plot-label' }, g);
      label.textContent = String(p.id).padStart(2, '0');
      if (state.saved.has(p.id)) drawSavedMark(g, r);

      g.addEventListener('mouseenter', e => showTip(p, r));
      g.addEventListener('mouseleave', hideTip);
      g.addEventListener('click', () => selectPlot(p.id));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPlot(p.id); } });
    });

    applyTransform();
  }

  function drawSavedMark(g, r) {
    const m = el('path', { class: 'plot-saved-mark',
      d: `M${r.x + r.w - 16} ${r.y + 8} q4 -4 8 0 q4 4 -4 10 q-8 -6 -4 -10 Z` }, g);
    return m;
  }

  /* ── Tooltip ── */
  function showTip(p, r) {
    if (!tooltip) return;
    const pct = svg.getBoundingClientRect();
    const scaleX = pct.width / 1000;
    const cx = (r.x + r.w / 2) * scaleX * state.zoom + state.panX * scaleX;
    const cy = r.y * (pct.height / 660) * state.zoom + state.panY * (pct.height / 660);
    tooltip.innerHTML =
      `<strong>Plot ${String(p.id).padStart(2, '0')}</strong>` +
      `${p.size} cents · ${p.frontage} ft frontage · ${p.trees} mango trees<br>` +
      `${p.corner ? 'Corner plot · ' : ''}${p.view ? 'Nilgiris view · ' : ''}${p.sun ? 'Morning sun' : 'Evening shade'}` +
      `<span class="tt-status ${p.status}">${p.status}</span>`;
    tooltip.style.left = Math.max(8, Math.min(cx - 100, pct.width - 220)) + 'px';
    tooltip.style.top = Math.max(8, cy - 86) + 'px';
    tooltip.classList.add('show');
  }
  function hideTip() { tooltip && tooltip.classList.remove('show'); }

  /* ── Selection & detail card ── */
  function selectPlot(id) {
    state.selected = id;
    svg.querySelectorAll('.plot').forEach(g =>
      g.classList.toggle('selected', +g.dataset.id === id));
    const p = PLOTS.find(x => x.id === id);
    const card = document.getElementById('plot-detail');
    if (!p || !card) return;
    card.hidden = false;
    document.getElementById('pd-name').textContent = 'Plot ' + String(p.id).padStart(2, '0');
    const st = document.getElementById('pd-status');
    st.textContent = p.status;
    st.className = 'pd-status ' + p.status;
    document.getElementById('pd-grid').innerHTML = [
      [`${p.size} cents`, 'Plot size'],
      [`${p.frontage} ft`, 'Road frontage'],
      [`+${p.elev} m`, 'Elevation'],
      [`${p.trees}`, 'Mango trees'],
      [`${p.dist} m`, 'From entrance'],
      [p.sun ? 'Morning' : 'Evening', 'Best light'],
      [p.corner ? 'Yes' : 'No', 'Corner plot'],
      [p.view ? 'Yes' : '—', 'Nilgiris view'],
    ].map(([v, k]) => `<div class="pd-cell"><strong>${v}</strong><span>${k}</span></div>`).join('');
    document.getElementById('pd-note').textContent = NOTES[p.status];
    const visitBtn = document.getElementById('pd-visit');
    visitBtn.disabled = p.status === 'sold';
    visitBtn.textContent = p.status === 'sold' ? 'Already part of a family’s story' : 'Book a visit to this plot';
    updateSaveBtn(p.id);
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function updateSaveBtn(id) {
    const b = document.getElementById('pd-save');
    const saved = state.saved.has(id);
    b.classList.toggle('saved', saved);
    b.innerHTML = saved ? '♥ Saved' : '♡ Save';
  }

  /* ── Filters ── */
  function matches(p) {
    if (state.status !== 'all' && p.status !== state.status) return false;
    if (state.size === '20' && !(p.size >= 20 && p.size <= 24)) return false;
    if (state.size === '25' && !(p.size >= 25)) return false;
    if (state.char === 'corner' && !p.corner) return false;
    if (state.char === 'orchard' && p.trees < 7) return false;
    if (state.char === 'view' && !p.view) return false;
    if (state.front !== 'all' && p.frontage < +state.front) return false;
    if (state.sun && !p.sun) return false;
    if (state.savedOnly && !state.saved.has(p.id)) return false;
    return true;
  }

  function applyFilters() {
    svg.querySelectorAll('.plot').forEach(g => {
      const p = PLOTS.find(x => x.id === +g.dataset.id);
      g.classList.toggle('dimmed', !matches(p));
    });
  }

  function updateCounts() {
    const c = s => PLOTS.filter(p => p.status === s).length;
    const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = '· ' + v; };
    set('cc-all', PLOTS.length);
    set('cc-available', c('available'));
    set('cc-reserved', c('reserved'));
    set('cc-sold', c('sold'));
    const rem = document.getElementById('sticky-remaining');
    if (rem) rem.textContent = c('available');
  }

  /* ── Compare ── */
  function renderCompare() {
    const drawer = document.getElementById('compare-drawer');
    const cnt = document.getElementById('cd-count');
    if (!state.compare.length) { drawer.hidden = true; return; }
    drawer.hidden = false;
    cnt.textContent = `(${state.compare.length}/3)`;
    const ps = state.compare.map(id => PLOTS.find(p => p.id === id));
    const rows = [
      ['Status', p => `<span class="tt-status ${p.status}" style="color:inherit">${p.status}</span>`],
      ['Size', p => p.size + ' cents'],
      ['Frontage', p => p.frontage + ' ft'],
      ['Elevation', p => '+' + p.elev + ' m'],
      ['Mango trees', p => p.trees],
      ['From entrance', p => p.dist + ' m'],
      ['Best light', p => p.sun ? 'Morning' : 'Evening'],
      ['Corner', p => p.corner ? 'Yes' : 'No'],
      ['Nilgiris view', p => p.view ? 'Yes' : '—'],
    ];
    document.getElementById('cd-table').innerHTML =
      '<table><thead><tr><th></th>' +
      ps.map(p => `<th>Plot ${String(p.id).padStart(2, '0')}</th>`).join('') +
      '</tr></thead><tbody>' +
      rows.map(([k, f]) => '<tr><td>' + k + '</td>' + ps.map(p => '<td>' + f(p) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table>';
  }

  /* ── Zoom & pan ── */
  function applyTransform() {
    if (viewport) viewport.setAttribute('transform',
      `translate(${state.panX} ${state.panY}) scale(${state.zoom})`);
  }
  function zoomTo(z, cx, cy) {
    const nz = Math.max(0.7, Math.min(3.2, z));
    // keep (cx, cy) in svg coords fixed on screen
    if (cx !== undefined) {
      state.panX = cx - (cx - state.panX) * (nz / state.zoom);
      state.panY = cy - (cy - state.panY) * (nz / state.zoom);
    }
    state.zoom = nz;
    applyTransform();
  }
  function svgPoint(e) {
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (1000 / r.width), y: (e.clientY - r.top) * (660 / r.height) };
  }

  function bindPanZoom() {
    let dragging = false, lx = 0, ly = 0, moved = false;
    stage.addEventListener('pointerdown', e => {
      dragging = true; moved = false; lx = e.clientX; ly = e.clientY;
      stage.classList.add('grabbing');
    });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const r = svg.getBoundingClientRect();
      const dx = (e.clientX - lx) * (1000 / r.width);
      const dy = (e.clientY - ly) * (660 / r.height);
      if (Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly) > 3) moved = true;
      state.panX += dx; state.panY += dy;
      lx = e.clientX; ly = e.clientY;
      applyTransform();
    });
    window.addEventListener('pointerup', () => { dragging = false; stage.classList.remove('grabbing'); });
    stage.addEventListener('wheel', e => {
      e.preventDefault();
      const pt = svgPoint(e);
      zoomTo(state.zoom * (e.deltaY < 0 ? 1.12 : 0.89), pt.x, pt.y);
    }, { passive: false });
    // suppress plot click after a drag
    stage.addEventListener('click', e => { if (moved) e.stopPropagation(); }, true);

    document.getElementById('zoom-in').addEventListener('click', () => zoomTo(state.zoom * 1.25, 500, 330));
    document.getElementById('zoom-out').addEventListener('click', () => zoomTo(state.zoom * 0.8, 500, 330));
    document.getElementById('zoom-reset').addEventListener('click', () => {
      state.zoom = 1; state.panX = 0; state.panY = 0; applyTransform();
    });
  }

  /* ── Wire up controls ── */
  function bindControls() {
    document.querySelectorAll('#ex-status-chips .ex-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#ex-status-chips .ex-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.status = chip.dataset.status;
        applyFilters();
      });
    });
    const bind = (id, key) => {
      const n = document.getElementById(id);
      n.addEventListener('change', () => { state[key] = n.type === 'checkbox' ? n.checked : n.value; applyFilters(); });
    };
    bind('f-size', 'size'); bind('f-char', 'char'); bind('f-front', 'front');
    bind('f-sun', 'sun'); bind('f-saved', 'savedOnly');
    document.getElementById('f-reset').addEventListener('click', () => {
      state.size = state.char = state.front = 'all'; state.sun = state.savedOnly = false; state.status = 'all';
      ['f-size', 'f-char', 'f-front'].forEach(id => document.getElementById(id).value = 'all');
      ['f-sun', 'f-saved'].forEach(id => document.getElementById(id).checked = false);
      document.querySelectorAll('#ex-status-chips .ex-chip').forEach(c =>
        c.classList.toggle('active', c.dataset.status === 'all'));
      applyFilters();
    });

    document.getElementById('tg-master').addEventListener('click', function () {
      stage.classList.remove('satellite');
      this.classList.add('active');
      document.getElementById('tg-satellite').classList.remove('active');
    });
    document.getElementById('tg-satellite').addEventListener('click', function () {
      // lazy-load the aerial imagery only when satellite view is first opened
      const sat = document.getElementById('map-satellite');
      if (!sat.style.backgroundImage) {
        sat.style.backgroundImage = 'url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=70")';
      }
      stage.classList.add('satellite');
      this.classList.add('active');
      document.getElementById('tg-master').classList.remove('active');
    });

    document.getElementById('pd-close').addEventListener('click', () => {
      document.getElementById('plot-detail').hidden = true;
      state.selected = null;
      svg.querySelectorAll('.plot.selected').forEach(g => g.classList.remove('selected'));
    });
    document.getElementById('pd-visit').addEventListener('click', () => {
      if (state.selected && typeof window.openVisitForm === 'function') {
        window.openVisitForm('Plot ' + String(state.selected).padStart(2, '0'));
      }
    });
    document.getElementById('pd-compare').addEventListener('click', () => {
      if (!state.selected) return;
      const i = state.compare.indexOf(state.selected);
      if (i >= 0) state.compare.splice(i, 1);
      else {
        if (state.compare.length >= 3) state.compare.shift();
        state.compare.push(state.selected);
      }
      renderCompare();
    });
    document.getElementById('cd-clear').addEventListener('click', () => {
      state.compare = []; renderCompare();
    });
    document.getElementById('pd-save').addEventListener('click', () => {
      if (!state.selected) return;
      const id = state.selected;
      if (state.saved.has(id)) state.saved.delete(id); else state.saved.add(id);
      localStorage.setItem('tfs-saved-plots', JSON.stringify([...state.saved]));
      updateSaveBtn(id);
      // refresh saved marks
      svg.querySelectorAll('.plot').forEach(g => {
        const pid = +g.dataset.id;
        const mark = g.querySelector('.plot-saved-mark');
        if (state.saved.has(pid) && !mark) drawSavedMark(g, plotRect(PLOTS.find(p => p.id === pid)));
        if (!state.saved.has(pid) && mark) mark.remove();
      });
      if (state.savedOnly) applyFilters();
    });
  }

  /* ── Entry animation: plots bloom in one by one ── */
  function bloomIn() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const plots = svg.querySelectorAll('.plot');
    plots.forEach((g, i) => {
      g.style.opacity = '0';
      g.style.transition = 'opacity .7s ease ' + (i * 40) + 'ms';
    });
    requestAnimationFrame(() => requestAnimationFrame(() =>
      plots.forEach(g => { g.style.opacity = ''; g.style.removeProperty('opacity'); g.style.opacity = '1'; })));
    setTimeout(() => plots.forEach(g => { g.style.transition = ''; g.style.opacity = ''; }), 2400);
  }

  function init() {
    stage = document.getElementById('map-stage');
    tooltip = document.getElementById('plot-tooltip');
    if (!stage) return;
    buildMap();
    bindControls();
    bindPanZoom();
    updateCounts();
    applyFilters();
    // bloom when the portal section first becomes visible
    let bloomed = false;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting && !bloomed) { bloomed = true; bloomIn(); io.disconnect(); }
      });
    }, { threshold: 0.2 });
    io.observe(stage);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.TFS_PLOTS = PLOTS;
})();
