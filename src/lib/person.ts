// Kanonische Person-Entität (Olaf Hoppe) für strukturierte Daten (JSON-LD). Bei einer
// Künstler-Website ist der Urheber die zentrale Entität: Die Vita-Seite gibt die volle
// Definition aus, Werke (creator) und Galerie (founder) verweisen per @id darauf.
// Person.image + primaryImageOfPage sind Googles dokumentierte Hebel fürs Suchergebnis-
// Thumbnail. Bewusst OHNE E-Mail (Cloudflares Email-Obfuscation würde sonst greifen).
import { socials } from '../data/site';

const PORTRAIT_PATH = '/olaf-hoppe.jpg'; // stabile, ungehashte URL unter public/
const PORTRAIT_WIDTH = 1032;
const PORTRAIT_HEIGHT = 1400;

const personId = (origin: string) => origin + '/#olaf-hoppe';
const jobTitle = (lang: 'de' | 'en') => (lang === 'en' ? 'Visual artist' : 'Bildender Künstler');

// Volle Person-Entität — auf der Vita-Seite ausgegeben.
export function personJsonLd(origin: string, lang: 'de' | 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId(origin),
    name: 'Olaf Hoppe',
    url: origin + '/',
    image: {
      '@type': 'ImageObject',
      url: origin + PORTRAIT_PATH,
      width: PORTRAIT_WIDTH,
      height: PORTRAIT_HEIGHT,
    },
    jobTitle: jobTitle(lang),
    sameAs: socials.map((s) => s.href),
  };
}

// Schlanker @id-Verweis (creator / founder auf Unterseiten): benennt die Person UND verlinkt
// per @id auf die volle Definition (Vita).
export const personRef = (origin: string) => ({ '@type': 'Person', '@id': personId(origin), name: 'Olaf Hoppe' });
