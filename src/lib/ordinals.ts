// Ordinal-Werke (Johannes x Olaf 2024): Live-Inschrift (iframe über ordinals.com) + Kauf-Link
// (Gamma). Beides steht jetzt als `ordinal`-Frontmatter am Werk (vom Scaffolder aus dem alten
// WP-Content extrahiert) — kein Regex zur Laufzeit mehr.
import type { CollectionEntry } from 'astro:content';

export interface Ordinal {
  iframe: string;
  buy: string | null;
}

export function ordinalData(art: CollectionEntry<'artworks'>): Ordinal | null {
  const o = art.data.ordinal;
  return o ? { iframe: o.inscription, buy: o.buy ?? null } : null;
}
