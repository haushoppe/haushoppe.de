// OG-Karten-Generator (LOKAL, macOS): erzeugt die Hero-Header-Social-Cards in public/og/.
// Kein Build-Dependency. Einmalig ausführen, wenn sich Poster/Sprüche ändern:
//   npm i -D satori @resvg/resvg-js  &&  node scripts/gen-og-cards.mjs
// Nutzt System-Serif (Georgia) + Sans (Arial). Ergebnis-JPEGs sind eingecheckt.
import fs from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const SITE = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const OUT = `${SITE}/public/og`;
fs.mkdirSync(OUT, { recursive: true });

const font = (p) => fs.readFileSync(p);
const fonts = [
  { name: 'Georgia', data: font('/System/Library/Fonts/Supplemental/Georgia.ttf'), weight: 400, style: 'normal' },
  { name: 'Georgia', data: font('/System/Library/Fonts/Supplemental/Georgia Bold.ttf'), weight: 700, style: 'normal' },
  { name: 'Arial', data: font('/System/Library/Fonts/Supplemental/Arial.ttf'), weight: 400, style: 'normal' },
  { name: 'Arial', data: font('/System/Library/Fonts/Supplemental/Arial Bold.ttf'), weight: 700, style: 'normal' },
];

async function coverDataUri(posterPath) {
  const buf = await sharp(posterPath).resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

const el = (type, style, children) => ({ type, props: { style, ...(children !== undefined ? { children } : {}) } });

function card(bgUri, wordmark, sub, quote) {
  const quoteSize = quote.length > 46 ? 46 : 58;
  return el('div', { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '1200px', height: '630px', position: 'relative', padding: '62px 64px', fontFamily: 'Arial' }, [
    // Hintergrundbild
    { type: 'img', props: { src: bgUri, width: 1200, height: 630, style: { position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px', objectFit: 'cover' } } },
    // Scrim links + unten (Hero-Look, damit Text steht)
    el('div', { position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px', backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.32) 52%, rgba(0,0,0,0) 78%)' }),
    el('div', { position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px', backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 42%)' }),
    // Wortmarke oben links
    el('div', { display: 'flex', flexDirection: 'column', position: 'relative' }, [
      el('div', { fontFamily: 'Arial', fontWeight: 700, fontSize: '30px', letterSpacing: '6px', color: '#ffffff' }, wordmark),
      el('div', { fontFamily: 'Arial', fontWeight: 400, fontSize: '15px', letterSpacing: '4px', color: 'rgba(255,255,255,0.82)', marginTop: '8px' }, sub),
    ]),
    // Serifen-Spruch unten links
    el('div', { display: 'flex', position: 'relative', maxWidth: '880px', fontFamily: 'Georgia', fontWeight: 400, fontSize: `${quoteSize}px`, lineHeight: 1.16, color: '#ffffff' }, quote),
  ]);
}

const SUB = { de: 'Galerie für Bildende Kunst', en: 'Gallery for Fine Art' };
const WORD = 'HAUS HOPPE';
const cards = [
  { name: 'home', poster: `${SITE}/src/assets/hero/olaf-hero-poster.jpg`, de: 'Kunst: Ausdruck der kreativen Kraft.', en: 'Art: an expression of creative power.' },
  { name: 'werke', poster: `${SITE}/src/assets/atlantis-4/lebenswerk-poster.jpg`, de: 'Gemälde und mehrfarbige Holzschnitte.', en: 'Paintings and colour woodcuts.' },
  { name: 'gemaelde', poster: `${SITE}/src/assets/gemaelde/gemaelde-poster.jpg`, de: 'Soweit ich denken kann, habe ich nichts anderes gemacht als gemalt.', en: 'As far back as I can remember, I have done nothing but paint.' },
  { name: 'holzschnitte', poster: `${SITE}/src/assets/holzschnitte/schnitzen-poster.jpg`, de: 'Von Hand geschnitten, von Hand gedruckt.', en: 'Cut by hand, printed by hand.' },
  { name: 'digitale-kunst', poster: `${SITE}/public/media/glitch-hong-kong-2025.jpg`, de: 'Glitch-Art, für immer auf der Blockchain.', en: 'Glitch art, forever on the blockchain.' },
  { name: 'videos', poster: `${SITE}/src/assets/atlantis-4/lebenswerk-poster.jpg`, de: 'Filme rund um Olaf Hoppe.', en: 'Films around Olaf Hoppe.' },
  { name: 'kontakt', poster: `${SITE}/src/assets/impressionen/garten-sommer.webp`, de: 'Nah an der Ostseeküste, zwischen Wismar und Rostock.', en: 'Near the Baltic coast, between Wismar and Rostock.' },
];

for (const c of cards) {
  const bg = await coverDataUri(c.poster);
  for (const lang of ['de', 'en']) {
    const svg = await satori(card(bg, WORD, SUB[lang], c[lang]), { width: 1200, height: 630, fonts });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
    const jpg = await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    const file = `${OUT}/${c.name}-${lang}.jpg`;
    fs.writeFileSync(file, jpg);
    console.log('✓', file.replace(SITE, ''), (jpg.length / 1024).toFixed(0) + 'KB');
  }
}
console.log('fertig:', cards.length * 2, 'Karten');
