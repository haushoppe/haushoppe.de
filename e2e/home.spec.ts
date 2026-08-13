import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

test('HomeHero: sichtbar, mit nicht-leerer Überschrift und Inhalt', async ({ page }, info) => {
  await page.goto(site(info).routes.home);
  await expect(page.locator('.ohero')).toBeVisible();
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).not.toBeEmpty();
  await expect(page.locator('main')).toContainText('Olaf Hoppe');
});
