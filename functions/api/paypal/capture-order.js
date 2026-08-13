import { paypalBase, accessToken, json } from './_paypal.js';

// Bucht eine zuvor angelegte Bestellung final ab. Danach liegen Zahlung UND Lieferadresse im
// PayPal-Konto von Olaf. Rückgabe: Status + Bestell-ID für die Danke-Meldung im Client.
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
    const res = await fetch(`${paypalBase(env)}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) return json({ error: 'capture_failed', detail: data }, 502);
    return json({ id: data.id, status: data.status });
  } catch (e) {
    return json({ error: 'server_error', message: String((e && e.message) || e) }, 500);
  }
}
