// Werk-Galerie: Justified-Layout (Zeilen auf Container-Breite, Zielhöhe ~200px, letzte Zeile
// linksbündig) + Kategorie-Filter + Infinite Scroll. Eigener Vanilla-JS-Code (kein Plugin).
// Die Galerie liefert nur den ersten Batch als HTML; alle Werke stecken als JSON
// (.gallery__data) in der Seite. Filter arbeitet über ALLE Werke; beim Scrollen werden weitere
// Kacheln aus den Daten gebaut (IntersectionObserver).
(function () {
  function layout(g, tries) {
    const grid = g.querySelector('.gallery__grid');
    if (!grid) return;
    const gap = parseInt(g.dataset.gap || '15', 10);
    const targetH = parseInt(g.dataset.rowHeight || '200', 10);
    // 1px Reserve: die Zeilen füllen rechnerisch exakt W, aber die Kachelbreiten sind
    // Fließkomma-Pixel. Je nach Display-Skalierung/Zoom rundet der Browser die letzte Kachel
    // minimal auf und sie ragt Bruchteile über den Rand → dünner horizontaler Scrollbalken.
    // W-1 verhindert das deterministisch (der 15px-Außenabstand fängt den Rest ab).
    const W = grid.clientWidth - 1;
    if (W < 1) {
      // Grid hat (noch) keine gemessene Breite -> es würde nichts positioniert und is-ready
      // nie gesetzt (Kacheln blieben unsichtbar). Im nächsten Frame erneut versuchen.
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

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Kachel-HTML aus einem Datensatz (identisch zur serverseitig gerenderten Kachel).
  function buildItem(d) {
    const t = esc(d.t);
    const num = d.n ? `<span class="gallery__number">${esc(d.n)}</span>` : '';
    return (
      `<article class="gallery__item" data-cats="${esc(d.c)}" data-w="${d.w}" data-h="${d.h}">` +
      `<a href="${esc(d.u)}" class="gallery__link" aria-label="${t}"><picture class="gallery__thumb">` +
      `<source srcset="${esc(d.a)}" type="image/avif"><source srcset="${esc(d.p)}" type="image/webp">` +
      `<img src="${esc(d.p)}" width="${d.w}" height="${d.h}" alt="" loading="lazy" decoding="async"></picture>` +
      `<span class="gallery__overlay"><span class="gallery__title">${t}</span>${num}</span></a></article>`
    );
  }

  function init(g) {
    // Filter + IntersectionObserver nur EINMAL pro Galerie binden; Layout darf beliebig oft
    // laufen (idempotent). Nach einem Client-Wechsel ist g ein frisches Element -> neu binden.
    if (g.__galleryBound) { layout(g); return; }
    g.__galleryBound = true;
    const grid = g.querySelector('.gallery__grid');
    const filter = g.querySelector('.gallery__filter');
    const sentinel = g.querySelector('.gallery__sentinel');
    const dataEl = g.querySelector('.gallery__data');
    const BATCH = parseInt(g.dataset.batch || '36', 10);
    let all = [];
    try { all = JSON.parse(dataEl.textContent || '[]'); } catch (e) { all = []; }

    let list = all; // aktuell gefilterte Liste
    let rendered = grid.querySelectorAll('.gallery__item').length; // erster Batch steht schon im HTML

    function appendMore() {
      if (rendered >= list.length) return;
      const next = list.slice(rendered, rendered + BATCH);
      grid.insertAdjacentHTML('beforeend', next.map(buildItem).join(''));
      rendered += next.length;
      layout(g);
    }

    function setFilter(val) {
      list = val === '*' ? all : all.filter((d) => (' ' + d.c + ' ').indexOf(' ' + val + ' ') >= 0);
      grid.innerHTML = '';
      rendered = 0;
      appendMore();
      let guard = 0;
      while (sentinel && rendered < list.length && sentinel.getBoundingClientRect().top < window.innerHeight && guard++ < 20) appendMore();
    }

    if (filter) {
      filter.addEventListener('click', (e) => {
        const a = e.target.closest('.gallery__filter-btn');
        if (!a) return;
        e.preventDefault();
        filter.querySelectorAll('.gallery__filter-btn').forEach((b) => b.classList.remove('is-active'));
        a.classList.add('is-active');
        setFilter(a.getAttribute('data-cat'));
      });
    }

    if (sentinel && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) appendMore();
      }, { rootMargin: '800px 0px' }).observe(sentinel);
    }

    layout(g);
  }

  function run() {
    document.querySelectorAll('.gallery[data-gallery]').forEach(init);
  }

  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => document.querySelectorAll('.gallery[data-gallery]').forEach(layout), 120);
  });
  // Mehrfach getriggert, damit die Galerie zuverlässig auslegt, unabhängig davon, wann der
  // Init drankommt: astro:page-load (Erststart + jeder Client-Wechsel), sofort selbst, und
  // window.load als Sicherheitsnetz. layout() versucht bei Breite 0 selbst erneut (rAF).
  document.addEventListener('astro:page-load', run);
  run();
  window.addEventListener('load', () => document.querySelectorAll('.gallery[data-gallery]').forEach((g) => layout(g)));
})();
