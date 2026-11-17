/* ═══════════════════════════════════════════════════════
   THE FARM STORIES — Plot Explorer
   Interactive masterplan for The Mango Meadows.
   Zoom / pan / hover / filter / compare / bookmark.
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Plot data ─────────────────────────────────────
     Geometry, size, frontage and distance are measured from the architect's
     master layout AR-01-WD-01 (R-03, 28 Aug 2026, 1:300) — see GEO below.
     status: available | reserved | sold
     size in cents, road frontage in ft, dist = metres from the main entrance,
     elevation in m above site datum,
     sun = morning-sun (east-facing) plot, view = Nilgiris view,
     orchard = orchard-dense (6+ mature trees inside boundary) */
  const PLOTS = [
    { id: 1,  status: 'sold',      size: 22, frontage: 85, elev: 6,  trees: 6,  corner: true,  sun: true,  view: true,  dist: 110  },
    { id: 2,  status: 'available', size: 23, frontage: 90, elev: 6,  trees: 7,  corner: false, sun: true,  view: true,  dist: 80  },
    { id: 3,  status: 'reserved',  size: 23, frontage: 90, elev: 5,  trees: 6,  corner: false, sun: true,  view: true,  dist: 50 },
    { id: 4,  status: 'available', size: 23, frontage: 95, elev: 5,  trees: 5,  corner: true,  sun: true,  view: true,  dist: 30 },
    { id: 5,  status: 'available', size: 23, frontage: 90, elev: 4,  trees: 7,  corner: true,  sun: true,  view: true,  dist: 20 },
    { id: 6,  status: 'sold',      size: 24, frontage: 90, elev: 4,  trees: 8,  corner: false, sun: true,  view: false, dist: 50 },
    { id: 7,  status: 'available', size: 25, frontage: 90, elev: 3,  trees: 8,  corner: false, sun: false, view: false, dist: 80 },
    { id: 8,  status: 'reserved',  size: 25, frontage: 90, elev: 3,  trees: 9,  corner: false, sun: false, view: false, dist: 100 },
    { id: 9,  status: 'sold',      size: 24, frontage: 90, elev: 2,  trees: 8,  corner: false, sun: false, view: false, dist: 130 },
    { id: 10, status: 'available', size: 25, frontage: 90, elev: 2,  trees: 9,  corner: false,  sun: false, view: false, dist: 160 },
    { id: 11, status: 'sold',      size: 21, frontage: 75, elev: 2,  trees: 10, corner: true,  sun: true,  view: false, dist: 170 },
    { id: 12, status: 'available', size: 25, frontage: 90, elev: 2,  trees: 8,  corner: false, sun: true,  view: false, dist: 140 },
    { id: 13, status: 'available', size: 25, frontage: 90, elev: 3,  trees: 7,  corner: false, sun: true,  view: false, dist: 120 },
    { id: 14, status: 'reserved',  size: 25, frontage: 90, elev: 3,  trees: 11, corner: false, sun: true,  view: false, dist: 90 },
    { id: 15, status: 'available', size: 25, frontage: 90, elev: 4,  trees: 9,  corner: false, sun: true,  view: true,  dist: 70 },
    { id: 16, status: 'sold',      size: 26, frontage: 90, elev: 4,  trees: 9,  corner: true,  sun: true,  view: true,  dist: 60 },
    { id: 17, status: 'available', size: 21, frontage: 90, elev: 5,  trees: 6,  corner: true,  sun: false, view: true,  dist: 60 },
    { id: 18, status: 'reserved',  size: 20, frontage: 85, elev: 5,  trees: 6,  corner: false, sun: false, view: true,  dist: 70 },
    { id: 19, status: 'sold',      size: 19, frontage: 85, elev: 6,  trees: 5,  corner: false, sun: false, view: true,  dist: 90 },
    { id: 20, status: 'available', size: 19, frontage: 90, elev: 6,  trees: 5,  corner: true,  sun: false, view: true,  dist: 110 },
    { id: 21, status: 'available', size: 27, frontage: 110, elev: 1,  trees: 10, corner: false,  sun: true,  view: false, dist: 100 },
    { id: 22, status: 'available', size: 24, frontage: 85, elev: 1,  trees: 11, corner: false,  sun: true,  view: false, dist: 110 },
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

  /* ── Layout: traced from the architect's master layout (R-03) ──
     Two diagonal 14-ft roads with a loop, 12-ft private roads on the north and
     east edges, main entrance from the north, clubhouse + pool in the south-west
     corner, pods beside the stream. Coordinates are in the 1000 x 660 viewBox,
     framed exactly like assets/masterplan.jpg so the two views line up. */
  const GEO = {"plots":{"1":{"pts":[[866.1,24.2],[894.4,118.1],[826.8,142.1],[794.4,52.4]],"c":[845.4,84.2],"cents":22,"front":85,"dist":110},"2":{"pts":[[791.7,53.3],[823.6,143.5],[749.6,169.9],[718.1,82.5]],"c":[770.7,112.3],"cents":23,"front":90,"dist":80},"3":{"pts":[[715.3,83.4],[746.3,171.3],[672.3,197.6],[641.3,112.5]],"c":[693.8,141.2],"cents":23,"front":90,"dist":50},"4":{"pts":[[638.6,113.9],[669.1,198.6],[589.1,226.8],[559.5,149.1]],"c":[614.0,172.1],"cents":23,"front":95,"dist":30},"5":{"pts":[[538.2,154.2],[566.9,233.7],[490.1,262.9],[458.2,172.7]],"c":[513.3,205.9],"cents":23,"front":90,"dist":20},"6":{"pts":[[454.9,173.6],[487.3,263.8],[413.3,290.6],[379.1,193.9]],"c":[433.6,230.5],"cents":24,"front":90,"dist":50},"7":{"pts":[[375.8,194.4],[410.5,291.5],[336.5,317.9],[302.3,221.7]],"c":[356.3,256.4],"cents":25,"front":90,"dist":80},"8":{"pts":[[299.5,222.6],[333.7,319.3],[259.7,345.7],[225.5,250.4]],"c":[279.6,284.5],"cents":25,"front":90,"dist":100},"9":{"pts":[[222.7,251.3],[257.0,346.6],[182.9,373.0],[149.2,279.1]],"c":[202.9,312.5],"cents":24,"front":90,"dist":130},"10":{"pts":[[145.9,280.0],[180.2,374.3],[105.2,401.2],[71.5,307.7]],"c":[125.7,340.8],"cents":25,"front":90,"dist":160},"11":{"pts":[[187.1,394.2],[222.3,491.8],[160.7,513.6],[124.7,417.8]],"c":[173.7,454.4],"cents":21,"front":75,"dist":170},"12":{"pts":[[263.9,366.5],[299.0,464.5],[225.0,490.9],[190.3,392.8]],"c":[244.6,428.7],"cents":25,"front":90,"dist":140},"13":{"pts":[[340.7,339.2],[375.4,436.8],[301.8,463.2],[266.7,365.6]],"c":[321.1,401.2],"cents":25,"front":90,"dist":120},"14":{"pts":[[417.5,311.4],[452.2,409.5],[378.6,435.9],[343.4,337.8]],"c":[397.9,373.7],"cents":25,"front":90,"dist":90},"15":{"pts":[[494.2,284.1],[529.4,381.7],[455.4,408.1],[420.7,310.5]],"c":[474.9,346.1],"cents":25,"front":90,"dist":70},"16":{"pts":[[573.3,255.9],[609.0,351.7],[532.2,380.4],[497.0,282.8]],"c":[552.9,317.7],"cents":26,"front":90,"dist":60},"17":{"pts":[[670.9,220.8],[698.7,300.8],[624.7,330.9],[596.0,249.5]],"c":[647.6,275.5],"cents":21,"front":90,"dist":60},"18":{"pts":[[745.4,193.9],[772.7,270.7],[701.5,299.9],[673.7,219.4]],"c":[723.3,246.0],"cents":20,"front":85,"dist":70},"19":{"pts":[[820.8,166.7],[847.2,240.2],[775.9,269.3],[748.7,192.6]],"c":[798.1,217.2],"cents":19,"front":85,"dist":90},"20":{"pts":[[899.9,138.4],[919.8,211.1],[850.4,239.3],[824.0,165.7]],"c":[873.5,188.6],"cents":19,"front":90,"dist":110},"21":{"pts":[[633.5,367.9],[653.4,423.4],[639.0,465.0],[574.3,493.2],[541.4,401.2]],"c":[608.3,430.1],"cents":27,"front":110,"dist":100},"22":{"pts":[[534.5,403.0],[569.6,496.0],[498.4,526.1],[463.7,428.5]],"c":[516.6,463.4],"cents":24,"front":85,"dist":110}},"roads":{"upper":[[109.3,404.2],[912.8,129.4]],"lower":[[150.6,524.9],[623.8,363.0]],"loop":[[109.3,404.2],[150.6,524.9]],"conn":[[582.6,242.4],[623.8,363.0]],"entry":[[542.7,131.6],[580.8,243.0]],"north_l":[[66.9,294.4],[542.7,131.6]],"north_r":[[542.7,131.5],[874.7,17.9]],"east":[[874.7,17.9],[933.7,190.5]]},"w14":20.2,"w12":17.3,"stream":[[167.7,613.0],[180.6,602.9],[193.6,601.9],[206.5,601.9],[219.5,607.0],[232.4,612.6],[245.4,607.9],[258.3,599.2],[271.3,594.5],[284.2,595.0],[297.2,598.2],[310.1,601.0],[323.1,603.3],[336.0,602.4],[349.0,599.2],[362.0,594.1],[374.9,588.0],[387.9,580.2],[400.8,576.5],[413.8,569.1],[426.7,562.6],[439.7,556.1],[452.6,546.0],[465.6,537.2],[478.5,528.4],[491.5,523.3],[504.4,518.2],[517.4,512.2],[530.3,508.0],[543.3,501.1],[556.2,496.0],[569.2,491.8],[582.1,488.6],[595.1,488.1]],"club":[[144.5,539.4],[215.2,544.6],[230.8,596.6],[203.8,635.1],[158.0,635.1]],"pool":[[184.0,562.3],[203.8,565.4],[202.7,591.4],[184.0,589.3]],"pods":[[[307.7,555.0],[332.7,557.1],[332.7,590.4],[307.7,588.3]],[[368.5,548.8],[394.5,550.9],[394.5,583.1],[368.5,581.0]]],"parking":[[199.6,515.5],[230.8,510.3],[232.9,530.1],[201.7,534.2]],"entrance":[544.2,140.3],"labels":{"forest_n":[338.9,166.3],"forest_s":[292.1,640.3]},"angle":-18.9};
  const pts = a => a.map(p => p.join(',')).join(' ');
  // Bounding box of a plot polygon — used for the tooltip + saved-mark position
  function plotRect(p) {
    const g = GEO.plots[p.id], xs = g.pts.map(q => q[0]), ys = g.pts.map(q => q[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, cx: g.c[0], cy: g.c[1] };
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

    // Real architect's site plan (lazy: href set on first Site-Plan toggle).
    // Sits at the back of the viewport so it pans/zooms with the controls.
    // 'meet' contains the whole drawing within the viewBox, centered.
    el('image', {
      id: 'mp-siteplan', x: 0, y: 0, width: 1000, height: 660,
      preserveAspectRatio: 'xMidYMid meet',
    }, viewport);

    // Paper base: the real site, drawn from the master layout
    const paper = el('g', { class: 'mp-paper' }, viewport);
    const line = (a, cls, w) => el('polyline', { points: pts(a), class: cls, 'stroke-width': w, fill: 'none' }, paper);
    const txt = (x, y, str, size, extra = {}) => {
      const t = el('text', Object.assign({ x, y, class: 'mp-text', 'font-size': size, 'text-anchor': 'middle' }, extra), paper);
      t.textContent = str; return t;
    };
    const roadLabel = (a, f) => {
      const x = a[0][0] + (a[1][0] - a[0][0]) * f, y = a[0][1] + (a[1][1] - a[0][1]) * f;
      txt(x, y + 3, '14 FT ROAD', 8, { transform: `rotate(${GEO.angle} ${x} ${y})` });
    };
    // Stream along the south edge
    el('polyline', { points: pts(GEO.stream), class: 'mp-stream', fill: 'none' }, paper);
    // Roads: 14 ft spine + loop, 12 ft private roads, entrance road
    ['north_l', 'north_r', 'east'].forEach(k => line(GEO.roads[k], 'mp-road', GEO.w12));
    ['upper', 'lower', 'loop', 'conn', 'entry'].forEach(k => line(GEO.roads[k], 'mp-road', GEO.w14));
    ['upper', 'lower', 'conn', 'entry'].forEach(k => line(GEO.roads[k], 'mp-road-dash', 1.4));
    roadLabel(GEO.roads.upper, .3);
    roadLabel(GEO.roads.lower, .45);
    // Clubhouse + pool, pods by the stream, parking
    el('polygon', { points: pts(GEO.club), class: 'mp-amenity' }, paper);
    el('polygon', { points: pts(GEO.pool), fill: 'rgba(90,150,180,.5)', stroke: 'rgba(60,110,150,.7)', 'stroke-width': 1 }, paper);
    GEO.pods.forEach(q => el('polygon', { points: pts(q), class: 'mp-amenity' }, paper));
    el('polygon', { points: pts(GEO.parking), class: 'mp-amenity' }, paper);
    const cb = GEO.club, ccx = cb.reduce((a, q) => a + q[0], 0) / cb.length;
    txt(ccx, Math.max(...cb.map(q => q[1])) + 12, 'CLUBHOUSE · POOL', 7.5, { 'font-weight': 500 });
    txt(GEO.pods[1][0][0] + 8, GEO.pods[1][0][1] - 6, 'PODS', 7.5);
    // Main entrance (north)
    const [ex, ey] = GEO.entrance;
    el('path', { d: `M${ex - 9} ${ey - 20} L${ex + 9} ${ey - 20} L${ex} ${ey - 6} Z`, fill: 'rgba(74,55,40,.8)' }, paper);
    txt(ex, ey - 26, 'MAIN ENTRANCE', 9, { 'font-weight': 500 });
    // Forest on both sides
    txt(GEO.labels.forest_n[0], GEO.labels.forest_n[1], 'Forest', 12);
    txt(GEO.labels.forest_s[0], GEO.labels.forest_s[1], 'Forest', 12);
    // Title + compass in the open south-east corner
    txt(975, 646, 'THE MANGO MEADOWS · MASTER LAYOUT · 22 PLOTS', 10, { 'text-anchor': 'end' });
    const cp = el('g', { transform: 'translate(955,592)' }, paper);
    el('circle', { cx: 0, cy: 0, r: 16, fill: 'none', stroke: 'rgba(74,55,40,.4)', 'stroke-width': 1 }, cp);
    el('path', { d: 'M0 -12 L4 4 L0 1 L-4 4 Z', fill: 'rgba(139,111,71,.85)' }, cp);
    const nl = el('text', { x: 0, y: 30, 'text-anchor': 'middle', class: 'mp-text', 'font-size': 9 }, cp);
    nl.textContent = 'N';

    // Plots
    PLOTS.forEach(p => {
      const r = plotRect(p);
      const g = el('g', { class: 'plot ' + p.status, 'data-id': p.id, tabindex: 0, role: 'button',
        'aria-label': `Plot ${String(p.id).padStart(2, '0')}, ${p.size} cents, ${p.status}` }, viewport);
      const geo = GEO.plots[p.id];
      el('polygon', { points: pts(geo.pts), class: 'plot-shape' }, g);
      // In-plot mango trees (sketch dots), set between the centre and the corners
      const n = Math.min(3, Math.max(1, Math.round(p.trees / 4)));
      for (let k = 0; k < n; k++) {
        const v = geo.pts[k % geo.pts.length];
        drawTree(g, r.cx + (v[0] - r.cx) * .5, r.cy + (v[1] - r.cy) * .5 - 3, 5);
      }
      const label = el('text', { x: r.cx, y: r.cy + 5, class: 'plot-label' }, g);
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
    // Phones: open zoomed in on the heart of the site so plots are big enough to
    // read and tap; drag to explore, and the reset button frames the whole plan.
    if (window.matchMedia('(max-width: 640px)').matches) zoomTo(1.8, 520, 300);
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
