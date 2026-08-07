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
