// Werk-Kategorien als EINE Quelle (Slug + Anzeigename je Sprache). Ersetzt die aus dem
// WP-Dump gezogenen, sprachspezifischen Taxonomie-Objekte. Der kanonische Schlüssel
// (sprachneutral) steht im Frontmatter jedes Werks; Slug/Name pro Sprache kommen von hier.
export type CategoryKey = 'paintings' | 'woodcuts' | 'drawings' | 'digital-art';

interface CatLocale {
  slug: string;
  name: string;
}
export const CATEGORIES: Record<CategoryKey, { de: CatLocale; en: CatLocale }> = {
  paintings: { de: { slug: 'gemaelde', name: 'Gemälde' }, en: { slug: 'paintings', name: 'Paintings' } },
  woodcuts: { de: { slug: 'holzschnitte', name: 'Holzschnitte' }, en: { slug: 'woodcuts', name: 'Woodcuts' } },
  drawings: { de: { slug: 'zeichnungen', name: 'Zeichnungen' }, en: { slug: 'drawings', name: 'Drawings' } },
  'digital-art': { de: { slug: 'digitale-kunst', name: 'Digitale Kunst' }, en: { slug: 'digital-art', name: 'Digital Art' } },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

// DE-Slug (aus dem alten WP-Dump) -> kanonischer Schlüssel (für den Scaffolder + Alt-Pfade).
export function keyByDeSlug(slug: string): CategoryKey | undefined {
  return CATEGORY_KEYS.find((k) => CATEGORIES[k].de.slug === slug);
}
export function keyByEnSlug(slug: string): CategoryKey | undefined {
  return CATEGORY_KEYS.find((k) => CATEGORIES[k].en.slug === slug);
}
export function keyBySlug(slug: string, lang: 'de' | 'en'): CategoryKey | undefined {
  return lang === 'de' ? keyByDeSlug(slug) : keyByEnSlug(slug);
}
export const catSlug = (key: CategoryKey, lang: 'de' | 'en'): string => CATEGORIES[key][lang].slug;
export const catName = (key: CategoryKey, lang: 'de' | 'en'): string => CATEGORIES[key][lang].name;
