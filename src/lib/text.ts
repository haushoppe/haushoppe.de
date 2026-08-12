type Lang = 'de' | 'en';

// Typografische Anführungszeichen je Sprache: DE „…“ (U+201E/U+201C), EN “…” (U+201C/U+201D).
const QUOTES: Record<Lang, { open: string; close: string }> = {
  de: { open: '„', close: '“' },
  en: { open: '“', close: '”' },
};

// Wandelt gerade Anführungszeichen in einem Text in typografisch korrekte um — sprachabhängig und
// idempotent. Behebt zentral die uneinheitlichen Werktitel aus dem WordPress-Import (mal „…“, mal
// "…", mal gemischt), ohne die Daten Titel für Titel anzufassen. Angewendet dort, wo Titel gebaut
// werden (galleryItems + Detailseite) -> greift für ALLE Werke, überall.
export function smartQuotes(input: string, lang: Lang): string {
  if (!input) return input;
  const { open, close } = QUOTES[lang];
  // 1) Erst alle Doppel-Varianten auf gerade " vereinheitlichen -> auch gemischte Fälle werden sauber.
  let s = input.replace(/[„“”«»]/g, '"');
  // 2) Gerade " kontextbasiert zu Paaren: öffnend am Anfang oder nach Leerraum/Klammer/Gedankenstrich.
  s = s.replace(/"/g, (_m, offset: number, str: string) => {
    const before = offset === 0 ? '' : str[offset - 1];
    return before === '' || /[\s(\[{–—\/]/.test(before) ? open : close;
  });
  // 3) Gerader Apostroph zwischen Buchstaben -> typografischer Apostroph (Lion's -> Lion’s).
  s = s.replace(/(\p{L})'(\p{L})/gu, '$1’$2');
  return s;
}
