import artworksData from '../data/artworks.json';
import media from '../data/artworks-media.json';

type Lang = 'de' | 'en';
type Cat = { name: string; slug: string; taxonomy: string };
type RawArtwork = {
  id: string; title: string; slug: string; date: string; menuOrder: number;
  lang: string | null; trid: string | null; categories: Cat[]; tags: { name: string; slug: string }[];
};
type Media = Record<string, { src: string; w: number; h: number }>;

const arts = artworksData as unknown as RawArtwork[];
const mediaMap = media as unknown as Media;

const MONTHS: Record<Lang, string[]> = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
function dateText(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;
}
const prefix = (lang: Lang) => (lang === 'de' ? '' : '/en');

export interface GalleryItem {
  id: string; title: string; detailUrl: string;
  categorySlugs: string[]; primaryCategory: string;
  img: string; w: number; h: number; dateText: string;
}
export interface FilterCat { slug: string; name: string; count: number; }

// Kunstwerke einer Sprache, die ein web-Bild haben — nach Datum absteigend (VP-Default).
export function galleryItems(lang: Lang): GalleryItem[] {
  return arts
    .filter((a) => a.lang === lang && mediaMap[a.id])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.menuOrder - a.menuOrder)
    .map((a) => {
      const pcats = a.categories.filter((c) => c.taxonomy === 'portfolio_category');
      const m = mediaMap[a.id];
      return {
        id: a.id,
        title: a.title,
        detailUrl: `${prefix(lang)}/portfolio/${a.slug}/`,
        categorySlugs: pcats.map((c) => c.slug),
        primaryCategory: pcats[0]?.slug ?? '',
        img: m.src, w: m.w, h: m.h,
        dateText: dateText(a.date, lang),
      };
    });
}

// Filter-Kategorien (Slug, Anzeigename, Anzahl) für eine Sprache.
export function galleryCategories(lang: Lang): FilterCat[] {
  const map = new Map<string, { name: string; count: number }>();
  for (const a of arts) {
    if (a.lang !== lang || !mediaMap[a.id]) continue;
    for (const c of a.categories.filter((x) => x.taxonomy === 'portfolio_category')) {
      const e = map.get(c.slug) ?? { name: c.name, count: 0 };
      e.count++;
      map.set(c.slug, e);
    }
  }
  return [...map.entries()]
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => b.count - a.count);
}
