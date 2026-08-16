// Bestell-Mails nach erfolgreicher Zahlung, versendet über Resend (https://resend.com).
// Zwei Mails: (1) an den Kunden = Eingangsbestätigung mit allen Daten + Widerrufsbelehrung +
// Hinweis, dass der Vertrag erst mit Versand zustande kommt; (2) an team@haushoppe.de = Olafs
// Kopie mit allen Infos. Ohne RESEND_API_KEY wird nichts versendet (Graceful Degradation) —
// die Zahlung ist da bereits abgeschlossen, der Mailversand darf sie nie scheitern lassen.

import { WOODCUT_PRICES_EUR } from './_paypal.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// PayPal liefert Beträge als "1000.00" -> lokalisiert inkl. Tausendertrennung:
// "1.000,00 €" (de) bzw. "€1,000.00" (en). Fallback: einfacher Komma-Tausch.
function money(value, currency, lang) {
  const n = Number(value);
  if (Number.isFinite(n)) {
    try {
      return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-GB', { style: 'currency', currency: currency || 'EUR' }).format(n);
    } catch {
      // unbekannter Währungscode -> Fallback unten
    }
  }
  const sym = currency === 'EUR' ? '€' : `${currency} `;
  const v = lang === 'de' ? String(value).replace('.', ',') : String(value);
  return `${v} ${sym}`.trim();
}

function nowStr(lang) {
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'de-DE', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Europe/Berlin',
    }).format(new Date());
  } catch {
    return new Date().toISOString();
  }
}

// Relevante Felder aus der PayPal-Capture-Antwort ziehen.
function extract(data, lang) {
  const payer = data.payer || {};
  const pu = (data.purchase_units || [])[0] || {};
  const cap = ((pu.payments || {}).captures || [])[0] || {};
  const shipping = pu.shipping || {};
  const addr = shipping.address || {};
  const amount = cap.amount || {};
  return {
    orderId: data.id || '',
    captureId: cap.id || '',
    // PENDING (z. B. eCheck): Bestellung ist aufgegeben, Geld aber noch nicht final da —
    // die Händler-Mail warnt dann ausdrücklich vor dem Versand.
    pending: data.status === 'PENDING' || cap.status === 'PENDING',
    item: pu.description || pu.custom_id || (lang === 'en' ? 'Woodcut' : 'Holzschnitt'),
    slug: pu.custom_id || '',
    amount: money(amount.value || WOODCUT_PRICES_EUR.unframed, amount.currency_code || 'EUR', lang),
    buyerName: [payer.name && payer.name.given_name, payer.name && payer.name.surname].filter(Boolean).join(' '),
    buyerEmail: payer.email_address || '',
    shipName: (shipping.name || {}).full_name || '',
    addrLines: [
      addr.address_line_1,
      addr.address_line_2,
      [addr.postal_code, addr.admin_area_2].filter(Boolean).join(' '),
      addr.admin_area_1,
      addr.country_code,
    ].filter(Boolean),
    date: nowStr(lang),
  };
}

// Offizielle Muster-Widerrufsbelehrung (Anlage 1 zu Art. 246a EGBGB), Kontakt eingesetzt.
function widerruf(seller) {
  return `<h3 style="margin:1.5em 0 .4em">Widerrufsbelehrung</h3>
<p style="margin:.4em 0"><strong>Widerrufsrecht</strong><br>
Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.<br>
Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${esc(seller.name)}, ${esc(seller.street)}, ${esc(seller.city)}, E-Mail: ${esc(seller.email)}, Telefon: ${esc(seller.phone)}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.<br>
Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>
<p style="margin:.4em 0"><strong>Folgen des Widerrufs</strong><br>
Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet. Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.<br>
Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden. Sie tragen die unmittelbaren Kosten der Rücksendung der Waren. Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.</p>
<p style="margin:.4em 0;color:#555;font-size:13px"><strong>Muster-Widerrufsformular</strong> (wenn Sie den Vertrag widerrufen wollen, füllen Sie dieses Formular aus und senden Sie es zurück): An ${esc(seller.name)}, ${esc(seller.street)}, ${esc(seller.city)}, ${esc(seller.email)}. Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über den Kauf der folgenden Waren. Bestellt am / erhalten am. Name. Anschrift. Datum.</p>`;
}

function row(label, value) {
  return `<tr><td style="padding:4px 12px 4px 0;color:#555;vertical-align:top">${esc(label)}</td><td style="padding:4px 0"><strong>${esc(value)}</strong></td></tr>`;
}

