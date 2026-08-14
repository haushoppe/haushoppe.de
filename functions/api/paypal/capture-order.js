import { paypalBase, accessToken, json } from './_paypal.js';
import { sendOrderEmails } from './_email.js';

// Bucht eine zuvor angelegte Bestellung final ab. Danach liegen Zahlung UND Lieferadresse im
// PayPal-Konto von Olaf. Rückgabe: Status + Bestell-ID für die Danke-Meldung im Client.
// Nach erfolgreicher Buchung: Bestätigungs-Mails (Kunde + Olaf) via Resend — über waitUntil,
// damit die Antwort an den Client nicht wartet und ein Mail-Fehler die Zahlung nie berührt.
export async function onRequestPost({ request, env, waitUntil }) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // leerer/kaputter Body -> unten als bad_order_id abgewiesen
  }
  const orderID = typeof body.orderID === 'string' ? body.orderID : '';
  const lang = body.lang === 'en' ? 'en' : 'de';
  if (!/^[A-Z0-9]{5,32}$/i.test(orderID)) return json({ error: 'bad_order_id' }, 400);

  try {
    const token = await accessToken(env);

    // Vorerst nur DACH: die von PayPal erhobene Lieferadresse VOR der Abbuchung prüfen. Ist das
    // Land nicht DE/AT/CH, wird NICHT abgebucht (keine Belastung) und der Client zeigt einen Hinweis.
    const ordRes = await fetch(`${paypalBase(env)}/v2/checkout/orders/${orderID}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const ord = await ordRes.json();
    const country = ((((ord.purchase_units || [])[0] || {}).shipping || {}).address || {}).country_code;
    if (!country || ['DE', 'AT', 'CH'].indexOf(country) === -1) {
      return json({ error: 'shipping_country', country: country || null }, 422);
    }

    const res = await fetch(`${paypalBase(env)}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) return json({ error: 'capture_failed', detail: data }, 502);
    // Bestätigungs-Mails nur bei abgeschlossener Zahlung, im Hintergrund (blockiert die Antwort nicht).
    if (data.status === 'COMPLETED') {
      const mail = sendOrderEmails(env, data, lang).catch(() => {});
      if (typeof waitUntil === 'function') waitUntil(mail);
    }
    return json({ id: data.id, status: data.status });
  } catch (e) {
    return json({ error: 'server_error', message: String((e && e.message) || e) }, 500);
  }
}
