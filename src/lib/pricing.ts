// Feste Preise für alle Original-Holzschnitte (brutto, inkl. 7 % ermäßigter MwSt,
// versandkostenfrei): ungerahmt oder fertig gerahmt im HALBE-Museumsrahmen (Alu-Magnetrahmen,
// Museumsglas, säurefreies Passepartout). DIE Preisquelle ist src/data/woodcut-prices.json —
// Anzeige (WoodcutBuy), Anfrage-Mail (ArtworkBody) UND der PayPal-Server (functions/api/paypal)
// lesen dieselbe Datei, damit beworbener und abgebuchter Betrag nie auseinanderlaufen können.
import prices from '../data/woodcut-prices.json';

export const WOODCUT_PRICE_EUR = prices.unframed;
export const WOODCUT_PRICE_FRAMED_EUR = prices.framed;

// Holzschnitt-Erkennung über das strukturierte category-Feld der Werke — die Kategorie ist die
// eine Quelle der Wahrheit dafür, welche Werke die Kaufbox mit Festpreis tragen.
export function isWoodcut(category?: string | null): boolean {
  return category === 'woodcuts';
}

// Anzeige-Beträge mit Tausendertrennung je Sprache (de „1.000 €", en „1,000 €").
export function woodcutPrice(lang: 'de' | 'en'): { amount: string; amountFramed: string; note: string } {
  return lang === 'en'
    ? {
        amount: `${WOODCUT_PRICE_EUR.toLocaleString('en-US')} €`,
        amountFramed: `${WOODCUT_PRICE_FRAMED_EUR.toLocaleString('en-US')} €`,
        note: 'incl. 7% VAT, free shipping',
      }
    : {
        amount: `${WOODCUT_PRICE_EUR.toLocaleString('de-DE')} €`,
        amountFramed: `${WOODCUT_PRICE_FRAMED_EUR.toLocaleString('de-DE')} €`,
        note: 'inkl. 7 % MwSt, versandkostenfrei',
      };
}
