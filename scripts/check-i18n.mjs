// i18n-Vollständigkeits-Gate: stellt sicher, dass JEDER Inhalt in BEIDEN Sprachen existiert und
// anzeigbar ist. Läuft vor jedem Build (npm run build) — bei einer Lücke bricht der Build mit
// exakter Liste ab. So kann nie still eine Übersetzung fehlen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
const __dir = path.dirname(fileURLToPath(import.meta.url));

const problems = [];
const add = (m) => problems.push(m);

// ── A) Werke: EINE Datei pro Werk, beide Sprachen im Frontmatter. Das Zod-Schema erzwingt schon
//        im Build de/en/category; hier prüfen wir zusätzlich Nummer (Sortier-Pflichtfeld) und dass
//        ein Bild ODER ein Ordinal da ist (sonst wäre das Werk unsichtbar). ──
const artDir = path.join(__dir, '..', 'src/content/artworks');
const artFiles = fs.readdirSync(artDir).filter((f) => /\.(md|mdx)$/.test(f));
let nWorks = 0;
for (const f of artFiles) {
  const src = fs.readFileSync(path.join(artDir, f), 'utf8');
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) {
    add(`Werk ${f}: kein Frontmatter`);
    continue;
  }
  let d;
  try {
    d = yaml.load(m[1]);
  } catch (e) {
    add(`Werk ${f}: Frontmatter nicht lesbar (${e.message})`);
    continue;
  }
  nWorks++;
  const label = d?.de?.title || d?.en?.title || f;
  if (!d?.de?.slug || !d?.en?.slug) add(`Werk „${label}" (${f}): de.slug/en.slug unvollständig → keine Sprach-Verknüpfung`);
  if (!d?.image && !d?.ordinal) add(`Werk „${label}" (${f}): weder Bild noch Ordinal → unsichtbar in der Galerie`);
  if (!d?.number) add(`Werk „${label}" (${f}): keine Nummer (Pflicht-Sortierschlüssel „YYYY-…")`);
}

// ── B) MDX-Prosa-Seiten: jede Seite muss als <name>-de.mdx UND <name>-en.mdx existieren ──
const mdxDir = path.join(__dir, '..', 'src/content/pages');
const mdxFiles = new Set(fs.readdirSync(mdxDir).filter((f) => f.endsWith('.mdx')));
const pageBases = new Set();
for (const f of mdxFiles) {
  const m = f.match(/^(.*)-(de|en)\.mdx$/);
  if (m) pageBases.add(m[1]);
}
for (const base of pageBases) {
  for (const lang of ['de', 'en']) {
    if (!mdxFiles.has(`${base}-${lang}.mdx`)) add(`MDX-Seite ${base}-${lang}.mdx fehlt → Seite in einer Sprache nicht vorhanden`);
  }
}

// ── Ergebnis ──
if (problems.length) {
  console.error(`\n✗ i18n-Check: ${problems.length} Lücke(n) gefunden:\n`);
  problems.forEach((p) => console.error('  • ' + p));
  console.error('\nBuild abgebrochen. Bitte fehlende Übersetzung/Bild ergänzen.\n');
  process.exit(1);
}
console.log(`✓ i18n-Check bestanden: ${nWorks} Werke (Datei pro Werk, DE+EN im Frontmatter), ${pageBases.size} MDX-Seiten DE+EN.`);
