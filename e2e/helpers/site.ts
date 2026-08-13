import { type Page, type TestInfo } from '@playwright/test';

// Sprach- und projektbewusste Fixpunkte. Ein Spec läuft unter den Projekten `de` und `en`
// (Desktop) bzw. `de-mobile` (iPhone); der Helper liefert die je Sprache erwarteten Werte,
// damit dieselbe Assertion für beide Domains stimmt.
export type Lang = 'de' | 'en';

export function langOf(info: TestInfo): Lang {
  return info.project.name.startsWith('en') ? 'en' : 'de';
}
export function isMobile(info: TestInfo): boolean {
  return info.project.name.includes('mobile');
}

interface Cat {
  slug: string;
  label: string;
  count: number;
}
interface SiteData {
  origin: string; // eigene Produktions-Domain (für erwartete absolute URLs)
  other: string; // andere Sprach-Domain (Sprach-Flagge)
  htmlLang: string;
  nav: string[]; // sichtbare Menü-Labels in Reihenfolge
  routes: Record<string, string>;
  galleryBase: string; // '/werke' | '/artwork'
  cats: Cat[];
  camper: { path: string; title: string; cta: string };
  work: { untitled: string; woodcut: string; ordinal: string };
}

export type SiteDataLike = SiteData;

export const SITE: Record<Lang, SiteData> = {
  de: {
    origin: 'https://haushoppe.de',
    other: 'https://haushoppe.art',
    htmlLang: 'de',
    nav: ['Start', 'Videos', 'Werke', 'Kunst Erwerben', 'Vita', 'Camping', 'Kontakt'],
    routes: {
      home: '/',
      videos: '/videos/',
      gallery: '/werke/',
      acquire: '/kunst-erwerben/',
      vita: '/vita/',
      camping: '/kunst-und-camping/',
      contact: '/kontakt/',
    },
    galleryBase: '/werke',
    cats: [
      { slug: 'holzschnitte', label: 'Holzschnitte', count: 30 },
      { slug: 'gemaelde', label: 'Gemälde', count: 293 },
      { slug: 'zeichnungen', label: 'Zeichnungen', count: 5 },
      { slug: 'digitale-kunst', label: 'Digitale Kunst', count: 5 },
    ],
    camper: { path: '/kunst-und-camping/', title: 'Camper willkommen', cta: 'Anrufen' },
    work: { untitled: '1167', woodcut: '90-02-h-winter-im-dorf', ordinal: 'broke-johannes-x-olaf-2024' },
  },
  en: {
    origin: 'https://haushoppe.art',
    other: 'https://haushoppe.de',
    htmlLang: 'en',
    nav: ['Home', 'Videos', 'Artwork', 'Buy Fine Art', 'Vita', 'Camping', 'Contact'],
    routes: {
      home: '/',
      videos: '/videos/',
      gallery: '/artwork/',
      acquire: '/buy-fine-art/',
      vita: '/vita/',
      camping: '/art-and-camping/',
      contact: '/contact/',
    },
    galleryBase: '/artwork',
    cats: [
      { slug: 'woodcuts', label: 'Woodcuts', count: 30 },
      { slug: 'paintings', label: 'Paintings', count: 293 },
      { slug: 'drawings', label: 'Drawings', count: 5 },
      { slug: 'digital-art', label: 'Digital Art', count: 5 },
    ],
    camper: { path: '/art-and-camping/', title: 'Campers Welcome', cta: 'Call' },
    work: { untitled: '1167', woodcut: '1990-02-h-winter-in-the-village', ordinal: 'broke-johannes-x-olaf-2024' },
  },
};

export function site(info: TestInfo): SiteData {
  return SITE[langOf(info)];
}

// Die jeweils ANDERE Sprache (für Sprachwechsel-Ziele mit abweichenden Slugs).
export function otherSite(info: TestInfo): SiteData {
  return SITE[langOf(info) === 'de' ? 'en' : 'de'];
}

// Konsolen-Fehler + same-origin-4xx/5xx sammeln (externe Ressourcen wie YouTube-Thumbnails ignorieren).
export function watchProblems(page: Page, baseURL?: string) {
  const consoleErrors: string[] = [];
  const badResponses: string[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const src = m.location()?.url || '';
    // Fremd-Frames (z. B. ordinals.com- oder YouTube-iframe) ignorieren; nur eigene JS-Fehler zählen.
    if (baseURL && src && !src.startsWith(baseURL)) return;
    consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    const s = r.status();
    if (s >= 400 && baseURL && r.url().startsWith(baseURL)) badResponses.push(`${s} ${r.url()}`);
  });
  return { consoleErrors, badResponses };
}
