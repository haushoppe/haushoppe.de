// Wir verlassen uns NICHT auf das Browser-Autoplay: JEDES <video autoplay> wird per JS angestoßen.
// Beim Sichtbarwerden (IntersectionObserver) + Sofort-Versuch + erneut, sobald Daten da sind. Deckt
// Home-Hero, Finale-Hero, Holzschnitte-Hero und den Glitch-Banner ab. Reduce-Motion: nichts erzwingen
// (dann greift das jeweilige Standbild aus dem CSS). astro:page-load = Erststart + View-Transitions.
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
          new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) tryPlay(v); });
          }, { threshold: 0.1 }).observe(v);
        }
        tryPlay(v);
        // Nachzügler: play() erneut versuchen, sobald das Video abspielbereit ist.
        v.addEventListener('loadeddata', function () { tryPlay(v); });
        v.addEventListener('canplay', function () { tryPlay(v); });
      })(vids[i]);
    }
  }
  document.addEventListener('astro:page-load', arm);
  if (document.readyState !== 'loading') arm();
})();
