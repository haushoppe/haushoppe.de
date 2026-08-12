// Nach dem Build: unreferenzierte Bild-Assets aus _astro entfernen. Ursache: artwork-images.ts
// lädt die Master per eager import.meta.glob -> Astro emittiert jedes Original in den Build, obwohl
// nur die <Picture>-Derivate gerendert werden. Diese Originale (plus etwaige Waisen-Derivate) bleiben
// unreferenziert liegen: Deploy-Bloat + die vollauflösenden Nachlass-Originale wären CDN-abrufbar.
//
// Vorgehen: ALLE Textausgaben (HTML/CSS/JS/JSON/XML/map) einlesen, daraus die referenzierten
// _astro-Bildnamen extrahieren und URL-DEKODIEREN (Dateinamen mit Umlauten/„ stehen im HTML
// url-enkodiert wie %E2%80%9E, auf der Platte aber roh — ohne Dekodierung würden sie fälschlich
// als unreferenziert gelöscht). Danach jede _astro-Bilddatei entfernen, die NICHT referenziert ist.
import { readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2];
if (!dist) {
  console.error('usage: node scripts/prune-unreferenced-images.mjs <distDir>');
  process.exit(1);
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const text = walk(dist)
  .filter((f) => /\.(html|css|js|mjs|json|xml|txt|map)$/i.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

// Referenzierte _astro-Bildnamen einsammeln (roh + dekodiert), robust für src/srcset/url().
const referenced = new Set();
const re = /_astro\/([^"'\s,)>]+?\.(?:avif|webp|jpe?g|png|gif|bmp))/gi;
let m;
while ((m = re.exec(text))) {
  const raw = m[1];
  referenced.add(raw);
  try {
    referenced.add(decodeURIComponent(raw));
  } catch {
    /* ungültige %-Sequenz: der rohe Name ist schon drin */
  }
}

const astroDir = join(dist, '_astro');
const imgs = readdirSync(astroDir).filter((f) => /\.(avif|webp|jpe?g|png|gif|bmp)$/i.test(f));

let removed = 0;
let freed = 0;
for (const f of imgs) {
  if (!referenced.has(f)) {
    freed += statSync(join(astroDir, f)).size;
    unlinkSync(join(astroDir, f));
    removed++;
  }
}
console.log(`prune ${dist}: ${removed}/${imgs.length} unreferenzierte Bild-Assets entfernt (${(freed / 2 ** 20).toFixed(1)} MB frei)`);
