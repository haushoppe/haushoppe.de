// EINMALIGE Migration: erzeugt aus dem WordPress-Dump (artworks.json), den Beschriftungen
// (artwork-meta.json), dem Bild-Manifest und den Prosa-Dateien (artwork-extra) eine Datei pro
// Werk unter src/content/artworks/ — beide Sprachen im Frontmatter, Prosa im Body zwischen
// <De>/<En>-Blöcken. Nach erfolgreicher Migration wird dieses Skript gelöscht.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dir, '..');
const R = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const artworks = R('src/data/artworks.json');
const meta = R('src/data/artwork-meta.json');
const manifest = R('src/artwork-originals/manifest.json');

// WP-id -> Bilddatei (relativ zu src/artwork-originals/)
const id2file = new Map();
for (const e of manifest) for (const id of e.werk_ids) id2file.set(String(id), e.datei);

// DE-Kategorie-Slug -> kanonischer Schlüssel
const CAT = { gemaelde: 'paintings', holzschnitte: 'woodcuts', zeichnungen: 'drawings', 'digitale-kunst': 'digital-art' };

// Prosa aus artwork-extra: id (Dateiname ohne Endung = Slug) -> { imports[], content }
const extraDir = path.join(root, 'src/content/artwork-extra');
const extras = new Map();
for (const f of fs.existsSync(extraDir) ? fs.readdirSync(extraDir) : []) {
  if (!/\.(md|mdx)$/.test(f)) continue;
  const id = f.replace(/\.(md|mdx)$/, '');
  const src = fs.readFileSync(path.join(extraDir, f), 'utf8');
  const fm = src.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/); // Frontmatter abtrennen
  const body = fm ? src.slice(fm[0].length) : src;
  const imports = [];
  const rest = [];
  for (const ln of body.split(/\r?\n/)) {
    if (/^\s*import\s.+\bfrom\b\s+['"].+['"];?\s*$/.test(ln)) imports.push(ln.trim());
    else rest.push(ln);
  }
  extras.set(id, { imports, content: rest.join('\n').trim() });
}

// Werke nach trid gruppieren (nur type=portfolio mit trid)
const byTrid = new Map();
for (const a of artworks) {
  if (a.type !== 'portfolio' || !a.trid) continue;
  const g = byTrid.get(a.trid) || {};
  g[a.lang] = a;
  byTrid.set(a.trid, g);
}

const J = (v) => JSON.stringify(v ?? '');
const outDir = path.join(root, 'src/content/artworks');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

let written = 0,
  withProse = 0,
  ordinals = 0,
  skipped = 0;

for (const [trid, g] of byTrid) {
  const de = g.de;
  const en = g.en;
  if (!de || !en) {
    skipped++;
    console.log('SKIP (fehlende Sprache) trid', trid, Object.keys(g));
    continue;
  }
  const m = meta[trid] || {};
  const mEn = m.en || {};

  // Kategorie aus dem DE-Record
  const deCatSlug = (de.categories || []).find((c) => c.taxonomy === 'portfolio_category')?.slug;
  const category = CAT[deCatSlug];
  if (!category) {
    skipped++;
    console.log('SKIP (unbekannte Kategorie) trid', trid, deCatSlug);
    continue;
  }

  // Bild
  const datei = id2file.get(String(de.id)) || id2file.get(String(en.id));
  const image = datei ? `../../artwork-originals/${datei}` : null;

  // Ordinal (5 Werke): Inschrift + Kauf-Link aus dem WP-content (wie ordinals.ts)
  const c = de.content || '';
  let ordinal = null;
  if (/(explorer\.ordinalsbot\.com|ordinals\.com)/i.test(c)) {
    const rawFrame = (c.match(/<iframe[^>]*\ssrc="([^"]+)"/i) || [])[1];
    const inscription = rawFrame ? rawFrame.replace(/explorer\.ordinalsbot\.com/i, 'ordinals.com') : null;
    const buy = (c.match(/href="(https?:\/\/gamma\.io\/[^"]+)"/i) || [])[1] || null;
    if (inscription) {
      ordinal = { inscription, buy };
      ordinals++;
    }
  }

  // Prosa (per Sprache über den jeweiligen Slug)
  const deExtra = extras.get(de.slug);
  const enExtra = extras.get(en.slug);
  const hasProse = !!(deExtra || enExtra);

  // Frontmatter
  const L = [];
  L.push('---');
  L.push(`artist: ${J(m.artist || 'Olaf Hoppe')}`);
  L.push(`year: ${J(m.year || '')}`);
  L.push(`number: ${J(m.number || '')}`);
  if (de.date) L.push(`date: ${J(de.date)}`);
  L.push(`category: ${category}`);
  if (image) L.push(`image: ${J(image)}`);
  const side = (rec, mBase, mOv) => [
    `  title: ${J(rec.title)}`,
    `  slug: ${J(rec.slug)}`,
    `  captionTitle: ${J(mOv.title ?? mBase.title ?? '')}`,
    `  technique: ${J(mOv.technique ?? mBase.technique ?? '')}`,
    `  dimensions: ${J(mOv.dimensions ?? mBase.dimensions ?? '')}`,
    `  edition: ${J(mOv.edition ?? mBase.edition ?? '')}`,
  ];
  L.push('de:');
  L.push(...side(de, m, {}));
  L.push('en:');
  L.push(...side(en, m, mEn));
  if (ordinal) {
    L.push('ordinal:');
    L.push(`  inscription: ${J(ordinal.inscription)}`);
    if (ordinal.buy) L.push(`  buy: ${J(ordinal.buy)}`);
  }
  if (hasProse) {
    L.push('prose:');
    L.push(`  de: ${!!deExtra}`);
    L.push(`  en: ${!!enExtra}`);
  }
  L.push('---');

  // Body (nur bei Prosa)
  const bodyParts = [];
  if (hasProse) {
    const imports = new Set();
    if (deExtra) imports.add(`import De from '../../components/mdx/De.astro';`);
    if (enExtra) imports.add(`import En from '../../components/mdx/En.astro';`);
    for (const e of [deExtra, enExtra]) if (e) for (const im of e.imports) imports.add(im);
    bodyParts.push([...imports].join('\n'));
    if (deExtra) bodyParts.push(`<De>\n\n${deExtra.content}\n\n</De>`);
    if (enExtra) bodyParts.push(`<En>\n\n${enExtra.content}\n\n</En>`);
  }

  const ext = hasProse ? 'mdx' : 'md';
  const body = bodyParts.length ? '\n' + bodyParts.join('\n\n') + '\n' : '\n';
  fs.writeFileSync(path.join(outDir, `${de.slug}.${ext}`), L.join('\n') + body);
  written++;
  if (hasProse) withProse++;
}

console.log(`\ngeschrieben: ${written} Werke (${withProse} mit Prosa, ${ordinals} Ordinals), übersprungen: ${skipped}`);
// Prosa-Abdeckung prüfen: jede artwork-extra-Datei sollte einem Werk zugeordnet worden sein
const usedSlugs = new Set();
for (const [, g] of byTrid) { if (g.de) usedSlugs.add(g.de.slug); if (g.en) usedSlugs.add(g.en.slug); }
const orphanExtras = [...extras.keys()].filter((id) => !usedSlugs.has(id));
if (orphanExtras.length) console.log('WARNUNG: nicht zugeordnete Prosa-Dateien:', orphanExtras);
