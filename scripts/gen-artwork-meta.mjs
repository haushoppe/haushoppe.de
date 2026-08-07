// Einmal-Normalisierung: zieht die Bildunterschrift jedes Werks aus dem uneinheitlichen
// WP-Content (mal <figcaption>, mal <p>) in saubere, editierbare Felder:
//   artist · title · year · technique · dimensions (Maße) · edition (nur Drucke) · number · extra
//
// Captions sind in Wahrheit <br>-getrennte Zeilen mit fester Reihenfolge:
//   Zeile 0:  Olaf Hoppe „Titel“ © Jahr
//   Mitte:    Technik / Auflage / Maße   (mal einzeln, mal kombiniert — „Olaf tippt mal so, mal so“)
//   Ende:     interne Nummer  (JJJJ-NN-X)
// Darum parsen wir ZEILENWEISE (robust für DE + EN) statt alles zu Text zu zermatschen.
//
// Ergebnis: src/data/artwork-meta.json  { "<trid>": { slug, …, en: { … } } }  — hübsch,
// nach trid verschlüsselt (DE + EN teilen sich einen Eintrag), von Hand editierbar.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dir = path.dirname(fileURLToPath(import.meta.url));
const R = (p) => JSON.parse(fs.readFileSync(path.join(__dir, '..', p), 'utf8'));
const arr = Object.values(R('src/data/artworks.json')).filter((a) => a.type === 'portfolio');

