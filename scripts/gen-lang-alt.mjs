import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dir = path.dirname(fileURLToPath(import.meta.url));
const R = (p) => JSON.parse(fs.readFileSync(path.join(__dir, '..', p), 'utf8'));
const arr = (x) => Array.isArray(x) ? x : Object.values(x);

// aus der SITE-Quelle (Single Source of Truth), nicht aus dem Migrations-Snapshot
const artworks = arr(R('src/data/artworks.json'));
const map = {};

// Portfolio: nach trid gruppieren
const byTrid = {};
for (const a of artworks) {
  // ohne trid keine Sprach-Verknüpfung — sonst landen alle null-trid-Werke im selben „null“-Topf
  // und würden fälschlich als DE↔EN-Paar verlinkt.
  if (a.type !== 'portfolio' || !a.trid) continue;
  (byTrid[a.trid] ||= {})[a.lang] = a.slug;
}
// Sprache = Domain: beide Sprachen liegen am Root ihrer Domain, KEIN /en/-Präfix.
// Die Map bildet Pfad → Pfad des Pendants ab; der Header stellt die andere Domain davor.
for (const t of Object.values(byTrid)) {
  if (t.de && t.en) {
    const de = `/portfolio/${t.de}/`, en = `/portfolio/${t.en}/`;
    map[de] = en; map[en] = de;
  }
}

// Seiten: geroutete Slug-Paare (Home ↔ Home; videos/vita gleicher Slug in beiden Sprachen)
const pagePairs = [
  ['/', '/'],
  ['/werke/', '/artwork/'],
  // Galerie-Kategorien (echte URLs statt Filter) — Slug-Paare DE↔EN.
  ['/werke/gemaelde/', '/artwork/paintings/'],
  ['/werke/holzschnitte/', '/artwork/woodcuts/'],
  ['/werke/digitale-kunst/', '/artwork/digital-art/'],
  ['/werke/zeichnungen/', '/artwork/drawings/'],
  ['/videos/', '/videos/'],
  ['/vita/', '/vita/'],
  ['/kontakt/', '/contact/'],
  ['/kunst-erwerben/', '/buy-fine-art/'],
];
for (const [de, en] of pagePairs) { map[de] = en; map[en] = de; }

// Standalone-Seiten: DE↔EN-Slug-Paare aus dem MDX-Frontmatter (standalone: true + slug).
const pagesDir = path.join(__dir, '..', 'src/content/pages');
const byBase = {};
for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith('.mdx'))) {
  const m = f.match(/^(.*)-(de|en)\.mdx$/);
  if (!m) continue;
  const src = fs.readFileSync(path.join(pagesDir, f), 'utf8');
  const end = src.indexOf('---', 3);
  const fm = end > 0 ? src.slice(0, end) : '';
  if (!/^\s*standalone:\s*true\b/m.test(fm)) continue;
  const sm = fm.match(/^\s*path:\s*["']?([^"'\n]+?)["']?\s*$/m);
  if (sm) (byBase[m[1]] ||= {})[m[2]] = sm[1].trim();
}
for (const t of Object.values(byBase)) {
  if (t.de && t.en) { map[`/${t.de}/`] = `/${t.en}/`; map[`/${t.en}/`] = `/${t.de}/`; }
}

fs.writeFileSync(path.join(__dir, '..', 'src/data/lang-alt.json'), JSON.stringify(map, null, 0));
console.log('lang-alt.json:', Object.keys(map).length, 'Einträge');
