import { CURRENCY, json } from './_paypal.js';

// Öffentliche Konfiguration für den Client (die PayPal-Client-ID ist per Design öffentlich und
// steht in jeder SDK-URL). Der Client lädt darüber das PayPal-SDK, sodass die Client-ID nur in den
// Cloudflare-Variablen liegt und nicht ins Repo/Build wandert. Ohne konfigurierten Key:
// enabled=false -> der Client zeigt dann ausschliesslich den E-Mail-CTA (Graceful Degradation).
export function onRequestGet({ env }) {
  const clientId = env.PAYPAL_CLIENT_ID || '';
  return json({
    enabled: Boolean(clientId),
    clientId,
    currency: CURRENCY,
    env: (env.PAYPAL_ENV || 'sandbox') === 'live' ? 'live' : 'sandbox',
  });
}
