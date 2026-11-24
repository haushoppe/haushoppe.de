// Verbotene Zeichen (CLAUDE.md, goldene Regel 3). Bei einem Fund bricht der Build ab. Vorbild:
// gleichnamiges Skript in haushoppe-its.de.
// - Ohne Argument (Teil von npm run check): der Mittelpunkt „·“ als Trennzeichen in src/ (ohne die
//   aus YouTube erzeugte src/data/videos.json), functions/, scripts/ und e2e/. Er gilt als typisches
//   Merkmal maschinell geschriebener Texte.
// - Mit gebauten Verzeichnissen als Argument (nach dem Build, z. B. dist-de dist-art): kein
//   Gedankenstrich „–“ oder „—“ in <title>, og:title und twitter:title; Trennzeichen ist „|“.
//   Werktitel in Anführungszeichen sind ausgenommen: Sie sind Olafs Namen für seine Bilder und
//   bleiben wörtlich, auch mit Gedankenstrich.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['src', 'functions', 'scripts', 'e2e'];
const SKIP = [path.join('src', 'data', 'videos.json')];
const EXT = /\.(astro|ts|mjs|js|md|mdx|html|css|json)$/;
const FORBIDDEN = { '·': 'Mittelpunkt' };

const hits = [];
const builds = process.argv.slice(2);
if (builds.length) {
  const DASH = /[–—]/;
  const QUOTED = /[„“”"][^„“”"]*[“”"]/g;
  const TITLES = [/<title>([^<]*)<\/title>/g, /<meta property="og:title" content="([^"]*)"/g, /<meta name="twitter:title" content="([^"]*)"/g];
  const decode = (t) => t.replace(/&quot;|&#34;/g, '"').replace(/&amp;/g, '&');
  const scan = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) scan(full);
      else if (name.endsWith('.html')) {
        const html = fs.readFileSync(full, 'utf8');
        for (const re of TITLES)
          for (const [, t] of html.matchAll(re)) if (DASH.test(decode(t).replace(QUOTED, ''))) hits.push(`${path.relative(ROOT, full)}: Gedankenstrich im Titel „${decode(t)}“`);
      }
    }
  };
  builds.forEach((b) => scan(path.join(ROOT, b)));
  if (hits.length) {
    console.error(`check-typography: ${hits.length} Seitentitel mit Gedankenstrich:\n  ` + hits.join('\n  '));
    process.exit(1);
  }
  console.log(`check-typography: Seitentitel ohne Gedankenstrich (${builds.join(', ')}).`);
  process.exit(0);
}
function walk(dir) {
  for (const name of fs.readdirSync(path.join(ROOT, dir))) {
    const rel = path.join(dir, name);
    if (SKIP.some((s) => rel.startsWith(s))) continue;
    const full = path.join(ROOT, rel);
    if (fs.statSync(full).isDirectory()) walk(rel);
    else if (EXT.test(name) && rel !== path.join('scripts', 'check-typography.mjs')) {
      fs.readFileSync(full, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          for (const [ch, label] of Object.entries(FORBIDDEN)) if (line.includes(ch)) hits.push(`${rel}:${i + 1}: ${label} „${ch}“`);
        });
    }
  }
}
DIRS.forEach(walk);
if (hits.length) {
  console.error(`check-typography: ${hits.length} verbotene Zeichen:\n  ` + hits.join('\n  '));
  process.exit(1);
}
console.log('check-typography: keine verbotenen Zeichen.');
