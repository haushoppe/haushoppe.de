// GETEILT mit dem Schwester-Repo (haushoppe-its.de und haushoppe.de): möglichst synchron halten,
// aber nicht zwingend. Bewusste Abweichungen einer Seite sind erlaubt.
//
// Namen für Seitenübergänge (View Transitions). Ein Element der Liste und sein Gegenstück auf
// der Detailseite tragen denselben view-transition-name, der Browser lässt es dorthin wandern.
// Schlüssel ist der Pfad der Detailseite (Bereich + Slug): Slugs allein sind über Bereiche hinweg
// nicht eindeutig, Pfade schon. scripts/check-view-transitions.mjs prüft nach dem Build, dass
// keine zwei Pfade denselben Schlüssel ergeben.

export type VtPart = 'media' | 'title';

/** Pfad ohne Query, Hash und Schluss-Slash; Sonderzeichen zu „-“. */
export function vtKey(href: string): string {
  const path = new URL(href, 'https://vt.invalid').pathname;
  return path.replace(/\/+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+/, '');
}

/** view-transition-name, z. B. media-blog-2026-10-webmcp. */
export function vtName(part: VtPart, href: string): string {
  return `${part}-${vtKey(href)}`;
}

/** Inline-Style mit Name und Klasse (vt-media bzw. vt-title, Regeln in view-transitions.css). */
export function vtStyle(part: VtPart, href: string): string {
  return `view-transition-name:${vtName(part, href)};view-transition-class:vt-${part}`;
}

/**
 * Wandern nur, wenn beide Enden im Bild sind. Ein Element außerhalb des sichtbaren Bereichs
 * verliert vor dem Übergang seinen Namen; sein sichtbares Gegenstück hat dann kein Paar mehr und
 * blendet sanft ein bzw. aus, statt quer über den Bildschirm von außerhalb hereinzufliegen.
 * Alte Seite: astro:after-preparation (vor dem Schnappschuss). Neue Seite: astro:after-swap
 * (nach dem Scrollen an die Zielposition). Gilt für die Klassen vt-*, ob per vtStyle im HTML oder
 * per el.style zur Laufzeit gesetzt (der Browser schreibt das style-Attribut dann mit Leerzeichen,
 * darum die Prüfung über el.style statt über den Attributtext).
 * Vor jedem Messen bekommen die zuletzt entfernten Elemente ihren Namen zurück: Ein Element, das
 * beim Ankommen unterhalb des Fensters stand, ist nach dem Scrollen sichtbar und soll beim nächsten
 * Wechsel wieder wandern. Das gilt auch, wenn ein neuer Klick einen laufenden Übergang abbricht.
 * Zurück kommt der Name nur, solange das Element noch auf 'none' steht; hat ein Skript den Namen
 * inzwischen selbst neu gesetzt oder entfernt, bleibt es dabei.
 * Einmal pro Seitenaufruf registrieren (das document bleibt über Seitenwechsel bestehen), nach
 * allen Skripten, die in astro:after-swap noch scrollen.
 */
export function morphOnlyVisible(): void {
  let stripped: [HTMLElement, string][] = [];
  const strip = () => {
    for (const [el, name] of stripped) if (el.style.viewTransitionName === 'none') el.style.viewTransitionName = name;
    stripped = [];
    for (const el of document.querySelectorAll<HTMLElement>('[style*="view-transition-class"]')) {
      if (!el.style.viewTransitionClass.startsWith('vt-')) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) {
        stripped.push([el, el.style.viewTransitionName]);
        el.style.viewTransitionName = 'none';
      }
    }
  };
  document.addEventListener('astro:after-preparation', strip);
  document.addEventListener('astro:after-swap', strip);
}
