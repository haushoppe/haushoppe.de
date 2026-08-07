import langAlt from '../data/lang-alt.json';

const ALT = langAlt as Record<string, string>;

/**
 * Bereitet das statische Astra-Header-HTML pro Seite auf:
 *  1. markiert den aktiven Menüpunkt (Portfolio-Detailseiten heben die Galerie hervor),
 *  2. richtet den WPML-Sprachumschalter auf das jeweilige Pendant der Gegensprache.
 * Läuft zur Build-Zeit (SSG) — kein Client-JS, kein Flackern.
 */
export function processChrome(headerHtml: string, rawPath: string, lang: 'de' | 'en') {
  // Pfad normalisieren (Astra-Menülinks haben abschließenden Slash)
  let pathname = rawPath;
  if (pathname !== '/' && !pathname.endsWith('/')) pathname += '/';

  // Portfolio-Detailseiten markieren die Galerie-Übersicht als aktiv
  let activePath = pathname;
  if (/^\/(en\/)?portfolio\//.test(pathname)) {
    activePath = lang === 'en' ? '/en/artwork/' : '/werke/';
  }

  // Pendant für den Sprachumschalter (Fallback: Startseite der Gegensprache)
  const altUrl = ALT[pathname] || (lang === 'en' ? '/' : '/en/');

  let h = headerHtml;
  // bestehende Aktiv-Marker entfernen …
  h = h.replace(
    / current-menu-item| current_page_item| current-menu-ancestor| current-menu-parent| current_page_ancestor| current_page_parent/g,
    '',
  );
  h = h.replace(/ aria-current="page"/g, '');
  // … und am passenden Menüpunkt neu setzen
  const esc = activePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const liRe = new RegExp('(<li\\b[^>]*class=")([^"]*)("[^>]*>\\s*<a\\s+href="' + esc + '")([^>]*>)');
  h = h.replace(liRe, '$1$2 current-menu-item current_page_item$3 aria-current="page"$4');
  // Sprachumschalter aufs Pendant zeigen
  h = h.replace(/(<li\b[^>]*wpml-ls-item\b[^>]*>\s*<a\b[^>]*?href=")[^"]*(")/, '$1' + altUrl + '$2');

  return { header: h, altUrl };
}
