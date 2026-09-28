import { SHIP_COUNTRIES, paypalBase, accessToken, json } from './_paypal.js';

// Prüft nach der PayPal-Freigabe (vor der Kassen-Stufe), ob die von PayPal erhobene Lieferadresse in
// einem Lieferland liegt. So sieht ein Käufer mit Adresse außerhalb der Lieferländer den Hinweis auf
// die E-Mail-Anfrage sofort und nicht erst beim Klick auf „Zahlungspflichtig bestellen". Bucht nichts
// ab; capture-order prüft das Land vor der Abbuchung zusätzlich.
export async function onRequestPost({ request, env }) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // leerer/kaputter Body -> unten als bad_order_id abgewiesen
  }
  const orderID = typeof body.orderID === 'string' ? body.orderID : '';
  if (!/^[A-Z0-9]{5,32}$/i.test(orderID)) return json({ error: 'bad_order_id' }, 400);
  try {
    const token = await accessToken(env);
    const res = await fetch(`${paypalBase(env)}/v2/checkout/orders/${orderID}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return json({ error: 'order_lookup_failed' }, 502);
    const ord = await res.json();
    const pu = (ord.purchase_units || [])[0] || {};
    const country = ((pu.shipping || {}).address || {}).country_code || null;
    return json({ country, allowed: !!country && SHIP_COUNTRIES.indexOf(country) !== -1 });
  } catch (e) {
    return json({ error: 'server_error', message: String((e && e.message) || e) }, 500);
  }
}
