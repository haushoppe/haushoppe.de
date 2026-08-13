import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

// Header/Navigation: Logo, Menüpunkte, aktiver Punkt, NEU-Pill, Sprach-Flagge, Suche.

test('Logo, Menü, aktiver Punkt, NEU-Pill, Flagge, Suche', async ({ page }, info) => {
  const lang = langOf(info);
  const s = site(info);
  // Galerie-Seite: aktiver Menüpunkt = Werke/Artwork
  await page.goto(s.routes.gallery);

  await expect(page.locator('a.site-logo')).toHaveAttribute('href', '/');

  // alle erwarteten Menü-Labels vorhanden (Camping trägt zusätzlich die Pill)
  const labels = (await page.locator('.mainnav__label').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  for (const n of s.nav) {
    expect(labels.some((l) => l.startsWith(n)), `Menüpunkt „${n}" fehlt`).toBeTruthy();
  }

  // aktiver Punkt fett + aria-current
  const active = page.locator('.mainnav__link.is-active');
  await expect(active).toHaveAttribute('aria-current', 'page');
  await expect(active).toContainText(s.nav[2]); // Werke / Artwork

  // NEU/NEW-Pill am Camping-Menüpunkt
  await expect(page.locator('.mainnav__badge')).toHaveText(lang === 'en' ? 'NEW' : 'NEU');

  // Sprach-Flagge zeigt auf die andere Domain
  await expect(page.locator('.mainnav__lang')).toHaveAttribute('href', new RegExp(s.other.replace(/\./g, '\\.')));

  // Such-Trigger vorhanden
  await expect(page.locator('[data-search-trigger]')).toBeVisible();
});

test('Navigation bleibt einzeilig (kein Umbruch)', async ({ page }, info) => {
  await page.goto(site(info).routes.home);
  const tops = await page.locator('.mainnav__list > li:not(.mainnav__extra) .mainnav__link').evaluateAll(
    (els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().top)))].length,
  );
  expect(tops, 'Menü soll in einer Zeile stehen').toBe(1);
});
