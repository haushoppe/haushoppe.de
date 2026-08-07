// QA: prüft die generierte artwork-meta.json auf Parse-Anomalien, damit nichts
// Kaputtes live geht. Meldet je Werk konkrete Verdachtsflags (DE + EN).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dir = path.dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(fs.readFileSync(path.join(__dir, '..', 'src/data/artwork-meta.json'), 'utf8'));

const YEAR = /\b(18|19|20)\d{2}\b/;
const TECHWORD = /Farbholzschnitt|Holzschnitt|Acryl|Öl|Aquarell|Radierung|Lithografie|woodcut|acrylic|oil|watercolour|etching/i;
const AUFL = /Auflage|Edition of|Exemplare|copies|signiert|signed|nummeriert|numbered/i;
const DIM = /\d+\s*×\s*\d+\s*cm/;

function flagsFor(label, e) {
  const f = [];
  const tech = e.technique || '';
  const dim = e.dimensions || '';
  const ed = e.edition || '';
  const title = e.title || '';
  if (YEAR.test(tech)) f.push(`${label}:JAHR-in-technique`);
  if (AUFL.test(tech)) f.push(`${label}:AUFLAGE-in-technique`);
  if (DIM.test(tech)) f.push(`${label}:MASS-in-technique`);
  if (tech.length > 70) f.push(`${label}:technique-zu-lang(${tech.length})`);
  if (TECHWORD.test(dim)) f.push(`${label}:TECHNIK-in-dimensions`);
  if (AUFL.test(dim)) f.push(`${label}:AUFLAGE-in-dimensions`);
  if (ed && TECHWORD.test(ed) && !AUFL.test(ed)) f.push(`${label}:TECHNIK-in-edition`);
  if (/[«»„“”‟"'‚‘’]/.test(title)) f.push(`${label}:QUOTE-in-title`);
  if (/\b(18|19|20)\d{2}\s*$/.test(title)) f.push(`${label}:JAHR-am-title-ende`);
  return f;
}

const rows = [];
for (const [trid, e] of Object.entries(meta)) {
  const f = [...flagsFor('DE', e)];
  if (!e.year) f.push('DE:JAHR-fehlt');
  if (e.en) f.push(...flagsFor('EN', e.en));
  if (f.length) rows.push({ slug: e.slug, trid, flags: f });
}

rows.sort((a, b) => b.flags.length - a.flags.length);
console.log(`Werke gesamt: ${Object.keys(meta).length}`);
console.log(`Werke mit Verdacht: ${rows.length}\n`);
// Häufigkeit je Flag-Typ
const freq = {};
for (const r of rows) for (const fl of r.flags) { const k = fl.split('(')[0]; freq[k] = (freq[k] || 0) + 1; }
console.log('Flag-Häufigkeit:');
for (const [k, v] of Object.entries(freq).sort((a, b) => b[1] - a[1])) console.log(`  ${v.toString().padStart(3)}  ${k}`);
console.log('\nDetails:');
for (const r of rows) console.log(`  • ${r.slug}  [${r.flags.join(', ')}]`);
