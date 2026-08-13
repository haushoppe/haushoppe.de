import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Läuft unter den Projekten `de-mobile` und `en-mobile` (Pixel-5-Viewport).

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

test('Mobiles Such-Overlay: über Burger öffnen, per × schließen', async ({ page }, info) => {
  await page.goto(site(info).routes.home);
  await page.getByTestId('nav-burger').click();
  const overlay = page.getByTestId('search-overlay');
  await page.getByTestId('search-trigger').click();
  await expect(overlay).toBeVisible();
  await page.getByTestId('search-close').click();
  await expect(overlay).toBeHidden();
});

test('Videos: mobiles Punkt-Karussell ist sichtbar (<1000px)', async ({ page }, info) => {
  await page.goto(site(info).routes.videos);
  await expect(page.getByTestId('video-dot').first()).toBeVisible();
});
