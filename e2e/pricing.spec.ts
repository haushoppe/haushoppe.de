import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

// Holzschnitt-Festpreis 785 EUR: Anzeige nur bei Holzschnitten, nicht bei anderen Werken/Ordinals.

test('Holzschnitt zeigt Preis 785 EUR (inkl. 7 % MwSt, versandkostenfrei)', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const price = page.locator('.art-meta__price');
  await expect(price).toBeVisible();
  await expect(price).toContainText('785 EUR');
  await expect(price).toContainText(langOf(info) === 'en' ? 'incl. 7% VAT, free shipping' : 'inkl. 7 % MwSt, versandkostenfrei');
});

test('Nicht-Holzschnitt (Aquarell) zeigt KEINEN Preis', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.untitled}/`);
  await expect(page.locator('.art-meta__price')).toHaveCount(0);
});

test('Ordinal zeigt KEINEN Preis', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.ordinal}/`);
  await expect(page.locator('.art-meta__price')).toHaveCount(0);
});
