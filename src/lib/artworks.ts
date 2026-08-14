import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { smartQuotes } from './text';
import { isWoodcut } from './pricing';
import { catSlug, catName, type CategoryKey } from './categories';

type Lang = 'de' | 'en';
export type Art = CollectionEntry<'artworks'>;

// Werk-Nummer (Format „JJJJ-NN-X", z. B. „1990-02-H") = Sortier- UND Anzeige-Schlüssel. Fehlt sie
// ausnahmsweise, Fallback aufs WP-Datum (nur Sortierung) und kein Nummer-Badge.
function artworkNumber(a: Art): string {
  const n = a.data.number;
  return n && /^\d{4}-/.test(n) ? n.trim() : '';
}
function sortKey(a: Art): string {
  return artworkNumber(a) || (a.data.date || '').slice(0, 7);
}
// Werk online kaufbar = Holzschnitt (PayPal) ODER Ordinal (Kauf über Gamma). Holzschnitt-Erkennung
// sprachneutral über die DE-Technik + Werk-Nummer.
function buyableOf(a: Art): boolean {
  return isWoodcut({ technique: a.data.de.technique, number: a.data.number }) || a.data.ordinal != null;
}

export interface GalleryItem {
  id: string;
  title: string;
  detailUrl: string;
  categorySlugs: string[];
  primaryCategory: string;
  image: ImageMetadata;
  w: number;
  h: number;
  number: string;
  buyable: boolean;
}
export interface FilterCat {
  slug: string;
  name: string;
  count: number;
}

// Werke einer Sprache mit Bild — nach Werk-Nummer absteigend (neueste zuerst). Gleichstände (5 Werke
// mit identischer Nummer) über `order` = die frühere artworks.json-Array-Reihenfolge, damit die
// Galerie-Reihenfolge stabil bleibt.
export async function galleryItems(lang: Lang): Promise<GalleryItem[]> {
  const arts = await getCollection('artworks');
  return arts
    .filter((a) => !a.data.hidden && a.data.image)
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)) || a.data.order - b.data.order)
    .map((a) => {
      const side = a.data[lang];
      const image = a.data.image!;
      const slug = catSlug(a.data.category, lang);
      return {
        id: a.id,
        title: smartQuotes(side.title, lang),
        detailUrl: `/portfolio/${side.slug}/`,
        categorySlugs: [slug],
        primaryCategory: slug,
        image,
        w: image.width,
        h: image.height,
        number: artworkNumber(a),
        buyable: buyableOf(a),
      };
    });
}

// Filter-Kategorien (Slug, Anzeigename, Anzahl) für eine Sprache — alphabetisch wie live.
export async function galleryCategories(lang: Lang): Promise<FilterCat[]> {
  const arts = await getCollection('artworks');
  const map = new Map<CategoryKey, number>();
  for (const a of arts) {
    if (a.data.hidden || !a.data.image) continue;
    map.set(a.data.category, (map.get(a.data.category) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ slug: catSlug(key, lang), name: catName(key, lang), count }))
    .sort((a, b) => a.name.localeCompare(b.name, lang === 'en' ? 'en' : 'de'));
}
