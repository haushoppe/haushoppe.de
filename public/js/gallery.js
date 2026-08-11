// Werk-Galerie — reine Progressive-Enhancement-Veredelung. ALLE Werke stehen server-seitig im
// HTML (ohne JS ein einfaches CSS-Raster, voll sichtbar + crawlbar, siehe Gallery.astro).
// Mit JS: (1) Justified-Layout, (2) Kategorie-Filter (blendet vorhandene Kacheln ein/aus),
// (3) Infinite Scroll durch schrittweises EINBLENDEN der zunächst versteckten Kacheln — kein
// Nachbau, kein JSON. Global im BaseLayout geladen, damit der astro:page-load-Listener schon
// beim ersten Vollladen registriert ist und nach jeder View-Transition feuert.
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

  const matches = (el, cat) => cat === '*' || (' ' + (el.dataset.cats || '') + ' ').indexOf(' ' + cat + ' ') >= 0;

  function init(g) {
    // Nur EINMAL binden (Filter, IntersectionObserver); Layout darf beliebig oft laufen.
    // Nach einem Client-Wechsel ist g ein frisches Element -> neu binden.
    if (g.__galleryBound) { layout(g); return; }
    g.__galleryBound = true;
    const grid = g.querySelector('.gallery__grid');
    const filter = g.querySelector('.gallery__filter');
    const sentinel = g.querySelector('.gallery__sentinel');
    const BATCH = parseInt(g.dataset.batch || '36', 10);
    const all = [...grid.querySelectorAll('.gallery__item')];
    let cat = '*';
    let shown = BATCH; // wie viele der aktuell gefilterten Kacheln eingeblendet sind

    const filteredCount = () => all.reduce((n, el) => n + (matches(el, cat) ? 1 : 0), 0);

    function render() {
      let seen = 0;
      for (const el of all) {
        if (!matches(el, cat)) { el.style.display = 'none'; continue; }
        el.style.display = seen < shown ? '' : 'none';
        seen++;
      }
      layout(g);
    }

    if (filter) {
      filter.addEventListener('click', (e) => {
        const b = e.target.closest('.gallery__filter-btn');
        if (!b) return;
        cat = b.getAttribute('data-cat');
        shown = BATCH;
        filter.querySelectorAll('.gallery__filter-btn').forEach((x) => x.classList.toggle('is-active', x === b));
        render();
      });
    }

    if (sentinel && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting) && shown < filteredCount()) {
          shown += BATCH;
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
