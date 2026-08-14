import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

test('Holzschnitt zeigt Preis 785 € (inkl. 7 % MwSt, versandkostenfrei)', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const price = page.getByTestId('artwork-price');
  await expect(price).toBeVisible();
  await expect(price).toContainText('785 €');
  await expect(price).toContainText(
    langOf(info) === 'en' ? 'incl. 7% VAT, free shipping' : 'inkl. 7 % MwSt, versandkostenfrei',
  );
});

test('Nicht-Holzschnitt (Aquarell) zeigt KEINEN Preis', async ({ page }, info) => {
  await page.goto(`/portfolio/${site(info).work.untitled}/`);
  await expect(page.getByTestId('artwork-price')).toHaveCount(0);
});

test('Ordinal zeigt KEINEN Preis', async ({ page }, info) => {
  await page.goto(`/portfolio/${site(info).work.ordinal}/`);
  await expect(page.getByTestId('artwork-price')).toHaveCount(0);
});

// Galerie-Marker „online kaufbar": genau auf den 30 Holzschnitten, nicht bei Gemälden.
test('Galerie: „online kaufbar"-Pill genau auf den Holzschnitten', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`${s.galleryBase}/${s.cats[0].slug}/`); // Holzschnitte/Woodcuts
  await expect(page.getByTestId('gallery-buy')).toHaveCount(30);
  await expect(page.getByTestId('gallery-buy').first()).toHaveText(langOf(info) === 'en' ? 'buy online' : 'online kaufbar');
  await page.goto(`${s.galleryBase}/${s.cats[1].slug}/`); // Gemälde/Paintings
  await expect(page.getByTestId('gallery-buy')).toHaveCount(0);
});

// Regressions-Anker: GENAU die 30 Holzschnitte tragen den Preis (keine Drift der isWoodcut-Logik).
test('Genau 30 Holzschnitt-Seiten zeigen den Preis', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`${s.galleryBase}/${s.cats[0].slug}/`);
  const hrefs = await page.getByTestId('gallery-item').locator('a').evaluateAll((els) => [
    ...new Set((els as HTMLAnchorElement[]).map((e) => e.getAttribute('href')).filter((h): h is string => !!h)),
  ]);
  expect(hrefs.length, 'Holzschnitt-Kategorie hat 30 Werke').toBe(30);
  let withPrice = 0;
  for (const h of hrefs) {
    await page.goto(h);
    if (await page.getByTestId('artwork-price').count()) withPrice++;
  }
  expect(withPrice, 'alle 30 Holzschnitte zeigen den Preis').toBe(30);
});
