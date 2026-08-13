import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Accessibility-Basics: genau ein h1 pro Seite, Bilder mit alt-Attribut.
const PAGES = ['home', 'videos', 'gallery', 'acquire', 'vita', 'camping', 'contact'] as const;

for (const key of PAGES) {
  test(`Genau ein h1: ${key}`, async ({ page }, info) => {
    await page.goto(site(info).routes[key]);
    expect(await page.locator('h1').count(), `h1-Anzahl auf ${key}`).toBe(1);
  });
}

test('Galerie-Bilder haben ein alt-Attribut', async ({ page }, info) => {
  await page.goto(site(info).routes.gallery);
  expect(await page.locator('img:not([alt])').count(), 'Bilder ohne alt').toBe(0);
});
