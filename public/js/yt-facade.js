// Klick auf eine YouTube-Facade -> lädt erst dann das (youtube-nocookie-)iframe.
// Kein Fremdkontakt zu YouTube beim Seitenaufruf (nur das Poster, s. Facade-Markup).
document.addEventListener('click', function (e) {
  var btn = e.target.closest && e.target.closest('.yt-facade__btn');
  if (!btn) return;
  var facade = btn.closest('.yt-facade');
  var src = facade && facade.getAttribute('data-src');
  if (!src) return;
  var iframe = document.createElement('iframe');
  iframe.setAttribute('src', src);
  iframe.setAttribute('title', facade.getAttribute('data-title') || 'YouTube-Video');
  iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('loading', 'lazy');
  iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0';
  facade.innerHTML = '';
  facade.appendChild(iframe);
});

// maxresdefault.jpg fehlt für manche Videos -> YouTube liefert ein graues 120×90-Bild (HTTP 200,
// kein 404, daher greift onerror nicht). Erkennen und auf hqdefault.jpg (immer vorhanden) wechseln,
// damit im Hero kein grauer Kasten steht.
(function () {
  function fixPoster(img) {
    if (img.naturalWidth && img.naturalWidth <= 120 && img.src.indexOf('/maxresdefault.jpg') !== -1) {
      img.src = img.src.replace('/maxresdefault.jpg', '/hqdefault.jpg');
    }
  }
  function run() {
    var posters = document.querySelectorAll('.yt-facade__poster');
    for (var i = 0; i < posters.length; i++) {
      var img = posters[i];
      if (img.complete) fixPoster(img);
      else img.addEventListener('load', function () { fixPoster(this); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
