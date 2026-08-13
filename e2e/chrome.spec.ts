import { test, expect } from '@playwright/test';
import { site, watchProblems } from './helpers/site';

// Smoke: jede Kernseite lädt sauber (Status, html-lang, h1, Title/Description, canonical,
// hreflang, Favicon) und wirft KEINE JS-Konsolenfehler / same-origin-4xx. Läuft unter de + en.
const PAGES = ['home', 'videos', 'gallery', 'acquire', 'vita', 'camping', 'contact'] as const;

for (const key of PAGES) {
  test(`Smoke: ${key}`, async ({ page, baseURL }, info) => {
    const s = site(info);
    const path = s.routes[key];
    const p = watchProblems(page, baseURL);

    const resp = await page.goto(path, { waitUntil: 'load' });
    expect(resp, `keine Response für ${path}`).toBeTruthy();
    expect(resp!.status(), `HTTP-Status ${path}`).toBeLessThan(400);

    await expect(page.locator('html')).toHaveAttribute('lang', s.htmlLang);
    expect(await page.locator('h1').count(), `h1-Anzahl auf ${path}`).toBeGreaterThanOrEqual(1);
    await expect(page).toHaveTitle(/HAUS HOPPE/);
    await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(s.origin.replace(/\./g, '\\.')),
    );
    expect(await page.locator('head link[rel="alternate"][hreflang="de"]').count()).toBeGreaterThan(0);
    expect(await page.locator('head link[rel="alternate"][hreflang="en"]').count()).toBeGreaterThan(0);
    expect(await page.locator('head link[rel="icon"]').count()).toBeGreaterThan(0);

    // „Failed to load resource" = externe/Netz-Fehler; die decken wir separat via badResponses (same-origin) ab.
    const jsErrors = p.consoleErrors.filter((e) => !/Failed to load resource/i.test(e));
    expect(jsErrors, `JS-Konsolenfehler auf ${path}`).toEqual([]);
    expect(p.badResponses, `same-origin 4xx/5xx auf ${path}`).toEqual([]);
  });
}
