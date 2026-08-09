import artworksData from '../data/artworks.json';
import type { ImageMetadata } from 'astro';
import { artworkImage, hasArtworkImage } from './artwork-images';

type Lang = 'de' | 'en';
type Cat = { name: string; slug: string; taxonomy: string };
type RawArtwork = {
  id: string; title: string; slug: string; date: string; menuOrder: number;
  lang: string | null; trid: string | null; categories: Cat[]; tags: { name: string; slug: string }[];
};

const arts = artworksData as unknown as RawArtwork[];

const MONTHS: Record<Lang, string[]> = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
function dateText(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;
}
// Sprache = Domain: Werk-Detail liegt in beiden Sprachen unter /portfolio/<slug>/ am Root.

export interface GalleryItem {
  id: string; title: string; detailUrl: string;
  categorySlugs: string[]; primaryCategory: string;
  image: ImageMetadata; w: number; h: number; dateText: string;
}
export interface FilterCat { slug: string; name: string; count: number; }

// Kunstwerke einer Sprache, die ein web-Bild haben — nach Datum absteigend (VP-Default).
export function galleryItems(lang: Lang): GalleryItem[] {
  return arts
    .filter((a) => a.lang === lang && hasArtworkImage(a.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.menuOrder - a.menuOrder)
    .map((a) => {
      const pcats = a.categories.filter((c) => c.taxonomy === 'portfolio_category');
      const image = artworkImage(a.id)!;
      return {
        id: a.id,
        title: a.title,
        detailUrl: `/portfolio/${a.slug}/`,
        categorySlugs: pcats.map((c) => c.slug),
        primaryCategory: pcats[0]?.slug ?? '',
        image, w: image.width, h: image.height,
        dateText: dateText(a.date, lang),
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
