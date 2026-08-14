import { getCollection } from 'astro:content';
import { CATEGORIES, CATEGORY_KEYS } from './categories';

// Pfad-Helfer, einheitlich für Header + BaseLayout (früher dupliziert).

// Pfad mit Trailing-Slash normalisieren (außer Root).
export const normPath = (p: string): string => (p !== '/' && !p.endsWith('/') ? p + '/' : p);

// DE↔EN-Pendant-Pfade zur Laufzeit aus den Collections ableiten (ersetzt das generierte
// lang-alt.json). Einmal pro Build gebaut und gecacht. Deckt geroutete Seiten, Kategorien,
// Werke (aus der artworks-Collection) und Standalone-Seiten (aus der pages-Collection) ab.
let altMapPromise: Promise<Record<string, string>> | null = null;
async function buildAltMap(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const pair = (de: string, en: string) => {
    map[de] = en;
    map[en] = de;
  };
  // Geroutete Seiten (kein Standalone-MDX): Home + gleiche/andere Slugs je Sprache.
  pair('/', '/');
  pair('/werke/', '/artwork/');
  pair('/videos/', '/videos/');
  pair('/vita/', '/vita/');
  pair('/kontakt/', '/contact/');
  pair('/kunst-erwerben/', '/buy-fine-art/');
  // Galerie-Kategorien
  for (const k of CATEGORY_KEYS) pair(`/werke/${CATEGORIES[k].de.slug}/`, `/artwork/${CATEGORIES[k].en.slug}/`);
  // Werke: beide Slugs stehen im selben Eintrag.
  for (const a of await getCollection('artworks')) pair(`/portfolio/${a.data.de.slug}/`, `/portfolio/${a.data.en.slug}/`);
  // Standalone-Seiten: Slug-Paare aus dem Frontmatter (Basisname <name>-<lang>, path).
  const byBase: Record<string, { de?: string; en?: string }> = {};
  for (const p of await getCollection('pages')) {
    if (!p.data.standalone || !p.data.path) continue;
    const m = p.id.match(/^(.*)-(de|en)$/);
    if (m) (byBase[m[1]] ??= {})[m[2] as 'de' | 'en'] = p.data.path;
  }
  for (const t of Object.values(byBase)) if (t.de && t.en) pair(`/${t.de}/`, `/${t.en}/`);
  return map;
}

// Pendant-Pfad (root-relativ) — oder undefined, wenn kein Paar existiert.
export async function altOf(p: string): Promise<string | undefined> {
  altMapPromise ??= buildAltMap();
  return (await altMapPromise)[normPath(p)];
}