// Stichwort-Sätze (Deutsch UND Englisch)
const TECH = /Acryl|Öl|Farbholzschnitt|Holzschnitt|Aquarell|Radierung|Lithografie|Mischtechnik|woodcut|woodblock|acrylic|\boil\b|watercolou?r|etching|lithograph|mixed media/i;
const EDITION = /Auflage|Exemplare|Bütten|nummeriert|handsigniert|handsignierte|Edition of|copies|handmade paper|numbered|signed/i;
// Zum TRENNEN Technik|Auflage nur „starke“ Auflage-Wörter — NICHT „Bütten/paper“ allein,
// sonst zerschneidet „Aquarell auf Bütten 70 × 100 cm“ falsch (Bütten = Malgrund, keine Auflage).
const EDITION_SPLIT = /Auflage|Exemplare|Edition of|\bcopies\b|nummeriert|handsigniert|handsignierte|numbered|\bsigned\b/i;
const DIMKW = /Motivgröße|Motiv\b|Blattformat|Papierformat|Sheet size|Motif\b|Paper size/i;
const DIMRE = /\d+\s*[×x]\s*\d+\s*cm/i;
const YEAR = /(?:18|19|20)\d{2}/;
const QUOTES = /[«»„“”‟"'‚‘’]/g;

const strip = (s) =>
  (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const harmDim = (s) => s.replace(/(\d+)\s*(?:cm)?\s*[-–]?\s*[x×]\s*[-–]?\s*(\d+)\s*[-–]?\s*cm/gi, '$1 × $2 cm');

// eine Caption-Zeile säubern + zusammengelaufene Tippfehler entwirren + Maße harmonisieren
function normLine(s) {
  return harmDim(
    s
      .replace(/-x-/gi, ' x ')
      .replace(/(\d)\s*-\s*cm/gi, '$1 cm')
      .replace(/(Bütten|Papier|Kunstdruckpapier|paper)\s*(nummeriert|numbered)/gi, '$1, $2')
      .replace(/(\d)\s*-\s*(Exemplare|Exemplaren|copies)/gi, '$1 $2')
      .replace(/\bcryl\b/gi, 'Acryl') // Olaf-Tippfehler: „©A // cryl…“ verklebt
      .replace(/\bAcyl\b/gi, 'Acryl')
      .replace(/([xX×]\s*\d+)\s+c\b(?!m)/g, '$1 cm') // „145 c“ (m verrutscht) → „145 cm“
      // Meter-Komma-Maße harmonisieren: „0,46 x 0,38 cm“ → „46 × 38 cm“, „1,50“ → „150“
      .replace(/(\d+),(\d{2})\b/g, (_, a, b) => String(parseInt(a, 10) * 100 + parseInt(b, 10)))
  )
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Caption-Block (figcaption ODER Olaf-Hoppe-<p>) → saubere Zeilen (Split an <br>)
function captionLines(content) {
  let block = null;
  const fc = (content || '').match(/<figcaption>([\s\S]*?)<\/figcaption>/i);
  if (fc && strip(fc[1])) block = fc[1];
  else
    for (const m of (content || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
      if (/Olaf Hoppe/i.test(m[1]) && (TECH.test(m[1]) || EDITION.test(m[1]))) {
        block = m[1];
        break;
      }
  if (!block) return null;
  const lines = block
    .split(/<br\s*\/?>/i)
    .map((seg) => normLine(strip(seg)))
    .filter(Boolean);
  return lines.length ? lines : null;
}

// interne Nummer JJJJ-NN-X — von hinten suchen (steht fast immer in der letzten Zeile)
function findNumber(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/(\d{4})\s*[-–/ ]\s*(\d{1,3})\s*[-–/ ]\s*([A-Z]{1,3})\b/);
    if (m) return { number: `${m[1]}-${m[2].padStart(2, '0')}-${m[3]}`, idx: i };
  }
  return { number: '', idx: -1 };
}

// Werktitel aus dem (kanonischen) WP-Titel; nachgestelltes/„angeklebtes“ Jahr abtrennen
function cleanTitle(rawTitle) {
  let t = strip(rawTitle).replace(QUOTES, '').replace(/©/g, ' ').replace(/\s{2,}/g, ' ').trim();
  let year = '';
  const m = t.match(new RegExp(`^(.*?)[\\s]*\\(?(${YEAR.source})\\)?\\s*$`));
  if (m && /[A-Za-zÀ-ÿ]{2,}/.test(m[1])) {
    t = m[1].replace(/[-–\s]+$/, '').trim();
    year = m[2];
  }
  return { title: t, year };
}

// eine Mittel-Zeile den Feldern zuordnen (kann Technik+Auflage bzw. Technik+Maße enthalten)
function classify(ln, out) {
  if (/^\(/.test(ln) || /Quelle:|Source:/i.test(ln)) {
    out.extra.push(ln.replace(/^\(\s*|\s*\)$/g, '').trim());
    return;
  }
  if (TECH.test(ln)) {
    const ei = ln.search(EDITION_SPLIT);
    // Maße: „NN × NN cm“ ODER (bei Gemälden) „NN × NN“ ohne Einheit am Zeilenende
    const dm =
      ln.match(DIMRE) ||
      (/Acryl|Öl|Aquarell|acrylic|\boil\b|watercolou?r/i.test(ln) && ln.match(/(\d+)\s*[×x]\s*(\d+)\s*$/)) ||
      null;
    if (ei >= 0 && !DIMKW.test(ln.slice(0, ei))) {
      // kombiniert: Technik + Auflage (+ evtl. Maße im Auflage-Teil, z. B. „… Motiv 0,46 × 0,38 cm“)
      out.technique ||= ln.slice(0, ei).replace(/[,\s]+$/, '').trim();
      let ed = ln.slice(ei).trim();
      const di = ed.search(DIMKW);
      if (di >= 0) {
        out.dimensions ||= ed.slice(di).trim();
        ed = ed.slice(0, di).replace(/[,\s]+$/, '').trim();
      }
      out.edition ||= ed;
    } else if (dm) {
      // kombiniert: Technik + Maße (Gemälde)
      out.technique ||= ln.slice(0, dm.index).replace(/[,\s]+$/, '').trim();
      let d = ln.slice(dm.index).trim().replace(/(\d+)\s*[x×]\s*(\d+)/, '$1 × $2');
      if (!/cm/i.test(d)) d += ' cm';
      out.dimensions ||= d;
    } else {
      out.technique ||= ln;
    }
    return;
  }
  if (EDITION.test(ln) && DIMKW.test(ln)) {
    // kombiniert: Auflage + Maße auf einer Zeile → an der Maß-Angabe trennen
    const di = ln.search(DIMKW);
    out.edition ||= ln.slice(0, di).replace(/[,\s]+$/, '').trim();
    out.dimensions ||= ln.slice(di).trim();
    return;
  }
  if (DIMKW.test(ln) || DIMRE.test(ln)) {
    out.dimensions ||= ln;
    return;
  }
  if (EDITION.test(ln)) {
    out.edition ||= ln;
    return;
  }
  out.extra.push(ln); // Unbekanntes lieber als Zusatztext behalten als verlieren
}

function parse(content, rawTitle, slug) {
  const lines = captionLines(content);
  if (!lines) return null;
  const { number, idx: numIdx } = findNumber(lines);
  const { title, year: titleY } = cleanTitle(rawTitle);

  // Jahr: © in Zeile 0  →  Nummer  →  Titel  →  Slug
  const l0 = (lines[0] || '').replace(QUOTES, ' ');
  const capYear =
    (l0.match(new RegExp(`(${YEAR.source})\\s*©`)) ||
      l0.match(new RegExp(`©\\s*(${YEAR.source})`)) ||
      l0.match(new RegExp(`(${YEAR.source})\\s*$`)) ||
      [])[1] || '';
  const year = capYear || (number && number.slice(0, 4)) || titleY || (slug.match(YEAR) || [''])[0] || '';

  const out = { technique: '', dimensions: '', edition: '', extra: [] };
  lines.forEach((ln, i) => {
    if (i === 0 || i === numIdx) return; // Titelzeile + Nummer raus
    classify(ln, out);
  });

  // Verklebter Einzeiler (alles in Zeile 0, kein <br>): Präfix „Olaf … ©“ + Nummer wegschneiden
  if (!out.technique && !out.dimensions && (TECH.test(lines[0] || '') || DIMRE.test(lines[0] || ''))) {
    const s = (lines[0] || '')
      .replace(/^.*?©\s*/, '')
      .replace(/(\d{4})\s*[-–/ ]\s*\d{1,3}\s*[-–/ ]\s*[A-Z]{1,3}\b.*$/, '')
      .trim();
    if (s) classify(normLine(s), out);
  }

  // Technik säubern: eingebettetes Jahr + baumelndes „x cm“ (fehlende Maße) raus
  const technique = out.technique
    .replace(new RegExp(`\\b${YEAR.source}\\b`, 'g'), '')
    .replace(/\s+[x×]\s*cm\.?\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim();

  let edition = out.edition.trim();
  if (edition) edition = edition.replace(/[.,\s]+$/, '') + '.';
  return {
    title,
    year,
    technique,
    dimensions: out.dimensions.trim(),
    edition,
    number,
    extra: out.extra.join(' ').trim(),
  };
}

// Maße wie „?“ gelten als leer → nicht anzeigen (statt wörtlich „? cm“)
const cleanDim = (s) => (s && /\d/.test(s) ? s : '');

// Vorherige Datei: von Hand ergänzte Maße/Extra überleben ein erneutes `npm run meta`.
const outPath = path.join(__dir, '..', 'src/data/artwork-meta.json');
const prev = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};

// nach trid gruppieren (DE + EN)
const byTrid = {};
for (const a of arr) (byTrid[a.trid] ||= {})[a.lang] = a;

const meta = {};
const incomplete = [];
for (const a of arr.filter((x) => x.lang === 'de')) {
  const de = parse(a.content, a.title, a.slug);
  if (!de) continue;
  const enArt = (byTrid[a.trid] || {}).en;
  const en = enArt ? parse(enArt.content, enArt.title, enArt.slug) : null;
  const p = prev[a.trid] || {};
  const dimensions = cleanDim(de.dimensions) || cleanDim(p.dimensions);
  meta[a.trid] = {
    slug: a.slug, // nur zur Orientierung beim Editieren — Komponente ignoriert es
    artist: 'Olaf Hoppe',
    title: de.title,
    year: de.year,
    technique: de.technique,
    dimensions,
    edition: de.edition || p.edition || '',
    number: de.number,
    extra: de.extra || p.extra || '', // freier Zusatztext (Quelle etc.)
    en: en
      ? {
          title: en.title,
          technique: en.technique,
          dimensions: cleanDim(en.dimensions) || cleanDim(p.en?.dimensions),
          edition: en.edition || p.en?.edition || '',
          extra: en.extra || p.en?.extra || '',
        }
      : undefined,
  };
  const missing = [];
  if (!de.technique) missing.push('technique');
  if (!dimensions) missing.push('dimensions');
  if (!de.number) missing.push('number');
  if (missing.length) incomplete.push(`${a.slug}: fehlt ${missing.join(', ')}  [${de.technique} | ${dimensions || '—'} | ${de.number}]`);
}

fs.writeFileSync(outPath, JSON.stringify(meta, null, 2) + '\n');
console.log('artwork-meta.json:', Object.keys(meta).length, 'Werke');
console.log('unvollständige Pflichtangaben:', incomplete.length);
incomplete.forEach((l) => console.log('  •', l));
