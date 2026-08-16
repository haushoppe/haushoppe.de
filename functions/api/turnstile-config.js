// Öffentliche Turnstile-Konfiguration für den Client (der Sitekey ist per Design öffentlich,
// das Secret bleibt server-seitig). enabled nur, wenn BEIDE Keys gesetzt sind — der Server
// verlangt das Token genau dann (fail-closed in /api/widerruf). Ohne Konfiguration (lokale
// Entwicklung, e2e gegen den statischen Server) bleibt das Formular ohne Widget nutzbar.
export function onRequestGet({ env }) {
  const sitekey = env.TURNSTILE_SITE_KEY || '';
  return new Response(
    JSON.stringify({ enabled: Boolean(sitekey && env.TURNSTILE_SECRET_KEY), sitekey }),
    { headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
}
