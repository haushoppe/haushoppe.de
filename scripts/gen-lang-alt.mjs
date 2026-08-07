import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dir = path.dirname(fileURLToPath(import.meta.url));
const R = (p) => JSON.parse(fs.readFileSync(path.join(__dir, '..', p), 'utf8'));
const arr = (x) => Array.isArray(x) ? x : Object.values(x);

const artworks = arr(R('../migration/data/artworks.json'));
const map = {};

// Portfolio: nach trid gruppieren
const byTrid = {};
for (const a of artworks) {
  if (a.type !== 'portfolio') continue;
  (byTrid[a.trid] ||= {})[a.lang] = a.slug;
}
for (const t of Object.values(byTrid)) {
  if (t.de && t.en) {
    const de = `/portfolio/${t.de}/`, en = `/en/portfolio/${t.en}/`;
    map[de] = en; map[en] = de;
  }
}

// Seiten: geroutete Slug-Paare (Home als Sonderfall)
const pagePairs = [
  ['/', '/en/'],
  ['/werke/', '/en/artwork/'],
  ['/videos/', '/en/videos/'],
  ['/vita/', '/en/vita/'],
  ['/kontakt/', '/en/contact/'],
  ['/kunst-erwerben/', '/en/buy-fine-art/'],
  ['/nft-kaufen/', '/en/nft-buy/'],
  ['/hintergrundwissen-zu-blockchain-token/', '/en/background-knowledge-to-blockchain-token/'],
];
for (const [de, en] of pagePairs) { map[de] = en; map[en] = de; }

fs.writeFileSync(path.join(__dir, '..', 'src/data/lang-alt.json'), JSON.stringify(map, null, 0));
console.log('lang-alt.json:', Object.keys(map).length, 'Einträge');
