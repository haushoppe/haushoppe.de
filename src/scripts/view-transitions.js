// Werk-Bild „morpht" beim Seitenwechsel: Vorschaubild (Galerie, Highlights, Startseite, Zyklus)
// ↔ großes Bild der Werkseite. Der ClientRouter ruft document.startViewTransition() selbst auf;
// hier wird nur festgelegt, WELCHE zwei Bilder denselben view-transition-name tragen.
//
// Bewusst dynamisch statt fest im HTML: Die Galerie hat über 300 Werke. Ein fester Name je Kachel
// ließe den Browser bei jedem Wechsel jede benannte Kachel einzeln erfassen, und ein Werk, das
// doppelt auf der Seite steht (Highlight + Raster), hätte einen doppelten Namen, was den ganzen
// Übergang abbricht. So trägt immer genau ein Bild pro Seite den Namen NAME.
//
// Alte Seite (astro:before-preparation): das angeklickte Werk-Bild, sonst (Zurück-Taste, Navi)
// das große Bild der Werkseite. Neue Seite (astro:before-swap, noch unsichtbar): das große Bild,
// wenn ein Vorschaubild zu genau dieser Werkseite angeklickt wurde, sonst das Vorschaubild des
// Werks, von dessen Seite man kommt. Steht es in der Galerie jenseits der ersten Charge, merkt
// data-min-shown vor, bis dorthin einzublenden (gallery.js). Nach dem Auslegen der Galerie
// (astro:after-swap, vor dem Erfassen der neuen Seite) steht die Kachel wieder an der Stelle im
// Fenster, an der sie beim Klick stand; Astros eigene Scroll-Wiederherstellung trifft sie bei
// langen Galerien nicht zuverlässig.
(function () {
  const NAME = 'art-media';
  const FIGURE = '.art-figure img';
  const isWork = (url) => /^\/portfolio\/[^/]+\/?$/.test(url.pathname);
  const samePath = (a, b) => a.replace(/\/+$/, '') === b.replace(/\/+$/, '');
  let fromThumb = false;
  let pending = null; // Kachel, die nach dem Auslegen ins Fenster gerückt wird
  const viewTop = new Map(); // Werkseite -> Abstand ihrer Kachel zum Fensterrand beim Klick

  function clear(root) {
    root.querySelectorAll('[data-vt-media]').forEach((el) => {
      el.style.viewTransitionName = '';
      el.removeAttribute('data-vt-media');
    });
  }
  function mark(el) {
    if (!el) return;
    el.style.viewTransitionName = NAME;
    el.setAttribute('data-vt-media', '');
  }
  // Vorschaubild = <img> in einem Link auf eine Werkseite (nicht das große Bild selbst).
  function thumbFor(root, path) {
    for (const a of root.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href') || '';
      if (!samePath(new URL(href, location.origin).pathname, path)) continue;
      const img = a.querySelector('img');
      if (img && !img.closest('.art-figure')) return img;
    }
    return null;
  }

  document.addEventListener('astro:before-preparation', (e) => {
    clear(document);
    fromThumb = false;
    const link = e.sourceElement && e.sourceElement.closest ? e.sourceElement.closest('a[href]') : null;
    const img = link && isWork(e.to) ? link.querySelector('img') : null;
    if (img && !img.closest('.art-figure')) {
      mark(img);
      fromThumb = true;
      viewTop.set(e.to.pathname.replace(/\/+$/, ''), img.getBoundingClientRect().top);
    } else if (isWork(e.from)) {
      mark(document.querySelector(FIGURE));
    }
  });

  document.addEventListener('astro:before-swap', (e) => {
    const doc = e.newDocument;
    if (fromThumb && isWork(e.to)) {
      mark(doc.querySelector(FIGURE));
      return;
    }
    if (!isWork(e.from) || isWork(e.to)) return;
    const img = thumbFor(doc, e.from.pathname);
    if (!img) return;
    const item = img.closest('.gallery__item');
    const g = item && item.closest('.gallery[data-gallery]');
    if (g) {
      const items = [...g.querySelectorAll('.gallery__grid .gallery__item')];
      g.dataset.minShown = String(items.indexOf(item) + 1);
    }
    mark(img);
    pending = { img, path: e.from.pathname.replace(/\/+$/, '') };
  });

  // Läuft nach gallery.js (Import-Reihenfolge im BaseLayout), die Galerie ist dann ausgelegt.
  document.addEventListener('astro:after-swap', () => {
    if (!pending) return;
    const { img, path } = pending;
    pending = null;
    if (!img.isConnected) return;
    const r = img.getBoundingClientRect();
    const top = viewTop.has(path) ? viewTop.get(path) : (innerHeight - r.height) / 2;
    window.scrollTo({ top: window.scrollY + r.top - top, behavior: 'instant' });
  });
})();
