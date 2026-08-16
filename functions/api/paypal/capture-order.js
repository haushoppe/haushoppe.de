import { WOODCUT_PRICES_EUR, CURRENCY, paypalBase, accessToken, json } from './_paypal.js';
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
    // Schlägt der Lookup fehl (Token abgelaufen, 5xx, Rate-Limit), retrybar melden — NICHT als
    // Lieferland-Ablehnung, sonst bekäme ein legitimer Käufer fälschlich die DACH-Meldung.
    if (!ordRes.ok) return json({ error: 'order_lookup_failed' }, 502);
    const ord = await ordRes.json();
    const pu = (ord.purchase_units || [])[0] || {};

    // Betrag/Währung der Order MÜSSEN einem Eintrag der server-seitigen Preistabelle entsprechen.
    // Die PayPal-Client-ID ist öffentlich — ohne diese Prüfung könnte ein manipulierter Client eine
    // beliebig billige Order anlegen lassen und hier abbuchen + bestätigen lassen.
    const amount = pu.amount || {};
    const priceOk =
      amount.currency_code === CURRENCY &&
      Object.values(WOODCUT_PRICES_EUR).indexOf(String(amount.value)) !== -1;
    if (!priceOk) return json({ error: 'bad_amount' }, 422);

    const country = ((pu.shipping || {}).address || {}).country_code;
    if (!country || ['DE', 'AT', 'CH'].indexOf(country) === -1) {
      return json({ error: 'shipping_country', country: country || null }, 422);
    }

    // return=representation: die Capture-Antwort enthält dann purchase_units inkl. description/
    // custom_id — daraus ziehen die Bestell-Mails Werk und Ausführung (sonst nur Minimalantwort).
    const res = await fetch(`${paypalBase(env)}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', prefer: 'return=representation' },
    });
    const data = await res.json();
    if (!res.ok) {
      // Zahlungsmittel abgelehnt: dem Client explizit melden, damit er actions.restart() aufruft
      // und der Käufer im selben Checkout eine andere Zahlungsart wählen kann.
      const declined = (data.details || []).some((d) => d && d.issue === 'INSTRUMENT_DECLINED');
      if (declined) return json({ error: 'instrument_declined' }, 422);
      return json({ error: 'capture_failed', detail: data }, 502);
    }
    // Bestätigungs-Mails bei platzierter Zahlung — COMPLETED ODER PENDING (z. B. eCheck / Prüfung):
    // in beiden Fällen ist die Bestellung aufgegeben, also Kunde + Olaf benachrichtigen. Im
    // Hintergrund, damit ein Mail-Fehler die Antwort nie berührt.
    const placed = data.status === 'COMPLETED' || data.status === 'PENDING';
    if (placed) {
      const mail = sendOrderEmails(env, data, lang).catch(() => {});
      if (typeof waitUntil === 'function') waitUntil(mail);
    }
    return json({ id: data.id, status: data.status });
  } catch (e) {
    return json({ error: 'server_error', message: String((e && e.message) || e) }, 500);
  }
}
