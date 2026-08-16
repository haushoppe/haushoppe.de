import { WOODCUT_PRICES_EUR, CURRENCY, paypalBase, accessToken, json } from './_paypal.js';

// Legt eine PayPal-Bestellung für EINEN Holzschnitt an. Der Betrag wird server-seitig aus
// WOODCUT_PRICES_EUR gewählt (keine Preis-Manipulation vom Client möglich); der Client liefert nur
// Slug/Titel/Sprache/Varianten-Schlüssel zur Kennzeichnung. Die Ausführung (ungerahmt/gerahmt)
// steht im Bestell-Label, damit sie in PayPal-Konto UND Bestell-Mails eindeutig sichtbar ist.
// shipping_preference=GET_FROM_FILE -> PayPal erhebt die Lieferadresse; sie landet mit der
// Zahlung im PayPal-Konto (keine Bestätigungsmail nötig).
export async function onRequestPost({ request, env }) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // leerer/kaputter Body -> Standardwerte
  }
  const slug = typeof body.slug === 'string' ? body.slug.slice(0, 120) : '';
  const rawTitle = typeof body.title === 'string' ? body.title.trim() : '';
  const lang = body.lang === 'en' ? 'en' : 'de';
  const variant = body.variant === 'framed' ? 'framed' : 'unframed';
  const price = WOODCUT_PRICES_EUR[variant];
  const name = rawTitle || slug || (lang === 'en' ? 'Woodcut' : 'Holzschnitt');
  const variantLabel =
    lang === 'en'
      ? variant === 'framed'
        ? 'framed (HALBE museum frame)'
        : 'unframed'
      : variant === 'framed'
        ? 'gerahmt (HALBE-Museumsrahmen)'
        : 'ungerahmt';
  const label = `${lang === 'en' ? 'Woodcut' : 'Holzschnitt'}: ${name} · ${variantLabel}`.slice(0, 127);

  try {
    const token = await accessToken(env);
    const res = await fetch(`${paypalBase(env)}/v2/checkout/orders`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: slug,
            description: label,
            amount: {
              currency_code: CURRENCY,
              value: price,
              breakdown: {
                item_total: { currency_code: CURRENCY, value: price },
                shipping: { currency_code: CURRENCY, value: '0.00' },
              },
            },
            items: [
              {
                name: label,
                quantity: '1',
                category: 'PHYSICAL_GOODS',
                unit_amount: { currency_code: CURRENCY, value: price },
              },
            ],
          },
        ],
        application_context: {
          brand_name: 'HAUS HOPPE – Galerie für Bildende Kunst',
          locale: lang === 'en' ? 'en-US' : 'de-DE',
          shipping_preference: 'GET_FROM_FILE',
          user_action: 'PAY_NOW',
        },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.id) return json({ error: 'create_failed', detail: data }, 502);
    return json({ id: data.id });
  } catch (e) {
    return json({ error: 'server_error', message: String((e && e.message) || e) }, 500);
  }
}
