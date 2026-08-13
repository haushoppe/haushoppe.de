import { test, expect } from '@playwright/test';

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
