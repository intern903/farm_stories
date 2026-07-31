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
    { id: 1,  status: 'sold',      size: 22, frontage: 40, elev: 6,  trees: 6,  corner: true,  sun: true,  view: true,  dist: 60  },
    { id: 2,  status: 'available', size: 23, frontage: 40, elev: 6,  trees: 7,  corner: false, sun: true,  view: true,  dist: 90  },
    { id: 3,  status: 'reserved',  size: 24, frontage: 44, elev: 5,  trees: 6,  corner: false, sun: true,  view: true,  dist: 120 },
    { id: 4,  status: 'available', size: 22, frontage: 40, elev: 5,  trees: 5,  corner: true,  sun: true,  view: true,  dist: 150 },
    { id: 5,  status: 'available', size: 22, frontage: 40, elev: 4,  trees: 7,  corner: true,  sun: true,  view: true,  dist: 175 },
    { id: 6,  status: 'sold',      size: 24, frontage: 40, elev: 4,  trees: 8,  corner: false, sun: true,  view: false, dist: 205 },
    { id: 7,  status: 'available', size: 24, frontage: 40, elev: 3,  trees: 8,  corner: false, sun: false, view: false, dist: 235 },
    { id: 8,  status: 'reserved',  size: 25, frontage: 42, elev: 3,  trees: 9,  corner: false, sun: false, view: false, dist: 265 },
    { id: 9,  status: 'sold',      size: 24, frontage: 40, elev: 2,  trees: 8,  corner: false, sun: false, view: false, dist: 295 },
    { id: 10, status: 'available', size: 25, frontage: 42, elev: 2,  trees: 9,  corner: true,  sun: false, view: false, dist: 325 },
    { id: 11, status: 'sold',      size: 27, frontage: 44, elev: 2,  trees: 10, corner: true,  sun: true,  view: false, dist: 300 },
    { id: 12, status: 'available', size: 25, frontage: 40, elev: 2,  trees: 8,  corner: false, sun: true,  view: false, dist: 270 },
    { id: 13, status: 'available', size: 23, frontage: 40, elev: 3,  trees: 7,  corner: false, sun: true,  view: false, dist: 240 },
    { id: 14, status: 'reserved',  size: 30, frontage: 46, elev: 3,  trees: 11, corner: false, sun: true,  view: false, dist: 210 },
    { id: 15, status: 'available', size: 25, frontage: 40, elev: 4,  trees: 9,  corner: false, sun: true,  view: true,  dist: 180 },
    { id: 16, status: 'sold',      size: 26, frontage: 42, elev: 4,  trees: 9,  corner: true,  sun: true,  view: true,  dist: 150 },
    { id: 17, status: 'available', size: 22, frontage: 40, elev: 5,  trees: 6,  corner: true,  sun: false, view: true,  dist: 130 },
    { id: 18, status: 'reserved',  size: 23, frontage: 40, elev: 5,  trees: 6,  corner: false, sun: false, view: true,  dist: 160 },
    { id: 19, status: 'sold',      size: 22, frontage: 40, elev: 6,  trees: 5,  corner: false, sun: false, view: true,  dist: 190 },
    { id: 20, status: 'available', size: 19, frontage: 40, elev: 6,  trees: 5,  corner: true,  sun: false, view: true,  dist: 220 },
    { id: 21, status: 'available', size: 29, frontage: 60, elev: 1,  trees: 10, corner: true,  sun: true,  view: false, dist: 250 },
    { id: 22, status: 'available', size: 30, frontage: 62, elev: 1,  trees: 11, corner: true,  sun: true,  view: false, dist: 230 },
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

  /* ── Layout: 22 plots echoing the site plan ──
     Entrance top-centre; plots 01-04 a top-right strip; 05-10 an upper
     band; 11-16 a middle band; 17-20 the right-side cluster; 21-22 the
     lower plots by the stream; amenity block bottom-left. */
  const POS = {
    1:  { x: 838, y: 118, w: 96,  h: 98 },
    2:  { x: 735, y: 110, w: 96,  h: 100 },
    3:  { x: 632, y: 130, w: 96,  h: 102 },
    4:  { x: 548, y: 168, w: 78,  h: 100 },
    // upper band (10 → 05, left to right)
    10: { x: 60,  y: 300, w: 100, h: 112 },
    9:  { x: 170, y: 300, w: 100, h: 112 },
    8:  { x: 280, y: 300, w: 100, h: 112 },
    7:  { x: 390, y: 300, w: 100, h: 112 },
    6:  { x: 500, y: 300, w: 100, h: 112 },
    5:  { x: 610, y: 300, w: 100, h: 112 },
    // middle band (11 → 16, left to right)
    11: { x: 60,  y: 430, w: 100, h: 112 },
    12: { x: 170, y: 430, w: 100, h: 112 },
    13: { x: 280, y: 430, w: 100, h: 112 },
    14: { x: 390, y: 430, w: 100, h: 112 },
    15: { x: 500, y: 430, w: 100, h: 112 },
    16: { x: 610, y: 430, w: 100, h: 112 },
    // right-side cluster (17-20)
    17: { x: 742, y: 300, w: 92,  h: 112 },
    18: { x: 842, y: 300, w: 92,  h: 112 },
    19: { x: 742, y: 430, w: 92,  h: 112 },
    20: { x: 842, y: 430, w: 92,  h: 112 },
    // lower plots by the stream
    21: { x: 300, y: 556, w: 150, h: 80  },
    22: { x: 460, y: 556, w: 150, h: 80  },
  };
  function plotRect(p) { return POS[p.id]; }

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

    // Real architect's site plan (lazy: href set on first Site-Plan toggle).
    // Sits at the back of the viewport so it pans/zooms with the controls.
    // 'meet' contains the whole drawing within the viewBox, centered.
    el('image', {
      id: 'mp-siteplan', x: 0, y: 0, width: 1000, height: 660,
      preserveAspectRatio: 'xMidYMid meet',
    }, viewport);

    // Paper base + boundary
    const paper = el('g', { class: 'mp-paper' }, viewport);
    el('rect', { x: 34, y: 24, width: 932, height: 612, fill: 'none', stroke: 'rgba(74,55,40,.4)', 'stroke-width': 1.4, 'stroke-dasharray': '2 6', rx: 6 }, paper);
    const t = el('text', { x: 500, y: 50, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 13 }, paper);
    t.textContent = 'THE MANGO MEADOWS · SITE PLAN · 22 PLOTS';

    // Roads: two horizontal 14-ft roads between the bands + a right spine,
    // and the entrance drive coming in from the top.
    const road = (d, w) => { el('path', { d, class: 'mp-road', 'stroke-width': w }, paper); el('path', { d, class: 'mp-road-dash' }, paper); };
    road('M40 285 H710', 20);          // between top strip / upper band
    road('M40 421 H930', 22);          // central 14-ft road
    road('M725 300 V545', 20);         // right spine to the cluster
    road('M610 40 Q640 150 660 285', 22); // entrance drive
    const rd = el('text', { x: 360, y: 417, class: 'mp-text', 'font-size': 9 }, paper);
    rd.textContent = '14 FEET WIDE ROAD';

    // Main entrance (top)
    el('path', { d: 'M596 46 L624 46 L610 66 Z', fill: 'rgba(74,55,40,.8)' }, paper);
    const en = el('text', { x: 610, y: 34, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 10, 'font-weight': 500 }, paper);
    en.textContent = 'MAIN ENTRANCE';

    // Forest labels
    const f1 = el('text', { x: 190, y: 150, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 12 }, paper);
    f1.textContent = 'Forest';
    const f2 = el('text', { x: 470, y: 628, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 12 }, paper);
    f2.textContent = 'Forest';

    // Amenity cluster bottom-left (pavilion + pool)
    el('rect', { x: 60, y: 556, width: 210, height: 80, rx: 4, class: 'mp-amenity' }, paper);
    el('rect', { x: 78, y: 576, width: 46, height: 42, rx: 3, fill: 'rgba(107,140,106,.5)', stroke: 'rgba(74,100,73,.7)', 'stroke-width': 1 }, paper);
    el('rect', { x: 140, y: 582, width: 54, height: 30, rx: 12, fill: 'rgba(90,150,180,.5)', stroke: 'rgba(60,110,150,.7)', 'stroke-width': 1 }, paper); // pool
    const am = el('text', { x: 165, y: 550, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 8 }, paper);
    am.textContent = 'PAVILION · POOL · FIRE PIT';

    // Stream along the bottom-right
    el('path', { d: 'M270 616 Q430 636 560 612 Q660 594 700 560', fill: 'none', stroke: 'rgba(90,150,180,.55)', 'stroke-width': 6, 'stroke-linecap': 'round' }, paper);

    // Compass
    const cp = el('g', { transform: 'translate(930,66)' }, paper);
    el('circle', { cx: 0, cy: 0, r: 16, fill: 'none', stroke: 'rgba(74,55,40,.4)', 'stroke-width': 1 }, cp);
    el('path', { d: 'M0 -12 L4 4 L0 1 L-4 4 Z', fill: 'rgba(139,111,71,.85)' }, cp);
    const nl = el('text', { x: 0, y: 30, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 9 }, cp);
    nl.textContent = 'N';

    // Orchard fringe trees
    const fringe = [[150,110],[240,120],[70,200],[70,250],[930,150],[930,220],[300,596],[540,600],[650,585]];
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
    const pointers = new Map();   // active touch pointers, for pinch
    let pinchDist = 0;
    stage.addEventListener('pointerdown', e => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        // begin pinch: capture the two-finger gesture, block page scroll
        dragging = false;
        stage.style.touchAction = 'none';
        const p = [...pointers.values()];
        pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      } else {
        dragging = true; moved = false; lx = e.clientX; ly = e.clientY;
        stage.classList.add('grabbing');
      }
    });
    window.addEventListener('pointermove', e => {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // Pinch-to-zoom (two fingers)
      if (pointers.size === 2) {
        const p = [...pointers.values()];
        const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        if (pinchDist > 0) {
          const r = svg.getBoundingClientRect();
          const midX = ((p[0].x + p[1].x) / 2 - r.left) * (1000 / r.width);
          const midY = ((p[0].y + p[1].y) / 2 - r.top) * (660 / r.height);
          zoomTo(state.zoom * (dist / pinchDist), midX, midY);
        }
        pinchDist = dist;
        e.preventDefault();
        return;
      }
      if (!dragging) return;
      const r = svg.getBoundingClientRect();
      const dx = (e.clientX - lx) * (1000 / r.width);
      const dy = (e.clientY - ly) * (660 / r.height);
      if (Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly) > 3) moved = true;
      state.panX += dx; state.panY += dy;
      lx = e.clientX; ly = e.clientY;
      applyTransform();
    }, { passive: false });
    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) { pinchDist = 0; stage.style.touchAction = ''; }
      if (pointers.size === 0) { dragging = false; stage.classList.remove('grabbing'); }
    }
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
    // Wheel zooms only with Ctrl/⌘ held; a plain wheel scrolls the page
    // normally (so the map never hijacks page scrolling).
    stage.addEventListener('wheel', e => {
      if (!(e.ctrlKey || e.metaKey)) return; // let the page scroll
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
    const toggles = ['tg-master', 'tg-siteplan', 'tg-satellite'];
    function setView(active) {
      toggles.forEach(id => document.getElementById(id).classList.toggle('active', id === active));
      stage.classList.toggle('satellite', active === 'tg-satellite');
      stage.classList.toggle('siteplan', active === 'tg-siteplan');
    }
    document.getElementById('tg-master').addEventListener('click', () => setView('tg-master'));
    document.getElementById('tg-siteplan').addEventListener('click', function () {
      // lazy-load the architect's site plan only when first opened
      const sp = document.getElementById('mp-siteplan');
      if (sp && !sp.getAttribute('href')) {
        // ?v busts the 1-day image cache when the plan is updated
        const url = 'assets/masterplan.jpg?v=' + (window.TFS_ASSET_V || '2');
        sp.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url);
        sp.setAttribute('href', url);
      }
      // reset view so the whole plan is framed
      state.zoom = 1; state.panX = 0; state.panY = 0; applyTransform();
      setView('tg-siteplan');
    });
    document.getElementById('tg-satellite').addEventListener('click', function () {
      // lazy-load the aerial imagery only when satellite view is first opened
      const sat = document.getElementById('map-satellite');
      if (!sat.style.backgroundImage) {
        sat.style.backgroundImage = 'url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=70")';
      }
      setView('tg-satellite');
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
