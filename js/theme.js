/* ═══════════════════════════════════════════
   THE FARM STORIES — day / night view
   The saved choice is applied before first paint by an inline script at the
   top of <body>; this file wires the nav toggle. Uses its own class
   (html.tfs-night) so it never collides with a host page's data-theme.
   ═══════════════════════════════════════════ */
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function sync() {
    const night = root.classList.contains('tfs-night');
    btn.setAttribute('aria-pressed', String(night));
    btn.setAttribute('aria-label', night ? 'Switch to day view' : 'Switch to night view');
    btn.title = night ? 'Day view' : 'Night view';
  }

  btn.addEventListener('click', () => {
    // Cross-fade colours for a moment, then hand transitions back to components
    if (!reduceMotion.matches) {
      root.classList.add('theme-fading');
      clearTimeout(btn._fade);
      btn._fade = setTimeout(() => root.classList.remove('theme-fading'), 700);
    }
    const night = root.classList.toggle('tfs-night');
    try { localStorage.setItem('tfs-theme', night ? 'night' : 'day'); } catch (e) {}
    sync();
  });

  sync();
})();
