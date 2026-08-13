import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Läuft nur im Projekt `de-mobile` (iPhone-Viewport).

test('Burger-Menü: geschlossen → öffnen → Menüpunkt sichtbar', async ({ page }, info) => {
  await page.goto(site(info).routes.home);
  const firstLink = page.getByTestId('nav-link').first();
  await expect(firstLink).toBeHidden();
  await page.getByTestId('nav-burger').click();
  await expect(firstLink).toBeVisible();
});

test('Hero flush unter der Header-Linie (kein Abstand)', async ({ page }, info) => {
  await page.goto(site(info).routes.home);
  const pt = await page.locator('.site-main').evaluate((el) => getComputedStyle(el).paddingTop);
  expect(pt).toBe('0px');
});

test('Camper-Hero ebenfalls flush', async ({ page }, info) => {
  await page.goto(site(info).camper.path);
  const pt = await page.locator('.site-main').evaluate((el) => getComputedStyle(el).paddingTop);
  expect(pt).toBe('0px');
});
