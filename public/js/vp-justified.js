// Justified-Layout wie Visual Portfolio (Zeilen auf Container-Breite, Zielhöhe ~200px, letzte
// Zeile linksbündig) + Kategorie-Filter + Infinite Scroll wie im Original. Die Galerie liefert
// nur den ersten Batch als HTML; alle Werke stecken als JSON (.vp-portfolio__data) in der Seite.
// Filter arbeitet über ALLE Werke; beim Scrollen werden weitere Kacheln aus den Daten gebaut.
(function () {
  function layout(vp) {
    const wrap = vp.querySelector('.vp-portfolio__items');
    if (!wrap) return;
    const gap = parseInt(vp.dataset.vpItemsGap || '15', 10);
    const targetH = parseInt(vp.dataset.vpJustifiedRowHeight || '200', 10);
    const W = wrap.clientWidth;
    if (!W) return;
    const items = [...wrap.querySelectorAll('.vp-portfolio__item-wrap')].filter((el) => el.style.display !== 'none');
    let y = 0, row = [], aspectSum = 0;

    const place = (isLast) => {
      if (!row.length) return;
      const rowH = isLast ? Math.min(targetH, (W - gap * (row.length - 1)) / aspectSum) : (W - gap * (row.length - 1)) / aspectSum;
      let x = 0;
      for (const el of row) {
        const w = parseFloat(el.dataset.w), h = parseFloat(el.dataset.h);
        const iw = (w / h) * rowH;
        el.style.position = 'absolute';
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
    wrap.style.position = 'relative';
    wrap.style.height = (y > 0 ? y - gap : 0) + 'px';
    vp.classList.add('vp-portfolio__ready');
  }

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Kachel-HTML aus einem Datensatz (identisch zur serverseitig gerenderten Kachel).
  function buildItem(d) {
    const t = esc(d.t);
    const num = d.n
      ? `<div class="vp-portfolio__item-meta-inline"><div class="vp-portfolio__item-meta-part vp-portfolio__item-meta-date"><span class="vp-portfolio__item-meta-part-text">${esc(d.n)}</span></div></div>`
      : '';
    return (
      `<article class="vp-portfolio__item-wrap" data-vp-filter="${esc(d.c)}" data-w="${d.w}" data-h="${d.h}">` +
      `<figure class="vp-portfolio__item"><div class="vp-portfolio__item-img-wrap"><div class="vp-portfolio__item-img">` +
      `<a href="${esc(d.u)}" aria-label="${t}"><picture>` +
      `<source srcset="${esc(d.a)}" type="image/avif"><source srcset="${esc(d.p)}" type="image/webp">` +
      `<img src="${esc(d.p)}" width="${d.w}" height="${d.h}" alt="" loading="lazy" decoding="async"></picture></a>` +
      `</div></div><figcaption class="vp-portfolio__item-overlay vp-portfolio__item-overlay-text-align-center">` +
      `<div class="vp-portfolio__item-meta-wrap vp-portfolio__custom-scrollbar">` +
      `<a href="${esc(d.u)}" tabindex="-1" class="vp-portfolio__item-meta" aria-label="${t}">` +
      `<h2 class="vp-portfolio__item-meta-title">${t}</h2>${num}</a></div></figcaption></figure></article>`
    );
  }

  function initGallery(vp) {
    const wrap = vp.querySelector('.vp-portfolio__items');
    const filter = vp.querySelector('.vp-filter');
    const sentinel = vp.querySelector('.vp-portfolio__sentinel');
    const dataEl = vp.querySelector('.vp-portfolio__data');
    const BATCH = parseInt(vp.dataset.vpBatch || '36', 10);
    let all = [];
    try { all = JSON.parse(dataEl.textContent || '[]'); } catch (e) { all = []; }

    let cur = '*';
    let list = all; // aktuell gefilterte Liste
    let rendered = wrap.querySelectorAll('.vp-portfolio__item-wrap').length; // erster Batch steht schon im HTML

    function appendMore() {
      if (rendered >= list.length) return;
      const next = list.slice(rendered, rendered + BATCH);
      wrap.insertAdjacentHTML('beforeend', next.map(buildItem).join(''));
      rendered += next.length;
      layout(vp);
    }

    function setFilter(val) {
      cur = val;
      list = val === '*' ? all : all.filter((d) => (' ' + d.c + ' ').indexOf(' ' + val + ' ') >= 0);
      wrap.innerHTML = '';
      rendered = 0;
      appendMore();
      // Falls der erste Batch den Viewport nicht füllt, nachladen bis er es tut (max. paar Runden).
      let guard = 0;
      while (sentinel && rendered < list.length && sentinel.getBoundingClientRect().top < window.innerHeight && guard++ < 20) appendMore();
    }

    if (filter) {
      filter.addEventListener('click', (e) => {
        const a = e.target.closest('a[data-vp-filter]');
        if (!a) return;
        e.preventDefault();
        filter.querySelectorAll('.vp-filter__item').forEach((i) => i.classList.remove('vp-filter__item-active'));
        a.closest('.vp-filter__item').classList.add('vp-filter__item-active');
        setFilter(a.getAttribute('data-vp-filter'));
      });
    }

    if (sentinel && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) appendMore();
      }, { rootMargin: '800px 0px' }).observe(sentinel);
    }

    layout(vp);
  }

  function run() {
    document.querySelectorAll('.vp-portfolio[data-vp-layout="justified"]').forEach(initGallery);
  }

  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => document.querySelectorAll('.vp-portfolio[data-vp-layout="justified"]').forEach(layout), 120);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  window.addEventListener('load', () => document.querySelectorAll('.vp-portfolio[data-vp-layout="justified"]').forEach(layout));
})();
