// Verbotene Zeichen in eigenen Texten, Vorlagen und Code (CLAUDE.md, „Verbotene Zeichen“): der
// Mittelpunkt „·“ als Trennzeichen gilt als typisches Merkmal maschinell geschriebener Texte.
// Geprüft werden src/ (ohne die aus YouTube erzeugte src/data/videos.json), functions/, scripts/
// und e2e/. Bei einem Fund bricht der Build ab. Vorbild: gleichnamiges Skript in haushoppe-its.de.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['src', 'functions', 'scripts', 'e2e'];
const SKIP = [path.join('src', 'data', 'videos.json')];
const EXT = /\.(astro|ts|mjs|js|md|mdx|html|css|json)$/;
const FORBIDDEN = { '·': 'Mittelpunkt' };

const hits = [];
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
