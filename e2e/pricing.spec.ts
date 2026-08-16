import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

test('Holzschnitt zeigt beide Preise: 785 € ungerahmt, 1.000 € gerahmt', async ({ page }, info) => {
  const s = site(info);
  const en = langOf(info) === 'en';
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const price = page.getByTestId('artwork-price');
  await expect(price).toBeVisible();
  await expect(price).toContainText('785 €');
  await expect(price).toContainText(en ? '1,000 €' : '1.000 €');
  await expect(price).toContainText(en ? 'incl. 7% VAT · free shipping' : 'inkl. 7 % MwSt · versandkostenfrei');
  // Vorauswahl: ungerahmt; die gerahmte Variante ist wählbar (HALBE-Museumsrahmen).
  await expect(price.locator('input[value="unframed"]')).toBeChecked();
  await expect(price.locator('input[value="framed"]')).not.toBeChecked();
  await expect(price).toContainText('HALBE');
});

test('Nicht-Holzschnitt (Aquarell) zeigt KEINEN Preis', async ({ page }, info) => {
  await page.goto(`/portfolio/${site(info).work.aquarell}/`);
  await expect(page.getByTestId('artwork-price')).toHaveCount(0);
});

test('Ordinal zeigt KEINEN Preis', async ({ page }, info) => {
  await page.goto(`/portfolio/${site(info).work.ordinal}/`);
  await expect(page.getByTestId('artwork-price')).toHaveCount(0);
});

// Galerie-Marker „online kaufbar": Holzschnitte (31, PayPal) + Ordinals/digitale Kunst (5, Gamma),
// nicht bei Gemälden.
test('Galerie: „online kaufbar"-Pill auf Holzschnitten und Ordinals, nicht bei Gemälden', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`${s.galleryBase}/${s.cats[0].slug}/`); // Holzschnitte/Woodcuts
  await expect(page.getByTestId('gallery-buy')).toHaveCount(31);
  await expect(page.getByTestId('gallery-buy').first()).toHaveText(langOf(info) === 'en' ? 'buy online' : 'online kaufen');
  await page.goto(`${s.galleryBase}/${s.cats[3].slug}/`); // Digitale Kunst / Digital Art (Ordinals)
  await expect(page.getByTestId('gallery-buy')).toHaveCount(5);
  await page.goto(`${s.galleryBase}/${s.cats[1].slug}/`); // Gemälde/Paintings
  await expect(page.getByTestId('gallery-buy')).toHaveCount(0);
});

// „Angeber"-Video nur auf der Kategorie Digitale Kunst.
test('Kategorie Digitale Kunst: Glitch-Video oben, sonst nicht', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`${s.galleryBase}/${s.cats[3].slug}/`); // Digitale Kunst / Digital Art
  await expect(page.getByTestId('glitch-video')).toBeVisible();
  await expect(page.getByTestId('glitch-video').locator('video')).toHaveCount(1);
  await page.goto(`${s.galleryBase}/${s.cats[0].slug}/`); // Holzschnitte
  await expect(page.getByTestId('glitch-video')).toHaveCount(0);
});

// Regressions-Anker: GENAU die 31 Holzschnitte tragen den Preis (keine Drift der isWoodcut-Logik).
test('Genau 31 Holzschnitt-Seiten zeigen den Preis', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`${s.galleryBase}/${s.cats[0].slug}/`);
  const hrefs = await page.getByTestId('gallery-item').locator('a').evaluateAll((els) => [
    ...new Set((els as HTMLAnchorElement[]).map((e) => e.getAttribute('href')).filter((h): h is string => !!h)),
  ]);
  expect(hrefs.length, 'Holzschnitt-Kategorie hat 31 Werke').toBe(31);
  let withPrice = 0;
  for (const h of hrefs) {
    await page.goto(h);
    if (await page.getByTestId('artwork-price').count()) withPrice++;
  }
  expect(withPrice, 'alle 31 Holzschnitte zeigen den Preis').toBe(31);
});
