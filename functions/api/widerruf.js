import { sendWithdrawalEmails } from './_widerruf-email.js';

// Widerrufs-Endpoint (§ 356a BGB, Stufe 2 „Widerruf bestätigen"). Nimmt genau die zulässigen
// Angaben entgegen (Name, Bestellnummer, E-Mail als Pflicht; betroffene Werke + Grund freiwillig),
// stempelt den EINGANGSZEITPUNKT server-seitig (Europe/Berlin) und löst die Eingangsbestätigung aus.
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

export async function onRequestPost({ request, env }) {
  // Missbrauchs-Bremse: der Endpoint mailt an eine frei wählbare Adresse — ohne Bremse wäre er
  // ein Spam-Relay. (1) Nur Aufrufe von den eigenen Seiten (Origin-Check inkl. Preview-Deploys
  // und lokaler Entwicklung). (2) Je IP höchstens ein Widerruf pro Minute (Soft-Limit über den
  // Colo-Cache; kein globaler Zähler nötig, es geht um das Stoppen von Schleifen).
  const origin = request.headers.get('origin') || '';
  const originOk =
    /^https:\/\/(www\.)?(haushoppe\.de|haushoppe\.art)$/.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.haushoppe-(de|art)\.pages\.dev$/.test(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (!originOk) return json({ error: 'forbidden' }, 403);
  try {
    const ip = request.headers.get('cf-connecting-ip') || '';
    if (ip) {
      const key = new Request('https://rate-limit.invalid/widerruf/' + encodeURIComponent(ip));
      if (await caches.default.match(key)) return json({ error: 'rate_limited' }, 429);
      await caches.default.put(key, new Response('1', { headers: { 'cache-control': 'max-age=60' } }));
    }
  } catch {
    // Cache API nicht verfügbar -> ohne Bremse fortfahren
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // leerer Body -> unten als missing_fields abgewiesen
  }

  // Turnstile (Cloudflare Bot-Schutz): sobald das Secret konfiguriert ist, ist ein gültiges
  // Token PFLICHT — fail-closed, auch bei Verifikations-Fehlern. Der Client zeigt bei 403 den
  // E-Mail-Fallback-Hinweis. Ohne konfiguriertes Secret (lokale Entwicklung) entfällt die Prüfung.
  if (env.TURNSTILE_SECRET_KEY) {
    const token = typeof body.turnstileToken === 'string' ? body.turnstileToken.slice(0, 2048) : '';
    if (!token) return json({ error: 'turnstile' }, 403);
    try {
      const vres = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: request.headers.get('cf-connecting-ip') || undefined,
        }),
      });
      const v = await vres.json();
      if (!v || v.success !== true) return json({ error: 'turnstile' }, 403);
    } catch {
      return json({ error: 'turnstile' }, 403);
    }
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
  // Eingang zusätzlich ins Function-Log stempeln (Cloudflare-Logs) — die Erklärung ist rechtlich
  // bindend und darf nicht spurlos verschwinden, falls der Mailversand scheitert.
  console.log('widerruf', JSON.stringify(data));

  // Erfolg NUR melden, wenn BEIDE Mails (Eingangsbestätigung an den Kunden nach § 356a Abs. 4 +
  // Kopie an team@haushoppe.de als dauerhafte Ablage) von Resend angenommen wurden. Sonst sieht
  // der Kunde den Fehlerhinweis mit dem E-Mail-Fallback statt einer falschen Erfolgsmeldung.
  const results = await sendWithdrawalEmails(env, data, lang).catch((e) => ({ error: String((e && e.message) || e) }));
  if (!results || !results.customer || !results.merchant) {
    console.log('widerruf mail_failed', JSON.stringify(results));
    return json({ error: 'mail_failed' }, 502);
  }

  return json({ ok: true, receivedAt });
}
