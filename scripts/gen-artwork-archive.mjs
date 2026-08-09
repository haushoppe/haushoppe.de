// Werke-Archiv (Olafs digitaler Nachlass): je Werk das ORIGINAL in voller Auflösung,
// visuell verlustfrei als AVIF q80 gespeichert — oder das Original byte-genau, falls
// AVIF größer wäre. Ziel: archive/werke/ (NICHT deployt; die Website liefert weiterhin
// die optimierten webp aus public/artworks/). Zusätzlich manifest.json als Index
// (Datei -> Werk-IDs, Titel DE/EN, Datum, Maße, Größen).
//
// Reproduzierbar: liest die WordPress-Originale (../wordpress/wp-content/uploads) und
// erzeugt das Archiv deterministisch neu. Einmal-Lauf, aber jederzeit wiederholbar.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// AVIF-Buffer aus einer Quelldatei. sharp/libvips liest manche Formate nicht (z. B. BMP) —
// dann macOS `sips` als Fallback: erst nach PNG wandeln, dann AVIF. Gibt null bei Fehlschlag.
async function toAvif(srcAbs, quality, effort) {
  try {
    return await sharp(srcAbs).rotate().avif({ quality, effort }).toBuffer();
  } catch {
    try {
      const tmp = path.join(os.tmpdir(), `arch-${process.pid}-${Math.round(process.hrtime()[1])}.png`);
      execFileSync('sips', ['-s', 'format', 'png', srcAbs, '--out', tmp], { stdio: 'ignore' });
      const buf = await sharp(tmp).rotate().avif({ quality, effort }).toBuffer();
      fs.rmSync(tmp, { force: true });
      return buf;
    } catch {
      return null;
    }
  }
}

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UP = path.resolve(SITE, '../wordpress/wp-content/uploads');
const OUT = path.join(SITE, 'src/artwork-originals');
const MB = 1048576;
const AVIF_Q = 80;
const AVIF_EFFORT = 6;

const arts = JSON.parse(fs.readFileSync(path.join(SITE, 'src/data/artworks.json'), 'utf8'));

// thumbFile -> gesammelte Werk-Metadaten (DE+EN teilen sich dieselbe Quelle)
const bySource = new Map();
for (const a of arts) {
  if (!a.thumbFile) continue;
  if (!bySource.has(a.thumbFile)) bySource.set(a.thumbFile, { ids: [], title_de: null, title_en: null, date: a.date });
  const e = bySource.get(a.thumbFile);
  e.ids.push(a.id);
  if (a.lang === 'de') e.title_de = a.title;
  if (a.lang === 'en') e.title_en = a.title;
}

const ex = (p) => fs.existsSync(path.join(UP, p));
const sz = (p) => fs.statSync(path.join(UP, p)).size;
// größte verfügbare Variante = echtes Original
const bestOriginal = (f) => {
  const dir = path.dirname(f), ext = path.extname(f), base = path.basename(f, ext);
  const c = new Set([f]);
  if (base.endsWith('-scaled')) c.add(path.join(dir, base.slice(0, -7) + ext));
  const m = base.match(/^(.*)-\d+x\d+$/); if (m) c.add(path.join(dir, m[1] + ext));
  let bf = f, bs = sz(f);
  for (const x of c) if (x !== f && ex(x)) { const s = sz(x); if (s > bs) { bf = x; bs = s; } }
  return { rel: bf, size: bs };
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const manifest = [];
let origTotal = 0, archTotal = 0, avifCount = 0, keepCount = 0, i = 0;

for (const [thumbFile, meta] of bySource) {
  const src = bestOriginal(thumbFile);
  const srcAbs = path.join(UP, src.rel);
  origTotal += src.size;
  const ext = path.extname(src.rel).toLowerCase();

  let outRel, outBytes, format, width, height;
  // GIF bleibt Original (Astro optimiert GIF direkt). Andere Raster -> AVIF versuchen (BMP via
  // sips-Fallback, da sharp/Astro kein BMP lesen). Bei Fehlschlag bleibt das Original.
  const canAvif = /\.(jpe?g|png|bmp|tiff?|webp)$/i.test(ext);
  let avifBuf = null;
  if (canAvif) avifBuf = await toAvif(srcAbs, AVIF_Q, AVIF_EFFORT);

  if (avifBuf && avifBuf.length < src.size) {
    outRel = src.rel.replace(/\.[^.]+$/, '.avif');
    const dst = path.join(OUT, outRel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, avifBuf);
    outBytes = avifBuf.length; format = 'avif'; avifCount++;
    const m = await sharp(avifBuf).metadata(); width = m.width; height = m.height;
  } else {
    // Original byte-genau behalten (AVIF hätte vergrößert oder ist nicht anwendbar)
    outRel = src.rel;
    const dst = path.join(OUT, outRel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(srcAbs, dst);
    outBytes = src.size; format = ext.replace('.', '') + ' (Original)'; keepCount++;
    try { const m = await sharp(srcAbs).rotate().metadata(); width = m.width; height = m.height; } catch { width = height = null; }
  }
  archTotal += outBytes;

  manifest.push({
    datei: outRel,
    quelle: src.rel,
    werk_ids: meta.ids,
    titel_de: meta.title_de,
    titel_en: meta.title_en,
    datum: meta.date,
    format,
    breite: width,
    hoehe: height,
    bytes_original: src.size,
    bytes_archiv: outBytes,
  });

  if (++i % 25 === 0) console.log(`… ${i}/${bySource.size}  (${(archTotal / MB).toFixed(0)} MB)`);
}

manifest.sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const readme = `# Werke-Archiv — digitaler Nachlass Olaf Hoppe

Master-Archiv aller ${bySource.size} Werke in **voller Auflösung**, visuell verlustfrei.

- Format je Datei: **AVIF q${AVIF_Q}** (effort ${AVIF_EFFORT}) — oder das **Original byte-genau**,
  falls AVIF größer gewesen wäre.
- Quelle: die WordPress-Originale (größte je Werk verfügbare Variante).
- **Nicht Teil des Website-Deploys** — die Seite liefert die optimierten webp aus
  \`public/artworks/\`. Dieses Archiv dient ausschließlich der Langzeit-Sicherung.
- \`manifest.json\`: Index — Datei → Werk-IDs, Titel (DE/EN), Datum, Maße, Größen.
- Reproduzierbar via \`npm run archive\` (\`scripts/gen-artwork-archive.mjs\`).
`;
fs.writeFileSync(path.join(OUT, 'README.md'), readme);

console.log('\n===== ARCHIV FERTIG =====');
console.log(`Werke: ${bySource.size}  |  AVIF: ${avifCount}  |  Original behalten: ${keepCount}`);
console.log(`Originale gesamt: ${(origTotal / MB).toFixed(0)} MB  ->  Archiv: ${(archTotal / MB).toFixed(0)} MB  (−${((1 - archTotal / origTotal) * 100).toFixed(0)} %)`);
console.log(`Geschrieben nach: ${path.relative(SITE, OUT)}/  (+ manifest.json, README.md)`);
