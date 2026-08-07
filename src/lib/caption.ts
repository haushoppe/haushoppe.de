// Zerlegt die (bei Olaf sehr uneinheitlich getippte) Bildunterschrift aus dem WP-Content in
// saubere Bestandteile: Titel+Künstler+Jahr · Technik/Auflage/Maße · interne Nummer.
// Die Maße werden dabei vereinheitlicht zu „B × H cm".
export interface Caption {
  line1: string; // Olaf Hoppe „Titel" Jahr
  line2: string; // Technik + (Auflage) + Maße, vereinheitlicht
  number: string; // interne Nummer, z. B. 2010-06-A
}

// „90 x125 cm" · „240 cm x 50 cm" · „120cm x 200cm" · „37-x-37 cm" → „90 × 125 cm"
function harmonizeDimensions(s: string): string {
  // „70 x 165 cm" · „90 x125 cm" · „240 cm x 50 cm" · „120cm x 200cm" · „37-x-37 cm" → „70 × 165 cm"
  return s.replace(/(\d+)\s*(?:cm)?\s*[-–]?\s*[x×]\s*[-–]?\s*(\d+)\s*[-–]?\s*cm/gi, '$1 × $2 cm');
}

function figcaption(content: string): string | null {
  const m = (content || '').match(/<figcaption>([\s\S]*?)<\/figcaption>/i);
  if (!m) return null;
  return m[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function artworkCaption(content: string): Caption | null {
  const raw = figcaption(content);
  if (!raw) return null;

  // 1) interne Nummer am Ende abtrennen: JJJJ-NN[-–]?X(X) (z. B. 2010-06-A, 2012-01-HZ, 1995-14 - A)
  let s = raw.replace(/©\s*$/, '').trim();
  let number = '';
  const numRe = /(\d{4})\s*[-–]\s*(\d+)\s*[-–]?\s*([A-Z]{1,2})\s*$/;
  const nm = s.match(numRe);
  if (nm) {
    number = `${nm[1]}-${nm[2].padStart(2, '0')}-${nm[3]}`;
    s = s.slice(0, nm.index).trim();
  }

  // 2) an erstem © trennen: davor = Titel+Künstler+Jahr, danach = Technik/Maße
  let line1 = s;
  let line2 = '';
  const ci = s.indexOf('©');
  if (ci >= 0) {
    line1 = s.slice(0, ci).trim();
    line2 = s.slice(ci + 1).trim();
  } else {
    // kein © — Technik-Stichwort suchen
    const tm = s.match(/\b(Acryl|Öl|Original[- ]?Farbholzschnitt|Farbholzschnitt|Holzschnitt|Aquarell|Mischtechnik|Radierung|Lithografie)\b/i);
    if (tm) {
      line1 = s.slice(0, tm.index).trim();
      line2 = s.slice(tm.index).trim();
    }
  }
  // führendes © / Jahr-Reste weg, zusammengelaufene Wörter trennen, Maße vereinheitlichen
  line2 = line2
    .replace(/^©\s*/, '')
    .replace(/^\d{4}\s*/, '')
    .replace(/(Holzstöcken|Druckplatten|Druckstöcken|Platten)\s*(Auflage)/gi, '$1, $2')
    .replace(/(Bütten|Papier|Kunstdruckpapier)\s*(nummeriert)/gi, '$1, $2')
    .replace(/(handsigniert)\.?\s*(Motiv)/gi, '$1. $2')
    .replace(/(cm)\.?\s+(Blattformat)/gi, '$1, $2')
    .replace(/(Auflage\s*\d+)\s*-\s*(Exemplare|\d)/gi, '$1 $2')
    .replace(/\s*,\s*/g, ', ');
  line2 = harmonizeDimensions(line2).replace(/\s{2,}/g, ' ').trim();

  return { line1: line1.replace(/©/g, '').trim(), line2, number };
}
