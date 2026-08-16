// Eingangsbestätigung des Widerrufs nach § 356a Abs. 4 BGB, versendet über Resend.
// WICHTIG (Gesetzesbegründung): Die Mail bestätigt AUSSCHLIESSLICH den Eingang (mit Datum + Uhrzeit)
// und darf NICHT den Eindruck erwecken, die Wirksamkeit sei schon geprüft. Kopie an team@haushoppe.de.
// Führendes „_" => keine Route. Self-contained (kein Import aus dem PayPal-Mailmodul).

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

async function sendResend(env, msg) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(msg),
  });
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

const SELLER = {
  name: 'Olaf Hoppe',
  brand: 'HAUS HOPPE - ITS',
  addr: 'Zum Breitling 12, 23974 Boiensdorf OT Stove',
  email: 'team@haushoppe.de',
};

function r(label, value) {
  return `<tr><td style="padding:3px 14px 3px 0;color:#555;vertical-align:top">${esc(label)}</td><td style="padding:3px 0"><strong>${esc(value)}</strong></td></tr>`;
}

function customerHtml(o, lang) {
  const works = o.works || (lang === 'en' ? 'the entire order' : 'die gesamte Bestellung');
  if (lang === 'en') {
    return `<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:620px">
<p>Dear ${esc(o.name)},</p>
<p>we confirm receipt of your notice of withdrawal.</p>
<table style="border-collapse:collapse;font-size:14px">
${r('Received by us on', `${o.receivedAt} (time zone Europe/Berlin)`)}${r('Name', o.name)}${r('Order / contract', o.orderId)}${r('Your withdrawal concerns', works)}${r('Communication channel provided', o.email)}${o.reason ? r('Reason (voluntary)', o.reason) : ''}
</table>
<p>This email confirms receipt of your notice only. Whether and to what extent your withdrawal is effective will be assessed separately. We will inform you in a further message about the reversal of the contract, in particular the return of the works and the refund of the purchase price.</p>
<p>Please keep this email for your records.</p>
<p>Kind regards<br>${esc(SELLER.name)}<br>${esc(SELLER.brand)}<br>${esc(SELLER.addr)}<br>${esc(SELLER.email)}</p>
</div>`;
  }
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:620px">
<p>Guten Tag ${esc(o.name)},</p>
<p>wir bestätigen Ihnen den Eingang Ihrer Widerrufserklärung.</p>
<table style="border-collapse:collapse;font-size:14px">
${r('Eingang bei uns am', `${o.receivedAt} (Zeitzone Europe/Berlin)`)}${r('Name', o.name)}${r('Bestellung / Vertrag', o.orderId)}${r('Widerruf bezieht sich auf', works)}${r('Angegebenes Kommunikationsmittel', o.email)}${o.reason ? r('Grund (freiwillig)', o.reason) : ''}
</table>
<p>Diese E-Mail bestätigt ausschließlich den Eingang Ihrer Erklärung. Ob und in welchem Umfang Ihr Widerruf wirksam ist, prüfen wir gesondert. Über die Rückabwicklung, insbesondere die Rücksendung der Werke und die Erstattung des Kaufpreises, informieren wir Sie in einer weiteren Nachricht.</p>
<p>Bitte bewahren Sie diese E-Mail auf.</p>
<p>Mit freundlichen Grüßen<br>${esc(SELLER.name)}<br>${esc(SELLER.brand)}<br>${esc(SELLER.addr)}<br>${esc(SELLER.email)}</p>
</div>`;
}

function merchantHtml(o) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:620px">
<h2 style="margin:0 0 .4em">Neuer Widerruf eingegangen</h2>
<table style="border-collapse:collapse;font-size:14px">
${r('Eingang', `${o.receivedAt} (${o.iso})`)}${r('Name', o.name)}${r('Bestellnummer', o.orderId)}${r('Bezieht sich auf', o.works || 'gesamte Bestellung')}${r('E-Mail (Kunde)', o.email)}${o.reason ? r('Grund (freiwillig)', o.reason) : ''}
</table>
<p style="color:#555;font-size:13px">Die Eingangsbestätigung wurde automatisch an den Kunden gesendet. Wirksamkeit und Rückabwicklung bitte gesondert prüfen.</p>
</div>`;
}

// Liefert je Mail das Resend-Ergebnis (customer/merchant) bzw. den Fehler (customerError/
// merchantError). Der Endpoint meldet dem Kunden nur dann Erfolg, wenn BEIDE Sendungen
// angenommen wurden — die Kopie an team@haushoppe.de ist die dauerhafte Ablage des Widerrufs.
export async function sendWithdrawalEmails(env, o, lang) {
  if (!env.RESEND_API_KEY) return { skipped: 'no RESEND_API_KEY' };
  const from = env.MAIL_FROM || 'HAUS HOPPE - ITS <team@haushoppe.de>';
  const merchant = env.MAIL_TO || 'team@haushoppe.de';
  const results = {};
  try {
    results.customer = await sendResend(env, {
      from,
      to: [o.email],
      reply_to: merchant,
      subject:
        lang === 'en'
          ? `Confirmation of receipt of your withdrawal, order ${o.orderId}`
          : `Eingangsbestätigung Ihres Widerrufs, Bestellung ${o.orderId}`,
      html: customerHtml(o, lang),
    });
  } catch (e) {
    results.customerError = String((e && e.message) || e);
  }
  try {
    results.merchant = await sendResend(env, {
      from,
      to: [merchant],
      reply_to: o.email,
      subject: `Neuer Widerruf: Bestellung ${o.orderId} (${o.name})`,
      html: merchantHtml(o),
    });
  } catch (e) {
    results.merchantError = String((e && e.message) || e);
  }
  return results;
}
