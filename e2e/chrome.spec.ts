import { test, expect, type Page } from '@playwright/test';
import { site, watchProblems, type SiteDataLike } from './helpers/site';

// Smoke: Seiten laden sauber. Kern-Routen mit voller Meta-Prüfung; zusätzlich die anderen
// Seitentypen (Werk-Detail, Ordinal, Kategorie), die den Großteil der Site ausmachen.
async function smoke(page: Page, baseURL: string | undefined, path: string, s: SiteDataLike, full = true) {
  const p = watchProblems(page, baseURL);
  const resp = await page.goto(path, { waitUntil: 'load' });
  expect(resp, `keine Response ${path}`).toBeTruthy();
  expect(resp!.status(), `HTTP-Status ${path}`).toBeLessThan(400);

  await expect(page.locator('html')).toHaveAttribute('lang', s.htmlLang);
  expect(await page.locator('h1').count(), `h1-Anzahl ${path}`).toBeGreaterThanOrEqual(1);
  await expect(page).toHaveTitle(/HAUS HOPPE/);
  if (full) {
    await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', new RegExp(s.origin.replace(/\./g, '\\.')));
    expect(await page.locator('head link[rel="alternate"][hreflang="de"]').count()).toBeGreaterThan(0);
    expect(await page.locator('head link[rel="alternate"][hreflang="en"]').count()).toBeGreaterThan(0);
    expect(await page.locator('head link[rel="icon"]').count()).toBeGreaterThan(0);
  }
  const jsErrors = p.consoleErrors.filter((e) => !/Failed to load resource/i.test(e));
  expect(jsErrors, `JS-Konsolenfehler ${path}`).toEqual([]);
  expect(p.badResponses, `same-origin 4xx/5xx ${path}`).toEqual([]);
}

const PAGES = ['home', 'videos', 'gallery', 'acquire', 'vita', 'camping', 'contact'] as const;
for (const key of PAGES) {
  test(`Smoke: ${key}`, async ({ page, baseURL }, info) => {
    const s = site(info);
    await smoke(page, baseURL, s.routes[key], s);
  });
}

test('Smoke: Werk-Detail', async ({ page, baseURL }, info) => {
  const s = site(info);
  await smoke(page, baseURL, `/portfolio/${s.work.woodcut}/`, s);
});

test('Smoke: Ordinal', async ({ page, baseURL }, info) => {
  const s = site(info);
  // Ordinals sind Sonderfall (bleed/inverted) -> reduzierte Meta-Prüfung, aber Konsole/4xx/h1/Title.
  await smoke(page, baseURL, `/portfolio/${s.work.ordinal}/`, s, false);
});

test('Smoke: Kategorie-Seite', async ({ page, baseURL }, info) => {
  const s = site(info);
  await smoke(page, baseURL, `${s.galleryBase}/${s.cats[0].slug}/`, s);
});
