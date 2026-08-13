import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

test('Logo, Menü, aktiver Punkt, NEU-Pill, Flagge, Suche', async ({ page }, info) => {
  const lang = langOf(info);
  const s = site(info);
  await page.goto(s.routes.gallery);

  await expect(page.locator('a.site-logo')).toHaveAttribute('href', '/');

  const labels = (await page.getByTestId('nav-link').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  for (const n of s.nav) expect(labels.some((l) => l.startsWith(n)), `Menüpunkt „${n}"`).toBeTruthy();

  await expect(page.locator('[data-testid="nav-link"][aria-current="page"]')).toContainText(s.nav[2]);
  await expect(page.getByTestId('nav-badge')).toHaveText(lang === 'en' ? 'NEW' : 'NEU');
  await expect(page.getByTestId('lang-switch')).toHaveAttribute('href', new RegExp(s.other.replace(/\./g, '\\.')));
  await expect(page.getByTestId('search-trigger')).toBeVisible();
});

test('Navigation bleibt einzeilig', async ({ page }, info) => {
  await page.goto(site(info).routes.home);
  const rows = await page
    .getByTestId('nav-link')
    .evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))).size);
  expect(rows).toBe(1);
});