function customerHtml(o, seller, lang) {
  const addr = o.addrLines.map(esc).join('<br>');
  if (lang === 'en') {
    return `<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:620px">
<h2 style="margin:0 0 .4em">Thank you for your order</h2>
<p>This confirms that we have <strong>received</strong> your order at HAUS HOPPE - ITS. <strong>A contract of sale is concluded only upon shipment of the goods.</strong></p>
<h3 style="margin:1.2em 0 .4em">Order details</h3>
<table style="border-collapse:collapse;font-size:14px">
${row('Item', o.item)}${row('Price', `${o.amount} (incl. 7% VAT, free shipping)`)}${row('Order no.', o.orderId)}${row('Payment ref.', o.captureId)}${row('Date', o.date)}
</table>
<h3 style="margin:1.2em 0 .4em">Shipping address</h3>
<p style="font-size:14px">${addr}</p>
<h3 style="margin:1.5em 0 .4em">Right of withdrawal</h3>
<p>You have the right to withdraw from this contract within 14 days without giving any reason. The withdrawal period is 14 days from the day on which you (or a third party named by you, who is not the carrier) take possession of the goods. To exercise your right of withdrawal, you must inform us (${esc(seller.name)}, ${esc(seller.street)}, ${esc(seller.city)}, email: ${esc(seller.email)}, phone: ${esc(seller.phone)}) of your decision by a clear statement (e.g. a letter sent by post or an email). To meet the withdrawal deadline, it is sufficient to send your communication before the withdrawal period has expired. If you withdraw, we will reimburse all payments received from you, including delivery costs (except for extra costs arising from your choice of a delivery type other than the cheapest standard delivery offered by us), without undue delay and within 14 days. You bear the direct cost of returning the goods.</p>
<p style="font-size:13px">You can also declare your withdrawal directly online: <a href="https://haushoppe.art/withdraw/">haushoppe.art/withdraw</a>.</p>
<p style="color:#555;font-size:13px">Questions? Just reply to this email or write to ${esc(seller.email)}.</p>
</div>`;
  }
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:620px">
<h2 style="margin:0 0 .4em">Vielen Dank für Ihre Bestellung</h2>
<p>Dies ist die Bestätigung über den <strong>Eingang</strong> Ihrer Bestellung bei HAUS HOPPE - ITS. <strong>Ein Kaufvertrag kommt erst mit dem Versand der Ware zustande.</strong></p>
<h3 style="margin:1.2em 0 .4em">Bestelldaten</h3>
<table style="border-collapse:collapse;font-size:14px">
${row('Werk', o.item)}${row('Preis', `${o.amount} (inkl. 7 % MwSt, versandkostenfrei)`)}${row('Bestellnummer', o.orderId)}${row('Zahlungsreferenz', o.captureId)}${row('Datum', o.date)}
</table>
<h3 style="margin:1.2em 0 .4em">Lieferadresse</h3>
<p style="font-size:14px">${addr}</p>
${widerruf(seller)}
<p style="font-size:13px">Sie können Ihren Widerruf auch direkt online erklären: <a href="https://haushoppe.de/widerruf-erklaeren/">haushoppe.de/widerruf-erklaeren</a>.</p>
<p style="color:#555;font-size:13px">Fragen? Antworten Sie einfach auf diese E-Mail oder schreiben Sie an ${esc(seller.email)}.</p>
</div>`;
}

function merchantHtml(o) {
  const addr = [o.shipName, ...o.addrLines].filter(Boolean).map(esc).join('<br>');
  const warn = o.pending
    ? '<p style="background:#fff3cd;border-left:4px solid #b45309;padding:8px 12px;font-size:14px"><strong>Zahlung noch AUSSTEHEND</strong> (z. B. eCheck). Bitte NICHT versenden, bevor die Zahlung im PayPal-Konto als abgeschlossen erscheint.</p>'
    : '';
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:620px">
<h2 style="margin:0 0 .4em">Neue Bestellung ${o.pending ? '(Zahlung ausstehend)' : '(bezahlt)'}</h2>
${warn}
<table style="border-collapse:collapse;font-size:14px">
${row('Werk', o.item)}${row('Slug', o.slug)}${row('Betrag', o.amount)}${row('Bestellnummer', o.orderId)}${row('Capture-ID', o.captureId)}${row('Datum', o.date)}${row('Käufer', o.buyerName)}${row('E-Mail', o.buyerEmail)}
</table>
<h3 style="margin:1.2em 0 .4em">Lieferadresse</h3>
<p style="font-size:14px">${addr}</p>
<p style="color:#555;font-size:13px">Hinweis: Der Kaufvertrag kommt erst mit dem Versand der Ware zustande.</p>
</div>`;
}

async function sendResend(env, msg) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(msg),
  });
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// Versendet Kunden- und Händler-Mail. Wirft NIE nach aussen (die Zahlung ist schon abgeschlossen);
// gibt {sent,skipped,error} zur optionalen Protokollierung zurück.
export async function sendOrderEmails(env, data, lang) {
  if (!env.RESEND_API_KEY) return { skipped: 'no RESEND_API_KEY' };
  const from = env.MAIL_FROM || 'HAUS HOPPE - ITS <team@haushoppe.de>';
  const merchant = env.MAIL_TO || 'team@haushoppe.de';
  const seller = {
    name: 'Olaf Hoppe',
    street: 'Zum Breitling 12',
    city: '23974 Boiensdorf OT Stove',
    email: 'team@haushoppe.de',
    phone: '+49 38427 64315',
  };
  const o = extract(data, lang);
  const results = {};
  // Händler-Mail (immer deutsch, an Olaf).
  try {
    results.merchant = await sendResend(env, {
      from,
      to: [merchant],
      reply_to: o.buyerEmail || merchant,
      subject: `Neue Bestellung${o.pending ? ' (Zahlung ausstehend)' : ''}: ${o.item} (${o.amount})`,
      html: merchantHtml(o),
    });
  } catch (e) {
    results.merchantError = String((e && e.message) || e);
  }
  // Kunden-Mail (nur wenn PayPal eine E-Mail geliefert hat).
  if (o.buyerEmail) {
    try {
      results.customer = await sendResend(env, {
        from,
        to: [o.buyerEmail],
        reply_to: merchant,
        subject:
          lang === 'en'
            ? `Your order at HAUS HOPPE - ITS (${o.item})`
            : `Ihre Bestellung bei HAUS HOPPE - ITS (${o.item})`,
        html: customerHtml(o, seller, lang),
      });
    } catch (e) {
      results.customerError = String((e && e.message) || e);
    }
  }
  return results;
}
