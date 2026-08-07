// Einmal-Normalisierung: zieht die Bildunterschrift jedes Werks (aus dem uneinheitlichen
// WP-Content — mal <figcaption>, mal <p> mit <br>) in saubere, editierbare Felder:
//   artist · title · year · technique · dimensions (Maße) · edition (nur Drucke) · number · extra
// Ergebnis: src/data/artwork-meta.json  { "<id>": { …, en: { title, technique, dimensions, edition } } }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dir = path.dirname(fileURLToPath(import.meta.url));
const R = (p) => JSON.parse(fs.readFileSync(path.join(__dir, '..', p), 'utf8'));

const arr = Object.values(R('src/data/artworks.json')).filter((a) => a.type === 'portfolio');
const TECH = /Acryl|Öl|Original[- ]?Farbholzschnitt|Farbholzschnitt|Holzschnitt|Aquarell|Mischtechnik|Radierung|Lithografie/i;

const clean = (s) =>
  (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/->/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Rohe Caption aus <figcaption> ODER <p> (mit „Olaf Hoppe" + Technik)
function rawCaption(content) {
  const fc = (content || '').match(/<figcaption>([\s\S]*?)<\/figcaption>/i);
  if (fc && clean(fc[1])) return clean(fc[1]);
  for (const m of (content || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    if (/Olaf Hoppe/i.test(m[1]) && TECH.test(m[1])) return clean(m[1]);
  }
  return null;
}

const harmDim = (s) =>
  s.replace(/(\d+)\s*(?:cm)?\s*[-–]?\s*[x×]\s*[-–]?\s*(\d+)\s*[-–]?\s*cm/gi, '$1 × $2 cm');

// interne Nummer: JJJJ[-–/ ]NN[-–/ ]X(X)  → normiert „JJJJ-NN-X"
function extractNumber(s) {
  const m = s.match(/(\d{4})\s*[-–/ ]\s*(\d{1,3})\s*[-–/ ]\s*([A-Z]{1,3})\b/);
  if (!m) return { number: '', rest: s };
  const number = `${m[1]}-${m[2].padStart(2, '0')}-${m[3]}`;
  return { number, rest: (s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim() };
}

// Technik / Auflage / Maße aus dem „rest" (nach Titelzeile, ohne Nummer)
function splitTechnique(rest) {
  let r = rest.replace(/^©\s*/, '').replace(/^\d{4}\s*©?\s*/, '').trim();
  // Zusammengelaufenes trennen
  r = r
    .replace(/(Holzstöcken|Druckplatten|Druckstöcken|Platten)\s*(Auflage)/gi, '$1, $2')
    .replace(/(Bütten|Papier|Kunstdruckpapier)\s*(nummeriert)/gi, '$1, $2')
    .replace(/(handsigniert)\.?\s*(Motiv)/gi, '$1. $2')
    .replace(/(cm)\.?\s+(Blattformat)/gi, '$1, $2')
    .replace(/(Auflage\s*\d+)\s*-\s*(Exemplare|\d)/gi, '$1 $2');
  r = harmDim(r).replace(/\s{2,}/g, ' ').trim();

  const isPrint = /Farbholzschnitt|Holzschnitt|Radierung|Lithografie/i.test(r);
  let technique = '',
    edition = '',
    dimensions = '';

  if (isPrint) {
    // Technik = bis „, Auflage"; Auflage = bis „handsigniert"; Maße = Motivgröße/Blattformat-Teil
    const aufl = r.match(/Auflage[\s\S]*?(?:handsigniert|handsignierte)\.?/i);
    const dimM = r.match(/(Motiv(?:größe)?[\s\S]*)$/i);
    if (aufl) {
      technique = r.slice(0, aufl.index).replace(/[,\s]+$/, '').trim();
      edition = clean(aufl[0]);
    }
    dimensions = dimM ? harmDim(clean(dimM[1])) : (r.match(/[\d\s×.,cmMotivBlattfor-]*×[^,]*$/) || [''])[0].trim();
    if (!technique) technique = r.split(/,|Auflage|Motiv/i)[0].trim();
  } else {
    // Gemälde: Technik = bis zur ersten Maßangabe
    const dm = r.match(/\d+\s*×\s*\d+\s*cm/);
    if (dm) {
      technique = r.slice(0, dm.index).replace(/[,\s]+$/, '').trim();
      dimensions = r.slice(dm.index).trim();
    } else {
      technique = r; // kein Maß (z. B. „? cm")
      const q = r.match(/(Acryl auf Leinwand|Acryl auf Papier|Öl auf Leinwand|Aquarell|Mischtechnik)/i);
      if (q) { technique = q[1]; dimensions = r.slice(q.index + q[1].length).trim(); }
    }
  }
  return { technique: technique.replace(/©/g, '').trim(), edition, dimensions: dimensions.replace(/©/g, '').trim() };
}

// Jahr aus Titel/Caption
function extractYear(title, line1) {
  const m = (title + ' ' + line1).match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : '';
}
// Werktitel säubern (alle Anführungszeichen-Varianten + nachgestelltes Jahr weg)
const QUOTES = /[«»„“”‟"'‚‘’]/g;
function cleanTitle(title) {
  return clean(title).replace(/\s*\(?\d{4}\)?\s*$/, '').replace(QUOTES, '').replace(/\s{2,}/g, ' ').trim();
}

function parse(content, artworkTitle) {
  const raw = rawCaption(content);
  if (!raw) return null;
  const { number, rest: noNum } = extractNumber(raw);
  // Titelzeile = bis erstes © ODER bis Technik-Stichwort
  let line1 = noNum,
    tail = '';
  const ci = noNum.indexOf('©');
  if (ci >= 0) { line1 = noNum.slice(0, ci); tail = noNum.slice(ci + 1); }
  else { const tm = noNum.match(TECH); if (tm) { line1 = noNum.slice(0, tm.index); tail = noNum.slice(tm.index); } }
  const { technique, edition, dimensions } = splitTechnique(tail);
  return {
    title: cleanTitle(artworkTitle),
    year: extractYear(artworkTitle, line1),
    technique,
    dimensions,
    edition,
    number,
  };
}

// nach trid gruppieren (DE + EN)
const byTrid = {};
for (const a of arr) (byTrid[a.trid] ||= {})[a.lang] = a;

const meta = {};
const incomplete = [];
for (const a of arr.filter((x) => x.lang === 'de')) {
  const de = parse(a.content, a.title);
  if (!de) continue;
  const enArt = (byTrid[a.trid] || {}).en;
  const en = enArt ? parse(enArt.content, enArt.title) : null;
  // Key = trid (für DE + EN identisch), damit beide Detailseiten dieselbe Meta finden.
  meta[a.trid] = {
    artist: 'Olaf Hoppe',
    ...de,
    extra: '',
    en: en ? { title: en.title, technique: en.technique, dimensions: en.dimensions, edition: en.edition } : undefined,
  };
  // Pflichtangaben-Check
  const missing = [];
  if (!de.technique) missing.push('technique');
  if (!de.dimensions || /\?|^$/.test(de.dimensions)) missing.push('dimensions');
  if (!de.number) missing.push('number');
  if (missing.length) incomplete.push(`${a.slug}: fehlt ${missing.join(', ')}  [${de.technique} | ${de.dimensions} | ${de.number}]`);
}

fs.writeFileSync(path.join(__dir, '..', 'src/data/artwork-meta.json'), JSON.stringify(meta, null, 0));
console.log('artwork-meta.json:', Object.keys(meta).length, 'Werke');
console.log('unvollständige Pflichtangaben:', incomplete.length);
incomplete.forEach((l) => console.log('  •', l));
