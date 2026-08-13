import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

test('404-Seite hat passenden Inhalt', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('h1')).toContainText(/nicht gefunden|not found/i);
});

test('robots.txt verweist auf die Sitemap', async ({ request }) => {
  const r = await request.get('/robots.txt');
  expect(r.status()).toBe(200);
  expect(await r.text()).toMatch(/Sitemap:.*sitemap-index\.xml/);
});

test('sitemap-index erreichbar', async ({ request }) => {
  const r = await request.get('/sitemap-index.xml');
  expect(r.status()).toBe(200);
  expect(await r.text()).toContain('sitemap-0.xml');
});

test('Sitemap enthält Kernrouten + ein Werk', async ({ request }, info) => {
  const s = site(info);
  const r = await request.get('/sitemap-0.xml');
  expect(r.status()).toBe(200);
  const xml = await r.text();
  for (const path of [s.routes.videos, s.routes.gallery, s.routes.contact, `/portfolio/${s.work.woodcut}/`]) {
    expect(xml, `Sitemap enthält ${path}`).toContain(`${s.origin}${path}`);
  }
});

test('EN _redirects enthält Weiterleitungen', async ({ request }, info) => {
  test.skip(langOf(info) !== 'en', 'nur die EN-Site liefert _redirects (gen-en-redirects)');
  const r = await request.get('/_redirects');
  expect(r.status()).toBe(200);
  expect(await r.text()).toMatch(/\/en\/\*\s+https:\/\/haushoppe\.art/);
});
