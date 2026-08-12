// Fester Preis für alle Original-Holzschnitte: 785 EUR brutto (inkl. 7 % ermäßigter MwSt),
// versandkostenfrei. Eine Quelle für Anzeige (ArtworkMeta) UND Anfrage-Mail (ArtworkBody).
//
// Holzschnitt-Erkennung robust über Technik ODER Werk-Nummer: beide liefern exakt dieselben 30
// Werke (per Datenprüfung). Bewusst NICHT über die Kategorie „Holzschnitte" — dort ist ein
// Acryl-Gemälde („Thalassogen" 2000, 2000-01-A) falsch einsortiert, das keinen Druckpreis hat.
export const WOODCUT_PRICE_EUR = 785;

export function isWoodcut(meta?: { technique?: string; number?: string } | null): boolean {
  if (!meta) return false;
  return /holzschnitt/i.test(meta.technique || '') || /-HZ?$/.test(meta.number || '');
}

export function woodcutPrice(lang: 'de' | 'en'): { amount: string; note: string } {
  return lang === 'en'
    ? { amount: `${WOODCUT_PRICE_EUR} EUR`, note: 'incl. 7% VAT, free shipping' }
    : { amount: `${WOODCUT_PRICE_EUR} EUR`, note: 'inkl. 7 % MwSt, versandkostenfrei' };
}
