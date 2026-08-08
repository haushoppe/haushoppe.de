// Bild-Pipeline: aus jedem Kunstwerk-Original (wordpress/uploads) ein web-optimiertes webp
// erzeugen (max. 1400px lange Kante, q80) -> public/artworks/<id>.webp. Rohdaten bleiben
// unverändert im Original (verlustfreies Archiv). Schreibt Maße nach data/artworks-media.json
// (für das Masonry-Seitenverhältnis der Galerie). Dedupliziert identische Quelldateien.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Pfade relativ zum Skript (site/scripts/) auflösen — nicht an einen festen Klon-Ort binden.
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = path.resolve(SITE, '..');
const UP = path.join(BASE, 'wordpress/wp-content/uploads');
const OUT = path.join(SITE, 'public/artworks');
fs.mkdirSync(OUT, { recursive: true });

const artworks = JSON.parse(fs.readFileSync(path.join(SITE, 'src/data/artworks.json'), 'utf8'));
const media = {};
const bySource = new Map(); // Quelldatei -> {file,w,h} (Dedup)
let done = 0, skipped = 0, failed = 0;

for (const a of artworks) {
  if (!a.thumbFile) { skipped++; continue; }
  const src = path.join(UP, a.thumbFile);
  if (!fs.existsSync(src)) { skipped++; continue; }
  const out = `${a.id}.webp`;
  const dst = path.join(OUT, out);
  try {
    if (bySource.has(a.thumbFile)) {
      // identische Quelle -> bereits erzeugtes Bild wiederverwenden (kopieren)
      const prev = bySource.get(a.thumbFile);
      fs.copyFileSync(path.join(OUT, prev.file), dst);
      media[a.id] = { src: `/artworks/${out}`, w: prev.w, h: prev.h };
    } else {
      const info = await sharp(src)
        .rotate()
        .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(dst);
      media[a.id] = { src: `/artworks/${out}`, w: info.width, h: info.height };
      bySource.set(a.thumbFile, { file: out, w: info.width, h: info.height });
    }
    done++;
    if (done % 100 === 0) console.log(`  ${done} erzeugt…`);
  } catch (e) {
    failed++;
    console.warn(`FAIL #${a.id} (${a.thumbFile}): ${e.message}`);
  }
}

fs.writeFileSync(path.join(SITE, 'src/data/artworks-media.json'), JSON.stringify(media, null, 2));
const bytes = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`\nFertig: ${done} webp erzeugt, ${skipped} übersprungen, ${failed} fehlgeschlagen.`);
console.log(`public/artworks: ${(bytes / 1024 / 1024).toFixed(1)} MB, ${fs.readdirSync(OUT).length} Dateien.`);
