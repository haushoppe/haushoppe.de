import artworksData from '../data/artworks.json';
import metaData from '../data/artwork-meta.json';
import type { ImageMetadata } from 'astro';
import { artworkImage, hasArtworkImage } from './artwork-images';
import { smartQuotes } from './text';

type Lang = 'de' | 'en';
type Cat = { name: string; slug: string; taxonomy: string };
type RawArtwork = {
  id: string; title: string; slug: string; date: string; menuOrder: number;
  lang: string | null; trid: string | null; categories: Cat[]; tags: { name: string; slug: string }[];
};

const arts = artworksData as unknown as RawArtwork[];

const meta = metaData as Record<string, { number?: string } | undefined>;
// Werk-Nummer (Format „YYYY-MM-…", z. B. „1990-02-H") = chronologischer Sortier- UND Anzeige-
// Schlüssel (das frühere Datum war nur Behelf). Fehlt sie (10 Werke), Fallback aufs Datum
// (nur für die Sortierung) und kein Nummer-Badge.
function artworkNumber(trid: string | null): string {
  const n = trid ? meta[trid]?.number : undefined;
  return n && /^\d{4}-/.test(n) ? n.trim() : ''; // „1976-03", „2016-??", „2024-02-O1" …
}
function sortKey(a: RawArtwork): string {
  return artworkNumber(a.trid) || (a.date || '').slice(0, 7); // „YYYY-MM"
}
// Sprache = Domain: Werk-Detail liegt in beiden Sprachen unter /portfolio/<slug>/ am Root.

export interface GalleryItem {
  id: string; title: string; detailUrl: string;
  categorySlugs: string[]; primaryCategory: string;
  image: ImageMetadata; w: number; h: number; number: string;
}
export interface FilterCat { slug: string; name: string; count: number; }

// Kunstwerke einer Sprache, die ein web-Bild haben — nach Werk-Nummer absteigend (neueste zuerst).
export function galleryItems(lang: Lang): GalleryItem[] {
  return arts
    .filter((a) => a.lang === lang && hasArtworkImage(a.id))
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)) || b.menuOrder - a.menuOrder)
    .map((a) => {
      const pcats = a.categories.filter((c) => c.taxonomy === 'portfolio_category');
      const image = artworkImage(a.id)!;
      return {
        id: a.id,
        title: smartQuotes(a.title, lang),
        detailUrl: `/portfolio/${a.slug}/`,
        categorySlugs: pcats.map((c) => c.slug),
        primaryCategory: pcats[0]?.slug ?? '',
        image, w: image.width, h: image.height,
        number: artworkNumber(a.trid),
      };
    });
}

// Filter-Kategorien (Slug, Anzeigename, Anzahl) für eine Sprache.
export function galleryCategories(lang: Lang): FilterCat[] {
  const map = new Map<string, { name: string; count: number }>();
  for (const a of arts) {
    if (a.lang !== lang || !hasArtworkImage(a.id)) continue;
    for (const c of a.categories.filter((x) => x.taxonomy === 'portfolio_category')) {
      const e = map.get(c.slug) ?? { name: c.name, count: 0 };
      e.count++;
      map.set(c.slug, e);
    }
  }
  return [...map.entries()]
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, lang === 'en' ? 'en' : 'de')); // alphabetisch wie live
}
