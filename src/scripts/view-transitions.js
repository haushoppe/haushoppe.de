// Werk-Bild „morpht" beim Seitenwechsel: Vorschaubild (Galerie, Highlights, Startseite, Zyklus)
// ↔ großes Bild der Werkseite. Der ClientRouter ruft document.startViewTransition() selbst auf;
// hier wird nur festgelegt, WELCHE zwei Bilder denselben view-transition-name tragen.
//
// Bewusst dynamisch statt fest im HTML: Die Galerie hat über 300 Werke. Ein fester Name je Kachel
// ließe den Browser bei jedem Wechsel jede benannte Kachel einzeln erfassen, und ein Werk, das
// doppelt auf der Seite steht (Highlight + Raster), hätte einen doppelten Namen, was den ganzen
// Übergang abbricht. Gemessen auf der Galerie (Klick bis transition.ready): 1 benanntes Bild ~33 ms,
// alle 325 eingeblendeten Kacheln benannt ~255 ms. So trägt immer nur das eine Bildpaar einen Namen,
// das gerade wechselt.
//
// Den Namen liefert vtName('media', pfad) aus src/lib/view-transitions.ts, z. B.
// media-portfolio-riomaggiore; die Regeln in src/styles/view-transitions.css hängen an der Klasse
// vt-media.
//
// Alte Seite (astro:before-preparation): das angeklickte Werk-Bild, sonst (Zurück-Taste, Navi)
// das große Bild der Werkseite. Neue Seite (astro:before-swap, noch unsichtbar): das große Bild,
// wenn ein Vorschaubild zu genau dieser Werkseite angeklickt wurde, sonst das Vorschaubild des
// Werks, von dessen Seite man kommt. Steht es in der Galerie jenseits der ersten Charge, merkt
// data-min-shown vor, bis dorthin einzublenden (gallery.js). Nach dem Auslegen der Galerie
// (astro:after-swap, vor dem Erfassen der neuen Seite) steht die Kachel wieder an der Stelle im
// Fenster, an der sie beim Klick stand; Astros eigene Scroll-Wiederherstellung trifft sie bei
// langen Galerien nicht zuverlässig.
import { vtName } from '../lib/view-transitions';

(function () {
  const FIGURE = '.art-figure img';
  const isWork = (url) => /^\/portfolio\/[^/]+\/?$/.test(url.pathname);
  const samePath = (a, b) => a.replace(/\/+$/, '') === b.replace(/\/+$/, '');
  let fromThumb = false;
  let pending = null; // Kachel, die nach dem Auslegen ins Fenster gerückt wird
  // Werkseite -> { n: das wievielte Vorschaubild mit diesem Pfad angeklickt wurde, top: sein Abstand
  // zum Fensterrand }. n trifft beim Rückweg dieselbe Kachel, falls ein Werk mehrfach verlinkt ist.
  const clicked = new Map();
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clear(root) {
    root.querySelectorAll('[data-vt-media]').forEach((el) => {
      el.style.viewTransitionName = '';
      el.style.viewTransitionClass = '';
      el.removeAttribute('data-vt-media');
    });
  }
  // Bei reduzierter Bewegung keine Namen; die Scroll-Korrektur beim Rückweg läuft trotzdem.
  function mark(el, path) {
    if (!el || reduced()) return;
    el.style.viewTransitionName = vtName('media', path);
    el.style.viewTransitionClass = 'vt-media';
    el.setAttribute('data-vt-media', '');
  }
  // Vorschaubilder = <img> in Links auf diese Werkseite (nicht das große Bild selbst), in
  // Dokumentreihenfolge.
  function thumbsFor(root, path) {
    const out = [];
    for (const a of root.querySelectorAll('a[href]')) {
      if (!samePath(new URL(a.getAttribute('href') || '', location.origin).pathname, path)) continue;
      const img = a.querySelector('img');
      if (img && !img.closest('.art-figure')) out.push(img);
    }
    return out;
  }

  document.addEventListener('astro:before-preparation', (e) => {
    clear(document);
    fromThumb = false;
    const link = e.sourceElement && e.sourceElement.closest ? e.sourceElement.closest('a[href]') : null;
    const img = link && isWork(e.to) ? link.querySelector('img') : null;
    if (img && !img.closest('.art-figure')) {
      mark(img, e.to.pathname);
      fromThumb = true;
      const path = e.to.pathname.replace(/\/+$/, '');
      clicked.set(path, { n: Math.max(0, thumbsFor(document, path).indexOf(img)), top: img.getBoundingClientRect().top });
    } else if (isWork(e.from)) {
      mark(document.querySelector(FIGURE), e.from.pathname);
    }
  });

  document.addEventListener('astro:before-swap', (e) => {
    const doc = e.newDocument;
    if (fromThumb && isWork(e.to)) {
      mark(doc.querySelector(FIGURE), e.to.pathname);
      return;
    }
    if (!isWork(e.from) || isWork(e.to)) return;
    const path = e.from.pathname.replace(/\/+$/, '');
    const thumbs = thumbsFor(doc, path);
    const img = thumbs[(clicked.get(path) || { n: 0 }).n] || thumbs[0];
    if (!img) return;
    const item = img.closest('.gallery__item');
    const g = item && item.closest('.gallery[data-gallery]');
    if (g) {
      const items = [...g.querySelectorAll('.gallery__grid .gallery__item')];
      g.dataset.minShown = String(items.indexOf(item) + 1);
    }
    mark(img, e.from.pathname);
    pending = { img, path };
  });

  // Läuft nach gallery.js (Import-Reihenfolge im BaseLayout), die Galerie ist dann ausgelegt.
  document.addEventListener('astro:after-swap', () => {
    if (!pending) return;
    const { img, path } = pending;
    pending = null;
    if (!img.isConnected) return;
    const r = img.getBoundingClientRect();
    const c = clicked.get(path);
    clicked.delete(path);
    const top = c ? c.top : (innerHeight - r.height) / 2;
    window.scrollTo({ top: window.scrollY + r.top - top, behavior: 'instant' });
  });
})();
