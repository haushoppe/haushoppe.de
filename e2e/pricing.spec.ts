import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

test('Holzschnitt zeigt Preis 785 EUR (inkl. 7 % MwSt, versandkostenfrei)', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const price = page.getByTestId('artwork-price');
  await expect(price).toBeVisible();
  await expect(price).toContainText('785 EUR');
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
