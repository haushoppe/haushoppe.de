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

// ── A) Kunstwerke: jedes Werk (trid) braucht DE- UND EN-Eintrag (beide mit Bild) UND eine
//        Beschriftung (artwork-meta.json) — außer Ordinals (eigener Zweig, keine Beschriftung). ──
const ORDINAL = /Bitcoin blockchain|ordinalsbot|Buy it on Gamma/i;
const arts = R('src/data/artworks.json').filter((a) => a.type === 'portfolio');
const media = R('src/data/artworks-media.json');
const meta = R('src/data/artwork-meta.json');
const byTrid = {};
for (const a of arts) {
  // Unerwartete Sprache (z. B. WPML-Zuordnung verloren → null) melden statt später abzustürzen.
  if (a.lang !== 'de' && a.lang !== 'en') {
    add(`Werk „${a.title}" (${a.slug}, id ${a.id}): unbekannte Sprache „${a.lang}" → nicht zuordenbar`);
    continue;
  }
  const key = a.trid || `NO_TRID:${a.id}`;
  (byTrid[key] ||= {})[a.lang] = a;
}
for (const [key, g] of Object.entries(byTrid)) {
  const other = g.de || g.en;
  if (key.startsWith('NO_TRID:')) {
    add(`Werk „${other.title}" (${other.slug}): kein trid → keine Sprach-Verknüpfung`);
    continue;
  }
  for (const lang of ['de', 'en']) {
    const e = g[lang];
    if (!e) add(`Werk „${other.title}" (${other.slug}, trid ${key}): fehlt ${lang.toUpperCase()}-Übersetzung`);
    else if (!media[e.id]) add(`Werk „${e.title}" (${e.slug}, ${lang.toUpperCase()}): kein Bild (media[${e.id}] fehlt → unsichtbar in der Galerie)`);
  }
  // Beschriftung: vollständige Werke (DE+EN+Bild), die keine Ordinals sind, brauchen eine Meta.
  const complete = g.de && g.en && media[g.de.id] && media[g.en.id];
  if (complete && !ORDINAL.test(g.de.content || '') && !meta[key]) {
    add(`Werk „${other.title}" (${other.slug}, trid ${key}): keine Beschriftung in artwork-meta.json → Detailseite bleibt blank (npm run meta)`);
  }
}

// ── B) MDX-Prosa-Seiten: jede Seite muss als <name>-de.mdx UND <name>-en.mdx existieren ──
const mdxDir = path.join(__dir, '..', 'src/content/pages');
const mdxFiles = new Set(fs.readdirSync(mdxDir).filter((f) => f.endsWith('.mdx')));
for (const base of ['home', 'kontakt', 'acquire', 'vita']) {
  for (const lang of ['de', 'en']) {
    if (!mdxFiles.has(`${base}-${lang}.mdx`)) add(`MDX-Seite ${base}-${lang}.mdx fehlt → Seite in einer Sprache nicht vorhanden`);
  }
}

// ── Ergebnis ──
const nWorks = Object.keys(byTrid).length;
if (problems.length) {
  console.error(`\n✗ i18n-Check: ${problems.length} Lücke(n) gefunden:\n`);
  problems.forEach((p) => console.error('  • ' + p));
  console.error('\nBuild abgebrochen. Bitte fehlende Übersetzung/Bild ergänzen.\n');
  process.exit(1);
}
console.log(`✓ i18n-Check bestanden: ${nWorks} Werke vollständig DE+EN (mit Bild + Beschriftung), MDX-Seiten (home/kontakt/acquire/vita) DE+EN.`);
