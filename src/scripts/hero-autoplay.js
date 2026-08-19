// Wir verlassen uns NICHT auf das Browser-Autoplay: JEDES <video autoplay> wird per JS angestoßen.
// Wichtig: die Seite nutzt View-Transitions (ClientRouter). Beim DOM-Swap wird das <video> zwar mit
// src/<source> eingefügt, der Browser lädt die Quelle aber NICHT von selbst (currentSrc leer,
// readyState 0) — play() hätte nichts abzuspielen. Darum stößt load() das Laden an. Abgespielt wird
// bei Sichtbarkeit (IntersectionObserver) + direkt für sichtbare Videos + bei erster Interaktion.
// Reduce-Motion: nichts erzwingen. astro:page-load + astro:after-swap decken Load, Filter-Wechsel
// und alle View-Transitions ab.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tryPlay(v) {
    if (reduce || !v.paused) return;
    var p = v.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }
  function inView(v) {
    var r = v.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    var w = window.innerWidth || document.documentElement.clientWidth;
    return r.bottom > 0 && r.top < h && r.right > 0 && r.left < w;
  }
  function arm() {
    var vids = document.querySelectorAll('video[autoplay]:not([data-autoplay-armed])');
    for (var i = 0; i < vids.length; i++) {
      (function (v) {
        v.setAttribute('data-autoplay-armed', '1');
        v.muted = true; // Autoplay ist nur stumm erlaubt
        // Nach einer View-Transition ist currentSrc leer -> Quelle nachladen, sonst spielt nichts.
        if (!v.currentSrc && (v.getAttribute('src') || v.querySelector('source'))) {
          try { v.load(); } catch (e) {}
        }
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) tryPlay(v); });
          }, { threshold: 0.2 }).observe(v);
        } else {
          tryPlay(v);
        }
        // Sobald die (nachgeladene) Quelle bereit ist und das Video im Bild steht: anstoßen.
        v.addEventListener('canplay', function () { if (inView(v)) tryPlay(v); });
      })(vids[i]);
    }
  }
  function playVisible() {
    var vids = document.querySelectorAll('video[data-autoplay-armed]');
    for (var i = 0; i < vids.length; i++) if (inView(vids[i])) tryPlay(vids[i]);
  }
  function refresh() { arm(); playVisible(); }
  function playAll() {
    var vids = document.querySelectorAll('video[data-autoplay-armed]');
    for (var i = 0; i < vids.length; i++) tryPlay(vids[i]);
  }
  document.addEventListener('astro:page-load', refresh);
  document.addEventListener('astro:after-swap', arm);
  if (document.readyState !== 'loading') refresh();
  // Fallback: erste Nutzer-Interaktion stößt alle Hero-Videos an.
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, playAll, { once: true, passive: true });
  });
})();
