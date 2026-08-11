// Werk-Galerie — reine Progressive-Enhancement-Veredelung. ALLE Werke der jeweiligen Seite (Alle
// oder eine Kategorie) stehen server-seitig im HTML (ohne JS ein einfaches CSS-Raster, voll
// sichtbar + crawlbar, siehe Gallery.astro). Der Kategorie-Filter sind echte Links auf eigene URLs
// — kein Client-Filter hier. Mit JS: (1) Justified-Layout, (2) Infinite Scroll durch schrittweises
// EINBLENDEN der zunächst versteckten Kacheln (kein Nachbau, kein JSON). Global im BaseLayout
// geladen, damit der astro:page-load-Listener schon beim ersten Vollladen registriert ist und nach
// jeder View-Transition feuert.
(function () {
  function layout(g, tries) {
    const grid = g.querySelector('.gallery__grid');
    if (!grid) return;
    const gap = parseInt(g.dataset.gap || '15', 10);
    const targetH = parseInt(g.dataset.rowHeight || '200', 10);
    // 1px Reserve gegen den Sub-Pixel-Überstand der letzten Kachel (dünner Scrollbalken).
    const W = grid.clientWidth - 1;
    if (W < 1) {
      // Grid hat (noch) keine gemessene Breite -> im nächsten Frame erneut versuchen, sonst
      // bliebe is-ready ungesetzt und die Justified-Kacheln unsichtbar.
      if ((tries || 0) < 30) requestAnimationFrame(() => layout(g, (tries || 0) + 1));
      return;
    }
    const items = [...grid.querySelectorAll('.gallery__item')].filter((el) => el.style.display !== 'none');
    let y = 0, row = [], aspectSum = 0;

    const place = (isLast) => {
      if (!row.length) return;
      const rowH = isLast ? Math.min(targetH, (W - gap * (row.length - 1)) / aspectSum) : (W - gap * (row.length - 1)) / aspectSum;
      let x = 0;
      for (const el of row) {
        const w = parseFloat(el.dataset.w), h = parseFloat(el.dataset.h);
        const iw = (w / h) * rowH;
        el.style.width = iw + 'px';
        el.style.height = rowH + 'px';
        el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
        x += iw + gap;
      }
      y += rowH + gap;
      row = []; aspectSum = 0;
    };

    for (const el of items) {
      const w = parseFloat(el.dataset.w), h = parseFloat(el.dataset.h);
      if (!w || !h) continue;
      const aspect = w / h;
      const heightWith = (W - gap * row.length) / (aspectSum + aspect);
      if (heightWith > targetH) {
        row.push(el);
        aspectSum += aspect;
      } else {
        const heightWithout = row.length ? (W - gap * (row.length - 1)) / aspectSum : Infinity;
        if (row.length && Math.abs(heightWithout - targetH) < Math.abs(heightWith - targetH)) {
          place(false);
          row.push(el);
          aspectSum += aspect;
        } else {
          row.push(el);
          aspectSum += aspect;
          place(false);
        }
      }
    }
    place(true);
    grid.style.height = (y > 0 ? y - gap : 0) + 'px';
    g.classList.add('is-ready');
  }

  function init(g) {
    // Nur EINMAL binden (IntersectionObserver); Layout darf beliebig oft laufen.
    // Nach einem Client-Wechsel ist g ein frisches Element -> neu binden.
    if (g.__galleryBound) { layout(g); return; }
    g.__galleryBound = true;
    const grid = g.querySelector('.gallery__grid');
    const sentinel = g.querySelector('.gallery__sentinel');
    const BATCH = parseInt(g.dataset.batch || '36', 10);
    const all = [...grid.querySelectorAll('.gallery__item')];
    let shown = Math.min(BATCH, all.length); // wie viele Kacheln aktuell eingeblendet sind

    function render() {
      for (let i = 0; i < all.length; i++) all[i].style.display = i < shown ? '' : 'none';
      layout(g);
    }

    if (sentinel && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting) && shown < all.length) {
          shown = Math.min(shown + BATCH, all.length);
          render();
        }
      }, { rootMargin: '600px 0px' }).observe(sentinel);
    }

    render();
  }

  function run() {
    document.querySelectorAll('.gallery[data-gallery]').forEach(init);
  }

  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => document.querySelectorAll('.gallery[data-gallery]').forEach((g) => layout(g)), 120);
  });
  // Mehrfach getriggert, damit die Galerie zuverlässig ausgelegt wird: astro:page-load
  // (Erststart + jeder Client-Wechsel), sofort selbst, und window.load als Sicherheitsnetz.
  document.addEventListener('astro:page-load', run);
  run();
  window.addEventListener('load', () => document.querySelectorAll('.gallery[data-gallery]').forEach((g) => layout(g)));
})();
