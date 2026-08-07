// Justified-Layout wie Visual Portfolio (data-vp-layout="justified"): Zeilen werden auf die
// Container-Breite gestreckt bei Zielhöhe ~200px; letzte Zeile linksbündig. Plus Kategorie-
// Filter. Bildmaße kommen aus data-w/data-h (kein Warten aufs Laden nötig).
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
      const heightWith = (W - gap * row.length) / (aspectSum + aspect); // Höhe, wenn dieses Bild dazukommt
      if (heightWith > targetH) {
        // noch höher als Ziel → Bild einfach aufnehmen
        row.push(el);
        aspectSum += aspect;
      } else {
        // Aufnahme drückt die Höhe auf/unter Ziel. Wie das echte Visual Portfolio (Flickr-
        // Justified): Bild aufnehmen ODER die Zeile ohne es umbrechen — je nachdem, was näher
        // an der Zielhöhe liegt. Verhindert das „ein Bild zu viel" (4/Reihe statt 3/Reihe).
        const heightWithout = row.length ? (W - gap * (row.length - 1)) / aspectSum : Infinity;
        if (row.length && Math.abs(heightWithout - targetH) < Math.abs(heightWith - targetH)) {
          place(false); // Zeile ohne dieses Bild umbrechen …
          row.push(el); // … Bild beginnt die neue Zeile
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

  function initFilter(vp) {
    const filter = vp.querySelector('.vp-filter');
    if (!filter) return;
    filter.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-vp-filter]');
      if (!a) return;
      e.preventDefault();
      const val = a.getAttribute('data-vp-filter');
      filter.querySelectorAll('.vp-filter__item').forEach((i) => i.classList.remove('vp-filter__item-active'));
      a.closest('.vp-filter__item').classList.add('vp-filter__item-active');
      vp.querySelectorAll('.vp-portfolio__item-wrap').forEach((el) => {
        const cats = (el.getAttribute('data-vp-filter') || '').split(/\s+/);
        el.style.display = val === '*' || cats.includes(val) ? '' : 'none';
      });
      layout(vp);
    });
  }

  function run() {
    document.querySelectorAll('.vp-portfolio[data-vp-layout="justified"]').forEach((vp) => {
      initFilter(vp);
      layout(vp);
    });
  }

  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => document.querySelectorAll('.vp-portfolio[data-vp-layout="justified"]').forEach(layout), 120);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  // nach vollständigem Laden nochmal (Fonts/Layout-Shift)
  window.addEventListener('load', () => document.querySelectorAll('.vp-portfolio[data-vp-layout="justified"]').forEach(layout));
})();
