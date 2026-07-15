/* ═══════════════════════════════════════════════════════
   THE FARM STORIES — Book intro experience
   Darkness → drifting paper motes → a hardbound book.
   Click / hover-edge / swipe turns the pages; after the
   last page the book dissolves into the website.
   Respects prefers-reduced-motion and repeat visits.
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const intro = document.getElementById('book-intro');
  if (!intro) return;

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = sessionStorage.getItem('tfs-intro-seen');

  if (REDUCED || seen) {
    intro.classList.add('removed');
    return;
  }

  document.body.classList.add('intro-open');

  /* ── Drifting paper particles ── */
  const canvas = document.getElementById('intro-particles');
  const ctx = canvas.getContext('2d');
  let motes = [], rafId = null, running = true;

  function sizeCanvas() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  sizeCanvas();
  addEventListener('resize', sizeCanvas);

  for (let i = 0; i < 42; i++) {
    motes.push({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: 0.6 + Math.random() * 2.2,
      vx: -0.12 + Math.random() * 0.24,
      vy: -0.05 - Math.random() * 0.22,
      a: 0.08 + Math.random() * 0.28,
      w: Math.random() * Math.PI * 2,
    });
  }

  function drawMotes() {
    if (!running) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const m of motes) {
      m.w += 0.012;
      m.x += m.vx + Math.sin(m.w) * 0.18;
      m.y += m.vy;
      if (m.y < -8) { m.y = innerHeight + 8; m.x = Math.random() * innerWidth; }
      if (m.x < -8) m.x = innerWidth + 8;
      if (m.x > innerWidth + 8) m.x = -8;
      ctx.globalAlpha = m.a * (0.75 + 0.25 * Math.sin(m.w * 1.4));
      ctx.fillStyle = '#EBD9AE';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(drawMotes);
  }
  drawMotes();

  /* ── Optional soft paper sound (WebAudio, no assets) ── */
  let audioCtx = null;
  function pageSound() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const dur = 0.38;
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / data.length;
        // shaped noise: a soft "shhf" swelling then fading
        data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t) * Math.pow(1 - t, 1.6) * 0.18;
      }
      const src = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 2600; filter.Q.value = 0.6;
      src.buffer = buf;
      src.connect(filter).connect(audioCtx.destination);
      src.start();
    } catch (e) { /* sound is optional */ }
  }

  /* ── Page turning ── */
  const turnables = [
    document.getElementById('bcover'),
    document.getElementById('bp1'),
    document.getElementById('bp2'),
  ];
  let current = 0;
  let turning = false;

  function turnNext() {
    if (turning) return;
    if (current >= turnables.length) { dissolve(); return; }
    turning = true;
    const page = turnables[current];
    page.classList.add('turning', 'turned');
    pageSound();
    // once a page is turned it stacks under the next ones
    setTimeout(() => {
      page.classList.remove('turning');
      page.style.zIndex = String(current); // keep turned pages beneath
      turning = false;
      current++;
      // after the final inner page, linger a moment then dissolve
      if (current >= turnables.length) setTimeout(dissolve, 2600);
    }, 1500);
  }

  function turnPrev() {
    if (turning || current === 0) return;
    turning = true;
    current--;
    const page = turnables[current];
    page.classList.add('turning');
    page.classList.remove('turned');
    page.style.zIndex = String(4 - current);
    pageSound();
    setTimeout(() => { page.classList.remove('turning'); turning = false; }, 1500);
  }

  /* ── Dissolve into the website ── */
  let dissolved = false;
  function dissolve() {
    if (dissolved) return;
    dissolved = true;
    sessionStorage.setItem('tfs-intro-seen', '1');
    intro.classList.add('dissolving');
    document.body.classList.remove('intro-open');
    if (typeof window.wakeHero === 'function') window.wakeHero();
    setTimeout(() => {
      intro.classList.add('removed');
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (audioCtx) audioCtx.close().catch(() => {});
    }, 1700);
  }

  /* ── Interactions: click, swipe, keys ── */
  intro.addEventListener('click', e => {
    if (e.target.closest('#skip-intro') || e.target.closest('#enter-site-btn')) return;
    turnNext();
  });
  document.getElementById('skip-intro').addEventListener('click', dissolve);
  document.getElementById('enter-site-btn').addEventListener('click', dissolve);

  document.addEventListener('keydown', function keys(e) {
    if (dissolved) { document.removeEventListener('keydown', keys); return; }
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turnNext(); }
    else if (e.key === 'ArrowLeft') turnPrev();
    else if (e.key === 'Escape') dissolve();
  });

  let touchX = null;
  intro.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  intro.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (dx < -40) turnNext();
    else if (dx > 40) turnPrev();
    touchX = null;
  }, { passive: true });

  /* Safety: never trap the visitor — auto-dissolve after 40s of inactivity */
  setTimeout(() => { if (!dissolved && current === 0) dissolve(); }, 40000);
})();
