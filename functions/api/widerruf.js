import { sendWithdrawalEmails } from './_widerruf-email.js';

// Widerrufs-Endpoint (§ 356a BGB, Stufe 2 „Widerruf bestätigen"). Nimmt genau die zulässigen
// Angaben entgegen (Name, Bestellnummer, E-Mail als Pflicht; betroffene Werke + Grund freiwillig),
// stempelt den EINGANGSZEITPUNKT server-seitig (Europe/Berlin) und löst die Eingangsbestätigung aus.
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

export async function onRequestPost({ request, env, waitUntil }) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // leerer Body -> unten als missing_fields abgewiesen
  }
  const lang = body.lang === 'en' ? 'en' : 'de';
  const name = String(body.name || '').trim().slice(0, 120);
  const orderId = String(body.orderId || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 160);
  const works = String(body.works || '').trim().slice(0, 500);
  const reason = String(body.reason || '').trim().slice(0, 1000);

  // Nur die drei Pflichtangaben aus § 356a Abs. 2 sind erforderlich.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !orderId || !emailOk) return json({ error: 'missing_fields' }, 400);

  // Eingangszeitpunkt = jetzt (Server), Pflichtinhalt der Bestätigung nach Abs. 4.
  const now = new Date();
  let receivedAt;
  try {
    receivedAt = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'de-DE', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Europe/Berlin',
    }).format(now);
  } catch {
    receivedAt = now.toISOString();
  }

  const data = { name, orderId, email, works, reason, receivedAt, iso: now.toISOString() };
  const mail = sendWithdrawalEmails(env, data, lang).catch(() => {});
  if (typeof waitUntil === 'function') waitUntil(mail);
  else await mail;

  return json({ ok: true, receivedAt });
}
