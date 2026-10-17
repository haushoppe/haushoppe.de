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
