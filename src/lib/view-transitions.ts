/**
 * Namen für Seitenübergänge (View Transitions API, ausgelöst von Astros ClientRouter). Zwei
 * Elemente mit demselben Namen auf alter und neuer Seite wandern ineinander, z. B. Vorschaubild
 * und großes Bild. Der Name leitet sich aus dem Pfad der Zielseite ab und benennt damit das Objekt
 * eindeutig; ein Slug allein reicht nicht immer, erst der Pfad trennt gleichnamige Inhalte
 * verschiedener Bereiche. Die Animationsregeln hängen an der Klasse vt-<part>
 * (src/styles/view-transitions.css).
 */
export type VtPart = 'media' | 'title';

/** Pfad ohne Query, Hash und Schluss-Slash, Sonderzeichen zu „-": /portfolio/foo/ → portfolio-foo */
export function vtKey(href: string): string {
  const path = new URL(href, 'https://x.invalid').pathname;
  return path.replace(/\/+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+/, '');
}

export function vtName(part: VtPart, href: string): string {
  return `${part}-${vtKey(href)}`;
}

/** Inline-Style für Elemente, die den Namen schon im HTML tragen. */
export function vtStyle(part: VtPart, href: string): string {
  return `view-transition-name:${vtName(part, href)};view-transition-class:vt-${part}`;
}
