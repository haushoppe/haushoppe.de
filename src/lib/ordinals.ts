// Erkennt die 5 Ordinal-Kunstwerke (Johannes x Olaf 2024) und zieht die Live-Inschrift
// (ordinalsbot-iframe) + den Kauf-Link (Gamma) sauber aus dem WP-Content. Das Roh-HTML
// selbst ist nicht direkt verwendbar (Zeilenumbrüche kamen als literales „n" im Dump an),
// deshalb bauen wir das Markup aus den extrahierten Werten neu.
export interface Ordinal {
  iframe: string;
  buy: string | null;
}

export function ordinalData(art: { content?: string }): Ordinal | null {
  const c = art.content || '';
  if (!/explorer\.ordinalsbot\.com/i.test(c)) return null;
  const iframe = (c.match(/<iframe[^>]*\ssrc="([^"]+)"/i) || [])[1];
  if (!iframe) return null;
  const buy = (c.match(/href="(https?:\/\/gamma\.io\/[^"]+)"/i) || [])[1] || null;
  return { iframe, buy };
}
