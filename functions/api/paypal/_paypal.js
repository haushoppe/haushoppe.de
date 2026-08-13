// Gemeinsame PayPal-Helfer für die Cloudflare Pages Functions (server-seitig, Secret-geschützt).
// Sandbox vs. Live steuert PAYPAL_ENV ("sandbox" | "live"); die Zugangsdaten kommen ausschliesslich
// aus den Cloudflare-Projekt-Variablen (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) und tauchen nie im
// Client-Code oder im Repo auf. Dateien mit führendem "_" werden von Pages NICHT als Route geroutet.

// Fester Brutto-Preis aller Holzschnitte in EUR. MUSS mit WOODCUT_PRICE_EUR in src/lib/pricing.ts
// übereinstimmen (dort die fachliche Quelle). Der Betrag wird server-seitig gesetzt, damit der
// Client den Preis nicht manipulieren kann.
export const WOODCUT_PRICE_EUR = '785.00';
export const CURRENCY = 'EUR';

export function paypalBase(env) {
  return (env.PAYPAL_ENV || 'sandbox') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

// OAuth2 Client-Credentials -> kurzlebiges Access-Token für die Orders-API.
export async function accessToken(env) {
  const id = env.PAYPAL_CLIENT_ID;
  const secret = env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error('PayPal-Zugangsdaten fehlen (PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET).');
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal-Token fehlgeschlagen (HTTP ${res.status})`);
  const data = await res.json();
  return data.access_token;
}
