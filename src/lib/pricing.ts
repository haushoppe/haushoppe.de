// Feste Preise für alle Original-Holzschnitte (brutto, inkl. 7 % ermäßigter MwSt,
// versandkostenfrei): 785 EUR ungerahmt, 1000 EUR fertig gerahmt im HALBE-Museumsrahmen
// (Alu-Magnetrahmen, Museumsglas, säurefreies Passepartout). Eine Quelle für die Kaufbox
// (WoodcutBuy) UND die Anfrage-Mail (ArtworkBody). MUSS mit WOODCUT_PRICES_EUR in
// functions/api/paypal/_paypal.js übereinstimmen (dort setzt der Server den PayPal-Betrag).
//
// Holzschnitt-Erkennung robust über Technik ODER Werk-Nummer: beide liefern exakt dieselben
// Werke (per Datenprüfung). Bewusst NICHT über die Kategorie „Holzschnitte" — dort ist ein
// Acryl-Gemälde („Thalassogen" 2000, 2000-01-A) falsch einsortiert, das keinen Druckpreis hat.
export const WOODCUT_PRICE_EUR = 785;
export const WOODCUT_PRICE_FRAMED_EUR = 1000;

export function isWoodcut(meta?: { technique?: string; number?: string } | null): boolean {
  if (!meta) return false;
  return /holzschnitt/i.test(meta.technique || '') || /-HZ?$/.test(meta.number || '');
}

// Anzeige-Beträge mit Tausendertrennung je Sprache (de „1.000 €", en „1,000 €").
export function woodcutPrice(lang: 'de' | 'en'): { amount: string; amountFramed: string; note: string } {
  return lang === 'en'
    ? {
        amount: `${WOODCUT_PRICE_EUR} €`,
        amountFramed: `${WOODCUT_PRICE_FRAMED_EUR.toLocaleString('en-US')} €`,
        note: 'incl. 7% VAT, free shipping',
      }
    : {
        amount: `${WOODCUT_PRICE_EUR} €`,
        amountFramed: `${WOODCUT_PRICE_FRAMED_EUR.toLocaleString('de-DE')} €`,
        note: 'inkl. 7 % MwSt, versandkostenfrei',
      };
}
