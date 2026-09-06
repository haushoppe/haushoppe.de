// In-Content-Slideshow: überblendet automatisch, mit Bildunterschrift + Punkten, Pfeilen,
// Touch-Swipe und Tastatur. Lazy: nur das aktive und das nächste Bild werden geladen
// (data-src -> src). Respektiert prefers-reduced-motion (kein Autoplay, Steuerung bleibt).
// Global geladen (wie gallery.js/hero-autoplay.js): initialisiert jede [data-slideshow] und
// stoppt die Autoplay-Timer beim View-Transition-Swap, damit sie nicht auf abgehängtem DOM
// weiterlaufen. Läuft einmal; astro:page-load re-initialisiert nach jedem Seitenwechsel.
const roots = new Set();

function stopAll() {
  roots.forEach((r) => r.__ssStop && r.__ssStop());
  roots.clear();
}

function initSlideshows() {
  document.querySelectorAll('[data-slideshow]').forEach((root) => {
    if (root.__ss) return;
    root.__ss = true;
    const slides = [...root.querySelectorAll('[data-slide]')];
    const dots = [...root.querySelectorAll('[data-dot]')];
    const imgs = slides.map((s) => s.querySelector('img'));
    const captions = slides.map((s) => s.querySelector('[data-testid="slideshow-caption"]')?.textContent ?? '');
    const status = root.querySelector('[data-ss-status]');
    if (slides.length < 2) return;
    const interval = Number(root.dataset.interval) || 4500;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let idx = 0;
    let timer;
    // Bild n bei Bedarf laden (aus data-src), einmalig.
    function load(n) {
      const im = imgs[(n + slides.length) % slides.length];
      if (im && im.dataset.src) {
        if (im.dataset.srcset) im.srcset = im.dataset.srcset;
        im.src = im.dataset.src;
        delete im.dataset.src;
      }
    }
    function show(n) {
      idx = (n + slides.length) % slides.length;
      load(idx);
      load(idx + 1); // nächstes Bild vorladen, damit die Überblendung sitzt
      slides.forEach((s, i) => {
        s.style.opacity = i === idx ? '1' : '0';
        s.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      });
      dots.forEach((d, i) => d.setAttribute('aria-current', i === idx ? 'true' : 'false'));
      if (status) status.textContent = (dots[idx].getAttribute('aria-label') || '') + (captions[idx] ? ': ' + captions[idx] : '');
    }
    function stop() { if (timer) { clearInterval(timer); timer = undefined; } }
    function start() { if (reduced) return; stop(); timer = window.setInterval(() => show(idx + 1), interval); }
    dots.forEach((d, i) => d.addEventListener('click', () => { show(i); start(); }));
    root.querySelector('[data-ss-prev]')?.addEventListener('click', () => { show(idx - 1); start(); });
    root.querySelector('[data-ss-next]')?.addEventListener('click', () => { show(idx + 1); start(); });
    // Tastatur: Pfeil links/rechts blättert, wenn der Fokus in der Slideshow liegt.
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { show(idx - 1); start(); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { show(idx + 1); start(); e.preventDefault(); }
    });
    // Touch-Swipe auf Mobil: horizontal wischen blättert vor/zurück (vertikal scrollt weiter).
    const frame = root.querySelector('.slideshow__frame') ?? root;
    let tx = 0;
    let ty = 0;
    frame.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; tx = t.clientX; ty = t.clientY; }, { passive: true });
    frame.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - tx;
      const dy = t.clientY - ty;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { show(idx + (dx < 0 ? 1 : -1)); start(); }
    }, { passive: true });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.__ssStop = stop;
    roots.add(root);
    show(0);
    start();
  });
}

document.addEventListener('astro:page-load', initSlideshows);
document.addEventListener('astro:before-swap', stopAll);
initSlideshows();
