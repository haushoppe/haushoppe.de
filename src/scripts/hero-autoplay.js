// Wir verlassen uns NICHT auf das Browser-Autoplay: JEDES <video autoplay> wird per JS angestoßen,
// aber erst wenn es sichtbar ist (IntersectionObserver) — off-screen play() lassen manche Browser
// (u. a. Chrome bei below-the-fold-Videos) im Standbild hängen. Zusätzlich ein Fallback bei der
// ersten Nutzer-Interaktion. Reduce-Motion: nichts erzwingen (dann greift das jeweilige Standbild).
// astro:page-load = Erststart + View-Transitions.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tryPlay(v) {
    if (reduce || !v.paused) return;
    var p = v.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }
  function arm() {
    var vids = document.querySelectorAll('video[autoplay]:not([data-autoplay-armed])');
    for (var i = 0; i < vids.length; i++) {
      (function (v) {
        v.setAttribute('data-autoplay-armed', '1');
        v.muted = true; // Autoplay ist nur stumm erlaubt
        if ('IntersectionObserver' in window) {
          // Beim Beobachten feuert der Callback sofort mit dem aktuellen Sichtbarkeitszustand:
          // im Viewport -> sofort abspielen, sonst -> abspielen sobald es reinscrollt.
          new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) tryPlay(v); });
          }, { threshold: 0.2 }).observe(v);
        } else {
          tryPlay(v);
        }
      })(vids[i]);
    }
  }
  function playAll() {
    var vids = document.querySelectorAll('video[data-autoplay-armed]');
    for (var i = 0; i < vids.length; i++) tryPlay(vids[i]);
  }
  document.addEventListener('astro:page-load', arm);
  if (document.readyState !== 'loading') arm();
  // Fallback: bei der ERSTEN Nutzer-Interaktion alle Hero-Videos anstoßen (falls der Browser
  // das programmatische Abspielen ohne Geste verweigert hat).
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, playAll, { once: true, passive: true });
  });
})();
