// Strukturierte Daten (JSON-LD). WICHTIG: keine E-Mail-Adresse aufnehmen — sonst erkennt
// Cloudflares „Email Address Obfuscation" sie im HTML und injiziert wieder ihr Script.
import { contact, socials } from '../data/site';

const GALLERY_NAME = 'HAUS HOPPE – Galerie für Bildende Kunst';

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
    founder: { '@type': 'Person', name: contact.name },
    sameAs: socials.map((s) => s.href),
    openingHours: 'Mo-Sa 13:00-17:00',
  };
}

// Ein einzelnes Kunstwerk (Werk-Detailseite).
export function artworkJsonLd(title: string, image: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: title,
    image,
    url,
    creator: { '@type': 'Person', name: contact.name },
  };
}
