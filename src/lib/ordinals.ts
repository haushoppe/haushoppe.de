// Ordinal-Werke (Johannes x Olaf 2024): Live-Inschrift (iframe über ordinals.com) + Kauf-Link
// (Gamma), beide als `ordinal`-Frontmatter am Werk.
import type { CollectionEntry } from 'astro:content';

// Eyebrow-Zeile der REVEALED-Collection (Detailseiten + Kategorie-Logo), sprachneutral.
export const REVEALED_EYEBROW = 'Bitcoin Ordinals · Glitch Art · Johannes × Olaf';

export interface Ordinal {
  iframe: string;
  buy: string | null;
}

export function ordinalData(art: CollectionEntry<'artworks'>): Ordinal | null {
  const o = art.data.ordinal;
  return o ? { iframe: o.inscription, buy: o.buy ?? null } : null;
}
