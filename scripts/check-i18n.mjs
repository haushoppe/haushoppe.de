// i18n-Vollständigkeits-Gate: stellt sicher, dass JEDER Inhalt in BEIDEN Sprachen
// existiert und anzeigbar ist. Läuft vor jedem Build (npm run build) — bei einer Lücke
// bricht der Build mit exakter Liste ab. So kann nie still eine Übersetzung fehlen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dir = path.dirname(fileURLToPath(import.meta.url));
const R = (p) => JSON.parse(fs.readFileSync(path.join(__dir, '..', p), 'utf8'));

const problems = [];
const add = (m) => problems.push(m);

// ── A) Kunstwerke: jedes Werk (trid) braucht DE- UND EN-Eintrag, beide mit Bild ──
const arts = R('src/data/artworks.json').filter((a) => a.type === 'portfolio');
const media = R('src/data/artworks-media.json');
const byTrid = {};
for (const a of arts) {
  // Werke ohne trid können nicht sprachverknüpft werden → eigener Schlüssel, wird gemeldet
  const key = a.trid || `NO_TRID:${a.id}`;
  (byTrid[key] ||= {})[a.lang] = a;
}
for (const [key, g] of Object.entries(byTrid)) {
  if (key.startsWith('NO_TRID:')) {
    add(`Werk „${(g.de || g.en).title}" (${(g.de || g.en).slug}): kein trid → keine Sprach-Verknüpfung`);
    continue;
  }
  for (const lang of ['de', 'en']) {
    const e = g[lang];
    const other = g.de || g.en;
    if (!e) add(`Werk „${other.title}" (${other.slug}, trid ${key}): fehlt ${lang.toUpperCase()}-Übersetzung`);
    else if (!media[e.id]) add(`Werk „${e.title}" (${e.slug}, ${lang.toUpperCase()}): kein Bild (media[${e.id}] fehlt → unsichtbar in der Galerie)`);
  }
}

// ── B) MDX-Prosa-Seiten: jede Seite muss als <name>-de.mdx UND <name>-en.mdx existieren ──
const mdxDir = path.join(__dir, '..', 'src/content/pages');
const mdxFiles = new Set(fs.readdirSync(mdxDir).filter((f) => f.endsWith('.mdx')));
for (const base of ['home', 'kontakt', 'acquire']) {
  for (const lang of ['de', 'en']) {
    if (!mdxFiles.has(`${base}-${lang}.mdx`)) add(`MDX-Seite ${base}-${lang}.mdx fehlt → Seite in einer Sprache nicht vorhanden`);
  }
}

// ── C) JSON-Inhaltsseiten (strukturierte Listen): DE+EN, gleich viele Abschnitte ──
function pair(name, obj, key) {
  if (!obj || !obj.de || !obj.en) return add(`${name}: fehlt de oder en`);
  const dn = (obj.de[key] || []).length, en = (obj.en[key] || []).length;
  if (dn !== en) add(`${name}: „${key}" unterschiedlich lang (DE ${dn} vs EN ${en}) → Inhalt fehlt in einer Sprache`);
}
pair('vita.json', R('src/data/vita.json'), 'sections');

// ── Ergebnis ──
const nWorks = Object.keys(byTrid).length;
if (problems.length) {
  console.error(`\n✗ i18n-Check: ${problems.length} Lücke(n) gefunden:\n`);
  problems.forEach((p) => console.error('  • ' + p));
  console.error('\nBuild abgebrochen. Bitte fehlende Übersetzung/Bild ergänzen.\n');
  process.exit(1);
}
console.log(`✓ i18n-Check bestanden: ${nWorks} Werke vollständig DE+EN (mit Bild), MDX-Seiten (home/kontakt/acquire) DE+EN, vita parallel.`);
