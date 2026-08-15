// Strukturierte Daten (JSON-LD). WICHTIG: keine E-Mail-Adresse aufnehmen — sonst erkennt
// Cloudflares „Email Address Obfuscation" sie im HTML und injiziert wieder ihr Script.
import { contact, socials } from '../data/site';
import { personRef } from './person';
import type { CategoryKey } from './categories';

const GALLERY_NAME = 'HAUS HOPPE – Galerie für Bildende Kunst';

// Kategorie -> schema.org-artform (Kunstform des Werks).
const ARTFORM: Record<CategoryKey, string> = {
  paintings: 'Painting',
  woodcuts: 'Woodcut',
  drawings: 'Drawing',
  'digital-art': 'Digital art',
};

// Die Galerie als LocalBusiness/ArtGallery (Adresse, Öffnungszeiten, Geo, Social-Profile).
export function galleryJsonLd(origin: string, image: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ArtGallery',
    name: GALLERY_NAME,
    url: origin + '/',
    image,
    telephone: '+49 38427 64315',
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.street,
      postalCode: '23974',
      addressLocality: 'Boiensdorf',
      addressRegion: 'Mecklenburg-Vorpommern',
      addressCountry: 'DE',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 54.006545, longitude: 11.51379 },
    founder: personRef(origin),
    sameAs: socials.map((s) => s.href),
    openingHours: 'Mo-Sa 13:00-17:00',
  };
}

// Ein einzelnes Kunstwerk (Werk-Detailseite) — angereichert um die vorhandenen Katalogdaten.
export function artworkJsonLd(opts: {
  origin: string;
  title: string;
  image: string;
  url: string;
  technique?: string;
  year?: string;
  category?: CategoryKey;
}) {
  const j: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: opts.title,
    image: opts.image,
    url: opts.url,
    creator: personRef(opts.origin),
  };
  if (opts.technique) j.artMedium = opts.technique;
  if (opts.year) j.dateCreated = opts.year;
  if (opts.category && ARTFORM[opts.category]) j.artform = ARTFORM[opts.category];
  return j;
}

// BreadcrumbList aus [{ name, url }] (absolute URLs, Reihenfolge = Ebene).
export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  };
}

// ItemList aus [{ name, url }] — spiegelt die sichtbare Werk-Reihenfolge einer Galerie-Liste.
export function itemListJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: it.url })),
  };
}
